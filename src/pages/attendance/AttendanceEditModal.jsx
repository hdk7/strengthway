/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  LogIn,
  LogOut,
  Layers,
  ShieldCheck,
  Loader2,
  FileText,
  XCircle,
} from "lucide-react";
import {
  getCurrentTimeString,
  isCheckOutValid,
} from "./memberAttendanceUtils";

export function AttendanceEditModal({
  isOpen,
  onClose,
  attendee,
  record,
  selectedDate,
  batchName,
  onSave,
  isSubmitting,
}) {
  const [actionType, setActionType] = useState("CHECK_IN"); // "CHECK_IN" | "CHECK_OUT" | "ABSENT"
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const nowStr = getCurrentTimeString();
      const existingIn = record?.checkInTime || "";
      const existingOut = record?.checkOutTime || "";

      setCheckInTime(existingIn || nowStr);
      setCheckOutTime(existingOut);
      setNotes(record?.notes || "");

      if (record?.status === "ABSENT") {
        setActionType("ABSENT");
      } else if (existingIn && !existingOut) {
        setActionType("CHECK_OUT");
        setCheckOutTime(nowStr);
      } else {
        setActionType("CHECK_IN");
      }
    }
  }, [isOpen, record]);

  if (!isOpen) return null;

  const handleActionSelect = (type) => {
    const nowStr = getCurrentTimeString();
    if (type === "CHECK_OUT" && !checkInTime && !record?.checkInTime) {
      toast.error("Check Out action is available only after a successful check-in.");
      return;
    }

    setActionType(type);
    if (type === "CHECK_IN") {
      if (!checkInTime) setCheckInTime(nowStr);
    } else if (type === "CHECK_OUT") {
      if (!checkOutTime) setCheckOutTime(nowStr);
    } else if (type === "ABSENT") {
      setCheckInTime("");
      setCheckOutTime("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (actionType === "CHECK_OUT") {
      if (!checkInTime && !record?.checkInTime) {
        toast.error("Check Out is available only after a successful check-in.");
        return;
      }
      if (!checkOutTime) {
        toast.error("Please enter a check-out time.");
        return;
      }
      if (!isCheckOutValid(checkInTime || record?.checkInTime, checkOutTime)) {
        toast.error("Check-out time cannot be earlier than check-in time.");
        return;
      }
    }

    const finalStatus = actionType === "ABSENT" ? "ABSENT" : "PRESENT";

    onSave({
      memberId: attendee?.memberId || record?.memberId,
      memberName: attendee?.name || record?.memberName,
      date: selectedDate,
      status: finalStatus,
      checkInTime: actionType === "ABSENT" ? "" : checkInTime.trim(),
      checkOutTime: actionType === "CHECK_OUT" ? checkOutTime.trim() : actionType === "ABSENT" ? "" : (checkOutTime ? checkOutTime.trim() : ""),
      notes: notes.trim(),
      isFlexAttendance: Boolean(attendee?.isFlexIn || record?.isFlexAttendance),
      originalPrimaryBatchId: attendee?.primaryBatchId || record?.originalPrimaryBatchId,
      assignmentId: attendee?.assignmentId || record?.assignmentId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-foreground">
                Manage Check-In & Check-Out
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Current day attendance management. Check-in marks status as Present.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member and Session Banner */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-border/70 bg-slate-50/60 dark:bg-muted/20">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-foreground text-sm">
              {attendee?.name || record?.memberName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground font-mono">
              <span>{attendee?.memberId || record?.memberId}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers size={11} className="text-blue-700 dark:text-accent" />
                {batchName || "Batch Session"}
              </span>
            </div>
          </div>
          <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Today's Session
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Selector: Retaining only Check In and Check Out */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-foreground block mb-1.5">
              Attendance Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleActionSelect("CHECK_IN")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 font-bold text-xs transition-all cursor-pointer border ${
                  actionType === "CHECK_IN"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "border-slate-200 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-slate-900 dark:hover:text-foreground"
                }`}
              >
                <LogIn size={14} />
                <span>Check In (Mark Present)</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionSelect("CHECK_OUT")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 font-bold text-xs transition-all cursor-pointer border ${
                  actionType === "CHECK_OUT"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "border-slate-200 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-slate-900 dark:hover:text-foreground"
                }`}
              >
                <LogOut size={14} />
                <span>Check Out</span>
              </button>
            </div>
          </div>

          {/* Timestamps */}
          {actionType !== "ABSENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Check-In Time */}
              <div>
                <label className="font-semibold text-slate-800 dark:text-foreground flex items-center gap-1.5 mb-1">
                  <LogIn size={13} className="text-emerald-500" />
                  <span>Check-In Time</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setCheckInTime(getCurrentTimeString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-700 dark:text-accent hover:underline cursor-pointer"
                  >
                    Now
                  </button>
                </div>
              </div>

              {/* Check-Out Time */}
              <div>
                <label className="font-semibold text-slate-800 dark:text-foreground flex items-center gap-1.5 mb-1">
                  <LogOut size={13} className="text-blue-500 dark:text-blue-400" />
                  <span>Check-Out Time</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 10:45 AM"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    disabled={actionType === "CHECK_IN" && !checkOutTime}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                  />
                  {actionType === "CHECK_OUT" && (
                    <button
                      type="button"
                      onClick={() => setCheckOutTime(getCurrentTimeString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-foreground flex items-center gap-1.5 mb-1">
              <FileText size={13} className="text-blue-700 dark:text-accent" />
              <span>Session Notes (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Completed scheduled workout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={() => handleActionSelect("ABSENT")}
              className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold cursor-pointer"
            >
              <XCircle size={13} />
              <span>Mark as Absent</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-900 dark:hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Attendance</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
