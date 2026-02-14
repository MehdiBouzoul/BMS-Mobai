import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// ─── Types ───────────────────────────────────────────────
// Manual types until you regenerate database.ts after running
// the 20260213100000_audit_logs.sql migration.
// Then replace with: Tables<"audit_logs">, TablesInsert<"audit_logs">

export interface AuditLog {
  id: string;
  ts: string;
  actor_user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
}

// ─── Action constants ────────────────────────────────────
export const AuditAction = {
  // Warehouse
  WAREHOUSE_CREATED: "WAREHOUSE_CREATED",
  WAREHOUSE_UPDATED: "WAREHOUSE_UPDATED",
  WAREHOUSE_DELETED: "WAREHOUSE_DELETED",

  // Floor
  FLOOR_CREATED: "FLOOR_CREATED",
  FLOOR_DELETED: "FLOOR_DELETED",

  // Location
  LOCATION_CREATED: "LOCATION_CREATED",
  LOCATION_UPDATED: "LOCATION_UPDATED",
  LOCATION_ACTIVATED: "LOCATION_ACTIVATED",
  LOCATION_DEACTIVATED: "LOCATION_DEACTIVATED",
  LOCATION_DELETED: "LOCATION_DELETED",

  // Storage subtype
  STORAGE_UPDATED: "STORAGE_UPDATED",
  STORAGE_MARKED_AVAILABLE: "STORAGE_MARKED_AVAILABLE",
  STORAGE_MARKED_UNAVAILABLE: "STORAGE_MARKED_UNAVAILABLE",

  // Picking subtype
  PICKING_UPDATED: "PICKING_UPDATED",

  // User
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_STATUS_CHANGED: "USER_STATUS_CHANGED",
  USER_DELETED: "USER_DELETED",

  // Auth
  USER_LOGGED_IN: "USER_LOGGED_IN",
  USER_LOGGED_OUT: "USER_LOGGED_OUT",
  PASSWORD_RESET: "PASSWORD_RESET",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",

  // Order
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_VALIDATED: "ORDER_VALIDATED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  ORDER_CANCELLED: "ORDER_CANCELLED",

  // Task
  TASK_CREATED: "TASK_CREATED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_STARTED: "TASK_STARTED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_VALIDATED: "TASK_VALIDATED",
  TASK_BLOCKED: "TASK_BLOCKED",
  TASK_CANCELLED: "TASK_CANCELLED",

  // Inventory / Stock
  INVENTORY_RECEIVED: "INVENTORY_RECEIVED",
  INVENTORY_MOVED: "INVENTORY_MOVED",
  INVENTORY_PICKED: "INVENTORY_PICKED",
  INVENTORY_DELIVERED: "INVENTORY_DELIVERED",
  STOCK_ADJUSTED: "STOCK_ADJUSTED",

  // AI
  AI_RECOMMENDATION_CREATED: "AI_RECOMMENDATION_CREATED",
  AI_RECOMMENDATION_APPROVED: "AI_RECOMMENDATION_APPROVED",
  AI_RECOMMENDATION_OVERRIDDEN: "AI_RECOMMENDATION_OVERRIDDEN",

  // Sync
  SYNC_CONFLICT: "SYNC_CONFLICT",
  SYNC_RESOLVED: "SYNC_RESOLVED",

  // Delivery
  DELIVERY_CREATED: "DELIVERY_CREATED",
  DELIVERY_STATUS_CHANGED: "DELIVERY_STATUS_CHANGED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

// ─── Entity constants ────────────────────────────────────
export const EntityType = {
  WAREHOUSE: "Warehouse",
  FLOOR: "Floor",
  LOCATION: "Location",
  STORAGE_LOCATION: "StorageLocation",
  PICKING_LOCATION: "PickingLocation",
  USER: "User",
  ORDER: "Order",
  COMMAND_ORDER: "CommandOrder",
  OPERATION_TASK: "OperationTask",
  DELIVERY: "Delivery",
  SKU: "SKU",
  STOCK_BALANCE: "StockBalance",
  CHARIOT: "Chariot",
  ROUTE_PLAN: "RoutePlan",
  AI_RECOMMENDATION: "AIRecommendation",
  DEVICE: "Device",
  SYNC_QUEUE: "SyncQueue",
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

// ═════════════════════════════════════════════════════════
//  1) CORE LOG WRITER
//     Non-blocking: catches errors so the caller never fails
// ═════════════════════════════════════════════════════════

export async function logEvent(params: {
  actorUserId?: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}): Promise<AuditLog | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        actor_user_id: params.actorUserId ?? null,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: (params.details ?? {}) as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error("[AuditLog] write failed:", error.message, {
        action: params.actionType,
        entity: `${params.entityType}:${params.entityId}`,
      });
      return null;
    }

    return data as unknown as AuditLog;
  } catch (err) {
    console.error("[AuditLog] unexpected error:", err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════
//  2) HELPER WRAPPERS
//     Build consistent actionType + details per domain
// ═════════════════════════════════════════════════════════

// ─── Warehouse ───────────────────────────────────────────

export function logWarehouseCreated(
  actorUserId: string,
  warehouseId: string,
  details: { code: string; name: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.WAREHOUSE_CREATED,
    entityType: EntityType.WAREHOUSE,
    entityId: warehouseId,
    details,
  });
}

export function logWarehouseUpdated(
  actorUserId: string,
  warehouseId: string,
  details: { before: Record<string, unknown>; after: Record<string, unknown> }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.WAREHOUSE_UPDATED,
    entityType: EntityType.WAREHOUSE,
    entityId: warehouseId,
    details,
  });
}

