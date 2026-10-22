import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Dumbbell, Plus, AlertCircle, RefreshCw, Trash2, X, Check, CalendarPlus, Edit3 } from "lucide-react";
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
import { ClassSessionDetailModal } from "./components/ClassSessionDetailModal";
import { ShuffleClassModal } from "./components/ShuffleClassModal";
import { DataTable } from "@/components/table";
import Pagination from "@/components/table/Pagination";
import { isAdmin } from "@/auth/currentUser";
import { ConfirmDialog } from "@/components/ui";

export default function MasterClassSchedulePage() {
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active perspective: "library" | "month"
  // Month Calendar subtab View is the default view across module navigation, reloads, and refreshes
  const [activeView, setActiveView] = useState("month");

  // View mode within library: defaults to "grid"
  const [viewMode, setViewMode] = useState("grid");

  // Reset to Month Calendar view when navigating to this module
  useEffect(() => {
    setActiveView("month");
  }, [location.key]);

  // Handle in-page navigation clicks from the navigation menu
  useEffect(() => {
    const handleSidebarNav = (e) => {
      const target = e.detail?.view || "month";
      setActiveView(target);
    };

    window.addEventListener("tsw-nav-class-schedule", handleSidebarNav);
    return () => window.removeEventListener("tsw-nav-class-schedule", handleSidebarNav);
  }, []);

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

  // Standardized Table Columns for Master Classes
  const classColumns = useMemo(
    () => [
      ...(isAdmin()
        ? [
            {
              header: "Select",
              className: "w-12 text-center",
              cell: (cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(cls.id);
                    }}
                    className={`mx-auto flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-accent border-accent text-accent-foreground"
                        : "border-border bg-background hover:border-accent"
                    }`}
                    title={isSelected ? "Deselect class" : "Select class"}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              },
            },
          ]
        : []),
      {
        header: "Class Program",
        className: "min-w-[200px]",
        cell: (cls) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-xs border border-accent/20 shadow-2xs">
              <Dumbbell size={16} />
            </span>
            <div className="min-w-0">
              <span className="font-bold text-foreground text-xs sm:text-sm truncate block">
                {cls.name}
              </span>
              <span className="inline-flex items-center font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 mt-0.5">
                #{cls.id}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Beginner Workouts",
        className: "max-w-xs",
        cell: (cls) => {
          const hasBeg = cls.beginnerWorkouts && cls.beginnerWorkouts.trim() !== "Not specified";
          return hasBeg ? (
            <div className="flex items-start gap-1.5 text-xs text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
              <span className="truncate max-w-[260px]" title={cls.beginnerWorkouts}>
                {cls.beginnerWorkouts}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not specified</span>
          );
        },
      },
      {
        header: "Intermediate Workouts",
        className: "max-w-xs",
        cell: (cls) => {
          const hasInt = cls.intermediateWorkouts && cls.intermediateWorkouts.trim() !== "Not specified";
          return hasInt ? (
            <div className="flex items-start gap-1.5 text-xs text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              <span className="truncate max-w-[260px]" title={cls.intermediateWorkouts}>
                {cls.intermediateWorkouts}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not specified</span>
          );
        },
      },
      {
        header: "Status",
        className: "whitespace-nowrap",
        cell: (cls) => (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs border ${
              cls.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border/60"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                cls.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>{cls.status}</span>
          </span>
        ),
      },
      ...(isAdmin()
        ? [
            {
              header: "Actions",
              align: "right",
              className: "whitespace-nowrap",
              cell: (cls) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(cls);
                    }}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Edit class"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingClass(cls);
                    }}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Delete class"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [selectedClassIds, handleToggleSelect, handleOpenEdit]
  );

  // Pagination State (classes library - standardized 7 rows per page)
  const PAGE_SIZE = 7;
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
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5 w-full animate-in fade-in duration-150">
      {/* Header, Stats & Search Controls */}
      <ClassHeaderStats
        activeView={activeView}
        setActiveView={setActiveView}
        viewMode={viewMode}
        setViewMode={setViewMode}
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
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
        </div>
      ) : (
        /* Reusable Classes Library Grid */
        loading ? (
          <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-xs">
            <RefreshCw size={24} className="animate-spin text-accent" />
            <p className="text-xs font-semibold text-foreground">
              Loading reusable classes library…
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
            <AlertCircle size={26} className="text-rose-500" />
            <p className="text-xs font-semibold text-rose-500">{error}</p>
            <button
              onClick={loadData}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-xs">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Dumbbell size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                No Reusable Classes Found
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                {searchQuery
                  ? `No classes matching "${searchQuery}". Try adjusting your search query or filters.`
                  : "No reusable classes exist in the library yet. Click below to create your first class!"}
              </p>
            </div>
            {!searchQuery && isAdmin() && (
              <button
                onClick={handleOpenCreate}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-900 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus size={15} />
                <span>Create Class</span>
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
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
            </div>

            {filteredClasses.length > 0 && (
              <div className="shrink-0 pt-1.5 border-t border-border/40 mt-1">
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
        ) : (
          <DataTable
            columns={classColumns}
            data={filteredClasses}
            keyField="id"
            pageSize={7}
            currentPage={safePage}
            onPageChange={setCurrentPage}
            totalItems={filteredClasses.length}
            totalPages={totalPages}
            showToolbar={false}
            itemLabel="classes"
            loading={loading}
            loadingRowsCount={7}
            className="flex-1 min-h-0"
          />
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
      <ConfirmDialog
        isOpen={Boolean(deletingClass)}
        onClose={() => setDeletingClass(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Reusable Class"
        message="Are you sure you want to delete this class from the library?"
        confirmText={submittingDelete ? "Deleting…" : "Confirm Delete"}
        variant="danger"
        isLoading={submittingDelete}
      >
        {deletingClass && (
          <div className="space-y-2 mt-2">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs space-y-1">
              <span className="font-bold text-foreground block">
                {deletingClass.name}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground block">
                ID: {deletingClass.id}
              </span>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Note: If this class is currently mapped to active upcoming batch sessions, deletion will be blocked to safeguard schedules.
            </p>
          </div>
        )}
      </ConfirmDialog>

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

      {/* Floating Selection Action Bar (Admin Only) */}
      {activeView === "library" && selectedClassIds.length > 0 && isAdmin() && (
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
