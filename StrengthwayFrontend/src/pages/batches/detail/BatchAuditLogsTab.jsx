/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { DataTable } from "@/components/table";
import {
  History,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  CalendarRange,
  ArrowRightLeft,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBatchAuditLogs,
  processExpiredFlexAssignments,
} from "@/lib/batchesService";
import { isAdmin } from "@/auth/currentUser";

export default function BatchAuditLogsTab({ batch }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [assignmentType, setAssignmentType] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    if (!batch?.id) return;
    setIsLoading(true);
    try {
      const res = await getBatchAuditLogs(batch.id, {
        search: search.trim() || undefined,
        assignmentType: assignmentType !== "ALL" ? assignmentType : undefined,
        role: role !== "ALL" ? role : undefined,
        status: status !== "ALL" ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const data = res?.logs || (Array.isArray(res) ? res : []);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch batch audit logs:", err);
      toast.error("Failed to load audit history.");
    } finally {
      setIsLoading(false);
    }
  }, [batch?.id, search, assignmentType, role, status, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRunRejoinCheck = async () => {
    setIsSyncing(true);
    try {
      const res = await processExpiredFlexAssignments();
      const count = res?.rejoinedCount || 0;
      const act = res?.activatedCount || 0;
      if (count > 0 || act > 0) {
        toast.success(
          `Auto-rejoin check processed: ${count} member(s) auto-rejoined home batch, ${act} activated.`
        );
      } else {
        toast.info("All flexible assignments are current. No pending expirations found.");
      }
      await fetchLogs();
    } catch (err) {
      console.error("Auto-rejoin run error:", err);
      toast.error(err.message || "Failed to run auto-rejoin process.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    let outboundFlex = 0;
    let inboundFlex = 0;
    let transfers = 0;
    let rejoined = 0;

    for (const item of logs) {
      if (item.assignmentType === "TEMPORARY_FLEX") {
        if (item.batchRole === "SOURCE") outboundFlex++;
        if (item.batchRole === "TARGET") inboundFlex++;
      } else if (item.assignmentType === "PERMANENT_TRANSFER") {
        transfers++;
      }
      if (item.rejoinedAt || item.status === "Completed") {
        rejoined++;
      }
    }

    return {
      total: logs.length,
      outboundFlex,
      inboundFlex,
      transfers,
      rejoined,
    };
  }, [logs]);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const columns = useMemo(
    () => [
      {
        header: "Transaction & Role",
        cell: (item) => {
          const isSource = item.batchRole === "SOURCE";
          return (
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted/80 text-foreground border border-border/80 inline-block">
                {item.transactionId || item.assignmentId || "TXN"}
              </span>
              <div>
                {isSource ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-500 border border-amber-500/20">
                    <ArrowUpRight size={11} /> Source (Outbound)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-extrabold text-blue-400 border border-blue-500/20">
                    <ArrowDownLeft size={11} /> Target (Inbound)
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Member",
        cell: (item) => (
          <div>
            <div className="font-bold text-foreground text-xs sm:text-sm">
              {item.memberName || item.memberId}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              #{item.memberId?.length > 7 ? item.memberId.slice(-6).toUpperCase() : item.memberId}
            </div>
          </div>
        ),
      },
      {
        header: "Event & Type",
        cell: (item) => {
          const isFlex = item.assignmentType === "TEMPORARY_FLEX";
          const isSource = item.batchRole === "SOURCE";
          return (
            <div className="space-y-1">
              {isFlex ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  <CalendarRange size={11} /> Temporary Flex
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                  <ArrowRightLeft size={11} /> Permanent Transfer
                </span>
              )}
              <div className="text-[11px] font-semibold text-muted-foreground">
                {isFlex
                  ? isSource
                    ? "Flex Pass Granted (Out)"
                    : "Flex Attendee (In)"
                  : isSource
                    ? "Transferred Out"
                    : "Transferred In"}
              </div>
            </div>
          );
        },
      },
      {
        header: "Counterparty Batch",
        cell: (item) => {
          const isSource = item.batchRole === "SOURCE";
          const counterBatch = isSource
            ? item.targetBatchName || item.targetBatchId
            : item.sourceBatchName || item.sourceBatchId;
          return (
            <div>
              <div className="text-xs font-semibold text-foreground">
                {counterBatch || "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {isSource ? "Destination Batch" : "Home Batch"}
              </div>
            </div>
          );
        },
      },
      {
        header: "Validity / Effective",
        cell: (item) => {
          if (item.assignmentType === "PERMANENT_TRANSFER") {
            return (
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-medium text-foreground">
                  Effective: {item.effectiveDate || item.startDate}
                </span>
                <div className="text-[10px] text-muted-foreground">Permanent</div>
              </div>
            );
          }
          return (
            <div className="space-y-1">
              <span className="text-xs font-mono font-medium text-foreground block">
                {item.startDate} → {item.endDate || "Ongoing"}
              </span>
              {Array.isArray(item.selectedDays) && item.selectedDays.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.selectedDays.map((d) => (
                    <span
                      key={d}
                      className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground border border-border/60"
                    >
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Status",
        cell: (item) => {
          const st = (item.status || "Active").toLowerCase();
          if (st.includes("completed")) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} /> Completed
              </span>
            );
          }
          if (st.includes("active") || st.includes("in")) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>{item.status}</span>
              </span>
            );
          }
          if (st.includes("scheduled")) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                <Clock size={12} /> Scheduled
              </span>
            );
          }
          if (st.includes("cancel") || st.includes("revok")) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive border border-destructive/20">
                <XCircle size={12} /> Cancelled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
              {item.status}
            </span>
          );
        },
      },
      {
        header: "Flex Attendance",
        cell: (item) => {
          if (item.assignmentType !== "TEMPORARY_FLEX") return <span className="text-muted-foreground">—</span>;
          const count = item.attendanceCount || 0;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-foreground">
                {count} session{count === 1 ? "" : "s"}
              </span>
              <div className="text-[10px] text-muted-foreground">Logged in flex batch</div>
            </div>
          );
        },
      },
      {
        header: "Rejoined At",
        cell: (item) => {
          if (!item.rejoinedAt) {
            return <span className="text-[11px] text-muted-foreground italic">Pending end date</span>;
          }
          const d = new Date(item.rejoinedAt);
          return (
            <div className="space-y-0.5">
              <span className="text-xs font-mono text-foreground font-semibold">
                {d.toISOString().slice(0, 10)}
              </span>
              <div className="text-[10px] text-muted-foreground">
                {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        },
      },
      {
        header: "Reason & Responsible User",
        cell: (item) => (
          <div className="max-w-[220px]">
            <p className="text-xs text-foreground truncate" title={item.reason}>
              {item.reason || "No notes recorded"}
            </p>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              By <strong className="text-foreground">{item.performedBy || "Admin"}</strong> •{" "}
              {item.performedAt ? new Date(item.performedAt).toLocaleDateString() : ""}
            </div>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Metrics Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Logs</span>
            <History size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">Across source & target</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Outbound Flex</span>
            <ArrowUpRight size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.outboundFlex}</div>
          <div className="text-[10px] text-muted-foreground">Flexed to other batches</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Inbound Flex</span>
            <ArrowDownLeft size={15} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{stats.inboundFlex}</div>
          <div className="text-[10px] text-muted-foreground">Flexing into this batch</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Transfers</span>
            <ArrowRightLeft size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{stats.transfers}</div>
          <div className="text-[10px] text-muted-foreground">Permanent moves</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Auto-Rejoined</span>
            <UserCheck size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.rejoined}</div>
          <div className="text-[10px] text-muted-foreground">Completed flex cycles</div>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by member, reason, transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Assignment Types</option>
              <option value="TEMPORARY_FLEX">Temporary Flex</option>
              <option value="PERMANENT_TRANSFER">Permanent Transfer</option>
            </select>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles (Source & Target)</option>
              <option value="SOURCE">Source (Outbound)</option>
              <option value="TARGET">Target (Inbound)</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {isAdmin() && (
              <button
                type="button"
                onClick={handleRunRejoinCheck}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="Runs the automatic rejoining check for any expired flex assignments"
              >
                <RotateCw size={13} className={isSyncing ? "animate-spin" : ""} />
                <span>Run Rejoin Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Window Filters */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50 flex-wrap">
          <span className="font-semibold flex items-center gap-1 text-foreground">
            <Calendar size={13} className="text-muted-foreground" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
            />
          </div>
          {(search || assignmentType !== "ALL" || role !== "ALL" || status !== "ALL" || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setAssignmentType("ALL");
                setRole("ALL");
                setStatus("ALL");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-semibold text-primary hover:underline ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Audit Logs Standardized Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        keyField="id"
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        onPageChange={setCurrentPage}
        totalItems={logs.length}
        totalPages={totalPages}
        itemLabel="audit records"
        showToolbar={false}
        emptyIcon={History}
        emptyTitle="No batch audit logs found"
        emptyMessage="When members are temporarily flexed or permanently transferred in or out of this batch, linked immutable audit logs will be permanently preserved here."
        className="flex-1 min-h-0"
      />
    </div>
  );
}
