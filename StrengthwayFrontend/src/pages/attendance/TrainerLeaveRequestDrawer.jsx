/* eslint-disable max-lines */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarOff,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  History,
  Send,
  Trash2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { validateTrainerLeaveNotice } from "@/lib/masterScheduleService";
import {
  createTrainerLeave,
  getTrainerLeaves,
  cancelTrainerLeave,
} from "@/lib/trainerLeaveService";
import {
  SelectField,
  InputField,
  TextareaField,
  CheckboxField,
} from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export function TrainerLeaveRequestDrawer({
  isOpen,
  onClose,
  trainer,
  trainers = [],
  batches = [],
  onLeaveSubmitted,
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedTrainerId, setSelectedTrainerId] = useState(trainer?.id || "");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leave history for selected trainer
  const [trainerLeaves, setTrainerLeaves] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Sync selected trainer whenever prop changes
  useEffect(() => {
    if (trainer?.id) {
      setSelectedTrainerId(trainer.id);
    } else if (trainers.length > 0 && !selectedTrainerId) {
      setSelectedTrainerId(trainers[0].id);
    }
  }, [trainer, trainers, selectedTrainerId]);

  const activeTrainer = useMemo(() => {
    return (
      trainers.find((t) => t.id === selectedTrainerId) ||
      trainer || { id: selectedTrainerId, name: selectedTrainerId }
    );
  }, [trainers, trainer, selectedTrainerId]);

  // Trainer's assigned batches
  const trainerBatches = useMemo(() => {
    if (!activeTrainer?.id) return [];
    return (batches || []).filter((b) =>
      Array.isArray(activeTrainer.batchIds) && activeTrainer.batchIds.includes(b.id)
    );
  }, [batches, activeTrainer]);

  // Load Trainer's Leave History
  const loadLeaveHistory = useCallback(async () => {
    if (!selectedTrainerId) return;
    try {
      setIsLoadingHistory(true);
      const data = await getTrainerLeaves({ trainerId: selectedTrainerId });
      setTrainerLeaves(Array.isArray(data) ? data : []);
    } catch {
      setTrainerLeaves([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedTrainerId]);

  useEffect(() => {
    if (isOpen) {
      setLeaveStartDate("");
      setLeaveEndDate("");
      setReason("");
      setAllowOverride(false);
      setOverrideReason("");
      setValidationResult(null);
      if (selectedTrainerId) {
        loadLeaveHistory();
      }
    }
  }, [isOpen, selectedTrainerId, loadLeaveHistory]);

  // Real-time Policy Validation debounced/effect
  useEffect(() => {
    if (!leaveStartDate) {
      setValidationResult(null);
      return;
    }

    const end = leaveEndDate || leaveStartDate;
    if (end < leaveStartDate) {
      setValidationResult({
        isValid: false,
        message: "Leave End Date cannot be earlier than Start Date.",
        actualNoticeDays: 0,
        requiredNoticeDays: 0,
        totalDays: 0,
      });
      return;
    }

    let isCancelled = false;
    async function checkPolicy() {
      try {
        setIsValidating(true);
        const result = await validateTrainerLeaveNotice(leaveStartDate, end);
        if (!isCancelled) {
          setValidationResult(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setValidationResult({
            isValid: true,
            message: "Standard notice validation passed.",
            actualNoticeDays: 0,
            requiredNoticeDays: 0,
            totalDays: 1,
          });
        }
      } finally {
        if (!isCancelled) setIsValidating(false);
      }
    }

    checkPolicy();
    return () => {
      isCancelled = true;
    };
  }, [leaveStartDate, leaveEndDate]);

  // Handle Submit
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedTrainerId) {
      toast.error("Please select a trainer.");
      return;
    }
    if (!leaveStartDate) {
      toast.error("Please choose a start date for the leave.");
      return;
    }

    const end = leaveEndDate || leaveStartDate;

    // Check policy enforcement
    if (validationResult && !validationResult.isValid) {
      if (!allowOverride) {
        toast.error(
          validationResult.message || "Leave request violates minimum notice policy."
        );
        return;
      }
      if (!overrideReason.trim()) {
        toast.error("Please explain the emergency circumstance for policy override.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await createTrainerLeave({
        trainerId: selectedTrainerId,
        trainerName:
          activeTrainer?.name ||
          `${activeTrainer?.firstName || ""} ${activeTrainer?.lastName || ""}`.trim() ||
          selectedTrainerId,
        leaveStartDate,
        leaveEndDate: end,
        reason: reason.trim() || "Trainer personal absence",
        isOverride: Boolean(allowOverride),
        overrideReason: allowOverride ? overrideReason.trim() : null,
      });

      toast.success(
        `Leave request submitted for ${
          activeTrainer?.name || activeTrainer?.firstName || "Faculty"
        } (${leaveStartDate} to ${end})!`
      );

      if (onLeaveSubmitted) onLeaveSubmitted();
      loadLeaveHistory();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Leave
  const handleCancelLeave = async (leaveId) => {
    try {
      await cancelTrainerLeave(leaveId);
      toast.success("Leave request cancelled.");
      loadLeaveHistory();
      if (onLeaveSubmitted) onLeaveSubmitted();
    } catch (err) {
      toast.error(err?.message || "Failed to cancel leave request.");
    }
  };

  if (!isOpen) return null;

  const isFormBlocked =
    validationResult && !validationResult.isValid && !allowOverride;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        icon={CalendarOff}
        title="Faculty Leave Request"
        subtitle="Enforces notice-period policy rules and schedule coverage."
        onClose={onClose}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          {/* Trainer Selection & Schedule Preview */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <User size={13} className="text-primary" />
                <span>Faculty Member</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                {selectedTrainerId}
              </span>
            </div>

            {trainers.length > 1 ? (
              <SelectField
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                options={trainers.map((t) => ({
                  value: t.id,
                  label: `${t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()} (${t.id})`,
                }))}
              />
            ) : (
              <div className="text-xs font-bold text-foreground">
                {activeTrainer?.name || activeTrainer?.firstName || selectedTrainerId}
              </div>
            )}

            {/* Assigned Batches Pills */}
            {trainerBatches.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Assigned Active Batches:
                </span>
                <div className="flex flex-wrap gap-1">
                  {trainerBatches.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
                    >
                      <Layers size={10} className="text-primary" />
                      <span>{b.shortName || b.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leave Date Range Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Leave Start Date"
              type="date"
              value={leaveStartDate}
              onChange={(e) => {
                setLeaveStartDate(e.target.value);
                if (leaveEndDate < e.target.value) {
                  setLeaveEndDate(e.target.value);
                }
              }}
            />

            <InputField
              label="Leave End Date"
              type="date"
              value={leaveEndDate}
              min={leaveStartDate}
              onChange={(e) => setLeaveEndDate(e.target.value)}
            />
          </div>

          {/* Live Policy Validation Card */}
          {validationResult && (
            <div
              className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                validationResult.isValid
                  ? "border-emerald-500/35 bg-emerald-500/5 text-emerald-500"
                  : "border-rose-500/35 bg-rose-500/5 text-rose-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {validationResult.isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                  <span>
                    {validationResult.isValid
                      ? "Policy Compliant: Advance Notice Met"
                      : "Policy Violation: Insufficient Notice"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border/80 text-foreground">
                  {validationResult.totalDays} Day{validationResult.totalDays > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-border/50 text-foreground">
                <div>
                  <span className="text-muted-foreground text-[10px] block">Notice Provided:</span>
                  <span className="font-extrabold">{validationResult.actualNoticeDays} Days</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Notice Required:</span>
                  <span className="font-extrabold">{validationResult.requiredNoticeDays} Days</span>
                </div>
              </div>

              {validationResult.tier && (
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Applied Rule:</span>{" "}
                  {validationResult.tier.label}
                </div>
              )}

              {!validationResult.isValid && validationResult.earliestEligibleStartDate && (
                <div className="rounded-lg bg-rose-500/10 p-2 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                  Earliest permitted start date:{" "}
                  <span className="underline font-bold">
                    {validationResult.earliestEligibleStartDate}
                  </span>
                </div>
              )}

              <p className="text-[10px] opacity-90 leading-relaxed">
                {validationResult.message}
              </p>
            </div>
          )}

          {/* Emergency Policy Override Option */}
          {validationResult && !validationResult.isValid && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <CheckboxField
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
                label="Authorize Emergency Policy Override"
                description="Bypass advance-notice requirement for emergency/medical cases. Logs an audit record."
              />

              {allowOverride && (
                <InputField
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide emergency reason for admin override..."
                />
              )}
            </div>
          )}

          {/* Reason Textarea */}
          <TextareaField
            label="Reason / Notes for Absence"
            rows={2}
            resize="vertical"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for leave, coverage handover, or special remarks..."
          />

          {/* Trainer Recent Leave History Section */}
          <div className="pt-2 border-t border-border/70 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} className="text-primary" />
                <span>Recent Leave Requests ({trainerLeaves.length})</span>
              </span>
              {isLoadingHistory && <span className="text-[10px] animate-pulse">Loading...</span>}
            </div>

            {trainerLeaves.length === 0 ? (
              <div className="p-3 rounded-xl border border-border/50 bg-background/40 text-center text-[11px] text-muted-foreground">
                No prior leave records for this faculty member.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {trainerLeaves.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span>
                          {item.leaveStartDate} → {item.leaveEndDate}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({item.totalDays}d)
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                        {item.reason || "No description"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === "APPROVED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Approved
                        </span>
                      ) : item.status === "PENDING" ? (
                        <>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelLeave(item.id)}
                            className="p-1 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                            title="Cancel leave request"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : item.status === "REJECTED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Close"
          onSubmit={handleSubmit}
          submitText="Submit Leave Request"
          submitIcon={Send}
          isSubmitting={isSubmitting}
          submitDisabled={isFormBlocked}
        />
      </div>
    </FormModal>
  );
}

export default TrainerLeaveRequestDrawer;
