import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function SessionNotesModal({
  selectedSessionForNotes,
  onClose,
  sessionNoteText,
  setSessionNoteText,
  onSave,
  batch,
}) {
  if (!selectedSessionForNotes || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Session Coach Notes</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSave} className="mt-4 space-y-4">
          <div className="text-xs text-muted-foreground">
            <strong>Class #{selectedSessionForNotes.classNumber}:</strong>{" "}
            {selectedSessionForNotes.subject}
            <div className="text-primary font-medium mt-0.5">
              {selectedSessionForNotes.displayDate} •{" "}
              {selectedSessionForNotes.timing || batch?.timingLabel} • {batch?.name}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Floor Cues, Member Absences, or Equipment Notes
            </label>
            <textarea
              rows={4}
              value={sessionNoteText}
              onChange={(e) => setSessionNoteText(e.target.value)}
              placeholder="Record PRs, floor observations, or substitution notes here..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
