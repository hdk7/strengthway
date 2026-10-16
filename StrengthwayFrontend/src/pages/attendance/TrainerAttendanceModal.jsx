/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Timer,
  ShieldAlert,
  LogIn,
  LogOut,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit3,
} from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, SelectField, TextareaField } from "@/components/form";
import {
  parseTimeToMinutes,
  calculateSessionOverlap,
  getCurrentTimeString,
} from "./trainerAttendanceUtils";
import { getTrainerDailySchedule } from "@/lib/attendanceService";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present (Checked In)" },
  { value: "CONDUCTED", label: "Present (Conducted Session)" },
  { value: "ABSENT", label: "Absent (Missed Class)" },
  { value: "LEAVE", label: "On Leave (Approved Leave)" },
];

export function TrainerAttendanceModal({
  isOpen,
  onClose,
  modalFormData,
  setModalFormData,
  handleSaveModal,
  handleQuickCheckInSession,
  handleQuickCheckOutSession,
  isSubmitting,
  trainers = [],
  batches = [],
  selectedDate,
}) {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Synchronize initial manual mode state based on existing check-in data or explicit override
  useEffect(() => {
    if (isOpen) {
      if (modalFormData.isOverride || modalFormData.checkInTime || modalFormData.checkOutTime) {
        setIsManualMode(Boolean(modalFormData.checkInTime || modalFormData.overrideReason));
      } else {
        setIsManualMode(false);
      }
    }
  }, [isOpen, modalFormData.isOverride, modalFormData.checkInTime, modalFormData.checkOutTime, modalFormData.overrideReason]);

  // Load the trainer's scheduled classes dynamically when trainer or date changes
  useEffect(() => {
    let cancelled = false;
    if (isOpen && modalFormData.trainerId && modalFormData.date) {
      setIsLoadingSchedule(true);
      getTrainerDailySchedule(modalFormData.trainerId, modalFormData.date)
        .then((res) => {
          if (!cancelled) {
            setScheduleData(res);
            // If no sessionId currently selected but schedule has sessions, pre-select first or matching session
            if (res?.sessions?.length > 0) {
              setModalFormData((prev) => {
                if (prev.sessionId) return prev;
                const matchedSession = prev.batchId
                  ? res.sessions.find((s) => s.batchId === prev.batchId) || res.sessions[0]
                  : res.sessions[0];
                return {
                  ...prev,
                  sessionId: matchedSession.id,
                  batchId: matchedSession.batchId,
                  checkInTime: prev.checkInTime || matchedSession.attendanceLog?.checkInTime || "",
                  checkOutTime: prev.checkOutTime || matchedSession.attendanceLog?.checkOutTime || "",
                };
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch trainer schedule:", err);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingSchedule(false);
        });
    } else {
      setScheduleData(null);
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, modalFormData.trainerId, modalFormData.date, setModalFormData]);

  const trainerOptions = useMemo(() => [
    { value: "", label: "Select Faculty Coach" },
    ...trainers.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.shift || "General Shift"})`,
    })),
  ], [trainers]);

  const batchOptions = useMemo(() => [
    { value: "", label: "Select Batch" },
    ...batches.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.timingLabel || b.timing || b.id})`,
    })),
  ], [batches]);

  // Find currently selected session from scheduleData
  const selectedSession = useMemo(() => {
    if (!scheduleData?.sessions?.length) return null;
    if (modalFormData.sessionId) {
      return scheduleData.sessions.find((s) => s.id === modalFormData.sessionId) || null;
    }
    if (modalFormData.batchId) {
      return scheduleData.sessions.find((s) => s.batchId === modalFormData.batchId) || null;
    }
    return scheduleData.sessions[0] || null;
  }, [scheduleData, modalFormData.sessionId, modalFormData.batchId]);

  // Calculation of teaching overlap and actual presence
  const calculatedDurations = useMemo(() => {
    if (!modalFormData.checkInTime || !modalFormData.checkOutTime) {
      return { presenceDuration: null, teachingDuration: null };
    }
    const inM = parseTimeToMinutes(modalFormData.checkInTime);
    const outM = parseTimeToMinutes(modalFormData.checkOutTime);
    if (inM === null || outM === null || outM < inM) {
      return { presenceDuration: null, teachingDuration: null };
    }
    const presenceDuration = outM - inM;

    let teachingDuration = presenceDuration;
    if (selectedSession?.startTime && selectedSession?.endTime) {
      const sStart = parseTimeToMinutes(selectedSession.startTime);
      const sEnd = parseTimeToMinutes(selectedSession.endTime);
      teachingDuration = calculateSessionOverlap(inM, outM, sStart, sEnd);
    }

    return { presenceDuration, teachingDuration };
  }, [modalFormData.checkInTime, modalFormData.checkOutTime, selectedSession]);

  const handleSelectSession = (session) => {
    setModalFormData((prev) => ({
      ...prev,
      sessionId: session.id,
      batchId: session.batchId,
      checkInTime: session.attendanceLog?.checkInTime || "",
      checkOutTime: session.attendanceLog?.checkOutTime || "",
      notes: session.attendanceLog?.notes || "",
    }));
  };

  const handleQuickNormalCheckIn = async () => {
    if (!selectedSession && !modalFormData.sessionId) {
      return toast.error("Please select a scheduled session to mark check-in.");
    }
    if (handleQuickCheckInSession) {
      await handleQuickCheckInSession({
        trainerId: modalFormData.trainerId,
        date: modalFormData.date,
        sessionId: selectedSession?.id || modalFormData.sessionId,
        batchId: selectedSession?.batchId || modalFormData.batchId,
      });
      onClose();
    }
  };

  const handleQuickNormalCheckOut = async () => {
    if (!selectedSession && !modalFormData.sessionId) {
      return toast.error("Please select a scheduled session to mark check-out.");
    }
    if (handleQuickCheckOutSession) {
      await handleQuickCheckOutSession({
        trainerId: modalFormData.trainerId,
        date: modalFormData.date,
        sessionId: selectedSession?.id || modalFormData.sessionId,
        batchId: selectedSession?.batchId || modalFormData.batchId,
      });
      onClose();
    }
  };

  const hasSessionCheckedIn = Boolean(selectedSession?.hasCheckedIn || selectedSession?.attendanceLog?.checkInTime);
  const hasSessionCheckedOut = Boolean(selectedSession?.hasCheckedOut || selectedSession?.attendanceLog?.checkOutTime);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        title="Mark Faculty Class Attendance"
        description="Select scheduled class session, view timings, and record normal server time or administrative corrections."
        icon={CalendarCheck}
        onClose={onClose}
      />

      <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          {/* Section 1: Coach and Date Selection */}
          <FormSectionHeader
            title="Session Schedule & Faculty Coach"
            subtitle="Select the faculty coach and session date to inspect scheduled classes"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <InputField
              type="date"
              label="Attendance Date"
              required
              value={modalFormData.date || selectedDate}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />

            <SelectField
              label="Assigned Faculty Coach"
              required
              value={modalFormData.trainerId}
              onChange={(e) =>
                setModalFormData((prev) => ({
                  ...prev,
                  trainerId: e.target.value,
                  sessionId: "",
                  batchId: "",
                }))
              }
              options={trainerOptions}
            />
          </div>

          {/* Coach Leave Warning Alert */}
          {scheduleData?.isOnLeave && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Coach is on Approved Leave</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  {scheduleData.trainerName} is on approved leave from{" "}
                  <strong>{scheduleData.leaveDetails?.startDate}</strong> to{" "}
                  <strong>{scheduleData.leaveDetails?.endDate}</strong>. Manual override reason is required.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Scheduled Classes List */}
          {modalFormData.trainerId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={13} className="text-accent" />
                  <span>Scheduled Classes on {modalFormData.date}</span>
                </label>
                {isLoadingSchedule && (
                  <span className="text-[10px] text-muted-foreground animate-pulse font-medium">
                    Loading daily schedule…
                  </span>
                )}
              </div>

              {scheduleData?.sessions?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto no-scrollbar p-1">
                  {scheduleData.sessions.map((s) => {
                    const isSelected = modalFormData.sessionId === s.id || (!modalFormData.sessionId && selectedSession?.id === s.id);
                    const isCheckedIn = Boolean(s.attendanceLog?.checkInTime);
                    const isCheckedOut = Boolean(s.attendanceLog?.checkOutTime);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSession(s)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                          isSelected
                            ? "bg-accent/15 border-accent shadow-xs text-foreground ring-1 ring-accent/30"
                            : "bg-card border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs truncate text-foreground">
                            {s.batchName || s.className || "Class Session"}
                          </span>
                          {isCheckedOut ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[9px] px-1.5 py-0.5 shrink-0">
                              <CheckCircle2 size={9} /> Completed
                            </span>
                          ) : isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 shrink-0">
                              <LogIn size={9} /> In: {s.attendanceLog.checkInTime}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 shrink-0">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                          <Clock size={11} className="text-accent shrink-0" />
                          <span>
                            {s.startTime} - {s.endTime}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : !isLoadingSchedule ? (
                <div className="p-3.5 rounded-xl border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground/80">No Explicit Scheduled Classes Found</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    You can select a batch container below to mark batch attendance.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Section 3: Prominent Display of Selected Session Timings */}
          {selectedSession && (
            <div className="p-3.5 rounded-xl border border-accent/25 bg-accent/5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Layers size={13} />
                  <span>Selected Session Schedule</span>
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {selectedSession.batchName || selectedSession.className}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-background border border-border/80">
                  <span className="block text-[10px] text-muted-foreground font-semibold">Scheduled Start</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400">
                    {selectedSession.startTime}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/80">
                  <span className="block text-[10px] text-muted-foreground font-semibold">Scheduled End</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-blue-400">
                    {selectedSession.endTime}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/80">
                  <span className="block text-[10px] text-muted-foreground font-semibold">Class Duration</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-foreground">
                    {parseTimeToMinutes(selectedSession.endTime) && parseTimeToMinutes(selectedSession.startTime)
                      ? `${parseTimeToMinutes(selectedSession.endTime) - parseTimeToMinutes(selectedSession.startTime)} min`
                      : "60 min"}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/80">
                  <span className="block text-[10px] text-muted-foreground font-semibold">Check-In Window</span>
                  <span className="font-mono text-[10px] font-bold text-foreground/90">
                    ±1 hr of start
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback batch container selector if no sessions found */}
          {(!scheduleData?.sessions?.length || !modalFormData.sessionId) && (
            <SelectField
              label="Batch Container (Target Session)"
              required
              value={modalFormData.batchId}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, batchId: e.target.value }))
              }
              options={batchOptions}
            />
          )}

          {/* Section 4: Normal Server Timestamp Quick Attendance Mode */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Normal Attendance (Server Timestamp)</span>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Records actual attendance using the current server timestamp for the selected session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!hasSessionCheckedIn ? (
                  <button
                    type="button"
                    onClick={handleQuickNormalCheckIn}
                    disabled={isSubmitting || !modalFormData.trainerId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogIn size={13} />
                    <span>Record Check-In (Now)</span>
                  </button>
                ) : !hasSessionCheckedOut ? (
                  <button
                    type="button"
                    onClick={handleQuickNormalCheckOut}
                    disabled={isSubmitting || !modalFormData.trainerId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut size={13} />
                    <span>Record Check-Out (Now)</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Toggle for Manual Timestamps / Admin Correction */}
            <div className="pt-2 border-t border-border/70 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualMode}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsManualMode(checked);
                    setModalFormData((prev) => ({
                      ...prev,
                      isOverride: checked,
                      checkInTime: checked ? prev.checkInTime || selectedSession?.startTime || "06:00 AM" : prev.checkInTime,
                      checkOutTime: checked ? prev.checkOutTime || selectedSession?.endTime || "07:00 AM" : prev.checkOutTime,
                    }));
                  }}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <Edit3 size={12} className="text-amber-400" />
                  <span>Manual Timestamp Entry / Administrative Correction</span>
                </span>
              </label>

              {isManualMode && (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                  Audit Trail Required
                </span>
              )}
            </div>
          </div>

          {/* Section 5: Manual Timestamp Inputs (Only when Manual Mode is enabled) */}
          {isManualMode && (
            <div className="space-y-3.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 animate-in fade-in">
              <FormSectionHeader
                title="Manual Timestamps & Floor Hours"
                subtitle="Specify exact check-in and check-out timestamps with mandatory audit reason"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <InputField
                    label="Check-in Time"
                    placeholder="e.g. 06:00 AM"
                    value={modalFormData.checkInTime}
                    onChange={(e) =>
                      setModalFormData((prev) => ({ ...prev, checkInTime: e.target.value }))
                    }
                  />
                  {selectedSession?.startTime && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalFormData((prev) => ({ ...prev, checkInTime: selectedSession.startTime }))
                      }
                      className="text-[10px] text-accent hover:underline mt-1 font-mono"
                    >
                      Use Scheduled Start ({selectedSession.startTime})
                    </button>
                  )}
                </div>

                <div>
                  <InputField
                    label="Check-out Time"
                    placeholder="e.g. 07:00 AM"
                    value={modalFormData.checkOutTime || ""}
                    onChange={(e) =>
                      setModalFormData((prev) => ({ ...prev, checkOutTime: e.target.value }))
                    }
                  />
                  {selectedSession?.endTime && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalFormData((prev) => ({ ...prev, checkOutTime: selectedSession.endTime }))
                      }
                      className="text-[10px] text-accent hover:underline mt-1 font-mono"
                    >
                      Use Scheduled End ({selectedSession.endTime})
                    </button>
                  )}
                </div>
              </div>

              {calculatedDurations.presenceDuration !== null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Timer size={14} className="text-emerald-400" />
                      <span>Teaching Duration:</span>
                    </span>
                    <span className="font-bold font-mono text-emerald-400">
                      {calculatedDurations.teachingDuration} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Clock size={14} className="text-blue-400" />
                      <span>Actual Presence:</span>
                    </span>
                    <span className="font-bold font-mono text-blue-400">
                      {calculatedDurations.presenceDuration} min
                    </span>
                  </div>
                </div>
              )}

              <InputField
                label="Admin Correction / Override Reason (Mandatory)"
                required={isManualMode}
                placeholder="e.g. Biometric scanner offline, verified by floor supervisor"
                value={modalFormData.overrideReason || ""}
                onChange={(e) =>
                  setModalFormData((prev) => ({ ...prev, overrideReason: e.target.value }))
                }
                startIcon={<ShieldAlert size={14} className="text-amber-500" />}
                helperText="Stored permanently in the audit log with your Administrator identity and server timestamp."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <SelectField
                  label="Session Attendance Status"
                  value={modalFormData.status}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  options={STATUS_OPTIONS}
                />

                <InputField
                  label="Attendees Count"
                  type="number"
                  min="0"
                  value={modalFormData.attendeesCount || 0}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, attendeesCount: e.target.value }))
                  }
                />
              </div>

              <TextareaField
                label="Session Notes & Remarks"
                rows={2}
                value={modalFormData.notes}
                onChange={(e) =>
                  setModalFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="e.g. Conditioning split completed, high engagement..."
              />
            </div>
          )}
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText={isManualMode ? "Save Manual Correction" : "Save Attendance"}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default TrainerAttendanceModal;
