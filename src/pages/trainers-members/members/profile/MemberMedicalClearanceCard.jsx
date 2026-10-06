import { FileCheck, Check, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

export function MemberMedicalClearanceCard({
  hasMedicalDoc,
  medicalDocName,
  medicalDocSubtext,
  setIsEditModalOpen,
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <FileCheck size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Medical Clearance & Physical Certificate
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Physician clearance documents and health verification
            </p>
          </div>
        </div>
        {hasMedicalDoc ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
            <Check size={12} />
            <span>Verified On File</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not uploaded</span>
        )}
      </div>

      {hasMedicalDoc && medicalDocName ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background p-4.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <FileCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {medicalDocName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {medicalDocSubtext}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toast.success("Opening document preview…")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Downloading medical certificate…")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/25 px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center text-xs text-muted-foreground">
          <p>No physician clearance file currently uploaded for this member.</p>
          <p className="mt-1">
            Admins can attach PDF medical certificates via the{" "}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-accent underline font-medium hover:text-accent/80 cursor-pointer"
            >
              Edit Profile
            </button>{" "}
            window.
          </p>
        </div>
      )}
    </div>
  );
}
