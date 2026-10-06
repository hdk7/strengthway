import { createPortal } from "react-dom";
import { CalendarDays, X, Dumbbell, Layers } from "lucide-react";
import { CurriculumSyllabusTab } from "./CurriculumSyllabusTab";
import { BatchTrackingTab } from "./BatchTrackingTab";

export function ScheduleCurriculumViewModal({
  viewingSchedule,
  onClose,
  viewModalTab,
  setViewModalTab,
  viewingItems,
  viewingBatchTracking,
  isAddingClassInModal,
  setIsAddingClassInModal,
  setEditingClassInModalId,
  newClassForm,
  setNewClassForm,
  handleSaveNewClassInModal,
  editingClassInModalId,
  editingClassForm,
  setEditingClassForm,
  handleSaveClassInModal,
  handleDeleteClassInModal,
  onOpenAssignModal,
  navigate,
  handleUpdateBatchSessionStatus,
}) {
  if (!viewingSchedule || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    {viewingSchedule.name}
                  </h2>
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                    {viewingItems.length} Classes
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {viewingSchedule.description || "Reusable class program curriculum"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-border/60 -mb-4">
            <button
              onClick={() => setViewModalTab("curriculum")}
              className={`pb-3 px-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                viewModalTab === "curriculum"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Dumbbell size={14} />
              <span>Curriculum Syllabus ({viewingItems.length})</span>
            </button>

            <button
              onClick={() => setViewModalTab("tracking")}
              className={`pb-3 px-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                viewModalTab === "tracking"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers size={14} />
              <span>Batch-Wise Tracking ({viewingBatchTracking.length} Batches)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {viewModalTab === "curriculum" ? (
            <CurriculumSyllabusTab
              viewingItems={viewingItems}
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
            />
          ) : (
            <BatchTrackingTab
              viewingBatchTracking={viewingBatchTracking}
              viewingSchedule={viewingSchedule}
              onOpenAssignModal={onOpenAssignModal}
              navigate={navigate}
              handleUpdateBatchSessionStatus={handleUpdateBatchSessionStatus}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border p-4 bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Reusable program assigned to {viewingBatchTracking.length} batch(es)
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
