import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  createMasterSchedule,
  updateMasterSchedule,
  getScheduleItems,
  DEFAULT_12_CLASS_CURRICULUM,
  ALL_COACHES,
} from "@/lib/masterScheduleService";

const EMPTY_FORM_DATA = {
  name: "",
  batchIds: [],
  daysPattern: "MWF",
  coachId: ALL_COACHES[0]?.id || "TRN-101",
  startDate: "",
  status: "Active",
  description: "",
};

export function useScheduleForm({ onSuccess }) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [classesData, setClassesData] = useState([]);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(-1);

  const currentDaysList = useMemo(() => {
    if (formData.daysPattern === "TTS") {
      return ["Tuesday", "Thursday", "Saturday"];
    }
    if (formData.daysPattern === "Daily") {
      return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }
    return ["Monday", "Wednesday", "Friday"];
  }, [formData.daysPattern]);

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingScheduleId(null);
    setFormData({ ...EMPTY_FORM_DATA, batchIds: [] });
    setClassesData([]);
    setExpandedAccordionIndex(-1);
  };

  const handleOpenCreate = () => {
    setEditingScheduleId(null);
    setFormData({ ...EMPTY_FORM_DATA, batchIds: [] });
    setClassesData([]);
    setExpandedAccordionIndex(-1);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = async (schedule) => {
    let items = schedule.items;
    if (!items || items.length === 0) {
      try {
        items = await getScheduleItems(schedule.id);
      } catch {
        items = [];
      }
    }
    let classesToLoad = [];
    if (items && items.length > 0) {
      classesToLoad = items.map((i) => ({
        id: i.id,
        classNumber: i.classNumber,
        subject: i.subject,
        message: i.message,
      }));
    } else {
      classesToLoad = DEFAULT_12_CLASS_CURRICULUM.map((c) => ({
        classNumber: c.classNumber,
        subject: c.subject,
        message: c.message,
      }));
    }

    const assignedIds = Array.isArray(schedule.batchIds)
      ? schedule.batchIds
      : schedule.batchId
        ? [schedule.batchId]
        : [];

    setEditingScheduleId(schedule.id);
    setFormData({
      name: schedule.name,
      batchIds: assignedIds,
      daysPattern: schedule.daysPattern || "MWF",
      coachId: schedule.coachId || "TRN-101",
      startDate: schedule.startDate || new Date().toISOString().slice(0, 10),
      status: schedule.status || "Active",
      description: schedule.description || "",
    });
    setClassesData(classesToLoad);
    setExpandedAccordionIndex(0);
    setIsFormModalOpen(true);
  };

  const handleToggleFormBatch = (batchId) => {
    setFormData((prev) => {
      const exists = prev.batchIds.includes(batchId);
      const nextBatchIds = exists
        ? prev.batchIds.filter((id) => id !== batchId)
        : [...prev.batchIds, batchId];
      return { ...prev, batchIds: nextBatchIds };
    });
  };

  const handleClassItemChange = (index, field, value) => {
    setClassesData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddClassItem = () => {
    const nextNum = classesData.length + 1;
    const newClass = {
      classNumber: nextNum,
      subject: "",
      message: "",
    };
    setClassesData((prev) => [...prev, newClass]);
    setExpandedAccordionIndex(classesData.length);
    toast.success(`Class ${nextNum} added to program.`);
  };

  const handleDeleteClassItem = (indexToDelete) => {
    const filtered = classesData.filter((_, idx) => idx !== indexToDelete);
    const renumbered = filtered.map((c, idx) => ({
      ...c,
      classNumber: idx + 1,
    }));
    setClassesData(renumbered);
    setExpandedAccordionIndex(-1);
    toast.info(`Deleted Class ${indexToDelete + 1}. Remaining: ${renumbered.length} classes.`);
  };

  const handleDuplicateClassItem = (index) => {
    const target = classesData[index];
    const copy = {
      ...target,
      subject: target.subject ? `${target.subject} (Copy)` : "",
    };
    const newClasses = [
      ...classesData.slice(0, index + 1),
      copy,
      ...classesData.slice(index + 1),
    ].map((c, idx) => ({ ...c, classNumber: idx + 1 }));
    setClassesData(newClasses);
    setExpandedAccordionIndex(index + 1);
    toast.success(`Duplicated Class ${index + 1}.`);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a Program Name.");
      return;
    }
    if (!formData.startDate) {
      toast.error("Please select a Cycle Start Date.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCoach = ALL_COACHES.find((c) => c.id === formData.coachId);
      const coachName = selectedCoach ? selectedCoach.name : "Assigned Coach";

      const preparedClasses = classesData.map((c, idx) => ({
        ...c,
        classNumber: idx + 1,
        subject: c.subject?.trim() || `Class ${idx + 1}`,
        message: c.message?.trim() || "",
      }));

      const programPayload = {
        name: formData.name.trim(),
        batchIds: formData.batchIds,
        daysPattern: formData.daysPattern,
        daysList: currentDaysList,
        coachId: formData.coachId,
        coachName,
        startDate: formData.startDate,
        status: formData.status,
        description: formData.description.trim(),
        totalClasses: preparedClasses.length,
      };

      if (editingScheduleId) {
        await updateMasterSchedule(editingScheduleId, programPayload, preparedClasses);
        toast.success(
          `Program "${formData.name}" updated with ${formData.batchIds.length} assigned batches!`,
        );
      } else {
        await createMasterSchedule(programPayload, preparedClasses);
        toast.success(
          `Created reusable program "${formData.name}" with ${formData.batchIds.length} assigned batches!`,
        );
      }

      handleCloseFormModal();
      if (onSuccess) await onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save program.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isFormModalOpen,
    setIsFormModalOpen,
    handleCloseFormModal,
    editingScheduleId,
    formData,
    setFormData,
    classesData,
    expandedAccordionIndex,
    setExpandedAccordionIndex,
    submitting,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleFormBatch,
    handleClassItemChange,
    handleAddClassItem,
    handleDeleteClassItem,
    handleDuplicateClassItem,
    handleSaveSchedule,
  };
}
