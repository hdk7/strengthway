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
          <div className="rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60 p-3 text-xs text-slate-600 dark:text-muted-foreground">
            <div className="font-semibold text-slate-900 dark:text-foreground">
              Class #{selectedSessionForNotes.classNumber}:{" "}
              <span className="font-normal">
                {selectedSessionForNotes.subject || selectedSessionForNotes.className || "Floor Session"}
              </span>
            </div>
            <div className="text-blue-700 dark:text-primary font-medium mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{selectedSessionForNotes.displayDate}</span>
              <span>•</span>
              <span>{selectedSessionForNotes.timing || batch?.timingLabel || "Standard Schedule"}</span>
              <span>•</span>
              <span>{batch?.name}</span>
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
              className="w-full rounded-xl border border-slate-200/90 dark:border-border bg-slate-50/90 dark:bg-muted/40 p-3 text-xs text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 focus:border-[#1e40af] dark:focus:border-primary focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors shadow-2xs active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 px-5 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-[0.99]"
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
