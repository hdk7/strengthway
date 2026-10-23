import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  History,
  User,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import { SearchInput } from "@/components/ui";
import { getAttendanceAuditLogs } from "@/lib/attendanceService";
import { toast } from "sonner";

export function AttendanceAuditModal({ isOpen, onClose, defaultType = "ALL" }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState(defaultType); // "ALL" | "MEMBER" | "TRAINER"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const params = {};
      if (filterType !== "ALL") params.attendanceType = filterType;
      if (selectedDate) params.date = selectedDate;
      const data = await getAttendanceAuditLogs(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      toast.error("Failed to load attendance audit history.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, filterType, selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReason = log.reason?.toLowerCase().includes(q);
        const matchesUser = log.performedBy?.toLowerCase().includes(q);
        const matchesRecord = log.recordId?.toLowerCase().includes(q);
        const matchesTarget = (log.targetName || log.memberId || log.trainerId || "")
          .toLowerCase()
          .includes(q);
        if (!matchesReason && !matchesUser && !matchesRecord && !matchesTarget) {
          return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery]);

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(ts);
    }
  };

  const renderValueDiff = (prev = {}, updated = {}) => {
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(updated)])).filter(
      (k) => !["updatedAt", "_id", "__v", "id"].includes(k)
    );

    const changedKeys = allKeys.filter((k) => String(prev[k] ?? "") !== String(updated[k] ?? ""));

    if (changedKeys.length === 0) {
      return (
        <span className="text-xs text-muted-foreground italic">
          Manual administrative verification recorded.
        </span>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {changedKeys.map((key) => {
          const fromVal = prev[key] !== undefined && prev[key] !== null ? String(prev[key]) : "empty";
          const toVal = updated[key] !== undefined && updated[key] !== null ? String(updated[key]) : "empty";

          return (
            <div
              key={key}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/60 border border-border/50"
            >
              <span className="font-semibold text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1")}:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="line-through text-rose-400/80 px-1.5 py-0.5 rounded bg-rose-500/10 text-[11px]">
                  {fromVal || "—"}
                </span>
                <ArrowRight size={12} className="text-muted-foreground" />
                <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-[11px]">
                  {toVal || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="xl">
      <FormModalHeader
        title="Attendance Audit Trail & Verification Log"
        description="Complete administrative compliance record of manual overrides, timing adjustments, and corrections."
        icon={History}
        onClose={onClose}
      />

      <div className="flex flex-col flex-1 min-h-0">
        {/* Controls Bar */}
        <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
            <SearchInput
              placeholder="Search reason, admin, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {/* Filter Type */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
              {[
                { id: "ALL", label: "All" },
                { id: "MEMBER", label: "Member" },
                { id: "TRAINER", label: "Coach" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterType(t.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    filterType === t.id
                      ? "bg-accent/15 text-accent border border-accent/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Audit Logs List */}
        <FormModalBody className="p-3 sm:p-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent mb-2" />
              <p className="text-xs font-semibold">Loading verified audit trail…</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isMember = log.attendanceType === "MEMBER";
              return (
                <div
                  key={log.id || log._id}
                  className="rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-accent/30 space-y-2.5"
                >
                  {/* Top Bar: Type, Target, Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isMember
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isMember ? <User size={10} /> : <ShieldCheck size={10} />}
                        <span>{isMember ? "Member Attendance" : "Coach Attendance"}</span>
                      </span>

                      <span className="text-xs font-bold text-foreground">
                        Record ID: <span className="font-mono text-muted-foreground">{log.recordId}</span>
                      </span>

                      {log.date && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                          <Calendar size={11} />
                          <span>{log.date}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Clock size={11} />
                      <span>{formatTimestamp(log.createdAt || log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Performed By & Reason */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">Authorized Administrator:</span>
                      <span className="font-bold text-foreground px-2 py-0.5 rounded bg-muted/60 font-mono text-[11px]">
                        {log.performedBy || "Admin"}
                      </span>
                    </div>

                    <div className="flex-1 sm:max-w-md bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-medium">
                      <span className="font-bold text-amber-400 mr-1.5">Mandatory Reason:</span>
                      {log.reason || "Administrative correction"}
                    </div>
                  </div>

                  {/* Changes Diff */}
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Recorded State Changes
                    </span>
                    {renderValueDiff(log.previousValues, log.updatedValues)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
              <FileText size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">No Audit Records Found</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                No administrative overrides or corrections have been recorded matching your search filters.
              </p>
            </div>
          )}
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Close Audit Log"
          submitText=""
        />
      </div>
    </FormModal>
  );
}

export default AttendanceAuditModal;
