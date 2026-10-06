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
  substituteForm,
  setSubstituteForm,
  setIsSubstituteModalOpen,
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

  const handleAssignSubstitute = async (e) => {
    e.preventDefault();
    if (!substituteForm.substituteTrainerId) {
      toast.error("Please select a substitute trainer.");
      return;
    }
    if (substituteForm.substituteTrainerId === substituteForm.primaryTrainerId) {
      toast.error("Substitute coach cannot be the same as the primary coach.");
      return;
    }
    try {
      const subTrainer = allTrainers.find((t) => t.id === substituteForm.substituteTrainerId);
      const priTrainer = allTrainers.find((t) => t.id === substituteForm.primaryTrainerId);

      await recordTrainerLog({
        date: substituteForm.date || new Date().toISOString().slice(0, 10),
        trainerId: substituteForm.substituteTrainerId,
        trainerName: subTrainer?.name || "Substitute Coach",
        batchId: batch.id,
        status: "SUBSTITUTE",
        substituteTrainerId: substituteForm.primaryTrainerId || null,
        durationMinutes: 60,
        notes: substituteForm.reason || `Substitute coach for ${priTrainer?.name || "Primary Coach"}`,
      });

      if (batch && !batch.trainerIds?.includes(substituteForm.substituteTrainerId)) {
        await updateBatch(batch.id, {
          trainerIds: [...(batch.trainerIds || []), substituteForm.substituteTrainerId],
        });
      }

      toast.success(
        `${subTrainer?.name || "Coach"} assigned as substitute coach for ${batch.name}!`
      );
      setIsSubstituteModalOpen(false);
      setSubstituteForm({
        primaryTrainerId: "",
        substituteTrainerId: "",
        date: new Date().toISOString().slice(0, 10),
        reason: "",
      });
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      console.error("Failed to assign substitute coach:", err);
      toast.error(err.message || "Failed to assign substitute coach.");
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
    e.preventDefault();
    if (!editingMasterItem) return;
    try {
      const updated = await updateMasterClassItem(editingMasterItem.id, {
        subject: editingMasterItem.subject,
        message: editingMasterItem.message,
      });
      if (updated) {
        setMasterClassItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setIsEditMasterItemOpen(false);
        toast.success(`Class ${updated.classNumber} curriculum updated!`);
      }
    } catch {
      toast.error("Failed to update class details.");
    }
  };

  return {
    handleRevokeFlexPass,
    handleAssignTrainer,
    handleUnassignTrainer,
    handleAssignSubstitute,
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
