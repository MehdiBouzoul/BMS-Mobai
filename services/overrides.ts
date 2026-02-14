import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import {
  logAIOverridden,
  logAIApproved,
  logTaskStatusChanged,
  logOrderStatusChanged,
  logDeliveryStatusChanged,
  logEvent,
  AuditAction,
  EntityType,
} from "@/services/audit-logs";

// ═════════════════════════════════════════════════════════
//  TYPES  (manual until database.ts is regenerated)
// ═════════════════════════════════════════════════════════

export type RecommendationType = "FORECAST" | "STORAGE_ASSIGNMENT" | "PICK_ROUTE";
export type OverrideStatus = "APPROVED_AS_IS" | "OVERRIDDEN";

export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  payload_json: Record<string, unknown>;
  order_id: string | null;
  task_id: string | null;
  delivery_id: number | null;
  created_at: string;
}

export interface OverrideDecision {
  id: string;
  recommendation_id: string;
  status: OverrideStatus;
  overridden_by_user_id: string;
  justification: string;
  final_payload_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RecommendationFeedback {
  id: string;
  recommendation_id: string;
  reviewer_user_id: string;
  reward: number; // +1 or -1
  comment: string | null;
  created_at: string;
}

/** Joined view returned by detail queries. */
export interface RecommendationWithDecision extends AIRecommendation {
  override_decision: OverrideDecision | null;
  feedback: RecommendationFeedback[];
}

// ─── Input shapes ────────────────────────────────────────

export interface OverrideInput {
  justification: string;
  editedPayload: Record<string, unknown>;
  reward?: number;   // +1 or -1
  comment?: string;
}

export interface ApproveInput {
  reward?: number;
  comment?: string;
}

export interface SupervisorOverrideTaskInput {
  status?: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "CANCELLED";
  assigned_to_user_id?: string | null;
  chariot_id?: string | null;
  validated?: boolean;
}

export interface SupervisorOverrideOrderInput {
  status?: "DRAFT" | "GENERATED" | "VALIDATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  validated_by?: string | null;
}

export interface SupervisorOverrideDeliveryInput {
  status?: "IDLE" | "IN_PROGRESS" | "DONE" | "FAILED";
}

// ─── Pagination ──────────────────────────────────────────

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
//  HELPERS
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

/** Validate that reward is +1 or -1 (if provided). */
function validateReward(reward?: number): void {
  if (reward !== undefined && reward !== 1 && reward !== -1) {
    throw new Error("Reward must be +1 or -1");
  }
}

// ═════════════════════════════════════════════════════════
//  1) OVERRIDE AI RECOMMENDATION
//     Admin provides edited payload + justification.
//     Steps: auth → lock rec → validate → upsert decision
//       → apply side-effects → insert feedback → audit log
// ═════════════════════════════════════════════════════════

export async function overrideRecommendation(
  adminId: string,
  recommendationId: string,
  input: OverrideInput
): Promise<ServiceResult<OverrideDecision>> {
  try {
    // ── Auth
    await assertAdmin(adminId);

    if (!input.justification?.trim()) {
      return { success: false, error: "Justification is required" };
    }
    validateReward(input.reward);

    const supabase = await createClient();

    // ── Fetch & lock recommendation (SELECT … FOR UPDATE via rpc not
    //    available in PostgREST, so we read and rely on UNIQUE constraint
    //    on override_decisions.recommendation_id for atomicity)
    const { data: rec, error: recErr } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recErr || !rec) {
      return { success: false, error: "Recommendation not found" };
    }

    const recommendation = rec as unknown as AIRecommendation;

    // ── Block if linked task is already DONE
    if (recommendation.task_id) {
      const { data: task } = await supabase
        .from("operation_tasks")
        .select("status")
        .eq("id", recommendation.task_id)
        .single();

      if (task && task.status === "DONE") {
        return { success: false, error: "Cannot override: linked task is already DONE" };
      }
    }

    // ── Upsert override decision (insert or update if already exists)
    const { data: existing } = await supabase
      .from("override_decisions")
      .select("id")
      .eq("recommendation_id", recommendationId)
      .maybeSingle();

    let decision: OverrideDecision;

    if (existing) {
      // Update existing decision
      const { data, error } = await supabase
        .from("override_decisions")
        .update({
          status: "OVERRIDDEN" as const,
          overridden_by_user_id: adminId,
          justification: input.justification.trim(),
          final_payload_json: input.editedPayload as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: `Failed to update decision: ${error?.message}` };
      }
      decision = data as unknown as OverrideDecision;
    } else {
      // Insert new decision
      const { data, error } = await supabase
        .from("override_decisions")
        .insert({
          recommendation_id: recommendationId,
          status: "OVERRIDDEN" as const,
          overridden_by_user_id: adminId,
          justification: input.justification.trim(),
          final_payload_json: input.editedPayload as unknown as Json,
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: `Failed to create decision: ${error?.message}` };
      }
      decision = data as unknown as OverrideDecision;
    }

    // ── Apply operational side-effects per recommendation type
    await applySideEffects(supabase, recommendation, input.editedPayload);

    // ── Insert feedback (if reward provided)
    if (input.reward !== undefined) {
      await supabase.from("recommendation_feedback").insert({
        recommendation_id: recommendationId,
        reviewer_user_id: adminId,
        reward: input.reward,
        comment: input.comment ?? null,
      });
    }

    // ── Audit log
    await logAIOverridden(adminId, recommendationId, {
      recommendationType: recommendation.type,
      originalValue: recommendation.payload_json,
      overriddenValue: input.editedPayload,
      justification: input.justification.trim(),
    });

    return { success: true, data: decision };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  2) APPROVE AI RECOMMENDATION (as-is)
//     Admin accepts the AI output without changes.
// ═════════════════════════════════════════════════════════

export async function approveRecommendation(
  adminId: string,
  recommendationId: string,
  input?: ApproveInput
): Promise<ServiceResult<OverrideDecision>> {
  try {
    await assertAdmin(adminId);
    if (input?.reward !== undefined) validateReward(input.reward);

    const supabase = await createClient();

    // ── Fetch recommendation
    const { data: rec, error: recErr } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recErr || !rec) {
      return { success: false, error: "Recommendation not found" };
    }

    const recommendation = rec as unknown as AIRecommendation;

    // ── Check no existing decision
    const { data: existing } = await supabase
      .from("override_decisions")
      .select("id, status")
      .eq("recommendation_id", recommendationId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `Decision already exists (status: ${(existing as Record<string, unknown>).status}). Use editOverride to change it.`,
      };
    }

