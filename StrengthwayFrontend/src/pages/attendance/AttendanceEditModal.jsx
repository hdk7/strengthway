/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  LogIn,
  LogOut,
  Layers,
  ShieldCheck,
  FileText,
  XCircle,
  Timer,
  ShieldAlert,
} from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormCalloutBox,
} from "@/components/ui/FormModal";
import { InputField } from "@/components/form";
import {
  getCurrentTimeString,
  isCheckOutValid,
  parseTimeToMinutes,
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
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const nowStr = getCurrentTimeString();
      const existingIn = record?.checkInTime || "";
      const existingOut = record?.checkOutTime || "";

      setCheckInTime(existingIn || nowStr);
      setCheckOutTime(existingOut);
      setOverrideReason("");
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

  const calculatedDuration = () => {
    if (!checkInTime || !checkOutTime) return null;
    const inM = parseTimeToMinutes(checkInTime);
    const outM = parseTimeToMinutes(checkOutTime);
    if (inM === null || outM === null || outM < inM) return null;
    return outM - inM;
  };

  const duration = calculatedDuration();

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

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
      checkOutTime: actionType === "ABSENT" ? "" : checkOutTime.trim(),
      durationMinutes: duration || 0,
      notes: notes.trim(),
      isAdminOverride: Boolean(overrideReason.trim()),
      overrideReason: overrideReason.trim(),
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        title="Manage Attendance & Time Corrections"
        description="Verify check-in, check-out, visit duration, and audit corrections."
        icon={ShieldCheck}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          {/* Member and Session Banner */}
          <FormCalloutBox className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm">
                {attendee?.name || record?.memberName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground font-mono mt-0.5">
                <span>{attendee?.memberId || record?.memberId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers size={11} className="text-blue-700 dark:text-accent" />
                  {batchName || "Batch Session"}
                </span>
              </div>
            </div>
            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {record?.date || selectedDate}
            </span>
          </FormCalloutBox>

          {/* Action Selector: Check In, Check Out */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-foreground block mb-1.5 text-xs">
              Attendance Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleActionSelect("CHECK_IN")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 font-bold text-xs transition-all cursor-pointer border ${
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
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 font-bold text-xs transition-all cursor-pointer border ${
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
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Check-In Time"
                  placeholder="e.g. 06:00 AM"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  inputClassName="font-mono"
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setCheckInTime(getCurrentTimeString())}
                      className="text-[10px] font-bold text-blue-700 dark:text-accent hover:underline cursor-pointer pr-2.5"
                    >
                      Now
                    </button>
                  }
                />

                <InputField
                  label="Check-Out Time"
                  placeholder="e.g. 07:15 AM"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  disabled={actionType === "CHECK_IN" && !checkOutTime}
                  inputClassName="font-mono"
                  endAdornment={
                    actionType === "CHECK_OUT" && (
                      <button
                        type="button"
                        onClick={() => setCheckOutTime(getCurrentTimeString())}
                        className="text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer pr-2.5"
                      >
                        Now
                      </button>
                    )
                  }
                />
              </div>

              {/* Duration Preview Card */}
              {duration !== null && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background/60 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                    <Timer size={14} className="text-indigo-500" />
                    <span>Calculated Visit Duration:</span>
                  </span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {duration} minutes ({Math.round((duration / 60) * 10) / 10} hrs)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Admin Override Reason */}
          <InputField
            label="Admin Correction / Override Reason"
            placeholder="e.g. Biometric sensor glitch; verified via facility gate log"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            startIcon={<ShieldAlert size={14} className="text-amber-500" />}
            helperText="Reason is recorded into the audit trail for regulatory compliance."
          />

          <InputField
            label="Session Notes (Optional)"
            placeholder="e.g. Completed full training program..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            startIcon={<FileText size={14} />}
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Save Attendance"
          isSubmitting={isSubmitting}
          extraLeft={
            <button
              type="button"
              onClick={() => handleActionSelect("ABSENT")}
              className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold cursor-pointer py-1"
            >
              <XCircle size={14} />
              <span>Mark as Absent</span>
            </button>
          }
        />
      </form>
    </FormModal>
  );
}

export default AttendanceEditModal;
