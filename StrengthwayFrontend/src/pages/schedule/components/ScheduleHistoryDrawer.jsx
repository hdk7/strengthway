import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  History,
  X,
  ArrowLeftRight,
  Layers,
  Shuffle,
  Clock,
  RefreshCw,
  User,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getBatchScheduleHistory } from "@/lib/classProgramService";

function formatTimestamp(isoString) {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${timeStr}`;
}

export function ScheduleHistoryDrawer({ isOpen, onClose, batch }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("ALL");

  const loadHistory = useCallback(async () => {
    if (!batch?.id) return;
    try {
      setLoading(true);
      const res = await getBatchScheduleHistory(batch.id, { limit: 50 });
      const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setHistory(records);
    } catch (err) {
      console.error("Failed to load schedule history:", err);
      toast.error("Failed to load schedule change history.");
    } finally {
      setLoading(false);
    }
  }, [batch?.id]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setFilterAction("ALL");
    }
  }, [isOpen, loadHistory]);

  const filteredHistory = history.filter((item) => {
    if (filterAction === "ALL") return true;
    return item.action === filterAction;
  });

  if (!isOpen || typeof document === "undefined" || !batch) return null;

  const getActionBadge = (action) => {
    switch (action) {
      case "SWAP_DATES":
        return {
          label: "Swap Dates",
          icon: ArrowLeftRight,
          color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        };
      case "ASSIGN_CLASSES":
        return {
          label: "Assigned Classes",
          icon: Layers,
          color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        };
      case "REORDER":
        return {
          label: "Random Shuffle",
          icon: Shuffle,
          color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        };
      default:
        return {
          label: action || "Schedule Update",
          icon: Clock,
          color: "bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground border-slate-200 dark:border-border",
        };
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-110 flex items-center justify-end bg-slate-900/35 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="h-full w-full max-w-lg bg-white dark:bg-card border-l border-slate-200/90 dark:border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-6 py-4.5 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-primary/10 text-indigo-700 dark:text-primary">
              <History size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
                Schedule Change History
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Audit trail of all curriculum changes for <strong>{batch.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              title="Refresh Audit Log"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-border bg-slate-50/60 dark:bg-muted/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={13} className="text-slate-400" />
            <span className="text-slate-500 font-semibold">Filter:</span>
            {["ALL", "SWAP_DATES", "ASSIGN_CLASSES", "REORDER"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterAction(f)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                  filterAction === f
                    ? "bg-white dark:bg-card text-indigo-700 dark:text-primary shadow-2xs border border-slate-200/80 dark:border-border"
                    : "text-slate-500 dark:text-muted-foreground hover:text-slate-800"
                }`}
              >
                {f === "ALL" ? "All" : f === "SWAP_DATES" ? "Swaps" : f === "ASSIGN_CLASSES" ? "Assigned" : "Shuffled"}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 dark:text-muted-foreground font-mono">
            {filteredHistory.length} event(s)
          </span>
        </div>

        {/* History Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={22} className="animate-spin text-indigo-600 dark:text-primary" />
              <span className="text-xs font-semibold">Loading schedule audit log…</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-border p-6 text-center text-xs text-slate-500">
              <History size={26} className="text-slate-300 dark:text-muted-foreground" />
              <p className="font-bold text-slate-700 dark:text-foreground">No Schedule Changes Recorded</p>
              <p className="text-[11px] text-slate-400">
                Any class assignments, date swaps, or shuffles will automatically be logged here.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100 dark:border-border/80 ml-3 space-y-5">
              {filteredHistory.map((item) => {
                const badge = getActionBadge(item.action);
                const BadgeIcon = badge.icon;
                const changeDetails = item.changeDetails || {};

                return (
                  <div key={item.id} className="relative pl-6 group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-2.25 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-card border-2 border-indigo-600 dark:border-primary shadow-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-primary" />
                    </div>

                    {/* Event Card */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2.5">
                      {/* Top Bar: Action Badge & Time */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.color}`}
                        >
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs font-semibold text-slate-900 dark:text-foreground leading-snug">
                        {item.description}
                      </p>

                      {/* Detailed Diff if SWAP_DATES */}
                      {item.action === "SWAP_DATES" && changeDetails.swappedFrom && changeDetails.swappedTo && (
                        <div className="rounded-lg bg-indigo-50/50 dark:bg-muted/40 p-2.5 border border-indigo-100 dark:border-border/60 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-muted-foreground">
                              <strong>{changeDetails.swappedFrom.day} ({changeDetails.swappedFrom.date})</strong>:
                            </span>
                            <span className="font-bold text-indigo-700 dark:text-primary">
                              {changeDetails.swappedTo.className}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-muted-foreground">
                              <strong>{changeDetails.swappedTo.day} ({changeDetails.swappedTo.date})</strong>:
                            </span>
                            <span className="font-bold text-blue-700 dark:text-primary">
                              {changeDetails.swappedFrom.className}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Detailed Diff if ASSIGN_CLASSES */}
                      {item.action === "ASSIGN_CLASSES" && changeDetails.classes && (
                        <div className="rounded-lg bg-blue-50/40 dark:bg-muted/40 p-2 border border-blue-100 dark:border-border/60 text-[11px] text-slate-600 dark:text-muted-foreground">
                          <span>
                            Mapped {changeDetails.totalClasses} classes starting on{" "}
                            <strong>{changeDetails.startDate}</strong>
                          </span>
                        </div>
                      )}

                      {/* Footer: Performed By & Reason */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-border/60 text-[11px] text-slate-500 dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          <span>{item.performedBy || "Admin"}</span>
                        </span>

                        {item.reason && (
                          <span className="italic truncate max-w-xs" title={item.reason}>
                            &ldquo;{item.reason}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 dark:border-border p-4 px-6 bg-white dark:bg-card shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
