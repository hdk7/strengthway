/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";
import { getBatches } from "@/lib/batchesService";
import {
  getMasterSchedules,
  toggleMasterScheduleStatus,
  deleteMasterSchedule,
  assignBatchesToProgram,
} from "@/lib/masterScheduleService";
import { ScheduleHeaderStats } from "./components/ScheduleHeaderStats";
import { ScheduleProgramCard } from "./components/ScheduleProgramCard";
import { ScheduleFormModal } from "./components/ScheduleFormModal";
import { ScheduleBatchAssignModal } from "./components/ScheduleBatchAssignModal";
import { ScheduleCurriculumViewModal } from "./components/ScheduleCurriculumViewModal";
import { useScheduleForm } from "./hooks/useScheduleForm";
import { useScheduleViewModal } from "./hooks/useScheduleViewModal";

export default function MasterClassSchedulePage() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingBatchAssign, setSubmittingBatchAssign] = useState(false);

  // Quick Batch Assignment Modal State
  const [assigningSchedule, setAssigningSchedule] = useState(null);
  const [assigningBatchIds, setAssigningBatchIds] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allSchedules, allBatches] = await Promise.all([
        getMasterSchedules(),
        getBatches(),
      ]);
      setSchedules(Array.isArray(allSchedules) ? allSchedules : []);
      setBatches(Array.isArray(allBatches) ? allBatches : []);
    } catch (err) {
      console.error("Failed to load schedules:", err);
      setError(err.message || "Failed to load schedules");
      toast.error("Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Schedule Form Hook
  const {
    isFormModalOpen,
    setIsFormModalOpen,
    handleCloseFormModal,
    editingScheduleId,
    formData,
    setFormData,
    classesData,
    expandedAccordionIndex,
    setExpandedAccordionIndex,
    submitting: submittingForm,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleFormBatch,
    handleClassItemChange,
    handleAddClassItem,
    handleDeleteClassItem,
    handleDuplicateClassItem,
    handleSaveSchedule,
  } = useScheduleForm({ onSuccess: loadData });

  // Schedule View Modal Hook
  const {
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
  } = useScheduleViewModal({ schedules, onSuccess: loadData });

  // Filtered schedules for page listing
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const assignedIds = Array.isArray(s.batchIds) ? s.batchIds : s.batchId ? [s.batchId] : [];

      if (selectedStatusFilter !== "ALL" && s.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchCoach = s.coachName?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchDays = s.daysLabel?.toLowerCase().includes(q);
        const matchBatch = assignedIds.some((bId) => {
          const b = batches.find((item) => item.id === bId);
          return b?.name?.toLowerCase().includes(q) || b?.shortName?.toLowerCase().includes(q);
        });
        if (!matchName && !matchCoach && !matchDesc && !matchDays && !matchBatch) return false;
      }
      return true;
    });
  }, [schedules, selectedStatusFilter, searchQuery, batches]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === "Active").length;
    const totalClasses = schedules.reduce((acc, s) => acc + (s.totalClasses || 12), 0);
    const assignedBatchesSet = new Set();
    schedules.forEach((s) => {
      const list = Array.isArray(s.batchIds) ? s.batchIds : s.batchId ? [s.batchId] : [];
      list.forEach((bId) => assignedBatchesSet.add(bId));
    });
    return {
      total,
      active,
      totalClasses,
      coveredBatches: assignedBatchesSet.size,
    };
  }, [schedules]);

  // Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const updated = await toggleMasterScheduleStatus(id);
      if (updated) {
        toast.success(`Program status changed to ${updated.status}.`);
        await loadData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  // Delete Schedule
  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"? This will remove all batch tracking sessions for this program.`,
      )
    ) {
      try {
        await deleteMasterSchedule(id);
        toast.success(`Deleted program "${name}".`);
        await loadData();
      } catch (err) {
        toast.error(err.message || "Failed to delete program.");
      }
    }
  };

  // Quick Batch Assignment Modal handlers
  const handleOpenAssignModal = (schedule) => {
    const assignedIds = Array.isArray(schedule.batchIds)
      ? schedule.batchIds
      : schedule.batchId
        ? [schedule.batchId]
        : [];
    setAssigningSchedule(schedule);
    setAssigningBatchIds(assignedIds);
  };

  const handleToggleAssignBatch = (batchId) => {
    setAssigningBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId],
    );
  };

  const handleSaveBatchAssignments = async () => {
    if (!assigningSchedule) return;
    setSubmittingBatchAssign(true);
    try {
      await assignBatchesToProgram(assigningSchedule.id, assigningBatchIds);
      toast.success(
        `Updated batches for "${assigningSchedule.name}" (${assigningBatchIds.length} assigned).`,
      );
      setAssigningSchedule(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update batch assignments.");
    } finally {
      setSubmittingBatchAssign(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header, KPI Stats, Search & Filters */}
      <ScheduleHeaderStats
        onOpenCreate={handleOpenCreate}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
      />

      {/* Program Cards Grid */}
      {loading ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <h3 className="text-base font-bold text-foreground">Loading Class Programs...</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            Fetching programs and curriculum from the database.
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-62.5 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <CalendarDays size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Scheduled Class Programs Found</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            {searchQuery || selectedStatusFilter !== "ALL"
              ? "No programs match your search filters. Try clearing the filters."
              : "No class programs created yet. Create a reusable program and assign it to batches!"}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-background hover:bg-primary/90"
          >
            <Plus size={16} /> Create Reusable Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredSchedules.map((schedule) => (
            <ScheduleProgramCard
              key={schedule.id}
              schedule={schedule}
              batches={batches}
              onOpenAssignModal={handleOpenAssignModal}
              onOpenViewClasses={handleOpenViewClasses}
              onOpenEdit={handleOpenEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* CREATE / EDIT PROGRAM MODAL */}
      <ScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        editingScheduleId={editingScheduleId}
        formData={formData}
        setFormData={setFormData}
        batches={batches}
        handleToggleFormBatch={handleToggleFormBatch}
        classesData={classesData}
        expandedAccordionIndex={expandedAccordionIndex}
        setExpandedAccordionIndex={setExpandedAccordionIndex}
        handleClassItemChange={handleClassItemChange}
        handleAddClassItem={handleAddClassItem}
        handleDeleteClassItem={handleDeleteClassItem}
        handleDuplicateClassItem={handleDuplicateClassItem}
        handleSaveSchedule={handleSaveSchedule}
        submitting={submittingForm}
      />

      {/* QUICK BATCH ASSIGNMENT MODAL */}
      <ScheduleBatchAssignModal
        schedule={assigningSchedule}
        onClose={() => setAssigningSchedule(null)}
        batches={batches}
        assigningBatchIds={assigningBatchIds}
        onToggleAssignBatch={handleToggleAssignBatch}
        onSaveBatchAssignments={handleSaveBatchAssignments}
        submitting={submittingBatchAssign}
      />

      {/* VIEW MODAL (CURRICULUM SYLLABUS & BATCH TRACKING) */}
      <ScheduleCurriculumViewModal
        viewingSchedule={viewingSchedule}
        onClose={() => setViewingSchedule(null)}
        viewModalTab={viewModalTab}
        setViewModalTab={setViewModalTab}
        viewingItems={viewingItems}
        viewingBatchTracking={viewingBatchTracking}
        isAddingClassInModal={isAddingClassInModal}
        setIsAddingClassInModal={setIsAddingClassInModal}
        setEditingClassInModalId={setEditingClassInModalId}
        newClassForm={newClassForm}
        setNewClassForm={setNewClassForm}
        handleSaveNewClassInModal={handleSaveNewClassInModal}
        editingClassInModalId={editingClassInModalId}
        editingClassForm={editingClassForm}
        setEditingClassForm={setEditingClassForm}
        handleSaveClassInModal={handleSaveClassInModal}
        handleDeleteClassInModal={handleDeleteClassInModal}
        onOpenAssignModal={handleOpenAssignModal}
        navigate={navigate}
        handleUpdateBatchSessionStatus={handleUpdateBatchSessionStatus}
      />
    </div>
  );
}
