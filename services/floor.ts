import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/database";

// ─── Types ───────────────────────────────────────────────
export type Floor = Tables<"floors">;
export type FloorInsert = TablesInsert<"floors">;
export type FloorUpdate = TablesUpdate<"floors">;

export type Location = Tables<"locations">;
export type LocationInsert = TablesInsert<"locations">;
export type LocationUpdate = TablesUpdate<"locations">;
export type LocationType = Enums<"location_type">;

export type StorageLocation = Tables<"storage_locations">;
export type StorageLocationInsert = TablesInsert<"storage_locations">;
export type StorageLocationUpdate = TablesUpdate<"storage_locations">;

export type PickingLocation = Tables<"picking_locations">;
export type PickingLocationInsert = TablesInsert<"picking_locations">;
export type PickingLocationUpdate = TablesUpdate<"picking_locations">;

// ─── Enriched location (base + subtype data) ────────────
export type LocationWithSubtype = Location & {
  storage_locations?: StorageLocation | null;
  picking_locations?: PickingLocation | null;
};

// ═════════════════════════════════════════════════════════
//  FLOOR OPERATIONS
// ═════════════════════════════════════════════════════════

// ─── CREATE FLOOR ────────────────────────────────────────
// POST /admin/warehouses/:warehouseId/floors
export async function createFloor(warehouseId: string, level: number) {
  const supabase = await createClient();

  // Validate: level must be unique per warehouse
  const { data: existing } = await supabase
    .from("floors")
    .select("id")
    .eq("warehouse_id", warehouseId)
    .eq("level", level)
    .maybeSingle();

  if (existing) {
    throw new Error(
      `Floor level ${level} already exists in this warehouse`
    );
  }

  const { data, error } = await supabase
    .from("floors")
    .insert({ warehouse_id: warehouseId, level })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── LIST FLOORS ─────────────────────────────────────────
// GET /admin/warehouses/:warehouseId/floors
export async function listFloors(warehouseId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("warehouse_id", warehouseId)
    .order("level", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── GET FLOOR ───────────────────────────────────────────
export async function getFloor(floorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("id", floorId)
    .single();

  if (error) throw error;
  return data;
}

// ─── GET FLOOR WITH LOCATION COUNTS ─────────────────────
export async function getFloorWithLocationCounts(floorId: string) {
  const supabase = await createClient();

  const { data: floor, error: floorError } = await supabase
    .from("floors")
    .select("*")
    .eq("id", floorId)
    .single();

  if (floorError) throw floorError;

  const { data: locations } = await supabase
    .from("locations")
    .select("type, is_active")
    .eq("floor_id", floorId);

  const counts = {
    total: locations?.length ?? 0,
    active: locations?.filter((l) => l.is_active).length ?? 0,
    by_type: {} as Record<string, number>,
  };

  for (const loc of locations ?? []) {
    counts.by_type[loc.type] = (counts.by_type[loc.type] ?? 0) + 1;
  }

  return { ...floor, location_counts: counts };
}

// ─── DELETE FLOOR ────────────────────────────────────────
// DELETE /admin/floors/:floorId
// ⚠ Will fail if locations still exist under this floor
export async function deleteFloor(floorId: string) {
  const supabase = await createClient();

  // Safety: check for existing locations
  const { count } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("floor_id", floorId);

  if (count && count > 0) {
    throw new Error(
      `Cannot delete floor: it has ${count} location(s). Remove all locations first.`
    );
  }

  const { error } = await supabase
    .from("floors")
    .delete()
    .eq("id", floorId);

  if (error) throw error;
}

// ═════════════════════════════════════════════════════════
//  LOCATION OPERATIONS (BASE)
// ═════════════════════════════════════════════════════════

// ─── Subtype data interfaces ─────────────────────────────
interface StorageSubtypeData {
  level: number;
  slot_code: string;
  area_m2: number;
  is_available?: boolean;
}

interface PickingSubtypeData {
  row: number;
  col: number;
}

// ─── CREATE LOCATION ─────────────────────────────────────
// POST /admin/floors/:floorId/locations
// Automatically creates the subtype row (storage_locations / picking_locations)
export async function createLocation(
  floorId: string,
  input: {
    code: string;
    type: LocationType;
    is_active?: boolean;
    storage?: StorageSubtypeData;
    picking?: PickingSubtypeData;
  }
) {
  const supabase = await createClient();

  // Validate: code must be unique globally
  const { data: existingCode } = await supabase
    .from("locations")
    .select("id")
    .eq("code", input.code)
    .maybeSingle();

  if (existingCode) {
    throw new Error(`Location code "${input.code}" already exists`);
  }

  // Validate subtype data requirements
  if (input.type === "STORAGE" && !input.storage) {
    throw new Error(
      "Storage location requires storage subtype data (level, slot_code, area_m2)"
    );
  }
  if (input.type === "PICKING" && !input.picking) {
    throw new Error(
      "Picking location requires picking subtype data (row, col)"
    );
  }
  if (input.storage && input.storage.area_m2 <= 0) {
    throw new Error("area_m2 must be greater than 0");
  }
  if (input.picking) {
    if (input.picking.row < 0 || input.picking.col < 0) {
      throw new Error("row and col must be >= 0");
    }
  }

  // 1. Insert base location
  const { data: location, error: locError } = await supabase
    .from("locations")
    .insert({
      floor_id: floorId,
      code: input.code,
      type: input.type,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (locError) throw locError;

  // 2. Insert subtype row
  if (input.type === "STORAGE" && input.storage) {
    const { error: storageError } = await supabase
      .from("storage_locations")
      .insert({
        location_id: location.id,
        level: input.storage.level,
        slot_code: input.storage.slot_code,
        area_m2: input.storage.area_m2,
        is_available: input.storage.is_available ?? true,
      });

    if (storageError) {
      // Rollback: delete the base location
      await supabase.from("locations").delete().eq("id", location.id);
      throw storageError;
    }
  }

  if (input.type === "PICKING" && input.picking) {
    const { error: pickingError } = await supabase
      .from("picking_locations")
      .insert({
        location_id: location.id,
        row: input.picking.row,
        col: input.picking.col,
      });

    if (pickingError) {
      // Rollback: delete the base location
      await supabase.from("locations").delete().eq("id", location.id);
      throw pickingError;
    }
  }

  return location;
}

// ─── UPDATE LOCATION ─────────────────────────────────────
// PATCH /admin/locations/:locationId
// Updates base location fields only (code, type, is_active)
export async function updateLocation(
  locationId: string,
  patch: { code?: string; type?: LocationType; is_active?: boolean }
) {
  const supabase = await createClient();

  // Validate: if updating code, check uniqueness
  if (patch.code) {
    const { data: existingCode } = await supabase
      .from("locations")
      .select("id")
      .eq("code", patch.code)
      .neq("id", locationId)
      .maybeSingle();

    if (existingCode) {
      throw new Error(`Location code "${patch.code}" already exists`);
    }
  }

  const updates: LocationUpdate = {};
  if (patch.code !== undefined) updates.code = patch.code;
  if (patch.type !== undefined) updates.type = patch.type;
  if (patch.is_active !== undefined) updates.is_active = patch.is_active;

  const { data, error } = await supabase
    .from("locations")
    .update(updates)
    .eq("id", locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── SET LOCATION ACTIVE/INACTIVE ────────────────────────
// POST /admin/locations/:locationId/activate
// POST /admin/locations/:locationId/deactivate
export async function setLocationActive(
  locationId: string,
  isActive: boolean
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .update({ is_active: isActive })
    .eq("id", locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── LIST LOCATIONS ──────────────────────────────────────
// GET /admin/floors/:floorId/locations?type=&isActive=
// Can filter by warehouseId (all locations across floors), floorId, type, isActive
export async function listLocations(filters?: {
  warehouseId?: string;
  floorId?: string;
  type?: LocationType;
  isActive?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("locations")
    .select("*, storage_locations(*), picking_locations(*)");

  // If filtering by warehouse, first get floor IDs
  if (filters?.warehouseId) {
    const { data: floors } = await supabase
      .from("floors")
      .select("id")
      .eq("warehouse_id", filters.warehouseId);

    if (!floors || floors.length === 0) return [];

    const floorIds = floors.map((f) => f.id);
    query = query.in("floor_id", floorIds);
  }

  if (filters?.floorId) {
    query = query.eq("floor_id", filters.floorId);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error } = await query.order("code", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LocationWithSubtype[];
}

// ─── GET LOCATION ────────────────────────────────────────
// GET /admin/locations/:locationId
// Returns location + subtype data (storage or picking)
export async function getLocation(
  locationId: string
): Promise<LocationWithSubtype> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*, storage_locations(*), picking_locations(*)")
    .eq("id", locationId)
    .single();

  if (error) throw error;
  return data as LocationWithSubtype;
}

// ─── DELETE LOCATION ─────────────────────────────────────
// Deletes base location + cascaded subtype rows
export async function deleteLocation(locationId: string) {
  const supabase = await createClient();

  // Safety: check for stock at this location
  const { count: stockCount } = await supabase
    .from("stock_balances")
    .select("*", { count: "exact", head: true })
    .eq("location_id", locationId);

  if (stockCount && stockCount > 0) {
    throw new Error(
      `Cannot delete location: it has ${stockCount} stock balance(s). Move stock first.`
    );
  }

  // Delete subtype rows first (if they exist)
  await supabase
    .from("storage_locations")
    .delete()
    .eq("location_id", locationId);
  await supabase
    .from("picking_locations")
    .delete()
    .eq("location_id", locationId);

  // Delete base location
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId);

  if (error) throw error;
}

// ═════════════════════════════════════════════════════════
//  STORAGE LOCATION SUBTYPE
// ═════════════════════════════════════════════════════════

// ─── UPDATE STORAGE LOCATION ─────────────────────────────
// PATCH /admin/locations/:locationId/storage
export async function updateStorageLocation(
  locationId: string,
  patch: {
    level?: number;
    slot_code?: string;
    area_m2?: number;
  }
) {
  const supabase = await createClient();

  // Validate: area_m2 > 0
  if (patch.area_m2 !== undefined && patch.area_m2 <= 0) {
    throw new Error("area_m2 must be greater than 0");
  }

  const updates: StorageLocationUpdate = {};
  if (patch.level !== undefined) updates.level = patch.level;
  if (patch.slot_code !== undefined) updates.slot_code = patch.slot_code;
  if (patch.area_m2 !== undefined) updates.area_m2 = patch.area_m2;

  const { data, error } = await supabase
    .from("storage_locations")
    .update(updates)
    .eq("location_id", locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── SET STORAGE AVAILABILITY ────────────────────────────
// POST /admin/locations/:locationId/storage/available
// POST /admin/locations/:locationId/storage/unavailable
export async function setStorageAvailability(
  locationId: string,
  isAvailable: boolean
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("storage_locations")
    .update({ is_available: isAvailable })
    .eq("location_id", locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── GET STORAGE LOCATION ────────────────────────────────
export async function getStorageLocation(locationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("storage_locations")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (error) throw error;
  return data;
}

// ═════════════════════════════════════════════════════════
//  PICKING LOCATION SUBTYPE
// ═════════════════════════════════════════════════════════

// ─── UPDATE PICKING LOCATION ─────────────────────────────
// PATCH /admin/locations/:locationId/picking
export async function updatePickingLocation(
  locationId: string,
  patch: { row?: number; col?: number }
) {
  const supabase = await createClient();

  // Validate: row/col >= 0
  if (patch.row !== undefined && patch.row < 0) {
    throw new Error("row must be >= 0");
  }
  if (patch.col !== undefined && patch.col < 0) {
    throw new Error("col must be >= 0");
  }

  const updates: PickingLocationUpdate = {};
  if (patch.row !== undefined) updates.row = patch.row;
  if (patch.col !== undefined) updates.col = patch.col;

  const { data, error } = await supabase
    .from("picking_locations")
    .update(updates)
    .eq("location_id", locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── GET PICKING LOCATION ────────────────────────────────
export async function getPickingLocation(locationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("picking_locations")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (error) throw error;
  return data;
}
