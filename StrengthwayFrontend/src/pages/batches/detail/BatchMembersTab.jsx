/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/table";
import {
  Users,
  Plus,
  CalendarRange,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
} from "lucide-react";
import { isAdmin, getRoleBasePath } from "@/auth/currentUser";

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

  // Pagination for Primary Enrolled Members (7 members per page)
  const PAGE_SIZE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredPrimaryMembers.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Pagination for Inbound Flexible Attendees (7 attendees per page)
  const [flexPage, setFlexPage] = useState(1);
  const flexPageSize = 7;
  const totalFlexPages = Math.ceil(filteredFlexInMembers.length / flexPageSize) || 1;
  const safeFlexPage = Math.max(1, Math.min(flexPage, totalFlexPages));

  useEffect(() => {
    if (flexPage > totalFlexPages) {
      setFlexPage(1);
    }
  }, [totalFlexPages, flexPage]);

  // ─── 1. Declarative Columns for Primary Enrolled Members ───────────────────
  const primaryMemberColumns = useMemo(
    () => [
      {
        header: "Member",
        cell: (mem) => {
          const fullName = `${mem.firstName || ""} ${mem.lastName || ""}`.trim();
          const initials = `${mem.firstName?.[0] || ""}${mem.lastName?.[0] || ""}`.toUpperCase();

          return (
            <div className="flex items-center gap-3">
              {mem.photo ? (
                <button
                  type="button"
                  onClick={() => navigate(`${getRoleBasePath()}/trainers-members/members/${mem.id}`)}
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
                  onClick={() => navigate(`${getRoleBasePath()}/trainers-members/members/${mem.id}`)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20 shadow-2xs hover:scale-105 transition-all cursor-pointer focus:outline-none"
                  title="View member profile"
                >
                  {initials || "M"}
                </button>
              )}
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`${getRoleBasePath()}/trainers-members/members/${mem.id}`)}
                  className="font-bold text-foreground text-xs sm:text-sm hover:text-primary hover:underline transition-colors cursor-pointer text-left truncate block"
                >
                  {fullName}
                </button>
                <span className="inline-flex items-center font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 mt-0.5">
                  #{mem.id?.length > 7 ? mem.id.slice(-6).toUpperCase() : mem.id}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Contact",
        className: "whitespace-nowrap",
        cell: (mem) => (
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
        ),
      },
      {
        header: "Gender",
        className: "whitespace-nowrap",
        cell: (mem) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/60">
            {mem.gender || "—"}
          </span>
        ),
      },
      {
        header: "Flex / Attendance Status",
        className: "whitespace-nowrap",
        cell: (mem) => {
          if (mem.isFlexOutActive) {
            const firstFlex = mem.flexOutDetails?.[0];
            return (
              <div className="flex flex-col gap-0.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/25 shadow-2xs"
                  title={`Temporarily flexed to ${firstFlex?.targetBatchName || "target batch"} until ${firstFlex?.endDate || ""}`}
                >
                  <CalendarRange size={12} className="text-amber-500 shrink-0" />
                  <span>Flex-Out: {firstFlex?.targetBatchName || "Target Batch"}</span>
                </span>
                {firstFlex?.endDate && (
                  <span className="text-[10px] text-muted-foreground font-mono pl-1">
                    Until {firstFlex.endDate}
                  </span>
                )}
              </div>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active in Home Batch</span>
            </span>
          );
        },
      },
      {
        header: "Plan & Entitlements",
        className: "whitespace-nowrap",
        cell: (mem) => (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground">
              {mem.membershipPlan?.name || "Standard Plan"}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(mem.pendingSessionsCount > 0 || (mem.carryForwardSessions && mem.carryForwardSessions.length > 0)) && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                  title="Carried-forward pending sessions from emergency class cancellations"
                >
                  <RotateCcw size={10} />
                  <span>+{mem.pendingSessionsCount || mem.carryForwardSessions.length} Pending</span>
                </span>
              )}
              {mem.totalAdjustmentCredit > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono"
                  title="Available cancellation adjustment credit towards next renewal"
                >
                  <span>₹{mem.totalAdjustmentCredit} Credit</span>
                </span>
              )}
              {!(mem.pendingSessionsCount > 0) && !mem.totalAdjustmentCredit && (
                <span className="text-[10px] text-muted-foreground">Standard</span>
              )}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        className: "whitespace-nowrap",
        cell: (mem) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{mem.status || "Active"}</span>
          </span>
        ),
      },
      {
        header: "Actions",
        align: "right",
        className: "whitespace-nowrap",
        cell: (mem) => (
          <div className="flex items-center justify-end gap-1.5">
            {isAdmin() && (
              <button
                type="button"
                onClick={() =>
                  onRemoveMember(
                    mem.id,
                    `${mem.firstName} ${mem.lastName || ""}`
                  )
                }
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Remove member from batch"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [navigate, onRemoveMember]
  );

  // ─── 2. Declarative Columns for Inbound Flexible Attendees ─────────────────
  const flexMemberColumns = useMemo(
    () => [
      {
        header: "Member",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-2xs">
              {item.name?.charAt(0) || "M"}
            </div>
            <div>
              <p className="font-bold text-foreground text-xs sm:text-sm">{item.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50">
                  #{item.memberId?.length > 7 ? item.memberId.slice(-6).toUpperCase() : item.memberId}
                </span>
                {item.mobile && <span className="text-[11px] font-medium">• {item.mobile}</span>}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Home Batch",
        className: "whitespace-nowrap",
        cell: (item) => (
          <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {item.primaryBatchName || "Home Batch"}
          </span>
        ),
      },
      {
        header: "Permitted Days",
        cell: (item) => (
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
        ),
      },
      {
        header: "Validity Window",
        className: "whitespace-nowrap font-mono text-xs text-muted-foreground",
        cell: (item) => `${item.startDate} → ${item.endDate || "Ongoing"}`,
      },
      {
        header: "Reason",
        className: "text-xs text-muted-foreground max-w-xs truncate",
        cell: (item) => item.reason || "Temporary flexible pass",
      },
      {
        header: "Action",
        align: "right",
        className: "whitespace-nowrap",
        cell: (item) => (
          <div className="flex items-center justify-end">
            {isAdmin() && (
              <button
                type="button"
                onClick={() => onRevokeFlexPass(item.assignmentId || item.transactionId || item.memberId, item.name)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Revoke flexible pass"
              >
                <RotateCcw size={12} />
                <span>Revoke Pass</span>
              </button>
            )}
          </div>
        ),
      },
    ],
    [onRevokeFlexPass]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Segment 1: Primary Enrolled Members Standardized Data Table */}
      <div className="space-y-2">
        <DataTable
          columns={primaryMemberColumns}
          data={filteredPrimaryMembers}
          keyField="id"
          pageSize={PAGE_SIZE}
          currentPage={safePage}
          onPageChange={setCurrentPage}
          totalItems={filteredPrimaryMembers.length}
          totalPages={totalPages}
          itemLabel="members"
          showToolbar={false}
          emptyIcon={Users}
          emptyTitle="No primary members found"
          emptyMessage="There are currently no members enrolled in this batch."
          emptyAction={
            isAdmin() ? (
              <button
                type="button"
                onClick={onOpenAddMember}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus size={14} />
                <span>Enroll Member in Batch</span>
              </button>
            ) : null
          }
          className="flex-1 min-h-0"
        />
      </div>

      {/* Segment 2: Inbound Flexible Attendees Standardized Data Table */}
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
              Active inbound flexible attendees authorized to attend {batch?.name} on specific days.
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
              No Active Inbound Flexible Attendees
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
              When members from other batches are granted active flexible day passes to
              attend this batch slot, they will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={flexMemberColumns}
            data={filteredFlexInMembers}
            keyField="assignmentId"
            pageSize={flexPageSize}
            currentPage={safeFlexPage}
            onPageChange={setFlexPage}
            totalItems={filteredFlexInMembers.length}
            totalPages={totalFlexPages}
            itemLabel="attendees"
            showToolbar={false}
            emptyIcon={CalendarRange}
            emptyTitle={`No Inbound Flexible Attendees in ${formattedMonthLabel}`}
            emptyMessage="When members from other batches are granted flexible day passes to attend this batch slot, they will be tracked here."
            className="flex-1 min-h-0"
          />
        )}
      </div>
    </div>
  );
}
