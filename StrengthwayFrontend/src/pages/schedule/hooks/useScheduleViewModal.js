import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getScheduleItems,
  getMasterScheduleById,
  updateMasterClassItem,
  addMasterClassItem,
  deleteMasterClassItem,
  getBatchTrackingSummary,
  updateSessionStatus,
} from "@/lib/masterScheduleService";
import { hasClassStarted } from "@/lib/batchUtils";

export function useScheduleViewModal({ schedules, onSuccess }) {
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [viewModalTab, setViewModalTab] = useState("curriculum"); // "curriculum" | "tracking"
  const [viewingItems, setViewingItems] = useState([]);
  const [viewingBatchTracking, setViewingBatchTracking] = useState([]);
  const [editingClassInModalId, setEditingClassInModalId] = useState(null);
  const [editingClassForm, setEditingClassForm] = useState({ subject: "", message: "" });
  const [isAddingClassInModal, setIsAddingClassInModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ subject: "", message: "" });

  // Open View Modal (Curriculum or Tracking)
  const handleOpenViewClasses = async (schedule, tab = "curriculum") => {
    setViewingSchedule(schedule);
    setViewModalTab(tab);
    setEditingClassInModalId(null);
    setIsAddingClassInModal(false);
    setNewClassForm({ subject: "", message: "" });
    try {
      const items = await getScheduleItems(schedule.id);
      setViewingItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to load schedule items:", err);
      setViewingItems([]);
    }
  };

  // Save Edited Class in Syllabus Modal
  const handleSaveClassInModal = async (itemId, classNumber) => {
    if (!editingClassForm.subject.trim()) {
      toast.error("Please enter a class subject.");
      return;
    }
    try {
      const updated = await updateMasterClassItem(itemId, {
        subject: editingClassForm.subject,
        message: editingClassForm.message,
      });
      if (updated) {
        toast.success(
          `Class ${classNumber} updated! Updated across all assigned batches while preserving batch session tracking.`,
        );
        setEditingClassInModalId(null);
        if (viewingSchedule) {
          const items = await getScheduleItems(viewingSchedule.id);
          setViewingItems(Array.isArray(items) ? items : []);
        }
        if (onSuccess) await onSuccess();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update class details.");
    }
  };

  // Delete a Class in Syllabus Modal
  const handleDeleteClassInModal = async (itemId, classNumber) => {
    if (viewingItems.length <= 1) {
      toast.error("A program must contain at least 1 class.");
      return;
    }
    try {
      await deleteMasterClassItem(itemId);
      toast.info(`Class ${classNumber} removed. Remaining classes renumbered.`);
      if (viewingSchedule) {
        const items = await getScheduleItems(viewingSchedule.id);
        setViewingItems(Array.isArray(items) ? items : []);
        const updatedSch = await getMasterScheduleById(viewingSchedule.id);
        if (updatedSch) setViewingSchedule(updatedSch);
      }
      if (onSuccess) await onSuccess();
    } catch (err) {
      toast.error(err.message || "Failed to remove class.");
    }
  };

  // Save New Class in Syllabus Modal
  const handleSaveNewClassInModal = async (e) => {
    e.preventDefault();
    if (!newClassForm.subject.trim()) {
      toast.error("Please enter a class subject.");
      return;
    }
    try {
      const added = await addMasterClassItem(viewingSchedule.id, newClassForm);
      if (added) {
        toast.success(`Class ${added.classNumber} added to program and mapped to assigned batches!`);
        setNewClassForm({ subject: "", message: "" });
        setIsAddingClassInModal(false);
        if (viewingSchedule) {
          const items = await getScheduleItems(viewingSchedule.id);
          setViewingItems(Array.isArray(items) ? items : []);
          const updatedSch = await getMasterScheduleById(viewingSchedule.id);
          if (updatedSch) setViewingSchedule(updatedSch);
        }
        if (onSuccess) await onSuccess();
      }
    } catch (err) {
      toast.error(err.message || "Failed to add class.");
    }
  };

  // Update session status for specific batch
  const handleUpdateBatchSessionStatus = async (sessionId, newStatus, session) => {
    let targetSession = session;
    if (!targetSession) {
      for (const bt of viewingBatchTracking) {
        const found = (bt.sessions || []).find((s) => s.id === sessionId);
        if (found) {
          targetSession = found;
          break;
        }
      }
    }

    if (newStatus === "COMPLETED" && targetSession && !hasClassStarted(targetSession)) {
      toast.error("Cannot mark a future class as Completed before its scheduled date and time.");
      return;
    }

    try {
      await updateSessionStatus(sessionId, newStatus);
      toast.success(`Session status updated to ${newStatus}.`);
      if (viewingSchedule) {
        const data = await getBatchTrackingSummary(viewingSchedule.id);
        setViewingBatchTracking(Array.isArray(data) ? data : []);
      }
      if (onSuccess) await onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update session status.");
    }
  };

  // Tracking summary for viewing modal
  useEffect(() => {
    if (!viewingSchedule) {
      setViewingBatchTracking([]);
      return;
    }
    let cancelled = false;
    getBatchTrackingSummary(viewingSchedule.id)
      .then((data) => {
        if (!cancelled) setViewingBatchTracking(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load batch tracking:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [viewingSchedule, schedules]);

  return {
    viewingSchedule,
    setViewingSchedule,
    viewModalTab,
    setViewModalTab,
    viewingItems,
    viewingBatchTracking,
    editingClassInModalId,
    setEditingClassInModalId,
    editingClassForm,
    setEditingClassForm,
    isAddingClassInModal,
    setIsAddingClassInModal,
    newClassForm,
    setNewClassForm,
    handleOpenViewClasses,
    handleSaveClassInModal,
    handleDeleteClassInModal,
    handleSaveNewClassInModal,
    handleUpdateBatchSessionStatus,
  };
}
