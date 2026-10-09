/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/table/Pagination";
import {
  Users,
  Plus,
  CalendarRange,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
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

  // Pagination for Primary Enrolled Members (5 members per page)
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredPrimaryMembers.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedPrimaryMembers = filteredPrimaryMembers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Pagination for Inbound Flexible Attendees
  const [flexPage, setFlexPage] = useState(1);
  const flexPageSize = 5;
  const totalFlexPages = Math.ceil(filteredFlexInMembers.length / flexPageSize) || 1;
  const safeFlexPage = Math.max(1, Math.min(flexPage, totalFlexPages));

  useEffect(() => {
    if (flexPage > totalFlexPages) {
      setFlexPage(1);
    }
  }, [totalFlexPages, flexPage]);

  const paginatedFlexMembers = filteredFlexInMembers.slice(
    (safeFlexPage - 1) * flexPageSize,
    safeFlexPage * flexPageSize
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Segment 1: Primary Enrolled Members Table */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-md border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-3 px-4 sm:px-5">Member</th>
                <th className="py-3 px-4 sm:px-5">Contact</th>
                <th className="py-3 px-4 sm:px-5">Gender</th>
                <th className="py-3 px-4 sm:px-5">Flex Status</th>
                <th className="py-3 px-4 sm:px-5">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm divide-y divide-border/50 font-medium">
              {filteredPrimaryMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 border border-border/60 text-muted-foreground/60 mb-3">
                        <Users size={24} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        No primary members found
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        There are currently no members enrolled in this batch.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenAddMember}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Plus size={14} />
                        <span>Enroll Member in Batch</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPrimaryMembers.map((mem) => {
                  const fullName = `${mem.firstName || ""} ${mem.lastName || ""}`.trim();
                  const initials = `${mem.firstName?.[0] || ""}${mem.lastName?.[0] || ""}`.toUpperCase();

                  return (
                    <tr
                      key={mem.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle">
                        <div className="flex items-center gap-3">
                          {mem.photo ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/trainers-members/members/${mem.id}`)}
                              className="shrink-0 cursor-pointer focus:outline-none"
                              title="View member profile"
                            >
                              <img
                                src={mem.photo}
                                alt={fullName}
                                className="h-9 w-9 rounded-xl object-cover border border-border/80 hover:scale-105 transition-all"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/trainers-members/members/${mem.id}`)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20 shadow-2xs hover:scale-105 transition-all cursor-pointer focus:outline-none"
                              title="View member profile"
                            >
                              {initials || "M"}
                            </button>
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/trainers-members/members/${mem.id}`)}
                              className="font-bold text-foreground text-xs sm:text-sm hover:text-primary hover:underline transition-colors cursor-pointer text-left truncate block"
                            >
                              {fullName}
                            </button>
                            <span className="inline-flex items-center font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 mt-0.5">
                              #{mem.id?.length > 7 ? mem.id.slice(-6).toUpperCase() : mem.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Phone size={12} className="text-muted-foreground shrink-0" />
                            <span>{mem.mobile || "—"}</span>
                          </div>
                          {mem.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Mail size={12} className="text-muted-foreground/70 shrink-0" />
                              <span className="truncate max-w-[190px]">{mem.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/60">
                          {mem.gender || "—"}
                        </span>
                      </td>

                      {/* Flex Status */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap">
                        {mem.isFlexOutActive ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/25 shadow-2xs"
                            title={mem.flexOutDetails
                              ?.map((f) => f.targetBatchName)
                              .join(", ")}
                          >
                            <CalendarRange size={12} className="text-amber-400 shrink-0" />
                            <span>
                              Flex-Out ({mem.flexOutDetails?.[0]?.targetBatchName || "Active"})
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                            <span>Primary Only</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{mem.status || "Active"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveMember(
                                mem.id,
                                `${mem.firstName} ${mem.lastName || ""}`
                              )
                            }
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Remove member from batch"
                          >
                            <Trash2 size={15} />
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

        {/* Pinned Pagination for Primary Members (5 per page, no per-page selector) */}
        {filteredPrimaryMembers.length > 0 && (
          <div className="p-3 border-t border-border/60 bg-muted/15">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredPrimaryMembers.length}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
              itemLabel="members"
              compact
            />
          </div>
        )}
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
              Members permanently assigned to other batches who are authorized
              to attend {batch?.name} on specific days in {formattedMonthLabel}.
            </p>
          </div>
        </div>

        {filteredFlexInMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
            <CalendarRange
              size={24}
              className="mx-auto text-muted-foreground/50 mb-1.5"
            />
            <p className="text-xs font-semibold text-foreground">
              No Inbound Flexible Attendees in {formattedMonthLabel}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
              When members from other batches are granted flexible day passes to
              attend this batch slot, they will be tracked here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-md border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-3 px-4 sm:px-5">Member</th>
                    <th className="py-3 px-4 sm:px-5">Home Batch</th>
                    <th className="py-3 px-4 sm:px-5">Permitted Days</th>
                    <th className="py-3 px-4 sm:px-5">Validity Window</th>
                    <th className="py-3 px-4 sm:px-5">Reason</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm divide-y divide-border/50 font-medium">
                  {paginatedFlexMembers.map((item) => (
                    <tr
                      key={item.assignmentId || item.memberId}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      {/* Member */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-2xs">
                            {item.name?.charAt(0) || "M"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs sm:text-sm">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50">
                                #
                                {item.memberId?.length > 7
                                  ? item.memberId.slice(-6).toUpperCase()
                                  : item.memberId}
                              </span>
                              {item.mobile && (
                                <span className="text-[11px] font-medium">
                                  • {item.mobile}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Home Batch */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          {item.primaryBatchName || "Home Batch"}
                        </span>
                      </td>

                      {/* Permitted Days */}
                      <td className="py-3.5 px-4 sm:px-5 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {(item.selectedDays || []).map((day) => (
                            <span
                              key={day}
                              className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400"
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
                          onClick={() =>
                            onRevokeFlexPass(item.assignmentId, item.name)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
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

            {/* Pagination for Inbound Flex Members if multi-page */}
            {filteredFlexInMembers.length > flexPageSize && (
              <div className="p-3 border-t border-border/60 bg-muted/15">
                <Pagination
                  currentPage={safeFlexPage}
                  totalPages={totalFlexPages}
                  totalItems={filteredFlexInMembers.length}
                  pageSize={flexPageSize}
                  onPageChange={(p) => setFlexPage(p)}
                  itemLabel="attendees"
                  compact
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
