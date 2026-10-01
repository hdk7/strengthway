/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowRightLeft,
  CalendarRange,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  ShieldAlert,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  executeBatchTransfer,
  createFlexibleBatchAssignment,
  getBatchCapacityCheck,
} from "@/lib/batchesService";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function BatchTransferModal({
  isOpen,
  onClose,
  member,
  membersList = [],
  currentBatch,
  allBatches = [],
  initialTab = "transfer",
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "transfer"); // "transfer" | "flex"
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permanent Transfer Form
  const [transferTargetBatchId, setTransferTargetBatchId] = useState("");
  const [transferEffectiveDate, setTransferEffectiveDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [transferReason, setTransferReason] = useState("");

  // Flexible Assignment Form
  const [flexTargetBatchId, setFlexTargetBatchId] = useState("");
  const [flexSelectedDays, setFlexSelectedDays] = useState([]);
  const [flexStartDate, setFlexStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [flexEndDate, setFlexEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [isOngoingPass, setIsOngoingPass] = useState(false);
  const [flexReason, setFlexReason] = useState("");
  const [flexCapacityInfo, setFlexCapacityInfo] = useState(null);
  const [isLoadingFlexCapacity, setIsLoadingFlexCapacity] = useState(false);

  // Reset form when modal opens or member changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "transfer");
      setSelectedMemberId(member?.id || "");
      setTransferTargetBatchId("");
      setTransferEffectiveDate(new Date().toISOString().slice(0, 10));
      setTransferReason("");
      setFlexTargetBatchId("");
      setFlexSelectedDays([]);
      setFlexStartDate(new Date().toISOString().slice(0, 10));
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setFlexEndDate(d.toISOString().slice(0, 10));
      setIsOngoingPass(false);
      setFlexReason("");
      setFlexCapacityInfo(null);
    }
  }, [isOpen, member, initialTab]);

  const effectiveMember = useMemo(() => {
    if (member) return member;
    if (selectedMemberId) {
      return membersList.find((m) => m.id === selectedMemberId) || null;
    }
    return null;
  }, [member, selectedMemberId, membersList]);

  // Target Batch for Permanent Transfer
  const selectedTransferBatch = useMemo(() => {
    return allBatches.find((b) => b.id === transferTargetBatchId);
  }, [allBatches, transferTargetBatchId]);

  // Target Batch for Flexible Assignment
  const selectedFlexBatch = useMemo(() => {
    return allBatches.find((b) => b.id === flexTargetBatchId);
  }, [allBatches, flexTargetBatchId]);

  // When flex target batch changes, filter out invalid days not in target batch
  useEffect(() => {
    if (selectedFlexBatch?.daysList && Array.isArray(selectedFlexBatch.daysList)) {
      setFlexSelectedDays((prev) =>
        prev.filter((d) => selectedFlexBatch.daysList.includes(d))
      );
    }
  }, [selectedFlexBatch]);

  // Check capacity warnings for Permanent Transfer
  const isTransferBatchFull = useMemo(() => {
    if (!selectedTransferBatch) return false;
    const currentPax = selectedTransferBatch.memberIds
      ? selectedTransferBatch.memberIds.length
      : selectedTransferBatch.currentPax || 0;
    const maxPax = selectedTransferBatch.maxPax || 25;
    return currentPax >= maxPax;
  }, [selectedTransferBatch]);

  // Real-time capacity check for Flexible Assignment
  useEffect(() => {
    if (!flexTargetBatchId || !flexStartDate) {
      setFlexCapacityInfo(null);
      return;
    }
    let cancelled = false;
    async function checkCap() {
      setIsLoadingFlexCapacity(true);
      try {
        const res = await getBatchCapacityCheck(flexTargetBatchId, flexStartDate);
        if (!cancelled) {
          setFlexCapacityInfo(res?.data || res);
        }
      } catch (err) {
        if (!cancelled) setFlexCapacityInfo(null);
      } finally {
        if (!cancelled) setIsLoadingFlexCapacity(false);
      }
    }
    checkCap();
    return () => {
      cancelled = true;
    };
  }, [flexTargetBatchId, flexStartDate]);

  // Handle Permanent Transfer Submission
  const handlePermanentTransfer = async (e) => {
    e.preventDefault();
    if (!effectiveMember || !effectiveMember.id) {
      toast.error("Please select a member to transfer.");
      return;
    }
    if (!transferTargetBatchId) {
      toast.error("Please select a target batch.");
      return;
    }
    if (transferTargetBatchId === (currentBatch?.id || effectiveMember.batchId)) {
      toast.error("Member is already assigned to this batch.");
      return;
    }
    if (selectedTransferBatch?.status === "Inactive") {
      toast.error("Selected target batch is currently inactive.");
      return;
    }
    if (isTransferBatchFull) {
      toast.error("Target batch is at maximum capacity.");
      return;
    }
    if (!transferReason.trim()) {
      toast.error("Please provide a reason for the transfer.");
      return;
    }

    try {
      setIsSubmitting(true);
      await executeBatchTransfer({
        memberId: effectiveMember.id,
        targetBatchId: transferTargetBatchId,
        effectiveDate: transferEffectiveDate,
        reason: transferReason.trim(),
        transferredBy: "Admin",
      });

      toast.success(
        `Successfully transferred ${effectiveMember.firstName || effectiveMember.name || "Member"} to ${
          selectedTransferBatch?.name || "new batch"
        }!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error(err.message || "Failed to execute batch transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Flexible Assignment Submission
  const handleFlexibleAssignment = async (e) => {
    e.preventDefault();
    if (!effectiveMember || !effectiveMember.id) {
      toast.error("Please select a member to assign flexible pass.");
      return;
    }
    if (!flexTargetBatchId) {
      toast.error("Please select a target batch for flex pass.");
      return;
    }
    if (flexTargetBatchId === (currentBatch?.id || effectiveMember.batchId)) {
      toast.error("Cannot create a flex assignment to the member's current primary batch.");
      return;
    }
    if (selectedFlexBatch?.status === "Inactive") {
      toast.error("Selected target batch is currently inactive.");
      return;
    }
    if (!flexSelectedDays || flexSelectedDays.length === 0) {
      toast.error("Please select at least one attendance day.");
      return;
    }
    if (!flexStartDate) {
      toast.error("Start date is required.");
      return;
    }
    if (!isOngoingPass && flexEndDate && new Date(flexStartDate) > new Date(flexEndDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    if (!flexReason.trim()) {
      toast.error("Please provide a reason for the flexible pass.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createFlexibleBatchAssignment({
        memberId: effectiveMember.id,
        targetBatchId: flexTargetBatchId,
        selectedDays: flexSelectedDays,
        startDate: flexStartDate,
        endDate: isOngoingPass ? null : flexEndDate || null,
        reason: flexReason.trim(),
        transferredBy: "Admin",
      });

      toast.success(
        `Assigned flexible pass for ${effectiveMember.firstName || effectiveMember.name || "Member"} to ${
          selectedFlexBatch?.name || "batch"
        } on [${flexSelectedDays.join(", ")}]!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Flex assignment error:", err);
      toast.error(err.message || "Failed to create flexible assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDaySelection = (day) => {
    setFlexSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!isOpen) return null;

  const memberDisplayName =
    effectiveMember?.firstName || effectiveMember?.lastName
      ? `${effectiveMember.firstName || ""} ${effectiveMember.lastName || ""}`.trim()
      : effectiveMember?.name || "Member";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Batch Transfer & Flexible Assignment
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage batch relocation or temporary flex day passes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member Profile Snapshot / Selection Banner */}
        <div className="bg-muted/40 px-6 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          {member ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                {memberDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">{memberDisplayName}</div>
                <div className="text-muted-foreground">
                  {effectiveMember?.id || member.id} • {effectiveMember?.mobile || member.mobile || effectiveMember?.email || member.email || "Enrolled"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Select Member to Transfer / Flex <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">-- Choose Member from Batch --</option>
                {membersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName || ""} ({m.id}) {m.mobile ? `• ${m.mobile}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {effectiveMember && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Primary:</span>
              <span className="font-semibold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
                {currentBatch?.name || effectiveMember.batchName || "Assigned Batch"}
              </span>
            </div>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setActiveTab("transfer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "transfer"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft size={15} />
            <span>Permanent Batch Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flex")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "flex"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarRange size={15} />
            <span>Temporary / Flex Pass</span>
          </button>
        </div>

        {/* Tab 1: Permanent Transfer Content */}
        {activeTab === "transfer" && (
          <form onSubmit={handlePermanentTransfer} className="p-6 space-y-5">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Permanent Batch Move
              </div>
              <p className="text-muted-foreground">
                Permanently unenrolls the member from{" "}
                <span className="font-bold text-foreground">
                  {currentBatch?.name || "Current Batch"}
                </span>{" "}
                and enrolls them into the selected target batch. An immutable audit record will be logged.
              </p>
            </div>

            {/* Target Batch Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Batch <span className="text-destructive">*</span>
              </label>
              <select
                value={transferTargetBatchId}
                onChange={(e) => setTransferTargetBatchId(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select target batch...</option>
                {allBatches
                  .filter((b) => b.id !== (currentBatch?.id || effectiveMember?.batchId))
                  .map((b) => {
                    const pax = b.memberIds ? b.memberIds.length : b.currentPax || 0;
                    const max = b.maxPax || 25;
                    const isFull = pax >= max;
                    const isInactive = b.status === "Inactive";
                    return (
                      <option key={b.id} value={b.id} disabled={isFull || isInactive}>
                        {b.name} ({b.timingLabel}) — {pax}/{max} Pax {isFull ? "[FULL]" : isInactive ? "[INACTIVE]" : `[${max - pax} spots left]`}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Target Batch Info / Warning */}
            {selectedTransferBatch && (
              <div
                className={`rounded-xl border p-4 text-xs ${
                  isTransferBatchFull || selectedTransferBatch.status === "Inactive"
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-border bg-muted/20 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{selectedTransferBatch.name}</span>
                  <span className="font-semibold">
                    {selectedTransferBatch.timingLabel} • {selectedTransferBatch.daysLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                  <span>
                    Current Pax:{" "}
                    <strong className="text-foreground">
                      {selectedTransferBatch.memberIds?.length || selectedTransferBatch.currentPax || 0}
                    </strong>{" "}
                    / {selectedTransferBatch.maxPax || 25}
                  </span>
                  <span>
                    Headroom:{" "}
                    <strong
                      className={
                        isTransferBatchFull || selectedTransferBatch.status === "Inactive"
                          ? "text-destructive font-black"
                          : "text-emerald-400 font-black"
                      }
                    >
                      {selectedTransferBatch.status === "Inactive"
                        ? "Inactive"
                        : `${Math.max(
                            0,
                            (selectedTransferBatch.maxPax || 25) -
                              (selectedTransferBatch.memberIds?.length || selectedTransferBatch.currentPax || 0)
                          )} spots remaining`}
                    </strong>
                  </span>
                </div>
                {isTransferBatchFull && (
                  <div className="mt-2 flex items-center gap-1.5 text-destructive font-semibold">
                    <ShieldAlert size={14} /> This batch is at maximum capacity. Cannot transfer here.
                  </div>
                )}
                {selectedTransferBatch.status === "Inactive" && (
                  <div className="mt-2 flex items-center gap-1.5 text-destructive font-semibold">
                    <ShieldAlert size={14} /> This batch is currently inactive. Cannot transfer here.
                  </div>
                )}
              </div>
            )}

            {/* Effective Transfer Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Effective Transfer Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={transferEffectiveDate}
                onChange={(e) => setTransferEffectiveDate(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Reason Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Transfer Reason & Notes <span className="text-destructive">*</span>
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g., Requested evening slot due to office hours change..."
                rows={3}
                required
                className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !transferTargetBatchId || isTransferBatchFull || selectedTransferBatch?.status === "Inactive"}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm Permanent Transfer</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Flexible Assignment Content */}
        {activeTab === "flex" && (
          <form onSubmit={handleFlexibleAssignment} className="p-6 space-y-5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Temporary / Multi-Day Flexible Pass
              </div>
              <p className="text-muted-foreground">
                Allows the member to attend another batch on specific designated days without relinquishing their primary enrollment in{" "}
                <span className="font-bold text-foreground">
                  {currentBatch?.name || "Current Batch"}
                </span>.
              </p>
            </div>

            {/* Target Batch Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Batch <span className="text-destructive">*</span>
              </label>
              <select
                value={flexTargetBatchId}
                onChange={(e) => setFlexTargetBatchId(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select target batch...</option>
                {allBatches
                  .filter((b) => b.id !== (currentBatch?.id || effectiveMember?.batchId))
                  .map((b) => {
                    const isInactive = b.status === "Inactive";
                    return (
                      <option key={b.id} value={b.id} disabled={isInactive}>
                        {b.name} ({b.timingLabel}) • {b.daysPattern} {isInactive ? "[INACTIVE]" : ""}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Target Batch Inactive Warning */}
            {selectedFlexBatch?.status === "Inactive" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-1.5 font-semibold">
                <ShieldAlert size={14} /> Warning: Target batch is inactive. Flex assignment cannot be created.
              </div>
            )}

            {/* Selected Days Checkboxes */}
            {selectedFlexBatch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Applicable Attendance Days <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Batch runs on: {selectedFlexBatch.daysList?.join(", ") || selectedFlexBatch.daysPattern}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isOperatingDay =
                      selectedFlexBatch.daysList &&
                      selectedFlexBatch.daysList.includes(day);
                    const isChecked = flexSelectedDays.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!isOperatingDay}
                        onClick={() => isOperatingDay && toggleDaySelection(day)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold border transition-all cursor-pointer ${
                          !isOperatingDay
                            ? "opacity-30 border-dashed border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                            : isChecked
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                              : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{day}</span>
                        {isChecked && <Check size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Start Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={flexStartDate}
                  onChange={(e) => setFlexStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={isOngoingPass ? "" : flexEndDate}
                  disabled={isOngoingPass}
                  onChange={(e) => setFlexEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Ongoing Weekly Pass Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ongoingPassToggle"
                checked={isOngoingPass}
                onChange={(e) => {
                  setIsOngoingPass(e.target.checked);
                  if (e.target.checked) setFlexEndDate("");
                }}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="ongoingPassToggle" className="text-xs text-foreground font-medium cursor-pointer select-none">
                Ongoing Weekly Pass (no fixed end date)
              </label>
            </div>

            {/* Live Capacity Indicator */}
            {isLoadingFlexCapacity && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl border border-border bg-muted/20">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Checking live batch capacity on selected date...</span>
              </div>
            )}
            {!isLoadingFlexCapacity && flexCapacityInfo && (
              <div
                className={`rounded-xl border p-3.5 text-xs space-y-1 ${
                  flexCapacityInfo.isFull
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>
                    Live Check on {flexCapacityInfo.dayOfWeek || "Selected Date"} ({flexCapacityInfo.date})
                  </span>
                  <span>{flexCapacityInfo.occupancyPercent}% Booked</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    Effective Pax: <strong className="text-foreground">{flexCapacityInfo.effectivePax}</strong> / {flexCapacityInfo.maxPax}
                  </span>
                  <span className={flexCapacityInfo.isFull ? "text-destructive font-black" : "text-emerald-400 font-black"}>
                    {flexCapacityInfo.spotsRemaining} spots available
                  </span>
                </div>
                {flexCapacityInfo.isFull && (
                  <div className="flex items-center gap-1.5 text-destructive font-semibold pt-1">
                    <ShieldAlert size={14} /> Warning: Target batch is full on this date.
                  </div>
                )}
              </div>
            )}

            {/* Reason Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Flex Pass Reason & Notes <span className="text-destructive">*</span>
              </label>
              <textarea
                value={flexReason}
                onChange={(e) => setFlexReason(e.target.value)}
                placeholder="e.g., Attending Wednesday Evening strength session due to morning conflict..."
                rows={2}
                required
                className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !flexTargetBatchId || flexSelectedDays.length === 0 || selectedFlexBatch?.status === "Inactive"}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Assign Flexible Batch Pass</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
