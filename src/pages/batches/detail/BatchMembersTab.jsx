/* eslint-disable max-lines */
import {
  Users,
  Plus,
  ArrowRightLeft,
  CalendarRange,
  Trash2,
  RotateCcw,
} from "lucide-react";

export default function BatchMembersTab({
  batch,
  formattedMonthLabel,
  filteredPrimaryMembers = [],
  filteredFlexInMembers = [],
  onOpenAddMember,
  onOpenTransfer,
  onRemoveMember,
  onRevokeFlexPass,
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Segment 1: Primary Enrolled Members */}
      <div className="space-y-3">
        <div className="overflow-x-auto overflow-y-auto max-h-110 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-2.5 px-4 sm:px-5">Member</th>
                <th className="py-2.5 px-4 sm:px-5">Contact</th>
                <th className="py-2.5 px-4 sm:px-5">Gender</th>
                <th className="py-2.5 px-4 sm:px-5">Flex Status</th>
                <th className="py-2.5 px-4 sm:px-5">Status</th>
                <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {filteredPrimaryMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="bg-card py-8 px-4 text-center text-muted-foreground border-y border-border/50 rounded-2xl border-x"
                  >
                    <Users size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No primary members found</p>
                    <button
                      onClick={onOpenAddMember}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Enroll Member in Batch</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPrimaryMembers.map((mem) => {
                  return (
                    <tr
                      key={mem.id}
                      className="group transition-all duration-150 hover:-translate-y-px"
                    >
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                            {mem.firstName?.charAt(0)}
                            {mem.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {mem.firstName} {mem.lastName}
                            </p>
                            <span className="font-mono text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                              #{mem.id?.length > 7 ? mem.id.slice(-6).toUpperCase() : mem.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
                        <p className="text-foreground font-medium">{mem.mobile}</p>
                        <p className="text-[11px] opacity-75">{mem.email}</p>
                      </td>
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
                        {mem.gender || "—"}
                      </td>

                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                        {mem.isFlexOutActive ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20"
                            title={mem.flexOutDetails?.map((f) => f.targetBatchName).join(", ")}
                          >
                            <CalendarRange size={11} />
                            Flex-Out ({mem.flexOutDetails?.[0]?.targetBatchName || "Active"})
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Primary Only</span>
                        )}
                      </td>
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 px-2.5 py-1 text-xs font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {mem.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Permanent Transfer button */}
                          <button
                            onClick={() => onOpenTransfer(mem, "transfer")}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Transfer to another batch permanently"
                          >
                            <ArrowRightLeft size={14} className="text-primary" />
                          </button>

                          {/* Temporary Flex Pass button */}
                          <button
                            onClick={() => onOpenTransfer(mem, "flex")}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Assign temporary flexible pass to another batch"
                          >
                            <CalendarRange size={14} className="text-amber-400" />
                          </button>

                          {/* Remove from batch button */}
                          <button
                            onClick={() =>
                              onRemoveMember(
                                mem.id,
                                `${mem.firstName} ${mem.lastName || ""}`
                              )
                            }
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove from this batch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment 2: Inbound Flexible Attendees */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
                <CalendarRange size={13} />
              </span>
              <span>Inbound Flexible Attendees</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
                {filteredFlexInMembers.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Members permanently assigned to other batches who are authorized to attend{" "}
              {batch?.name} on specific days in {formattedMonthLabel}.
            </p>
          </div>
        </div>

        {filteredFlexInMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
            <CalendarRange size={24} className="mx-auto text-muted-foreground/50 mb-1.5" />
            <p className="text-xs font-semibold text-foreground">
              No Inbound Flexible Attendees in {formattedMonthLabel}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
              When members from other batches are granted flexible day passes to attend this
              batch slot, they will be tracked here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-110 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Member</th>
                  <th className="py-2.5 px-4 sm:px-5">Home Batch</th>
                  <th className="py-2.5 px-4 sm:px-5">Permitted Days</th>
                  <th className="py-2.5 px-4 sm:px-5">Validity Window</th>
                  <th className="py-2.5 px-4 sm:px-5">Reason</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {filteredFlexInMembers.map((item) => (
                  <tr
                    key={item.assignmentId || item.memberId}
                    className="group transition-all duration-150 hover:-translate-y-px"
                  >
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-bold text-amber-500">
                          {item.name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                              #{item.memberId?.length > 7 ? item.memberId.slice(-6).toUpperCase() : item.memberId}
                            </span>
                            {item.mobile && <span>• {item.mobile}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                      <span className="rounded-full bg-card border border-border px-2.5 py-0.5 font-semibold text-foreground">
                        {item.primaryBatchName || "Home Batch"}
                      </span>
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs">
                      <div className="flex flex-wrap gap-1">
                        {(item.selectedDays || []).map((day) => (
                          <span
                            key={day}
                            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {item.startDate} → {item.endDate || "Ongoing"}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground max-w-xs truncate">
                      {item.reason || "Temporary flexible pass"}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRevokeFlexPass(item.assignmentId, item.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                        title="Revoke flexible pass"
                      >
                        <RotateCcw size={12} />
                        <span>Revoke Pass</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
