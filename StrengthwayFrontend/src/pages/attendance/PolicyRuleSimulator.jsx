/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { validateTrainerLeaveNotice } from "@/lib/masterScheduleService";

/**
 * Reusable Policy Rule Simulator Component
 *
 * Single source of truth calculation UI for both Regular and Emergency Leave rules.
 * Used across:
 * 1. Attendance Policy Master (TrainerLeavePolicyTab)
 * 2. Admin Trainer Profile (Trainer Profile Leave & Policy Simulator)
 * 3. Trainer Dashboard / Profile (My Leave Application & Simulator)
 * 4. Trainer Leave Request Drawer
 *
 * @param {Object} props
 * @param {string} [props.defaultLeaveType="REGULAR"] "REGULAR" | "EMERGENCY"
 * @param {string} [props.defaultStartDate]
 * @param {string} [props.defaultEndDate]
 * @param {string} [props.defaultSubmittedOn]
 * @param {boolean} [props.allowTypeToggle=true]
 * @param {boolean} [props.compact=false]
 * @param {boolean} [props.readOnlyDates=false]
 * @param {Function} [props.onValidationChange]
 * @param {Function} [props.onDateChange]
 * @param {string} [props.title]
 */
export function PolicyRuleSimulator({
  defaultLeaveType = "REGULAR",
  defaultStartDate,
  defaultEndDate,
  defaultSubmittedOn,
  allowTypeToggle = true,
  compact = false,
  readOnlyDates = false,
  onValidationChange,
  onDateChange,
  title = "Policy Rule Simulator",
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [leaveType, setLeaveType] = useState(defaultLeaveType || "REGULAR");
  const [submittedOn, setSubmittedOn] = useState(defaultSubmittedOn || todayStr);

  const [startDate, setStartDate] = useState(() => {
    if (defaultStartDate) return defaultStartDate;
    if (defaultLeaveType === "EMERGENCY") return todayStr;
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toISOString().slice(0, 10);
  });

  const [endDate, setEndDate] = useState(() => {
    if (defaultEndDate) return defaultEndDate;
    if (defaultLeaveType === "EMERGENCY") return todayStr;
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().slice(0, 10);
  });

  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Sync state if default props change from parent
  useEffect(() => {
    if (defaultStartDate && defaultStartDate !== startDate) {
      setStartDate(defaultStartDate);
    }
  }, [defaultStartDate]);

  useEffect(() => {
    if (defaultEndDate && defaultEndDate !== endDate) {
      setEndDate(defaultEndDate);
    }
  }, [defaultEndDate]);

  useEffect(() => {
    if (defaultLeaveType && defaultLeaveType !== leaveType) {
      setLeaveType(defaultLeaveType);
    }
  }, [defaultLeaveType]);

  // Run Real-time Simulation
  const runSimulation = useCallback(async () => {
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
      const errRes = {
        isValid: false,
        isEmergency: leaveType === "EMERGENCY",
        totalDays: 0,
        requiredNoticeDays: 0,
        actualNoticeDays: 0,
        message: "Leave end date cannot be earlier than start date.",
      };
      setSimResult(errRes);
      if (onValidationChange) onValidationChange(errRes);
      return;
    }

    try {
      setSimulating(true);
      const res = await validateTrainerLeaveNotice({
        startDate,
        endDate,
        submittedOn: submittedOn || todayStr,
        leaveType,
      });
      setSimResult(res);
      if (onValidationChange) onValidationChange(res);
    } catch (err) {
      const errRes = {
        isValid: false,
        isEmergency: leaveType === "EMERGENCY",
        message: err.message || "Policy simulation failed.",
      };
      setSimResult(errRes);
      if (onValidationChange) onValidationChange(errRes);
    } finally {
      setSimulating(false);
    }
  }, [startDate, endDate, submittedOn, todayStr, leaveType, onValidationChange]);

  useEffect(() => {
    runSimulation();
  }, [startDate, endDate, submittedOn, leaveType, runSimulation]);

  const handleStartDateChange = (val) => {
    setStartDate(val);
    let nextEnd = endDate;
    if (endDate && endDate < val) {
      nextEnd = val;
      setEndDate(val);
    }
    if (onDateChange) onDateChange({ startDate: val, endDate: nextEnd, leaveType });
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (onDateChange) onDateChange({ startDate, endDate: val, leaveType });
  };

  const handleTypeChange = (type) => {
    setLeaveType(type);
    if (type === "EMERGENCY") {
      // Default emergency leave to today or tomorrow
      setStartDate(todayStr);
      setEndDate(todayStr);
      if (onDateChange) onDateChange({ startDate: todayStr, endDate: todayStr, leaveType: type });
    } else {
      if (onDateChange) onDateChange({ startDate, endDate, leaveType: type });
    }
  };

  // Quick preset chips for rapid testing
  const setQuickDates = (daysOffset, duration) => {
    const s = new Date();
    s.setDate(s.getDate() + daysOffset);
    const sStr = s.toISOString().slice(0, 10);
    const e = new Date(s);
    e.setDate(e.getDate() + (duration - 1));
    const eStr = e.toISOString().slice(0, 10);
    setStartDate(sStr);
    setEndDate(eStr);
    if (onDateChange) onDateChange({ startDate: sStr, endDate: eStr, leaveType });
  };

  const isEmergency = leaveType === "EMERGENCY";

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col gap-3 ${
        compact ? "text-xs" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-lg ${
              isEmergency
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isEmergency ? <Zap size={16} /> : <Sparkles size={16} />}
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {isEmergency
                ? "Emergency leave rules, duration allowance & notice bypass check"
                : "Live compliance validation against duration-based notice tiers"}
            </p>
          </div>
        </div>

        {simulating && (
          <span className="text-[10px] text-muted-foreground animate-pulse font-medium">
            Simulating...
          </span>
        )}
      </div>

      {/* Leave Type Toggle */}
      {allowTypeToggle && (
        <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border">
          <button
            type="button"
            onClick={() => handleTypeChange("REGULAR")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              !isEmergency
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={13} />
            <span>Regular Leave (Advance Notice)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("EMERGENCY")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isEmergency
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-xs font-bold border border-amber-500/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap size={13} />
            <span>Emergency Leave (Bypassed)</span>
          </button>
        </div>
      )}

      {/* Date Pickers */}
      <div className="flex flex-col gap-2.5">
        {!readOnlyDates && (
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Application / Notice Date
            </label>
            <input
              type="date"
              value={submittedOn}
              onChange={(e) => setSubmittedOn(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Leave Start Date
            </label>
            <input
              type="date"
              value={startDate}
              disabled={readOnlyDates}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none disabled:opacity-75"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Leave End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              disabled={readOnlyDates}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none disabled:opacity-75"
            />
          </div>
        </div>

        {/* Quick Date Chips (when not read-only) */}
        {!readOnlyDates && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">Quick presets:</span>
            {isEmergency ? (
              <>
                <button
                  type="button"
                  onClick={() => setQuickDates(0, 1)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  Today (1d)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates(1, 1)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  Tomorrow (1d)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates(0, 2)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  Today + Tomorrow (2d)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates(0, 3)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  3-Day Emergency (Max)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setQuickDates(8, 2)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  Next Week (2d / 8d Notice)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates(15, 4)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  In 2 Weeks (4d / 15d Notice)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates(31, 7)}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-card border border-border/60 text-[10px] font-semibold text-foreground cursor-pointer transition-colors"
                >
                  In 1 Month (7d / 31d Notice)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Validation Output Card */}
      {simResult && (
        <div
          className={`mt-1 rounded-xl border p-3 flex flex-col gap-2 transition-all ${
            isEmergency
              ? simResult.isValid
                ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                : "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400"
              : simResult.isValid
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
              : "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400"
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              {isEmergency ? (
                simResult.isValid ? (
                  <>
                    <Zap size={16} className="text-amber-500" />
                    <span>Emergency Leave (Notice Bypassed)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>Emergency Duration Exceeded</span>
                  </>
                )
              ) : simResult.isValid ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Eligible (Notice Requirement Met)</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-rose-500" />
                  <span>Non-Compliant (Short Notice)</span>
                </>
              )}
            </div>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border/80 text-foreground">
              {simResult.totalDays} Day{simResult.totalDays > 1 ? "s" : ""} Leave
            </span>
          </div>

          {/* Metric Details */}
          {isEmergency ? (
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40 text-foreground">
              <div>
                <span className="text-muted-foreground block text-[10px]">Leave Category:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">Emergency</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Approval Status:</span>
                <span className="font-bold text-foreground">Requires Admin Approval</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40 text-foreground">
              <div>
                <span className="text-muted-foreground block text-[10px]">Notice Given:</span>
                <span className="font-extrabold">{simResult.actualNoticeDays} Days</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Required Notice:</span>
                <span className="font-extrabold">{simResult.requiredNoticeDays} Days</span>
              </div>
            </div>
          )}

          {/* Applied Tier / Rule */}
          {simResult.tier && (
            <div className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Applied Rule:</span>{" "}
              {simResult.tier.label}
            </div>
          )}

          {/* Short notice earliest permitted start date */}
          {!isEmergency && !simResult.isValid && simResult.earliestEligibleStartDate && (
            <div className="rounded-lg bg-rose-500/10 p-2 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
              Earliest permitted start date:{" "}
              <span className="underline font-bold">
                {simResult.earliestEligibleStartDate}
              </span>
            </div>
          )}

          {/* Emergency policy note */}
          {isEmergency && simResult.isValid && (
            <div className="rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Emergency Leave Protocol:</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Emergency leaves are submitted for urgent situations and bypass normal notice.
                <strong> They will not take effect until reviewed and approved by Admin.</strong>
              </p>
            </div>
          )}

          {/* Policy calculation message */}
          <p className="text-[10px] opacity-90 leading-relaxed mt-0.5">
            {simResult.message}
          </p>
        </div>
      )}

      {/* Policy Rule Cheat Sheet */}
      {!compact && (
        <div className="mt-1 pt-2 border-t border-border/60 flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Governance Policy Cheat Sheet
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">0 – 2 Days:</span>
              <span className="font-bold text-foreground">1 Wk Notice (7d)</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">2 – 5 Days:</span>
              <span className="font-bold text-foreground">2 Wks Notice (14d)</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">5 – 10 Days:</span>
              <span className="font-bold text-foreground">1 Mo Notice (30d)</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">&gt; 10 Days:</span>
              <span className="font-bold text-foreground">2 Mos Notice (60d)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
            <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
              <Zap size={12} />
              <span>Emergency Leave:</span>
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-300">Notice Bypassed (Max 3d, Admin Approval)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PolicyRuleSimulator;
