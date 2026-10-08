/* eslint-disable max-lines */
import { useNavigate } from "react-router-dom";
import {
  Users,
  Phone,
  Mail,
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
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* ─────────────────────────────────────────────────────────────
          Segment 1: Primary Enrolled Members
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Table Container */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Member</th>
                  <th className="py-3.5 px-4 sm:px-5">Contact</th>
                  <th className="py-3.5 px-4 sm:px-5">Gender</th>
                  <th className="py-3.5 px-4 sm:px-5">Flex Status</th>
                  <th className="py-3.5 px-4 sm:px-5">Status</th>
                  <th className="py-3.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs sm:text-sm font-medium">
                {filteredPrimaryMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/60">
                          <Users size={22} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          No primary members enrolled yet
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Enroll members to schedule them into {batch?.name || "this batch"}.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPrimaryMembers.map((mem) => {
                    const initials = `${mem.firstName?.[0] || ""}${mem.lastName?.[0] || ""}`.toUpperCase();
                    return (
                      <tr
                        key={mem.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Member Identity */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/trainers-members/members/${mem.id}`)}
                              title="View member profile"
                              className="h-9 w-9 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold text-xs flex items-center justify-center hover:scale-105 hover:ring-2 hover:ring-primary/40 transition-all shrink-0 cursor-pointer"
                            >
                              {initials || "M"}
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/trainers-members/members/${mem.id}`)}
                                className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors block truncate"
                              >
                                {mem.firstName} {mem.lastName}
                              </button>
                              <span className="font-mono text-[10px] font-semibold text-muted-foreground/80 block mt-0.5">
                                #{mem.id?.length > 7 ? mem.id.slice(-6).toUpperCase() : mem.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle text-xs whitespace-nowrap">
                          <div className="space-y-1">
                            <a
                              href={`tel:${mem.mobile}`}
                              className="flex items-center gap-1.5 text-foreground hover:text-accent font-medium transition-colors"
                            >
                              <Phone size={12} className="text-muted-foreground shrink-0" />
                              <span>{mem.mobile || "—"}</span>
                            </a>
                            {mem.email && (
                              <a
                                href={`mailto:${mem.email}`}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[11px] transition-colors truncate max-w-48"
                              >
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate">{mem.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle text-xs whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/60">
                            {mem.gender || "—"}
                          </span>
                        </td>

                        {/* Flex Status */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle text-xs whitespace-nowrap">
                          {mem.isFlexOutActive ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 text-xs font-semibold"
                              title={mem.flexOutDetails?.map((f) => f.targetBatchName).join(", ")}
                            >
                              <CalendarRange size={12} />
                              <span>Flex-Out ({mem.flexOutDetails?.[0]?.targetBatchName || "Active"})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 text-muted-foreground border border-border/40 px-2.5 py-1 text-xs font-medium">
                              Primary Only
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {mem.status || "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-5 align-middle text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveMember(
                                mem.id,
                                `${mem.firstName} ${mem.lastName || ""}`
                              )
                            }
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-transparent hover:border-destructive/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                            title="Remove member from this batch"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Segment 2: Inbound Flexible Attendees
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-display flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <CalendarRange size={16} />
              </span>
              <span>Inbound Flexible Attendees</span>
              <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
                {filteredFlexInMembers.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Members permanently assigned to other batches authorized to attend{" "}
              <strong>{batch?.name || "this batch"}</strong> on select days in {formattedMonthLabel}.
            </p>
          </div>
        </div>

        {filteredFlexInMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40">
            <CalendarRange size={26} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs font-semibold text-foreground">
              No Inbound Flexible Attendees in {formattedMonthLabel}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
              When members from other batches are granted flexible day passes to attend this
              batch slot, they will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-5">Member</th>
                    <th className="py-3.5 px-4 sm:px-5">Home Batch</th>
                    <th className="py-3.5 px-4 sm:px-5">Permitted Days</th>
                    <th className="py-3.5 px-4 sm:px-5">Validity Window</th>
                    <th className="py-3.5 px-4 sm:px-5">Reason</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs sm:text-sm font-medium">
                  {filteredFlexInMembers.map((item) => (
                    <tr
                      key={item.assignmentId || item.memberId}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/trainers-members/members/${item.memberId}`)}
                            title="View member profile"
                            className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-xs flex items-center justify-center hover:scale-105 transition-all shrink-0 cursor-pointer"
                          >
                            {item.name?.charAt(0) || "M"}
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/trainers-members/members/${item.memberId}`)}
                              className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors block truncate"
                            >
                              {item.name}
                            </button>
                            <span className="font-mono text-[10px] font-semibold text-muted-foreground/80 block mt-0.5">
                              #{item.memberId?.length > 7 ? item.memberId.slice(-6).toUpperCase() : item.memberId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Home Batch */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-xs whitespace-nowrap">
                        <span className="rounded-full bg-card border border-border px-2.5 py-0.5 font-semibold text-foreground">
                          {item.primaryBatchName || "Home Batch"}
                        </span>
                      </td>

                      {/* Permitted Days */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-xs">
                        <div className="flex flex-wrap gap-1">
                          {(item.selectedDays || []).map((day) => (
                            <span
                              key={day}
                              className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Validity Window */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {item.startDate} → {item.endDate || "Ongoing"}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-xs text-muted-foreground max-w-xs truncate">
                        {item.reason || "Temporary flexible pass"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onRevokeFlexPass(item.assignmentId, item.name)}
                          className="inline-flex items-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}
