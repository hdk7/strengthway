import { api } from "@/lib/apiClient";

/**
 * Executes a permanent transfer of a member from their current batch to a target batch.
 */
export async function executeBatchTransfer(
  payloadOrMemberId,
  targetBatchId,
  effectiveDateOrReason,
  reason,
  transferredBy = "Admin"
) {
  let memberId, targetBatch, effectiveDate, transferReason, by;
  if (payloadOrMemberId && typeof payloadOrMemberId === "object") {
    memberId = payloadOrMemberId.memberId;
    targetBatch = payloadOrMemberId.targetBatchId;
    effectiveDate = payloadOrMemberId.effectiveDate || new Date().toISOString().slice(0, 10);
    transferReason = payloadOrMemberId.reason;
    by = payloadOrMemberId.transferredBy || "Admin";
  } else {
    memberId = payloadOrMemberId;
    targetBatch = targetBatchId;
    if (typeof effectiveDateOrReason === "string" && /^\d{4}-\d{2}-\d{2}$/.test(effectiveDateOrReason)) {
      effectiveDate = effectiveDateOrReason;
      transferReason = reason;
    } else {
      effectiveDate = new Date().toISOString().slice(0, 10);
      transferReason = effectiveDateOrReason;
    }
    by = transferredBy || "Admin";
  }

  return api.post("/v1/batches/assignments/transfer", {
    memberId,
    targetBatchId: targetBatch,
    effectiveDate,
    reason: transferReason,
    transferredBy: by,
  });
}

/**
 * Creates a flexible / temporary multi-day batch assignment for a member.
 */
export async function createFlexibleBatchAssignment(
  dataOrMemberId,
  targetBatchId,
  selectedDays,
  startDate,
  endDate = null,
  reason = "",
  transferredBy = "Admin"
) {
  let payload;
  if (dataOrMemberId && typeof dataOrMemberId === "object" && !Array.isArray(dataOrMemberId)) {
    payload = {
      memberId: dataOrMemberId.memberId,
      targetBatchId: dataOrMemberId.targetBatchId,
      selectedDays: dataOrMemberId.selectedDays,
      startDate: dataOrMemberId.startDate,
      endDate: dataOrMemberId.endDate || null,
      reason: dataOrMemberId.reason,
      transferredBy: dataOrMemberId.transferredBy || "Admin",
    };
  } else {
    payload = {
      memberId: dataOrMemberId,
      targetBatchId,
      selectedDays,
      startDate,
      endDate,
      reason,
      transferredBy,
    };
  }

  return api.post("/v1/batches/assignments/flex", payload);
}

/**
 * Retrieves all assignment history (primary, transfer, flex) for a specific member.
 */
export async function getMemberBatchAssignments(memberId) {
  if (!memberId) return null;
  return api.get(`/v1/batches/assignments/member/${encodeURIComponent(memberId)}`);
}

/**
 * Revokes an active flexible batch assignment.
 */
export async function revokeFlexibleAssignment(assignmentId, reasonOrOptions = {}) {
  if (!assignmentId) return null;
  let reason = "Revoked by admin";
  let revokedBy = "Admin";

  if (typeof reasonOrOptions === "string") {
    reason = reasonOrOptions;
  } else if (reasonOrOptions && typeof reasonOrOptions === "object") {
    if (reasonOrOptions.reason !== undefined) reason = reasonOrOptions.reason;
    if (reasonOrOptions.revokedBy !== undefined) revokedBy = reasonOrOptions.revokedBy;
  }

  return api.delete(`/v1/batches/assignments/${encodeURIComponent(assignmentId)}/revoke`, {
    reason,
    revokedBy,
  });
}

/**
 * Retrieves month-wise 3-category tracking for a batch.
 */
export async function getBatchMonthTracking(batchId, yearMonth) {
  if (!batchId) return null;
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/month-tracking?month=${encodeURIComponent(ym)}`);
}

/**
 * Checks live capacity and available headroom for a batch on any target calendar date.
 */
export async function getBatchCapacityCheck(batchId, date) {
  if (!batchId) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/capacity-check?date=${encodeURIComponent(targetDate)}`);
}

/**
 * Retrieves the effective attendee roster for a batch on a specific calendar date.
 */
export async function getBatchEffectiveAttendees(batchId, date) {
  if (!batchId) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/effective-attendees?date=${encodeURIComponent(targetDate)}`);
}
