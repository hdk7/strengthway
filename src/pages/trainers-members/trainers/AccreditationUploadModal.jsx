import { X, FileText, ShieldCheck } from "lucide-react";
import { InputField } from "@/components/form";

export default function AccreditationUploadModal({
  isOpen,
  onClose,
  pendingFile,
  customTitle,
  setCustomTitle,
  customIssuer,
  setCustomIssuer,
  onConfirmUpload,
  isUploading,
}) {
  if (!isOpen || !pendingFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-foreground">Verify & Record Accreditation</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/60 dark:bg-muted/30 p-3 flex items-center gap-3">
            <FileText size={24} className="text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-foreground truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
              </p>
            </div>
          </div>

          <InputField
            label="Accreditation / Certificate Name"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. CSCS Strength Specialist"
          />

          <InputField
            label="Issuing Authority / Academy"
            value={customIssuer}
            onChange={(e) => setCustomIssuer(e.target.value)}
            placeholder="e.g. NSCA, CrossFit LLC, ACE"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmUpload}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 text-white px-5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            <span>{isUploading ? "Verifying..." : "Verify & Save Document"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
