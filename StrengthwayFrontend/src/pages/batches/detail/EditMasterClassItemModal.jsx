import { createPortal } from "react-dom";
import { X, Dumbbell } from "lucide-react";
import { InputField, TextareaField } from "@/components/form";

export default function EditMasterClassItemModal({
  isOpen,
  onClose,
  editingMasterItem,
  setEditingMasterItem,
  onSave,
}) {
  if (!isOpen || !editingMasterItem || typeof document === "undefined") {
    return null;
  }

  const programName =
    editingMasterItem.name !== undefined
      ? editingMasterItem.name
      : editingMasterItem.subject || "";

  const beginnerWorkouts =
    editingMasterItem.beginnerWorkouts !== undefined
      ? editingMasterItem.beginnerWorkouts === "Not specified"
        ? ""
        : editingMasterItem.beginnerWorkouts
      : "";

  const intermediateWorkouts =
    editingMasterItem.intermediateWorkouts !== undefined
      ? editingMasterItem.intermediateWorkouts === "Not specified"
        ? ""
        : editingMasterItem.intermediateWorkouts
      : "";

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-primary/15 text-blue-700 dark:text-primary text-xs font-black">
              {editingMasterItem.classNumber || 1}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                <span>Edit Scheduled Class</span>
                {editingMasterItem.classId && (
                  <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                    {editingMasterItem.classId}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Class #{String(editingMasterItem.classNumber || 1).padStart(2, "0")}{" "}
                {editingMasterItem.weekNumber ? `• Week ${editingMasterItem.weekNumber}` : ""}{" "}
                {editingMasterItem.dayOfWeek ? `• ${editingMasterItem.dayOfWeek}` : ""}{" "}
                {editingMasterItem.displayDate ? `• ${editingMasterItem.displayDate}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-sm">
          {/* Class Program Name */}
          <InputField
            label="Class Program Name"
            placeholder="e.g. Push, Legs, Pull or Circuit Training"
            value={programName}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                name: e.target.value,
                subject: e.target.value,
              })
            }
            required
          />

          {/* Beginner Workout Content */}
          <TextareaField
            rows={3}
            label="Beginner Workout Content"
            placeholder="e.g. 5 Push ups; 5 GB Squats; 5 Pulls; 5 Deadlift; × 5 sets"
            value={beginnerWorkouts}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                beginnerWorkouts: e.target.value,
              })
            }
          />

          {/* Intermediate Workout Content */}
          <TextareaField
            rows={4}
            label="Intermediate Workout Content"
            placeholder="e.g. Push: Push ups 5–10 × 3; Dips 4–10 × 3; OH Press 6–10 × 3..."
            value={intermediateWorkouts}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                intermediateWorkouts: e.target.value,
              })
            }
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-xs font-bold cursor-pointer shadow-md transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
