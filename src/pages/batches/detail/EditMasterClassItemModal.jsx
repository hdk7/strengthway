import { createPortal } from "react-dom";
import { X } from "lucide-react";
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

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-extrabold">
              {editingMasterItem.classNumber}
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Edit Class {editingMasterItem.classNumber} Curriculum
              </h3>
              <p className="text-xs text-muted-foreground">
                Week {editingMasterItem.weekNumber} • {editingMasterItem.dayOfWeek}{" "}
                {editingMasterItem.displayDate ? `• ${editingMasterItem.displayDate}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-sm">
          <InputField
            label="Class Subject / Title"
            value={editingMasterItem.subject}
            onChange={(e) =>
              setEditingMasterItem({ ...editingMasterItem, subject: e.target.value })
            }
            required
          />

          <TextareaField
            rows={4}
            label="Workout Focus & Coaching Guidance"
            value={editingMasterItem.message}
            onChange={(e) =>
              setEditingMasterItem({ ...editingMasterItem, message: e.target.value })
            }
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer shadow-md"
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
