import { History, ChevronRight } from "lucide-react";

export function MemberBatchHistoryTable({ assignmentHistory }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-accent" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Batch Assignment History Ledger (Audit Trail)
          </h4>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {assignmentHistory.length} {assignmentHistory.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {assignmentHistory.length > 0 ? (
        <div className="overflow-x-auto overflow-y-auto max-h-95 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-2.5 px-4 sm:px-5">Assignment Type</th>
                <th className="py-2.5 px-4 sm:px-5">Batch Transition</th>
                <th className="py-2.5 px-4 sm:px-5">Effective Window / Days</th>
                <th className="py-2.5 px-4 sm:px-5">Authorized By & Reason</th>
                <th className="py-2.5 px-4 sm:px-5 text-right">Status / Date</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {assignmentHistory.map((item, idx) => {
                const type = item.assignmentType || item.type || "ASSIGNMENT";
                const isTransfer = type.includes("TRANSFER");
                const isFlex = type.includes("FLEX");

                return (
                  <tr key={item.id || idx} className="group transition-all duration-150 hover:-translate-y-px">
                    {/* Assignment Type */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isTransfer
                            ? "bg-accent/10 text-accent border-accent/30"
                            : isFlex
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        }`}
                      >
                        {type}
                      </span>
                    </td>

                    {/* Batch Transition */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">
                          {item.fromBatchName || item.fromBatchId || "Initial"}
                        </span>
                        <ChevronRight size={13} className="text-muted-foreground/60 shrink-0" />
                        <span className="font-bold text-foreground">
                          {item.toBatchName || item.toBatchId || item.batchName || item.batchId || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Effective Window / Flex Days */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-mono text-foreground font-medium text-xs">
                          {item.startDate || item.effectiveDate || "Immediate"}
                          {" → "}
                          {item.endDate || "Ongoing"}
                        </div>
                        {Array.isArray(item.flexDays) && item.flexDays.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {item.flexDays.map((d) => (
                              <span
                                key={d}
                                className="rounded-full bg-muted/60 border border-border/50 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground"
                              >
                                {d.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Transferred By & Reason */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors max-w-xs">
                      <div>
                        <span className="font-semibold text-foreground block text-xs">
                          {item.transferredBy || item.changedBy || "System Admin"}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate" title={item.reason}>
                          {item.reason || "Administrative assignment"}
                        </p>
                      </div>
                    </td>

                    {/* Status / Logged Date */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.status === "REVOKED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {item.status || "ACTIVE"}
                        </span>
                        <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No historical batch transfers or flexible pass transitions recorded for this member.
        </div>
      )}
    </div>
  );
}
