/* eslint-disable max-lines */
import { toast } from "sonner";
import {
  updateBatch,
  enrollMemberInBatch,
  unenrollMemberFromBatch,
  revokeFlexibleAssignment,
} from "@/lib/batchesService";
import { recordTrainerLog } from "@/lib/attendanceService";
import {
  getMasterScheduleById,
  updateMasterClassItem,
  createMasterSchedule,
  assignBatchesToProgram,
  updateSessionStatus,
  updateSession,
} from "@/lib/masterScheduleService";
import { updateTrainer } from "@/lib/trainersService";
import { updateMember } from "@/lib/membersService";
import { hasClassStarted } from "@/lib/batchUtils";

export function useBatchDetailActions({
  batch,
  allTrainers,
  masterSchedule,
  loadBatchData,
  loadMonthTracking,
  selectedMonth,
  setMasterClassItems,
  setIsEditMasterItemOpen,
  editingMasterItem,
  setIsAssignProgramOpen,
  selectedSessionForNotes,
  setSelectedSessionForNotes,
  sessionNoteText,
  currentBatchSessions = [],
}) {
  const handleRevokeFlexPass = async (assignmentId, memberName) => {
    if (!window.confirm(`Are you sure you want to revoke the flexible batch pass for ${memberName}?`)) {
      return;
    }
    try {
      await revokeFlexibleAssignment(assignmentId, {
        reason: "Revoked from Batch detail page",
        revokedBy: "Admin",
      });
      toast.success(`Flexible pass for ${memberName} has been revoked.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      console.error("Failed to revoke flex pass:", err);
      toast.error(err.message || "Failed to revoke flexible pass.");
    }
  };

  const handleAssignTrainer = async (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      if (!currentIds.includes(trainerId)) {
        const updated = [...currentIds, trainerId];
        await updateBatch(batch.id, { trainerIds: updated });
        toast.success(`${trainerName || "Trainer"} assigned to ${batch.name}.`);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to assign trainer to batch.");
    }
  };

  const handleUnassignTrainer = async (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      const updated = currentIds.filter((tid) => tid !== trainerId);
      await updateBatch(batch.id, { trainerIds: updated });

      const targetTrainer = allTrainers.find((t) => t.id === trainerId);
      if (targetTrainer && Array.isArray(targetTrainer.batchIds) && targetTrainer.batchIds.includes(batch.id)) {
        await updateTrainer(trainerId, {
          batchIds: targetTrainer.batchIds.filter((bId) => bId !== batch.id),
        }).catch(() => null);
      }

      toast.success(`${trainerName || "Trainer"} removed from ${batch.name}.`);
      await loadBatchData();
    } catch {
      toast.error("Failed to unassign trainer.");
    }
  };

  const handleEnrollExistingMember = async (member) => {
    if (!batch) return;
    try {
      await updateMember(member.id, { batchId: batch.id });
      await enrollMemberInBatch(batch.id, member.id);
      toast.success(`${member.firstName} ${member.lastName || ""} enrolled into ${batch.name}!`);
      await loadBatchData();
    } catch {
      toast.error("Failed to enroll member in batch.");
    }
  };

  const handleRemoveMemberFromBatch = async (memberId, memberName) => {
    if (!batch) return;
    try {
      await unenrollMemberFromBatch(batch.id, memberId);
      await updateMember(memberId, { batchId: "" }).catch(() => null);
      toast.success(`${memberName || "Member"} removed from ${batch.name}.`);
      await loadBatchData();
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleMarkCompleted = async (sessionId, subject, session) => {
    const targetSession =
      session || (currentBatchSessions || []).find((s) => s.id === sessionId);
    if (targetSession && !hasClassStarted(targetSession)) {
      toast.error(
        "Cannot mark a future class as Completed before its scheduled date and time."
      );
      return;
    }
    try {
      await updateSessionStatus(sessionId, "COMPLETED");
      toast.success(`Class "${subject}" marked as Completed.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update class status."
      );
    }
  };

  const handleCancelSession = async (sessionId, subject) => {
    try {
      await updateSessionStatus(sessionId, "CANCELLED");
      toast.info(`Class "${subject}" has been marked as Cancelled.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel class."
      );
    }
  };

  const handleRestoreSession = async (sessionId, subject) => {
    try {
      await updateSessionStatus(sessionId, "SCHEDULED");
      toast.success(`Class "${subject}" restored to Scheduled.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to restore class."
      );
    }
  };

  const handleSaveSessionNotes = async (e) => {
    e.preventDefault();
    if (!selectedSessionForNotes) return;
    try {
      await updateSession(selectedSessionForNotes.id, { notes: sessionNoteText });
      toast.success("Coach note saved successfully.");
      setSelectedSessionForNotes(null);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to save coach note.");
    }
  };

  const handleAssignProgram = async (programId) => {
    if (!batch || !programId) return;
    try {
      if (masterSchedule && masterSchedule.id !== programId) {
        const oldBatches = (masterSchedule.batchIds || []).filter((bId) => bId !== batch.id);
        await assignBatchesToProgram(masterSchedule.id, oldBatches);
      }
      const targetProg = await getMasterScheduleById(programId);
      if (targetProg) {
        const existingBatches = Array.isArray(targetProg.batchIds)
          ? targetProg.batchIds
          : targetProg.batchId
            ? [targetProg.batchId]
            : [];
        if (!existingBatches.includes(batch.id)) {
          await assignBatchesToProgram(targetProg.id, [...existingBatches, batch.id]);
        }
        toast.success(`"${targetProg.name}" assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to assign program.");
    }
  };

  const handleUnassignProgram = async (programId) => {
    if (!batch || !programId) return;
    try {
      const targetProg = await getMasterScheduleById(programId);
      if (targetProg) {
        const remainingBatches = (targetProg.batchIds || []).filter((bId) => bId !== batch.id);
        await assignBatchesToProgram(programId, remainingBatches);
        toast.info(`Unassigned "${targetProg.name}" from ${batch.name}.`);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to unassign program.");
    }
  };

  const handleCreateMasterScheduleForBatch = async () => {
    if (!batch) return;
    try {
      const created = await createMasterSchedule({
        batchIds: [batch.id],
        batchId: batch.id,
        name: `${batch.shortName || batch.name} Program`,
        status: "Active",
      });
      if (created) {
        toast.success(`Master Class Program created and assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to initialize Master Class Program.");
    }
  };

  const handleSaveMasterClassItem = async (e) => {
    e?.preventDefault?.();
    if (!editingMasterItem) return;

    const programName = (editingMasterItem.name || editingMasterItem.subject || "").trim();
    if (!programName) {
      toast.error("Class program name is required.");
      return;
    }

    const beginnerWorkouts = (editingMasterItem.beginnerWorkouts || "").trim() || "Not specified";
    const intermediateWorkouts = (editingMasterItem.intermediateWorkouts || "").trim() || "Not specified";
    const message = `Beginner: ${beginnerWorkouts}\nIntermediate: ${intermediateWorkouts}`;

    try {
      // 1. Update or match ClassProgram in Reusable Classes library
      let classId = editingMasterItem.classId;
      if (!classId) {
        const { getClasses } = await import("@/lib/classProgramService");
        const allCls = await getClasses({ limit: 100 });
        const list = Array.isArray(allCls) ? allCls : allCls?.classes || [];
        const match = list.find(
          (c) =>
            c.name.toLowerCase() === (editingMasterItem.originalName || programName).toLowerCase() ||
            c.id === editingMasterItem.classId
        );
        if (match) classId = match.id;
      }

      if (classId) {
        const { updateClass } = await import("@/lib/classProgramService");
        await updateClass(classId, {
          name: programName,
          beginnerWorkouts,
          intermediateWorkouts,
        });
      }

      // 2. Direct session update if sessionId is known
      const sessionId =
        editingMasterItem.sessionId ||
        (editingMasterItem.id?.startsWith("SES-") ? editingMasterItem.id : null);
      if (sessionId) {
        await updateSession(sessionId, {
          subject: programName,
          className: programName,
          beginnerWorkouts,
          intermediateWorkouts,
          message,
        }).catch(() => null);
      }

      // 3. Update master class item if present
      const itemId =
        editingMasterItem.masterClassItemId ||
        (editingMasterItem.id?.startsWith("item_") ? editingMasterItem.id : null);
      if (itemId) {
        await updateMasterClassItem(itemId, {
          subject: programName,
          className: programName,
          beginnerWorkouts,
          intermediateWorkouts,
          message,
        }).catch(() => null);
      }

      setIsEditMasterItemOpen(false);
      toast.success(`Class program "${programName}" updated successfully!`);

      // Refresh batch and tracking data so updates immediately reflect
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      console.error("Failed to save class item:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update class details.");
    }
  };

  return {
    handleRevokeFlexPass,
    handleAssignTrainer,
    handleUnassignTrainer,
    handleEnrollExistingMember,
    handleRemoveMemberFromBatch,
    handleMarkCompleted,
    handleCancelSession,
    handleRestoreSession,
    handleSaveSessionNotes,
    handleAssignProgram,
    handleUnassignProgram,
    handleCreateMasterScheduleForBatch,
    handleSaveMasterClassItem,
  };
}