    // ── Insert APPROVED_AS_IS decision — final_payload = original payload
    const { data: decision, error: decErr } = await supabase
      .from("override_decisions")
      .insert({
        recommendation_id: recommendationId,
        status: "APPROVED_AS_IS" as const,
        overridden_by_user_id: adminId,
        justification: "Approved as-is",
        final_payload_json: recommendation.payload_json as unknown as Json,
      })
      .select()
      .single();

    if (decErr || !decision) {
      return { success: false, error: `Failed to approve: ${decErr?.message}` };
    }

    // ── Apply side-effects with original AI payload
    await applySideEffects(
      supabase,
      recommendation,
      recommendation.payload_json as Record<string, unknown>
    );

    // ── Feedback
    if (input?.reward !== undefined) {
      await supabase.from("recommendation_feedback").insert({
        recommendation_id: recommendationId,
        reviewer_user_id: adminId,
        reward: input.reward,
        comment: input.comment ?? null,
      });
    }

    // ── Audit
    await logAIApproved(adminId, recommendationId, {
      recommendationType: recommendation.type,
    });

    return { success: true, data: decision as unknown as OverrideDecision };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  3) EDIT AN EXISTING OVERRIDE
//     Admin modifies a previously overridden decision.
// ═════════════════════════════════════════════════════════

export async function editOverride(
  adminId: string,
  recommendationId: string,
  input: OverrideInput
): Promise<ServiceResult<OverrideDecision>> {
  try {
    await assertAdmin(adminId);

    if (!input.justification?.trim()) {
      return { success: false, error: "Justification is required" };
    }
    validateReward(input.reward);

    const supabase = await createClient();

    // ── Fetch recommendation
    const { data: rec, error: recErr } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recErr || !rec) {
      return { success: false, error: "Recommendation not found" };
    }

    const recommendation = rec as unknown as AIRecommendation;

    // ── Block if linked task is DONE
    if (recommendation.task_id) {
      const { data: task } = await supabase
        .from("operation_tasks")
        .select("status")
        .eq("id", recommendation.task_id)
        .single();

      if (task && task.status === "DONE") {
        return { success: false, error: "Cannot edit override: linked task is already DONE" };
      }
    }

    // ── Must have existing decision
    const { data: existing, error: exErr } = await supabase
      .from("override_decisions")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .single();

    if (exErr || !existing) {
      return { success: false, error: "No existing decision to edit. Use overrideRecommendation to create one." };
    }

    const previousPayload = (existing as unknown as OverrideDecision).final_payload_json;

    // ── Update decision
    const { data: updated, error: updErr } = await supabase
      .from("override_decisions")
      .update({
        status: "OVERRIDDEN" as const,
        overridden_by_user_id: adminId,
        justification: input.justification.trim(),
        final_payload_json: input.editedPayload as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as Record<string, unknown>).id)
      .select()
      .single();

    if (updErr || !updated) {
      return { success: false, error: `Failed to update decision: ${updErr?.message}` };
    }

    // ── Re-apply side-effects with new payload
    await applySideEffects(supabase, recommendation, input.editedPayload);

    // ── Feedback
    if (input.reward !== undefined) {
      await supabase.from("recommendation_feedback").insert({
        recommendation_id: recommendationId,
        reviewer_user_id: adminId,
        reward: input.reward,
        comment: input.comment ?? null,
      });
    }

    // ── Audit
    await logAIOverridden(adminId, recommendationId, {
      recommendationType: recommendation.type,
      originalValue: previousPayload,
      overriddenValue: input.editedPayload,
      justification: input.justification.trim(),
    });

    return { success: true, data: updated as unknown as OverrideDecision };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  4) SUPERVISOR DECISION OVERRIDES