export function logWarehouseDeleted(
  actorUserId: string,
  warehouseId: string,
  details: { code: string; name: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.WAREHOUSE_DELETED,
    entityType: EntityType.WAREHOUSE,
    entityId: warehouseId,
    details,
  });
}

// ─── Location ────────────────────────────────────────────

export function logLocationCreated(
  actorUserId: string,
  locationId: string,
  details: { code: string; type: string; floorId: string; subtypeData?: Record<string, unknown> }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.LOCATION_CREATED,
    entityType: EntityType.LOCATION,
    entityId: locationId,
    details,
  });
}

export function logLocationUpdated(
  actorUserId: string,
  locationId: string,
  details: { before: Record<string, unknown>; after: Record<string, unknown> }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.LOCATION_UPDATED,
    entityType: EntityType.LOCATION,
    entityId: locationId,
    details,
  });
}

export function logLocationDeactivated(
  actorUserId: string,
  locationId: string,
  details: { code: string; reason?: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.LOCATION_DEACTIVATED,
    entityType: EntityType.LOCATION,
    entityId: locationId,
    details,
  });
}

export function logLocationActivated(
  actorUserId: string,
  locationId: string,
  details: { code: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.LOCATION_ACTIVATED,
    entityType: EntityType.LOCATION,
    entityId: locationId,
    details,
  });
}

// ─── Task ────────────────────────────────────────────────

export function logTaskValidated(
  actorUserId: string,
  taskId: string,
  details: { operationType: string; orderId?: string; completedAt?: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.TASK_VALIDATED,
    entityType: EntityType.OPERATION_TASK,
    entityId: taskId,
    details,
  });
}

export function logTaskAssigned(
  actorUserId: string,
  taskId: string,
  details: { assignedToUserId: string; chariotId?: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.TASK_ASSIGNED,
    entityType: EntityType.OPERATION_TASK,
    entityId: taskId,
    details,
  });
}

export function logTaskStatusChanged(
  actorUserId: string | null,
  taskId: string,
  details: { from: string; to: string; reason?: string }
) {
  const actionMap: Record<string, string> = {
    DONE: AuditAction.TASK_COMPLETED,
    BLOCKED: AuditAction.TASK_BLOCKED,
    CANCELLED: AuditAction.TASK_CANCELLED,
    IN_PROGRESS: AuditAction.TASK_STARTED,
    ASSIGNED: AuditAction.TASK_ASSIGNED,
  };

  return logEvent({
    actorUserId,
    actionType: actionMap[details.to] ?? AuditAction.TASK_CREATED,
    entityType: EntityType.OPERATION_TASK,
    entityId: taskId,
    details,
  });
}

// ─── Inventory / Stock ───────────────────────────────────

export function logInventoryMoved(
  actorUserId: string | null,
  ledgerEntryId: string,
  details: {
    skuId: string;
    fromLocationId?: string | null;
    toLocationId?: string | null;
    qtyDelta: number;
    operationType: string;
    orderId?: string | null;
    taskId?: string | null;
  }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.INVENTORY_MOVED,
    entityType: EntityType.STOCK_BALANCE,
    entityId: ledgerEntryId,
    details,
  });
}

export function logStockAdjusted(
  actorUserId: string,
  locationId: string,
  details: { skuId: string; previousQty: number; newQty: number; reason: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.STOCK_ADJUSTED,
    entityType: EntityType.STOCK_BALANCE,
    entityId: locationId,
    details,
  });
}

// ─── AI Override ─────────────────────────────────────────

export function logAIOverridden(
  actorUserId: string,
  recommendationId: string,
  details: {
    recommendationType: string;
    originalValue: unknown;
    overriddenValue: unknown;
    justification: string;
  }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.AI_RECOMMENDATION_OVERRIDDEN,
    entityType: EntityType.AI_RECOMMENDATION,
    entityId: recommendationId,
    details: details as Record<string, unknown>,
  });
}

export function logAIApproved(
  actorUserId: string,
  recommendationId: string,
  details: { recommendationType: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.AI_RECOMMENDATION_APPROVED,
    entityType: EntityType.AI_RECOMMENDATION,
    entityId: recommendationId,
    details,
  });
}

// ─── Sync ────────────────────────────────────────────────

