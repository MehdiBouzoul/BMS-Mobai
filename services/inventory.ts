import { createClient } from "@/lib/supabase/server";

// ═════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════

type LocationType = "PICKING" | "STORAGE" | "EXPEDITION" | "RECEPTION" | "OTHER";
type OperationType = "RECEIPT" | "TRANSFER" | "PICKING" | "DELIVERY";

// ─── Balance row (table page) ────────────────────────────

export interface BalanceRow {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  location_id: string;
  location_code: string;
  location_type: LocationType;
  qty: number;
  version: number;
}

// ─── SKU inventory (per-SKU detail) ──────────────────────

export interface SkuInventory {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  total_qty: number;
  locations: {
    location_id: string;
    location_code: string;
    location_type: LocationType;
    qty: number;
    version: number;
  }[];
}

// ─── Location inventory (per-location detail) ────────────

export interface LocationInventory {
  location_id: string;
  location_code: string;
  location_type: LocationType;
  total_qty: number;
  skus: {
    sku_id: string;
    sku_code: string;
    sku_name: string;
    qty: number;
    version: number;
  }[];
}

// ─── Ledger row ──────────────────────────────────────────

export interface LedgerRow {
  id: string;
  ts: string;
  sku_id: string;
  sku_code: string;
  sku_name: string;
  from_location_id: string | null;
  from_location_code: string | null;
  to_location_id: string | null;
  to_location_code: string | null;
  qty_delta: number;
  operation_type: OperationType;
  user_id: string | null;
  user_name: string | null;
  order_id: string | null;
  task_id: string | null;
  idempotency_key: string;
}

// ─── Pagination & Result ─────────────────────────────────

