/* eslint-disable max-lines */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarOff,
  User,
  History,
  Send,
  Trash2,
  Layers,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
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
import { PolicyRuleSimulator } from "./PolicyRuleSimulator";

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
  const [leaveType, setLeaveType] = useState("REGULAR"); // "REGULAR" | "EMERGENCY"
  const [leaveStartDate, setLeaveStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toISOString().slice(0, 10);
  });
  const [leaveEndDate, setLeaveEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

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
      setLeaveType("REGULAR");
      const d = new Date();
      d.setDate(d.getDate() + 8);
      const s = d.toISOString().slice(0, 10);
      d.setDate(d.getDate() + 1);
      const e = d.toISOString().slice(0, 10);
      setLeaveStartDate(s);
      setLeaveEndDate(e);
      setReason("");
      setAllowOverride(false);
      setOverrideReason("");
      if (selectedTrainerId) {
        loadLeaveHistory();
      }
    }
  }, [isOpen, selectedTrainerId, loadLeaveHistory]);

  const handleSimulatorDateChange = ({ startDate, endDate, leaveType: nextType }) => {
    if (startDate) setLeaveStartDate(startDate);
    if (endDate) setLeaveEndDate(endDate);
    if (nextType) setLeaveType(nextType);
  };

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

    if (leaveType === "EMERGENCY" && (!reason || !reason.trim())) {
      toast.error("A reason is mandatory for emergency leave applications.");
      return;
    }

    // Check policy enforcement
    if (validationResult && !validationResult.isValid) {
      if (leaveType === "REGULAR" && !allowOverride) {
        toast.error(
          validationResult.message || "Leave request violates minimum notice policy."
        );
        return;
      }
      if (leaveType === "REGULAR" && allowOverride && !overrideReason.trim()) {
        toast.error("Please explain the circumstance for policy override.");
        return;
      }
      if (leaveType === "EMERGENCY") {
        toast.error(validationResult.message || "Emergency leave rules violated.");
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
        leaveType,
        leaveStartDate,
        leaveEndDate: end,
        reason: reason.trim() || (leaveType === "EMERGENCY" ? "Emergency Leave" : "Regular Planned Absence"),
        allowPolicyOverride: Boolean(allowOverride),
        overrideReason: allowOverride ? overrideReason.trim() : null,
      });

      toast.success(
        `${leaveType === "EMERGENCY" ? "Emergency leave" : "Leave"} request submitted for ${
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
    (validationResult && !validationResult.isValid && leaveType === "REGULAR" && !allowOverride) ||
    (validationResult && !validationResult.isValid && leaveType === "EMERGENCY") ||
    (leaveType === "EMERGENCY" && !reason.trim());

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        icon={CalendarOff}
        title="Faculty Leave Request"
        subtitle="Submit regular advance-notice leave or urgent emergency leave."
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

          {/* Integrated Live Policy Rule Simulator */}
          <PolicyRuleSimulator
            title="Leave Type & Policy Simulator"
            defaultLeaveType={leaveType}
            defaultStartDate={leaveStartDate}
            defaultEndDate={leaveEndDate}
            allowTypeToggle={true}
            onDateChange={handleSimulatorDateChange}
            onValidationChange={setValidationResult}
          />

          {/* Emergency Notice Override Option (for Regular leave when short notice) */}
          {leaveType === "REGULAR" && validationResult && !validationResult.isValid && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <CheckboxField
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
                label="Request Administrative Policy Override"
                description="Bypass normal advance-notice requirement for unexpected circumstances. Logs an audit record."
              />

              {allowOverride && (
                <InputField
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide reason for policy notice override..."
                />
              )}
            </div>
          )}

          {/* Reason Textarea (Mandatory for Emergency Leave) */}
          <div>
            <label className="text-[11px] font-semibold text-foreground flex items-center justify-between mb-1">
              <span>
                Reason for Leave{" "}
                {leaveType === "EMERGENCY" ? (
                  <span className="text-rose-500 font-bold">* (Mandatory for Emergency Leave)</span>
                ) : (
                  <span className="text-muted-foreground font-normal">(Recommended)</span>
                )}
              </span>
            </label>
            <TextareaField
              rows={2}
              resize="vertical"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                leaveType === "EMERGENCY"
                  ? "Detail the urgent circumstance or emergency requiring immediate leave..."
                  : "Reason for planned leave, personal commitment, coverage handover..."
              }
            />
          </div>

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
              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {trainerLeaves.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                            item.leaveType === "EMERGENCY"
                              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          {item.leaveType || "REGULAR"}
                        </span>
                        <span>
                          {item.leaveStartDate} → {item.leaveEndDate}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({item.totalDays}d)
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-xs mt-0.5">
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
                      ) : item.status === "DENIED" || item.status === "REJECTED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Denied
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
          submitText={leaveType === "EMERGENCY" ? "Submit Emergency Leave" : "Submit Leave Request"}
          submitIcon={Send}
          isSubmitting={isSubmitting}
          submitDisabled={isFormBlocked}
        />
      </div>
    </FormModal>
  );
}

export default TrainerLeaveRequestDrawer;
