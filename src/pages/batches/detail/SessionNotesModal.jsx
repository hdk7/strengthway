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
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border">
          <h3 className="font-bold text-slate-900 dark:text-foreground text-sm">Session Coach Notes</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSave} className="mt-4 space-y-4">
          <div className="text-xs text-slate-500 dark:text-muted-foreground">
            <strong className="text-slate-800 dark:text-foreground">Class #{selectedSessionForNotes.classNumber}:</strong>{" "}
            {selectedSessionForNotes.subject}
            <div className="text-blue-700 dark:text-primary font-medium mt-0.5">
              {selectedSessionForNotes.displayDate} •{" "}
              {selectedSessionForNotes.timing || batch?.timingLabel} • {batch?.name}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-foreground block mb-1">
              Floor Cues, Member Absences, or Equipment Notes
            </label>
            <textarea
              rows={4}
              value={sessionNoteText}
              onChange={(e) => setSessionNoteText(e.target.value)}
              placeholder="Record PRs, floor observations, or substitution notes here..."
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-sm"
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