export interface PaginationOpts {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ═════════════════════════════════════════════════════════
//  A) LIST BALANCES  (inventory table page)
//     Single query with joins: stock_balances → skus, locations
// ═════════════════════════════════════════════════════════

export interface BalanceFilters {
  skuId?: string;
  skuSearch?: string;          // search by sku_code or sku name
  locationId?: string;
  locationSearch?: string;     // search by location code
  locationType?: LocationType;
  warehouseId?: string;
  floorId?: string;
}

export async function listBalances(
  filters?: BalanceFilters,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<BalanceRow>>> {
  try {
    const supabase = await createClient();
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // ── Query with embedded joins ────────────────────
    let query = supabase
      .from("stock_balances")
      .select(
        `
        sku_id,
        location_id,
        qty,
        version,
        skus!stock_balances_sku_id_fkey ( id, sku_code, name ),
        locations!stock_balances_location_id_fkey ( id, code, type, floor_id )
        `,
        { count: "exact" }
      );

    // ── Direct ID filters ────────────────────────────
    if (filters?.skuId) {
      query = query.eq("sku_id", filters.skuId);
    }
    if (filters?.locationId) {
      query = query.eq("location_id", filters.locationId);
    }

    query = query.order("qty", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;

    // ── Map to flat DTO + apply post-filters that need join data ─
    let rows: BalanceRow[] = (data ?? []).map((r: Record<string, unknown>) => {
      const sku = r.skus as { id: string; sku_code: string; name: string } | null;
      const loc = r.locations as {
        id: string;
        code: string;
        type: LocationType;
        floor_id: string;
      } | null;

      return {
        sku_id: r.sku_id as string,
        sku_code: sku?.sku_code ?? "",
        sku_name: sku?.name ?? "",
        location_id: r.location_id as string,
        location_code: loc?.code ?? "",
        location_type: (loc?.type ?? "OTHER") as LocationType,
        qty: r.qty as number,
        version: r.version as number,
        _floor_id: loc?.floor_id ?? null,
      };
    });

    // ── Post-filters that require joined fields ──────
    // (PostgREST doesn't support filtering on embedded resources
    //  via .eq on the parent query, so we filter in JS for these)

    if (filters?.skuSearch?.trim()) {
      const term = filters.skuSearch.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.sku_code.toLowerCase().includes(term) ||
          r.sku_name.toLowerCase().includes(term)
      );
    }

    if (filters?.locationSearch?.trim()) {
      const term = filters.locationSearch.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.location_code.toLowerCase().includes(term)
      );
    }

    if (filters?.locationType) {
      rows = rows.filter((r) => r.location_type === filters.locationType);
    }

    // Floor / warehouse filter: need to resolve floor → warehouse
    if (filters?.floorId) {
      rows = rows.filter(
        (r) => (r as unknown as Record<string, unknown>)._floor_id === filters.floorId
      );
    }

    if (filters?.warehouseId) {
      // Fetch all floor IDs belonging to this warehouse
      const { data: floors } = await supabase
        .from("floors")
        .select("id")
        .eq("warehouse_id", filters.warehouseId);

      const floorIds = new Set((floors ?? []).map((f) => f.id));
      rows = rows.filter((r) =>
        floorIds.has((r as unknown as Record<string, unknown>)._floor_id as string)
      );
    }

    // Strip internal _floor_id before returning
    const cleanRows = rows.map(({ ...row }) => {
      const { _floor_id, ...clean } = row as BalanceRow & { _floor_id?: string | null };
      return clean as BalanceRow;
    });

    return {
      success: true,
      data: {
        data: cleanRows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  B) GET SKU INVENTORY  (SKU detail page)
//     All locations where this SKU exists + total qty
// ═════════════════════════════════════════════════════════

export async function getSkuInventory(
  skuId: string
): Promise<ServiceResult<SkuInventory>> {
  try {
    const supabase = await createClient();

    // ── Fetch SKU ────────────────────────────────────
    const { data: sku, error: skuErr } = await supabase
      .from("skus")
      .select("id, sku_code, name")
      .eq("id", skuId)
      .single();

    if (skuErr || !sku) {
      return { success: false, error: "SKU not found" };
    }

    // ── Fetch balances with location join ─────────────
    const { data: balances, error: balErr } = await supabase
      .from("stock_balances")
      .select(
        `
        location_id,
        qty,
        version,
        locations!stock_balances_location_id_fkey ( id, code, type )
        `
      )
      .eq("sku_id", skuId)
      .order("qty", { ascending: false });

    if (balErr) {
      return { success: false, error: balErr.message };
    }

    const rows = balances ?? [];
    let totalQty = 0;

    const locations = rows.map((r: Record<string, unknown>) => {
      const loc = r.locations as {
        id: string;
        code: string;
        type: LocationType;
      } | null;

      const qty = r.qty as number;
      totalQty += qty;

      return {
        location_id: r.location_id as string,
        location_code: loc?.code ?? "",
        location_type: (loc?.type ?? "OTHER") as LocationType,
        qty,
        version: r.version as number,
      };
    });

    return {
      success: true,
      data: {
        sku_id: sku.id,
        sku_code: sku.sku_code,
        sku_name: sku.name,
        total_qty: totalQty,
        locations,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  C) GET LOCATION INVENTORY  (location detail page)
//     All SKUs stored at this location + total qty
// ═════════════════════════════════════════════════════════

export async function getLocationInventory(
  locationId: string
): Promise<ServiceResult<LocationInventory>> {
  try {
    const supabase = await createClient();

    // ── Fetch location ───────────────────────────────
    const { data: loc, error: locErr } = await supabase
      .from("locations")
      .select("id, code, type")
      .eq("id", locationId)
      .single();

    if (locErr || !loc) {
      return { success: false, error: "Location not found" };
    }

    // ── Fetch balances with SKU join ─────────────────
    const { data: balances, error: balErr } = await supabase
      .from("stock_balances")
      .select(
        `
        sku_id,
        qty,
        version,
        skus!stock_balances_sku_id_fkey ( id, sku_code, name )
        `
      )
      .eq("location_id", locationId)
      .order("qty", { ascending: false });

    if (balErr) {
      return { success: false, error: balErr.message };
    }

    const rows = balances ?? [];
    let totalQty = 0;

    const skus = rows.map((r: Record<string, unknown>) => {
      const sku = r.skus as {
        id: string;
        sku_code: string;
        name: string;
      } | null;

      const qty = r.qty as number;
      totalQty += qty;

      return {
        sku_id: r.sku_id as string,
        sku_code: sku?.sku_code ?? "",
        sku_name: sku?.name ?? "",
        qty,
        version: r.version as number,
      };
    });

    return {
      success: true,
      data: {
        location_id: loc.id,
        location_code: loc.code,
        location_type: loc.type as LocationType,
        total_qty: totalQty,
        skus,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  D) LIST LEDGER  (inventory ledger / investigation page)
//     stock_ledger_entries with joins to skus, locations, users
// ═════════════════════════════════════════════════════════

export interface LedgerFilters {
  skuId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  orderId?: string;
  taskId?: string;
  userId?: string;
  operationType?: OperationType;
  dateFrom?: string;  // ISO date
  dateTo?: string;    // ISO date
}

export async function listLedger(
  filters?: LedgerFilters,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<LedgerRow>>> {
  try {
    const supabase = await createClient();
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // ── Query with embedded joins ────────────────────
    let query = supabase
      .from("stock_ledger_entries")
      .select(
        `
        id,
        ts,
        sku_id,
        from_location_id,
        to_location_id,
        qty_delta,
        operation_type,
        user_id,
        order_id,
        task_id,
        idempotency_key,
        skus!stock_ledger_entries_sku_id_fkey ( sku_code, name ),
        from_loc:locations!stock_ledger_entries_from_location_id_fkey ( code ),
        to_loc:locations!stock_ledger_entries_to_location_id_fkey ( code ),
        users!stock_ledger_entries_user_id_fkey ( name )
        `,
        { count: "exact" }
      );

    // ── Filters ──────────────────────────────────────
    if (filters?.skuId) {
      query = query.eq("sku_id", filters.skuId);
    }
    if (filters?.fromLocationId) {
      query = query.eq("from_location_id", filters.fromLocationId);
    }
    if (filters?.toLocationId) {
      query = query.eq("to_location_id", filters.toLocationId);
    }
    if (filters?.orderId) {
      query = query.eq("order_id", filters.orderId);
    }
    if (filters?.taskId) {
      query = query.eq("task_id", filters.taskId);
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.operationType) {
      query = query.eq("operation_type", filters.operationType);
    }
    if (filters?.dateFrom) {
      query = query.gte("ts", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("ts", filters.dateTo);
    }

    // ── Sort newest first + paginate ─────────────────
    query = query.order("ts", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;

    // ── Map to flat DTO ──────────────────────────────
    const rows: LedgerRow[] = (data ?? []).map((r: Record<string, unknown>) => {
      const sku = r.skus as { sku_code: string; name: string } | null;
      const fromLoc = r.from_loc as { code: string } | null;
      const toLoc = r.to_loc as { code: string } | null;
      const user = r.users as { name: string } | null;

      return {
        id: r.id as string,
        ts: r.ts as string,
        sku_id: r.sku_id as string,
        sku_code: sku?.sku_code ?? "",
        sku_name: sku?.name ?? "",
        from_location_id: r.from_location_id as string | null,
        from_location_code: fromLoc?.code ?? null,
        to_location_id: r.to_location_id as string | null,
        to_location_code: toLoc?.code ?? null,
        qty_delta: r.qty_delta as number,
        operation_type: r.operation_type as OperationType,
        user_id: r.user_id as string | null,
        user_name: user?.name ?? null,
        order_id: r.order_id as string | null,
        task_id: r.task_id as string | null,
        idempotency_key: r.idempotency_key as string,
      };
    });

    return {
      success: true,
      data: {
        data: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  BONUS HELPERS
// ═════════════════════════════════════════════════════════

/** Quick total stock count across all locations for a single SKU. */
export async function getTotalStock(
  skuId: string
): Promise<ServiceResult<number>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("stock_balances")
      .select("qty")
      .eq("sku_id", skuId);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = (data ?? []).reduce((sum, r) => sum + (r.qty ?? 0), 0);
    return { success: true, data: total };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Low-stock alerts: balances where qty <= threshold. */
export async function getLowStockBalances(
  threshold: number = 5,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<BalanceRow>>> {
  try {
    const supabase = await createClient();
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("stock_balances")
      .select(
        `
        sku_id,
        location_id,
        qty,
        version,
        skus!stock_balances_sku_id_fkey ( id, sku_code, name ),
        locations!stock_balances_location_id_fkey ( id, code, type )
        `,
        { count: "exact" }
      )
      .lte("qty", threshold)
      .gt("qty", 0)
      .order("qty", { ascending: true })
      .range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;

    const rows: BalanceRow[] = (data ?? []).map((r: Record<string, unknown>) => {
      const sku = r.skus as { id: string; sku_code: string; name: string } | null;
      const loc = r.locations as { id: string; code: string; type: LocationType } | null;

      return {
        sku_id: r.sku_id as string,
        sku_code: sku?.sku_code ?? "",
        sku_name: sku?.name ?? "",
        location_id: r.location_id as string,
        location_code: loc?.code ?? "",
        location_type: (loc?.type ?? "OTHER") as LocationType,
        qty: r.qty as number,
        version: r.version as number,
      };
    });

    return {
      success: true,
      data: {
        data: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Ledger entries for a specific order (investigation). */
export async function getLedgerByOrder(
  orderId: string,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<LedgerRow>>> {
  return listLedger({ orderId }, pagination);
}

/** Ledger entries for a specific task (investigation). */
export async function getLedgerByTask(
  taskId: string,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<LedgerRow>>> {
  return listLedger({ taskId }, pagination);
}