//     Admin directly modifies operational rows
//     (task / order / delivery) with full audit trail.
// ═════════════════════════════════════════════════════════

export async function overrideTaskDecision(
  adminId: string,
  taskId: string,
  updates: SupervisorOverrideTaskInput,
  justification: string
): Promise<ServiceResult<Record<string, unknown>>> {
  try {
    await assertAdmin(adminId);

    if (!justification?.trim()) {
      return { success: false, error: "Justification is required" };
    }

    const supabase = await createClient();

    // ── Snapshot current state
    const { data: before, error: fetchErr } = await supabase
      .from("operation_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (fetchErr || !before) {
      return { success: false, error: "Task not found" };
    }

    if (before.status === "DONE") {
      return { success: false, error: "Cannot override a DONE task" };
    }

    // ── Build update payload (only provided fields)
    const updatePayload: Record<string, unknown> = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.assigned_to_user_id !== undefined) updatePayload.assigned_to_user_id = updates.assigned_to_user_id;
    if (updates.chariot_id !== undefined) updatePayload.chariot_id = updates.chariot_id;
    if (updates.validated !== undefined) updatePayload.validated = updates.validated;

    if (Object.keys(updatePayload).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // ── Update
    const { data: after, error: updErr } = await supabase
      .from("operation_tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .select()
      .single();

    if (updErr || !after) {
      return { success: false, error: `Failed to update task: ${updErr?.message}` };
    }

    // ── Audit
    await logTaskStatusChanged(adminId, taskId, {
      from: before.status,
      to: (after as Record<string, unknown>).status as string,
    });

    await logEvent({
      actorUserId: adminId,
      actionType: "SUPERVISOR_TASK_OVERRIDE",
      entityType: EntityType.OPERATION_TASK,
      entityId: taskId,
      details: {
        justification: justification.trim(),
        before,
        after,
        fieldsChanged: Object.keys(updatePayload),
      },
    });

    return { success: true, data: after as Record<string, unknown> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function overrideOrderStatus(
  adminId: string,
  orderId: string,
  updates: SupervisorOverrideOrderInput,
  justification: string
): Promise<ServiceResult<Record<string, unknown>>> {
  try {
    await assertAdmin(adminId);

    if (!justification?.trim()) {
      return { success: false, error: "Justification is required" };
    }

    const supabase = await createClient();

    // ── Snapshot
    const { data: before, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !before) {
      return { success: false, error: "Order not found" };
    }

    // ── Build update
    const updatePayload: Record<string, unknown> = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.validated_by !== undefined) updatePayload.validated_by = updates.validated_by;

    if (Object.keys(updatePayload).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // ── Update
    const { data: after, error: updErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (updErr || !after) {
      return { success: false, error: `Failed to update order: ${updErr?.message}` };
    }

    // ── Audit
    await logOrderStatusChanged(adminId, orderId, {
      from: before.status,
      to: (after as Record<string, unknown>).status as string,
    });

    await logEvent({
      actorUserId: adminId,
      actionType: "SUPERVISOR_ORDER_OVERRIDE",
      entityType: EntityType.ORDER,
      entityId: orderId,
      details: {
        justification: justification.trim(),
        before,
        after,
        fieldsChanged: Object.keys(updatePayload),
      },
    });

    return { success: true, data: after as Record<string, unknown> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function overrideDeliveryStatus(
  adminId: string,
  deliveryId: number,
  updates: SupervisorOverrideDeliveryInput,
  justification: string
): Promise<ServiceResult<Record<string, unknown>>> {
  try {
    await assertAdmin(adminId);

    if (!justification?.trim()) {
      return { success: false, error: "Justification is required" };
    }

    const supabase = await createClient();

    // ── Snapshot
    const { data: before, error: fetchErr } = await supabase
      .from("deliveries")
      .select("*")
      .eq("delivery_id", deliveryId)
      .single();

    if (fetchErr || !before) {
      return { success: false, error: "Delivery not found" };
    }

    // ── Build update
    const updatePayload: Record<string, unknown> = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;

    if (Object.keys(updatePayload).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // ── Update
    const { data: after, error: updErr } = await supabase
      .from("deliveries")
      .update(updatePayload)
      .eq("delivery_id", deliveryId)
      .select()
      .single();

    if (updErr || !after) {
      return { success: false, error: `Failed to update delivery: ${updErr?.message}` };
    }

    // ── Audit
    await logDeliveryStatusChanged(adminId, String(deliveryId), {
      from: before.status,
      to: (after as Record<string, unknown>).status as string,
    });

    await logEvent({
      actorUserId: adminId,
      actionType: "SUPERVISOR_DELIVERY_OVERRIDE",
      entityType: EntityType.DELIVERY,
      entityId: String(deliveryId),
      details: {
        justification: justification.trim(),
        before,
        after,
        fieldsChanged: Object.keys(updatePayload),
      },
    });

    return { success: true, data: after as Record<string, unknown> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  5) SIDE-EFFECT APPLICATOR
//     Per recommendation type, materialize the chosen
//     payload into the appropriate operational table.
// ═════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applySideEffects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recommendation: AIRecommendation,
  payload: Record<string, unknown>
): Promise<void> {
  switch (recommendation.type) {
    case "PICK_ROUTE":
      await applyPickRoute(supabase, recommendation, payload);
      break;

    case "STORAGE_ASSIGNMENT":
      // Stored in final_payload_json of the decision — no extra table write.
      // The front-end / downstream consumer reads it from override_decisions.
      break;

    case "FORECAST":
      // Advisory-only: no operational write. Stored in decision row.
      break;
  }
}

/**
 * PICK_ROUTE: insert a new route_plans row and link it to the
 * recommendation's associated task.
 */
async function applyPickRoute(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recommendation: AIRecommendation,
  payload: Record<string, unknown>
): Promise<void> {
  const pathNodes = payload.path_nodes_json ?? payload.pathNodes ?? [];
  const totalDistance =
    (payload.total_distance_meters as number) ??
    (payload.totalDistanceMeters as number) ??
    0;

  // ── Create new route plan
  const { data: route, error: routeErr } = await supabase
    .from("route_plans")
    .insert({
      path_nodes_json: pathNodes as unknown as Json,
      total_distance_meters: totalDistance,
    })
    .select("id")
    .single();

  if (routeErr || !route) {
    console.error("[Override] Failed to create route_plan:", routeErr?.message);
    return;
  }

  // ── Link route to the task (if task exists)
  if (recommendation.task_id) {
    const { error: linkErr } = await supabase
      .from("operation_tasks")
      .update({ planned_route_id: route.id })
      .eq("id", recommendation.task_id);

    if (linkErr) {
      console.error("[Override] Failed to link route to task:", linkErr.message);
    }
  }
}

// ═════════════════════════════════════════════════════════
//  6) QUERY / READ FUNCTIONS
// ═════════════════════════════════════════════════════════

/** Get a single recommendation with its decision & feedback. */
export async function getRecommendation(
  recommendationId: string
): Promise<ServiceResult<RecommendationWithDecision>> {
  try {
    const supabase = await createClient();

    const { data: rec, error: recErr } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recErr || !rec) {
      return { success: false, error: "Recommendation not found" };
    }

    // Fetch decision
    const { data: decision } = await supabase
      .from("override_decisions")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .maybeSingle();

    // Fetch feedback
    const { data: feedback } = await supabase
      .from("recommendation_feedback")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .order("created_at", { ascending: false });

    const result: RecommendationWithDecision = {
      ...(rec as unknown as AIRecommendation),
      override_decision: (decision as unknown as OverrideDecision) ?? null,
      feedback: (feedback as unknown as RecommendationFeedback[]) ?? [],
    };

    return { success: true, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Paginated list of recommendations with optional filters. */
export async function listRecommendations(
  filters?: {
    type?: RecommendationType;
    orderId?: string;
    taskId?: string;
    deliveryId?: number;
    hasDecision?: boolean; // true = decided, false = pending
  },
  pagination?: PaginationOpts
): Promise<ServiceResult<PaginatedResult<AIRecommendation>>> {
  try {
    const supabase = await createClient();
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("ai_recommendations")
      .select("*", { count: "exact" });

    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.orderId) query = query.eq("order_id", filters.orderId);
    if (filters?.taskId) query = query.eq("task_id", filters.taskId);
    if (filters?.deliveryId) query = query.eq("delivery_id", filters.deliveryId);

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    let results = (data ?? []) as unknown as AIRecommendation[];

    // Post-filter for hasDecision (no join in PostgREST for NOT EXISTS easily)
    if (filters?.hasDecision !== undefined) {
      const ids = results.map((r) => r.id);

      if (ids.length > 0) {
        const { data: decisions } = await supabase
          .from("override_decisions")
          .select("recommendation_id")
          .in("recommendation_id", ids);

        const decidedIds = new Set(
          (decisions ?? []).map(
            (d: Record<string, unknown>) => d.recommendation_id as string
          )
        );

        results = results.filter((r) =>
          filters.hasDecision ? decidedIds.has(r.id) : !decidedIds.has(r.id)
        );
      }
    }

    const total = count ?? 0;

    return {
      success: true,
      data: {
        data: results,
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

/** Get override decision for a recommendation. */
export async function getOverrideDecision(
  recommendationId: string
): Promise<ServiceResult<OverrideDecision | null>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("override_decisions")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as unknown as OverrideDecision) ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Get all feedback entries for a recommendation. */
export async function getFeedbackHistory(
  recommendationId: string
): Promise<ServiceResult<RecommendationFeedback[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("recommendation_feedback")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data as unknown as RecommendationFeedback[]) ?? [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Submit standalone feedback (reward ± comment) without changing the decision. */
export async function submitFeedback(
  reviewerUserId: string,
  recommendationId: string,
  reward: number,
  comment?: string
): Promise<ServiceResult<RecommendationFeedback>> {
  try {
    validateReward(reward);

    const supabase = await createClient();

    // Verify recommendation exists
    const { data: rec, error: recErr } = await supabase
      .from("ai_recommendations")
      .select("id")
      .eq("id", recommendationId)
      .single();

    if (recErr || !rec) {
      return { success: false, error: "Recommendation not found" };
    }

    const { data, error } = await supabase
      .from("recommendation_feedback")
      .insert({
        recommendation_id: recommendationId,
        reviewer_user_id: reviewerUserId,
        reward,
        comment: comment ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: `Failed to submit feedback: ${error?.message}` };
    }

    return { success: true, data: data as unknown as RecommendationFeedback };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ═════════════════════════════════════════════════════════
//  7) AGGREGATE / ANALYTICS HELPERS
// ═════════════════════════════════════════════════════════

/** Summary counts for the override dashboard. */
export async function getOverrideSummary(): Promise<
  ServiceResult<{
    totalRecommendations: number;
    pendingDecisions: number;
    approvedCount: number;
    overriddenCount: number;
    avgReward: number | null;
  }>
> {
  try {
    const supabase = await createClient();

    // Total recommendations
    const { count: totalRecommendations } = await supabase
      .from("ai_recommendations")
      .select("*", { count: "exact", head: true });

    // Decisions by status
    const { data: decisions } = await supabase
      .from("override_decisions")
      .select("status");

    const decisionList = (decisions ?? []) as unknown as { status: OverrideStatus }[];
    const approvedCount = decisionList.filter((d) => d.status === "APPROVED_AS_IS").length;
    const overriddenCount = decisionList.filter((d) => d.status === "OVERRIDDEN").length;
    const decidedCount = approvedCount + overriddenCount;
    const pendingDecisions = (totalRecommendations ?? 0) - decidedCount;

    // Average reward
    const { data: feedbackRows } = await supabase
      .from("recommendation_feedback")
      .select("reward");

    let avgReward: number | null = null;
    if (feedbackRows && feedbackRows.length > 0) {
      const sum = feedbackRows.reduce(
        (acc, f) => acc + ((f as Record<string, unknown>).reward as number),
        0
      );
      avgReward = sum / feedbackRows.length;
    }

    return {
      success: true,
      data: {
        totalRecommendations: totalRecommendations ?? 0,
        pendingDecisions,
        approvedCount,
        overriddenCount,
        avgReward,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** Get recent override activity (last N decisions). */
export async function getRecentOverrides(
  limit: number = 10
): Promise<ServiceResult<OverrideDecision[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("override_decisions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as unknown as OverrideDecision[]) ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
