import { Link } from "react-router-dom";
import { Award, FileCheck, Copy, Check } from "lucide-react";

export function MemberPlanDossierCard({
  member,
  planDetails,
  isDeleted,
  copiedField,
  handleCopy,
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Award size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Membership Plan & Dossier
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Subscription agreement, batch allocation, and facility access
            </p>
          </div>
        </div>
      </div>

      {/* 4. Enrolled Membership Plan */}
      {planDetails && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Enrolled Membership Plan
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              {planDetails.name}
            </span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-border/40 text-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Duration
                </span>
                <span className="text-xs font-bold text-foreground">
                  {planDetails.durationMonths} Month{planDetails.durationMonths > 1 ? "s" : ""}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Fee
                </span>
                <span className="text-xs font-bold text-accent font-mono">
                  {planDetails.formattedPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Expires
                </span>
                <span className="text-xs font-bold text-emerald-400 truncate block">
                  {planDetails.formattedEnd}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Term Window:</span>
                <span className="font-medium text-foreground">
                  {planDetails.formattedStart} — {planDetails.formattedEnd}
                </span>
              </div>

              {member.paymentDetails && (
                <>
                  <div className="flex items-center justify-between text-muted-foreground pt-1.5 border-t border-border/40">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-foreground">
                      {member.paymentDetails.method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Txn Reference:</span>
                    <span className="font-mono text-[11px] text-foreground font-semibold">
                      {member.paymentDetails.transactionId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Receipt Number:</span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold">
                      {member.paymentDetails.receiptNo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Payment Status:</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {member.paymentDetails.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Membership Account Dossier */}
      <div className="space-y-2.5 pt-3.5 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <FileCheck size={13} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Membership Account Dossier
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs divide-y divide-border/40">
          <div className="flex items-center justify-between pb-2">
            <span className="text-muted-foreground">System Record ID:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-foreground">{member.id}</span>
              <button
                type="button"
                onClick={() => handleCopy(member.id, "memberId", "Member ID")}
                className="rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy ID"
              >
                {copiedField === "memberId" ? (
                  <Check size={11} className="text-emerald-500" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
          </div>

          {member.batchId && (
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Assigned Batch:</span>
              <Link
                to={`/admin/batches/${member.batchId}`}
                className="font-bold text-accent hover:underline flex items-center gap-1"
              >
                <span>{member.batchId}</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({member.batchTiming || "Morning"})
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Enrolled Date:</span>
            <span className="font-medium text-foreground">
              {member.registeredAt
                ? new Date(member.registeredAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Facility Access:</span>
            <span className="font-semibold text-emerald-400">
              Full Gym Floor & Equipment
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground">Record Status:</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              {isDeleted ? "Archived" : member.status || "Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