export function logSyncConflict(
  deviceId: string,
  syncItemId: string,
  details: {
    conflictType: string;
    serverValue: unknown;
    deviceValue: unknown;
    resolution?: string;
  }
) {
  return logEvent({
    actorUserId: null,
    actionType: AuditAction.SYNC_CONFLICT,
    entityType: EntityType.SYNC_QUEUE,
    entityId: syncItemId,
    details: { deviceId, ...details } as Record<string, unknown>,
  });
}

// ─── Order ───────────────────────────────────────────────

export function logOrderCreated(
  actorUserId: string | null,
  orderId: string,
  details: { type: string; source: string; deliveryId?: number | null }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.ORDER_CREATED,
    entityType: EntityType.ORDER,
    entityId: orderId,
    details,
  });
}

export function logOrderStatusChanged(
  actorUserId: string | null,
  orderId: string,
  details: { from: string; to: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.ORDER_STATUS_CHANGED,
    entityType: EntityType.ORDER,
    entityId: orderId,
    details,
  });
}

// ─── User ────────────────────────────────────────────────

export function logUserCreated(
  actorUserId: string,
  newUserId: string,
  details: { username: string; role: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.USER_CREATED,
    entityType: EntityType.USER,
    entityId: newUserId,
    details,
  });
}

export function logUserRoleChanged(
  actorUserId: string,
  targetUserId: string,
  details: { from: string; to: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.USER_ROLE_CHANGED,
    entityType: EntityType.USER,
    entityId: targetUserId,
    details,
  });
}

// ─── Delivery ────────────────────────────────────────────

export function logDeliveryStatusChanged(
  actorUserId: string | null,
  deliveryId: string,
  details: { from: string; to: string }
) {
  return logEvent({
    actorUserId,
    actionType: AuditAction.DELIVERY_STATUS_CHANGED,
    entityType: EntityType.DELIVERY,
    entityId: deliveryId,
    details,
  });
}

// ═════════════════════════════════════════════════════════
//  3) QUERY / SEARCH FUNCTIONS
// ═════════════════════════════════════════════════════════

// ─── Paginated search with filters ───────────────────────
export async function search(
  filters?: {
    from?: string;
    to?: string;
    actorUserId?: string;
    actionType?: string;
    entityType?: string;
    entityId?: string;
    freeText?: string;
  },
  pagination?: { page?: number; pageSize?: number }
) {
  const supabase = await createClient();
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" });

  if (filters?.from) query = query.gte("ts", filters.from);
  if (filters?.to) query = query.lte("ts", filters.to);
  if (filters?.actorUserId) query = query.eq("actor_user_id", filters.actorUserId);
  if (filters?.actionType) query = query.eq("action_type", filters.actionType);
  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters?.entityId) query = query.eq("entity_id", filters.entityId);

  if (filters?.freeText) {
    query = query.or(
      `action_type.ilike.%${filters.freeText}%,entity_type.ilike.%${filters.freeText}%`
    );
  }

  const { data, error, count } = await query
    .order("ts", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw error;

  return {
    data: (data ?? []) as unknown as AuditLog[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ─── Get single log by ID ────────────────────────────────
export async function getById(id: string): Promise<AuditLog> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as AuditLog;
}

// ─── Entity timeline ─────────────────────────────────────
// All logs for one entity, e.g. all events about order X
export async function getEntityTimeline(
  entityType: string,
  entityId: string,
  options?: { limit?: number }
): Promise<AuditLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("ts", { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AuditLog[];
}

// ─── Recent activity (dashboard widget) ──────────────────
export async function getRecent(limit: number = 20): Promise<AuditLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("ts", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as AuditLog[];
}

// ─── Logs by actor ───────────────────────────────────────
export async function getByActor(
  actorUserId: string,
  options?: { limit?: number }
): Promise<AuditLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("actor_user_id", actorUserId)
    .order("ts", { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AuditLog[];
}

// ═════════════════════════════════════════════════════════
//  4) EXPORT TO CSV
// ═════════════════════════════════════════════════════════

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportToCSV(filters?: {
  from?: string;
  to?: string;
  actorUserId?: string;
  actionType?: string;
  entityType?: string;
  entityId?: string;
}): Promise<string> {
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("*");

  if (filters?.from) query = query.gte("ts", filters.from);
  if (filters?.to) query = query.lte("ts", filters.to);
  if (filters?.actorUserId) query = query.eq("actor_user_id", filters.actorUserId);
  if (filters?.actionType) query = query.eq("action_type", filters.actionType);
  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters?.entityId) query = query.eq("entity_id", filters.entityId);

  const { data, error } = await query.order("ts", { ascending: false });
  if (error) throw error;

  const logs = (data ?? []) as unknown as AuditLog[];
  if (logs.length === 0) return "";

  const headers = [
    "id",
    "timestamp",
    "actor_user_id",
    "action_type",
    "entity_type",
    "entity_id",
    "details",
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.ts,
      log.actor_user_id ?? "",
      log.action_type,
      log.entity_type,
      log.entity_id,
      escapeCsvField(JSON.stringify(log.details)),
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
