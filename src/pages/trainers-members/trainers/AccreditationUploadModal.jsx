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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-scale-up">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">Verify & Record Accreditation</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
            <FileText size={24} className="text-red-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-muted-foreground">
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmUpload}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-background px-5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>{isUploading ? "Verifying..." : "Verify & Save Document"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
