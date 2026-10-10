import { useState, useEffect, useMemo, useCallback } from "react";
import { Dumbbell, Plus, AlertCircle, RefreshCw, Trash2, X, Check, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
} from "@/lib/classProgramService";
import { getBatches } from "@/lib/batchesService";
import { ClassHeaderStats } from "./components/ClassHeaderStats";
import { ClassCard } from "./components/ClassCard";
import { ClassFormModal } from "./components/ClassFormModal";
import { BatchClassAssignmentModal } from "./components/BatchClassAssignmentModal";
import { ClassMonthlyCalendarView } from "./components/ClassMonthlyCalendarView";
import { ClassDailyScheduleView } from "./components/ClassDailyScheduleView";
import { ClassSessionDetailModal } from "./components/ClassSessionDetailModal";
import { ShuffleClassModal } from "./components/ShuffleClassModal";
import Pagination from "@/components/table/Pagination";

export default function MasterClassSchedulePage() {
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active perspective: "library" | "month" | "daily"
  const [activeView, setActiveView] = useState("library");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Selection for Batch Mapping (Phases 3 & 4)
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [isBatchAssignModalOpen, setIsBatchAssignModalOpen] = useState(false);

  // Detail Inspector Modal & Shuffle Modal states (Phase 6)
  const [inspectingSession, setInspectingSession] = useState(null);
  const [shuffleModalState, setShuffleModalState] = useState({
    isOpen: false,
    batch: null,
    sourceSessionId: "",
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete Confirmation Modal
  const [deletingClass, setDeletingClass] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Load Reusable Classes & Batches
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allClasses, allBatches] = await Promise.all([
        getClasses({ limit: 100 }),
        getBatches(),
      ]);
      setClasses(Array.isArray(allClasses) ? allClasses : []);
      setBatches(Array.isArray(allBatches) ? allBatches : []);
    } catch (err) {
      console.error("Failed to load classes:", err);
      setError(err.message || "Failed to load classes.");
      toast.error("Failed to load classes library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Classes based on search query & status
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (selectedStatusFilter !== "ALL" && cls.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = cls.name?.toLowerCase().includes(q);
        const matchBeg = cls.beginnerWorkouts?.toLowerCase().includes(q);
        const matchInt = cls.intermediateWorkouts?.toLowerCase().includes(q);
        const matchId = cls.id?.toLowerCase().includes(q);
        return matchName || matchBeg || matchInt || matchId;
      }
      return true;
    });
  }, [classes, selectedStatusFilter, searchQuery]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedClassIds.length === filteredClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(filteredClasses.map((c) => c.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedClassIds([]);
  };

  // Create & Edit Handlers (Strictly 3 fields)
  const handleOpenCreate = () => {
    setEditingClass(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (classItem) => {
    setEditingClass(classItem);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmittingForm(true);
      if (editingClass) {
        await updateClass(editingClass.id, formData);
        toast.success(`Class "${formData.name}" updated successfully.`);
      } else {
        await createClass(formData);
        toast.success(`Class "${formData.name}" created successfully.`);
      }
      setIsFormModalOpen(false);
      setEditingClass(null);
      await loadData();
    } catch (err) {
      console.error("Save class failed:", err);
      toast.error(err.message || "Failed to save class program.");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete Handlers
  const handleConfirmDelete = async () => {
    if (!deletingClass) return;
    try {
      setSubmittingDelete(true);
      await deleteClass(deletingClass.id);
      toast.success(`Class "${deletingClass.name}" deleted.`);
      setDeletingClass(null);
      // Remove from selection if selected
      setSelectedClassIds((prev) => prev.filter((id) => id !== deletingClass.id));
      await loadData();
    } catch (err) {
      console.error("Delete class failed:", err);
      toast.error(err.message || "Failed to delete class program.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Batch Assign Trigger (Phase 4)
  const handleOpenBatchAssign = () => {
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class to assign to a batch.");
      return;
    }
    setIsBatchAssignModalOpen(true);
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: classes.length,
      active: classes.filter((c) => c.status === "ACTIVE").length,
    };
  }, [classes]);

  // Pagination State (classes library - fixed 6 per page, no per-page selector)
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredClasses.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedClasses = useMemo(() => {
    return filteredClasses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filteredClasses, safePage]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header, Stats & Search Controls */}
      <ClassHeaderStats
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCreate={handleOpenCreate}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
        onSelectAll={handleSelectAll}
        isAllSelected={selectedClassIds.length === filteredClasses.length && filteredClasses.length > 0}
        selectedCount={selectedClassIds.length}
        hasClasses={filteredClasses.length > 0}
        onClearSelection={handleClearSelection}
      />

      {/* Multi-Dimensional Perspectives */}
      {activeView === "month" ? (
        <ClassMonthlyCalendarView
          batches={batches}
          onOpenSessionDetail={(session) => setInspectingSession(session)}
          onOpenAssign={handleOpenBatchAssign}
          onOpenSwap={(session) => {
            const targetBatch =
              batches.find((b) => b.id === session.batchId) || {
                id: session.batchId,
                name: session.batchName,
              };
            setShuffleModalState({
              isOpen: true,
              batch: targetBatch,
              sourceSessionId: session.id,
            });
          }}
        />
      ) : activeView === "daily" ? (
        <ClassDailyScheduleView
          batches={batches}
          onOpenSessionDetail={(session) => setInspectingSession(session)}
          onOpenAssign={handleOpenBatchAssign}
          onOpenSwap={(session) => {
            const targetBatch =
              batches.find((b) => b.id === session.batchId) || {
                id: session.batchId,
                name: session.batchName,
              };
            setShuffleModalState({
              isOpen: true,
              batch: targetBatch,
              sourceSessionId: session.id,
            });
          }}
        />
      ) : (
        /* Reusable Classes Library Grid */
        loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-8 text-center shadow-xs">
            <RefreshCw size={26} className="animate-spin text-blue-700 dark:text-primary" />
            <p className="text-sm font-semibold text-slate-700 dark:text-foreground">
              Loading reusable classes library…
            </p>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center">
            <AlertCircle size={28} className="text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
            <button
              onClick={loadData}
              className="rounded-xl bg-rose-600 dark:bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-border bg-white dark:bg-card p-8 text-center shadow-xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-muted text-slate-400 dark:text-muted-foreground">
              <Dumbbell size={24} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                No Reusable Classes Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 max-w-sm">
                {searchQuery
                  ? `No classes matching "${searchQuery}". Try adjusting your search query or filters.`
                  : "No reusable classes exist in the library yet. Click below to create your first class!"}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-700 dark:bg-primary px-4 py-2 text-xs font-bold text-white dark:text-primary-foreground hover:bg-blue-800 cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Class</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classItem={cls}
                  isSelected={selectedClassIds.includes(cls.id)}
                  onToggleSelect={handleToggleSelect}
                  onEdit={handleOpenEdit}
                  onDelete={(item) => setDeletingClass(item)}
                />
              ))}
            </div>

            {filteredClasses.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={filteredClasses.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => setCurrentPage(p)}
                  itemLabel="classes"
                />
              </div>
            )}
          </div>
        )
      )}

      {/* Strict 3-Field Create / Edit Class Form Modal */}
      <ClassFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingClass(null);
        }}
        initialData={editingClass}
        onSubmit={handleFormSubmit}
        isSubmitting={submittingForm}
      />

      {/* Delete Confirmation Modal */}
      {deletingClass && (
        <div
          className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                  Delete Reusable Class
                </h3>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                  Are you sure you want to delete this class from the library?
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/70 dark:bg-muted/40 p-3 text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-foreground block">
                {deletingClass.name}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-muted-foreground block">
                ID: {deletingClass.id}
              </span>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400">
              Note: If this class is currently mapped to active upcoming batch sessions, deletion will be blocked to safeguard schedules.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-border">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                disabled={submittingDelete}
                className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingDelete ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Class Batch Calendar Assignment Modal (Phase 4) */}
      <BatchClassAssignmentModal
        isOpen={isBatchAssignModalOpen}
        onClose={() => setIsBatchAssignModalOpen(false)}
        batches={batches}
        allClasses={classes}
        initialSelectedClassIds={selectedClassIds}
        onSuccess={() => {
          setSelectedClassIds([]);
          loadData();
        }}
      />

      {/* Class Session Detail Inspector Modal (Phase 6) */}
      <ClassSessionDetailModal
        isOpen={Boolean(inspectingSession)}
        onClose={() => setInspectingSession(null)}
        session={inspectingSession}
        onOpenSwap={(session) => {
          const targetBatch =
            batches.find((b) => b.id === session.batchId) || {
              id: session.batchId,
              name: session.batchName,
            };
          setShuffleModalState({
            isOpen: true,
            batch: targetBatch,
            sourceSessionId: session.id,
          });
        }}
      />

      {/* Shuffle & Swap Modal (Phases 5 & 6) */}
      {shuffleModalState.batch && (
        <ShuffleClassModal
          isOpen={shuffleModalState.isOpen}
          onClose={() =>
            setShuffleModalState({
              isOpen: false,
              batch: null,
              sourceSessionId: "",
            })
          }
          batch={shuffleModalState.batch}
          initialSourceSessionId={shuffleModalState.sourceSessionId}
          onSuccess={loadData}
        />
      )}

      {/* Floating Selection Action Bar */}
      {activeView === "library" && selectedClassIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur-md px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200 dark:border-border">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 dark:bg-primary text-white text-xs font-bold shadow-xs">
              {selectedClassIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-foreground">
              {selectedClassIds.length === 1
                ? "1 class selected"
                : `${selectedClassIds.length} classes selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenBatchAssign}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 dark:bg-primary px-4 py-2 text-xs font-bold text-white dark:text-primary-foreground shadow-md hover:bg-blue-800 dark:hover:bg-primary/90 cursor-pointer transition-all active:scale-95"
            >
              <CalendarPlus size={15} />
              <span>Assign to Batch</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground cursor-pointer transition-colors"
            >
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
