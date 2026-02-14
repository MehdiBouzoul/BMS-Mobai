import { createClient } from "@/lib/supabase/server";
import {
  logTaskAssigned,
  logTaskValidated,
  logTaskStatusChanged,
  logEvent,
  AuditAction,
  EntityType,
} from "@/services/audit-logs";

// ═════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════

type TaskStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "CANCELLED";
type OperationType = "RECEIPT" | "TRANSFER" | "PICKING" | "DELIVERY";

/** Row returned by list queries (task + joined user name). */
export interface OperationRow {
  id: string;
  operation_type: OperationType;
  status: TaskStatus;
  validated: boolean;
  assigned_to_user_id: string | null;
  assigned_user_name: string | null;
  chariot_id: string | null;
  chariot_code: string | null;
  order_id: string | null;
  delivery_id: number | null;
  planned_route_id: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Full detail view for task page. */
export interface OperationDetail {
  id: string;
  operation_type: OperationType;
  status: TaskStatus;
  validated: boolean;
  created_at: string;
  completed_at: string | null;
  order_id: string | null;
  delivery_id: number | null;
  // Assigned user
  assigned_user: { id: string; name: string } | null;
  // Chariot
  chariot: { id: string; code: string; capacity: number | null } | null;
  // Route
  route: {
    id: string;
    path_nodes_json: unknown;
    total_distance_meters: number;
    created_at: string;
  } | null;
  // Delivery snapshot (if linked)
  delivery: {
    delivery_id: number;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
}

// ─── Filters & Pagination ────────────────────────────────

export interface OperationFilters {
  status?: TaskStatus;
  operationType?: OperationType;
  validated?: boolean;
  assignedToUserId?: string;
  deliveryId?: number;
  createdFrom?: string; // ISO date
  createdTo?: string;   // ISO date
}

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

// ─── ServiceResult ───────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ═════════════════════════════════════════════════════════
//  1) LIST OPERATIONS  (paginated, filterable)
// ═════════════════════════════════════════════════════════

export async function listOperations(
  filters?: OperationFilters,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<OperationRow>>> {
  try {
    const supabase = await createClient();
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // ── Build query with embedded joins ──────────────
    // PostgREST supports "resource embedding" via foreign-key names.
    // users  → operation_tasks_assigned_to_user_id_fkey
    // chariots → operation_tasks_chariot_id_fkey
    let query = supabase
      .from("operation_tasks")
      .select(
        `
        id,
        operation_type,
        status,
        validated,
        assigned_to_user_id,
        chariot_id,
        order_id,
        delivery_id,
        planned_route_id,
        created_at,
        completed_at,
        users!operation_tasks_assigned_to_user_id_fkey ( name ),
        chariots!operation_tasks_chariot_id_fkey ( code )
        `,
        { count: "exact" }
      );

    // ── Apply filters ────────────────────────────────
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.operationType) {
      query = query.eq("operation_type", filters.operationType);
    }
    if (filters?.validated !== undefined) {
      query = query.eq("validated", filters.validated);
    }
    if (filters?.assignedToUserId) {
      query = query.eq("assigned_to_user_id", filters.assignedToUserId);
    }
    if (filters?.deliveryId !== undefined) {
      query = query.eq("delivery_id", filters.deliveryId);
    }
    if (filters?.createdFrom) {
      query = query.gte("created_at", filters.createdFrom);
    }
    if (filters?.createdTo) {
      query = query.lte("created_at", filters.createdTo);
    }

    // ── Sort & paginate ──────────────────────────────
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;

    // ── Map to flat DTO ──────────────────────────────
    const rows: OperationRow[] = (data ?? []).map((row: Record<string, unknown>) => {
      const user = row.users as { name: string } | null;
      const chariot = row.chariots as { code: string } | null;

      return {
        id: row.id as string,
        operation_type: row.operation_type as OperationType,
        status: row.status as TaskStatus,
        validated: row.validated as boolean,
        assigned_to_user_id: row.assigned_to_user_id as string | null,
        assigned_user_name: user?.name ?? null,
        chariot_id: row.chariot_id as string | null,
        chariot_code: chariot?.code ?? null,
        order_id: row.order_id as string | null,
        delivery_id: row.delivery_id as number | null,
        planned_route_id: row.planned_route_id as string | null,
        created_at: row.created_at as string,
        completed_at: row.completed_at as string | null,
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
//  2) GET OPERATION BY ID  (full detail with joins)
// ═════════════════════════════════════════════════════════

export async function getOperationById(
  taskId: string
): Promise<ServiceResult<OperationDetail>> {
  try {
    const supabase = await createClient();

    // ── Fetch task with embedded relations ────────────
    const { data: row, error } = await supabase
      .from("operation_tasks")
      .select(
        `
        id,
        operation_type,
        status,
        validated,
        created_at,
        completed_at,
        order_id,
        delivery_id,
        assigned_to_user_id,
        chariot_id,
        planned_route_id,
        users!operation_tasks_assigned_to_user_id_fkey ( id, name ),
        chariots!operation_tasks_chariot_id_fkey ( id, code, capacity ),
        route_plans!operation_tasks_planned_route_id_fkey ( id, path_nodes_json, total_distance_meters, created_at )
        `
      )
      .eq("id", taskId)
      .single();

    if (error || !row) {
      return { success: false, error: "Operation task not found" };
    }

    const r = row as Record<string, unknown>;
    const user = r.users as { id: string; name: string } | null;
    const chariot = r.chariots as { id: string; code: string; capacity: number | null } | null;
    const route = r.route_plans as {
      id: string;
      path_nodes_json: unknown;
      total_distance_meters: number;
      created_at: string;
    } | null;

    // ── Fetch delivery snapshot (separate query, delivery PK is integer) ─
    let delivery: OperationDetail["delivery"] = null;
    if (r.delivery_id !== null && r.delivery_id !== undefined) {
      const { data: del } = await supabase
        .from("deliveries")
        .select("delivery_id, status, created_at, updated_at")
        .eq("delivery_id", r.delivery_id as number)
        .single();

      if (del) {
        delivery = del as unknown as OperationDetail["delivery"];
      }
    }

    const detail: OperationDetail = {
      id: r.id as string,
      operation_type: r.operation_type as OperationType,
      status: r.status as TaskStatus,
      validated: r.validated as boolean,
      created_at: r.created_at as string,
      completed_at: r.completed_at as string | null,
      order_id: r.order_id as string | null,
      delivery_id: r.delivery_id as number | null,
      assigned_user: user ? { id: user.id, name: user.name } : null,
      chariot: chariot ? { id: chariot.id, code: chariot.code, capacity: chariot.capacity } : null,
      route: route
        ? {
            id: route.id,
            path_nodes_json: route.path_nodes_json,
            total_distance_meters: route.total_distance_meters,
            created_at: route.created_at,
          }
        : null,
      delivery,
    };

    return { success: true, data: detail };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  3) ADMIN ACTIONS
// ═════════════════════════════════════════════════════════

/** Hard-check: caller must be ADMIN. */
async function assertAdmin(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) throw new Error("User not found");
  if (data.role !== "ADMIN") throw new Error("Forbidden: ADMIN role required");
}

// ─── A) Assign employee ──────────────────────────────────

export async function assignTask(
  taskId: string,
  employeeUserId: string,
  adminId: string,
  justification?: string
): Promise<ServiceResult<OperationDetail>> {
  try {
    await assertAdmin(adminId);

    const supabase = await createClient();

    // ── Verify employee exists
    const { data: employee, error: empErr } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", employeeUserId)
      .single();

    if (empErr || !employee) {
      return { success: false, error: "Employee user not found" };
    }

    // ── Fetch current task state
    const { data: task, error: taskErr } = await supabase
      .from("operation_tasks")
      .select("id, status, assigned_to_user_id, operation_type")
      .eq("id", taskId)
      .single();

    if (taskErr || !task) {
      return { success: false, error: "Operation task not found" };
    }

    if (task.status === "DONE" || task.status === "CANCELLED") {
      return {
        success: false,
        error: `Cannot assign: task is ${task.status}`,
      };
    }

    // ── Build update: assign + auto-promote PENDING → ASSIGNED
    const updatePayload: Record<string, unknown> = {
      assigned_to_user_id: employeeUserId,
    };

    if (task.status === "PENDING") {
      updatePayload.status = "ASSIGNED";
    }

    const { error: updErr } = await supabase
      .from("operation_tasks")
      .update(updatePayload)
      .eq("id", taskId);

    if (updErr) {
      return { success: false, error: `Failed to assign: ${updErr.message}` };
    }

    // ── Audit logs
    await logTaskAssigned(adminId, taskId, {
      assignedToUserId: employeeUserId,
    });

    // Status change audit (PENDING → ASSIGNED)
    if (task.status === "PENDING") {
      await logTaskStatusChanged(adminId, taskId, {
        from: "PENDING",
        to: "ASSIGNED",
        reason: justification ?? "Admin assignment",
      });
    }

    // Extra admin-action audit with justification
    if (justification?.trim()) {
      await logEvent({
        actorUserId: adminId,
        actionType: "TASK_ASSIGNED_BY_ADMIN",
        entityType: EntityType.OPERATION_TASK,
        entityId: taskId,
        details: {
          assignedToUserId: employeeUserId,
          assignedToName: employee.name,
          previousAssignee: task.assigned_to_user_id,
          justification: justification.trim(),
        },
      });
    }

    // ── Return fresh detail
    return getOperationById(taskId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ─── B) Set validated / unvalidated ──────────────────────

export async function setValidated(
  taskId: string,
  validated: boolean,
  adminId: string,
  justification?: string
): Promise<ServiceResult<OperationDetail>> {
  try {
    await assertAdmin(adminId);

    const supabase = await createClient();

    // ── Fetch current state
    const { data: task, error: taskErr } = await supabase
      .from("operation_tasks")
      .select("id, validated, status, operation_type, order_id, completed_at")
      .eq("id", taskId)
      .single();

    if (taskErr || !task) {
      return { success: false, error: "Operation task not found" };
    }

    if (task.validated === validated) {
      return {
        success: false,
        error: `Task is already ${validated ? "validated" : "unvalidated"}`,
      };
    }

    // ── Update
    const { error: updErr } = await supabase
      .from("operation_tasks")
      .update({ validated })
      .eq("id", taskId);

    if (updErr) {
      return { success: false, error: `Failed to update: ${updErr.message}` };
    }

    // ── Audit
    await logTaskValidated(adminId, taskId, {
      operationType: task.operation_type,
      orderId: task.order_id ?? undefined,
      completedAt: task.completed_at ?? undefined,
    });

    if (justification?.trim()) {
      await logEvent({
        actorUserId: adminId,
        actionType: validated ? "TASK_VALIDATED_BY_ADMIN" : "TASK_UNVALIDATED_BY_ADMIN",
        entityType: EntityType.OPERATION_TASK,
        entityId: taskId,
        details: {
          validated,
          previousValidated: task.validated,
          justification: justification.trim(),
        },
      });
    }

    return getOperationById(taskId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  4) QUICK STAT HELPERS  (dashboard cards)
// ═════════════════════════════════════════════════════════

/** Count tasks grouped by status. */
export async function getStatusCounts(): Promise<
  ServiceResult<Record<TaskStatus, number>>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("operation_tasks")
      .select("status");

    if (error) {
      return { success: false, error: error.message };
    }

    const counts: Record<string, number> = {
      PENDING: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      BLOCKED: 0,
      CANCELLED: 0,
    };

    for (const row of data ?? []) {
      const s = row.status as string;
      if (s in counts) counts[s]++;
    }

    return { success: true, data: counts as Record<TaskStatus, number> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Count tasks grouped by operation type. */
export async function getTypeCounts(): Promise<
  ServiceResult<Record<OperationType, number>>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("operation_tasks")
      .select("operation_type");

    if (error) {
      return { success: false, error: error.message };
    }

    const counts: Record<string, number> = {
      RECEIPT: 0,
      TRANSFER: 0,
      PICKING: 0,
      DELIVERY: 0,
    };

    for (const row of data ?? []) {
      const t = row.operation_type as string;
      if (t in counts) counts[t]++;
    }

    return { success: true, data: counts as Record<OperationType, number> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Tasks assigned to a specific user, ordered by priority (status). */
export async function getTasksForUser(
  userId: string,
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<OperationRow>>> {
  return listOperations({ assignedToUserId: userId }, pagination);
}
