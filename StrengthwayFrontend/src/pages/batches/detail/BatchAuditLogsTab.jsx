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
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBatchAuditLogs,
  processExpiredFlexAssignments,
  getBatchSubstitutionAuditLogs,
} from "@/lib/batchesService";
import { isAdmin } from "@/auth/currentUser";

export default function BatchAuditLogsTab({ batch }) {
  // Navigation Sub-tab: "MEMBERS" | "SUBSTITUTES"
  const [activeSubTab, setActiveSubTab] = useState("MEMBERS");

  // --- Member Transfers & Flex State ---
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters (Member)
  const [search, setSearch] = useState("");
  const [assignmentType, setAssignmentType] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination (Member)
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Trainer Substitutions State ---
  const [subLogs, setSubLogs] = useState([]);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState("");
  const [subStatus, setSubStatus] = useState("ALL");
  const [subReason, setSubReason] = useState("ALL");
  const [subStartDate, setSubStartDate] = useState("");
  const [subEndDate, setSubEndDate] = useState("");
  const [subPage, setSubPage] = useState(1);

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

  const fetchSubLogs = useCallback(async () => {
    if (!batch?.id) return;
    setIsSubLoading(true);
    try {
      const res = await getBatchSubstitutionAuditLogs(batch.id, {
        status: subStatus !== "ALL" ? subStatus : undefined,
        reason: subReason !== "ALL" ? subReason : undefined,
        startDate: subStartDate || undefined,
        endDate: subEndDate || undefined,
      });
      const data = Array.isArray(res?.audits)
        ? res.audits
        : Array.isArray(res)
        ? res
        : [];
      setSubLogs(data);
    } catch (err) {
      console.error("Failed to fetch substitute audit logs:", err);
      toast.error("Failed to load trainer substitution audit history.");
    } finally {
      setIsSubLoading(false);
    }
  }, [batch?.id, subStatus, subReason, subStartDate, subEndDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchSubLogs();
  }, [fetchSubLogs]);

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

  // Trainer Substitutions Derived & Filtered
  const filteredSubLogs = useMemo(() => {
    if (!subSearch.trim()) return subLogs;
    const q = subSearch.toLowerCase();
    return subLogs.filter(
      (item) =>
        item.id?.toLowerCase().includes(q) ||
        item.sessionTopic?.toLowerCase().includes(q) ||
        item.sessionId?.toLowerCase().includes(q) ||
        item.originalCoachName?.toLowerCase().includes(q) ||
        item.substituteCoachName?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.performedBy?.toLowerCase().includes(q)
    );
  }, [subLogs, subSearch]);

  const subStats = useMemo(() => {
    let scheduled = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    let noSub = 0;

    for (const item of subLogs) {
      const st = (item.status || "").toUpperCase();
      if (st === "SCHEDULED") scheduled++;
      else if (st === "ACTIVE") active++;
      else if (st === "COMPLETED") completed++;
      else if (st === "CANCELLED") cancelled++;
      else if (st === "PROCEEDED_WITHOUT_SUB") noSub++;
    }

    return {
      total: subLogs.length,
      scheduled,
      active,
      completed,
      cancelled,
      noSub,
    };
  }, [subLogs]);

  const SUB_PAGE_SIZE = 8;
  const subTotalPages = Math.ceil(filteredSubLogs.length / SUB_PAGE_SIZE) || 1;
  const safeSubPage = Math.max(1, Math.min(subPage, subTotalPages));

  useEffect(() => {
    if (subPage > subTotalPages) {
      setSubPage(1);
    }
  }, [subTotalPages, subPage]);

  const subColumns = useMemo(
    () => [
      {
        header: "Audit ID & Action",
        cell: (item) => {
          const act = item.action || "ASSIGNED";
          let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
          let Icon = UserCheck;
          if (act === "CANCELLED") {
            badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            Icon = XCircle;
          } else if (act === "PROCEEDED_WITHOUT_SUBSTITUTE") {
            badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            Icon = Clock;
          } else if (act === "UPDATED") {
            badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            Icon = RotateCw;
          } else if (act === "COMPLETED") {
            badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
            Icon = CheckCircle2;
          }
          return (
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted/80 text-foreground border border-border/80 inline-block">
                {item.id || "BSUB"}
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${badgeStyle}`}
                >
                  <Icon size={11} /> {act.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Scheduled Session",
        cell: (item) => (
          <div className="space-y-0.5">
            <div className="font-bold text-foreground text-xs flex items-center gap-1">
              <Calendar size={11} className="text-primary" />
              <span>{item.sessionDate || "N/A"}</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock size={10} />
              <span>
                {item.sessionStartTime || "—"} - {item.sessionEndTime || "—"}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
              {item.sessionTopic || item.sessionId || "Class Session"}
            </div>
          </div>
        ),
      },
      {
        header: "Original Coach",
        cell: (item) => (
          <div>
            <div className="font-bold text-foreground text-xs sm:text-sm">
              {item.originalCoachName || item.originalCoachId || "Primary Coach"}
            </div>
            <span className="inline-block rounded-md bg-muted/80 px-1.5 py-0.2 text-[9px] font-semibold text-muted-foreground border border-border/60">
              Primary Coach
            </span>
          </div>
        ),
      },
      {
        header: "Substitute Coach",
        cell: (item) => {
          if (!item.substituteCoachId || item.action === "PROCEEDED_WITHOUT_SUBSTITUTE") {
            return (
              <div>
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <Clock size={11} /> Proceeded Without Sub
                </span>
                <div className="text-[10px] text-muted-foreground">Original/available coach handled</div>
              </div>
            );
          }
          return (
            <div>
              <div className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <span>{item.substituteCoachName || item.substituteCoachId}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-extrabold text-primary">
                  Substitute
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                ID: {item.substituteCoachId}
              </div>
            </div>
          );
        },
      },
      {
        header: "Reason & Notes",
        cell: (item) => {
          const reason = item.reason || "OTHER";
          return (
            <div className="max-w-[220px] space-y-1">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground border border-border">
                {reason}
              </span>
              {item.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2" title={item.notes}>
                  {item.notes}
                </p>
              )}
              {item.cancellationReason && (
                <p className="text-[10px] text-rose-400 font-medium">
                  Cancelled: {item.cancellationReason}
                </p>
              )}
            </div>
          );
        },
      },
      {
        header: "Status",
        cell: (item) => {
          const st = (item.status || "SCHEDULED").toUpperCase();
          if (st === "COMPLETED") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} /> Completed
              </span>
            );
          }
          if (st === "ACTIVE") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Active
              </span>
            );
          }
          if (st === "SCHEDULED") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                <Clock size={12} /> Scheduled
              </span>
            );
          }
          if (st === "CANCELLED") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive border border-destructive/20">
                <XCircle size={12} /> Cancelled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
              {st}
            </span>
          );
        },
      },
      {
        header: "Authorized By & Time",
        cell: (item) => {
          const d = item.performedAt ? new Date(item.performedAt) : null;
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">
                {item.performedBy || "Admin"}
              </div>
              {d && (
                <div className="font-mono text-[10px] text-muted-foreground">
                  {d.toISOString().slice(0, 10)}{" "}
                  {d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

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
      {/* 0. Top Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveSubTab("MEMBERS")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "MEMBERS"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft
              size={13}
              className={activeSubTab === "MEMBERS" ? "text-purple-400" : ""}
            />
            <span>Member Transfers & Flex</span>
            <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] font-mono">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("SUBSTITUTES")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "SUBSTITUTES"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck
              size={13}
              className={activeSubTab === "SUBSTITUTES" ? "text-primary" : ""}
            />
            <span>Coach Substitutions</span>
            <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] font-mono">
              {subStats.total}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground">
          {activeSubTab === "MEMBERS"
            ? "Permanent & temporary athlete roster mobility trail"
            : "Complete session coach substitution & coverage audit log"}
        </div>
      </div>

      {activeSubTab === "MEMBERS" ? (
        <>
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
              {(search ||
                assignmentType !== "ALL" ||
                role !== "ALL" ||
                status !== "ALL" ||
                startDate ||
                endDate) && (
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
        </>
      ) : (
        <>
          {/* 1. Substitutions Header Metrics Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Sub Audits</span>
                <History size={15} className="text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">{subStats.total}</div>
              <div className="text-[10px] text-muted-foreground">Logged actions & assignments</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Scheduled</span>
                <Clock size={15} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{subStats.scheduled}</div>
              <div className="text-[10px] text-muted-foreground">Upcoming sub sessions</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Active Now</span>
                <UserCheck size={15} className="text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">{subStats.active}</div>
              <div className="text-[10px] text-muted-foreground">In-progress sessions</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Completed</span>
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{subStats.completed}</div>
              <div className="text-[10px] text-muted-foreground">Successfully conducted</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Cancelled / No Sub</span>
                <XCircle size={15} className="text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">
                {subStats.cancelled + subStats.noSub}
              </div>
              <div className="text-[10px] text-muted-foreground">Revoked or handled without sub</div>
            </div>
          </div>

          {/* 2. Substitutions Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search by coach name, topic, reason, audit ID..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PROCEEDED_WITHOUT_SUB">Proceeded Without Sub</option>
                </select>

                <select
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Reasons</option>
                  <option value="LEAVE">Leave</option>
                  <option value="ABSENT">Absent</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50 flex-wrap">
              <span className="font-semibold flex items-center gap-1 text-foreground">
                <Calendar size={13} className="text-muted-foreground" /> Date Range:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">From:</span>
                <input
                  type="date"
                  value={subStartDate}
                  onChange={(e) => setSubStartDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">To:</span>
                <input
                  type="date"
                  value={subEndDate}
                  onChange={(e) => setSubEndDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                />
              </div>
              {(subSearch ||
                subStatus !== "ALL" ||
                subReason !== "ALL" ||
                subStartDate ||
                subEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSubSearch("");
                    setSubStatus("ALL");
                    setSubReason("ALL");
                    setSubStartDate("");
                    setSubEndDate("");
                  }}
                  className="text-xs font-semibold text-primary hover:underline ml-auto cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* 3. Substitute Audits Data Table */}
          <DataTable
            columns={subColumns}
            data={filteredSubLogs}
            keyField="id"
            pageSize={SUB_PAGE_SIZE}
            currentPage={safeSubPage}
            onPageChange={setSubPage}
            totalItems={filteredSubLogs.length}
            totalPages={subTotalPages}
            itemLabel="substitute audit records"
            showToolbar={false}
            emptyIcon={UserCheck}
            emptyTitle="No trainer substitution audit records found"
            emptyMessage="When a coach substitution is optionally assigned, modified, or cancelled for this batch, an immutable audit entry with complete reason, timing, and admin attribution is logged here."
            className="flex-1 min-h-0"
          />
        </>
      )}
    </div>
  );
}
