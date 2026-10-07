/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerLeavePolicy,
  saveTrainerLeavePolicy,
  validateTrainerLeaveNotice,
} from "@/lib/masterScheduleService";

const FACTORY_DEFAULT_TIERS = [
  {
    minDays: 0,
    maxDays: 2,
    requiredNoticeDays: 7,
    label: "0–2 Days Leave (1 Week Notice)",
  },
  {
    minDays: 2.01,
    maxDays: 5,
    requiredNoticeDays: 14,
    label: "2–5 Days Leave (2 Weeks Notice)",
  },
  {
    minDays: 5.01,
    maxDays: 10,
    requiredNoticeDays: 30,
    label: "5–10 Days Leave (1 Month Notice)",
  },
  {
    minDays: 10.01,
    maxDays: null,
    requiredNoticeDays: 60,
    label: "More than 10 Days Leave (2 Months Notice)",
  },
];

export function TrainerLeavePolicyTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState({
    id: "DEFAULT_TRAINER_LEAVE_POLICY",
    isActive: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    monthlyPaidLeaveAllowance: 2,
    unpaidDeductionPerDay: 1000,
    description: "Standard Trainer Leave Policy with duration-based advance notice requirements.",
    tiers: FACTORY_DEFAULT_TIERS,
  });
  const [initialPolicy, setInitialPolicy] = useState(null);

  // Simulator State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [simStart, setSimStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [simEnd, setSimEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 12);
    return d.toISOString().slice(0, 10);
  });
  const [simSubmitted, setSimSubmitted] = useState(todayStr);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Load Policy from Backend
  const loadPolicy = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrainerLeavePolicy();
      if (data) {
        setPolicy({
          ...data,
          monthlyPaidLeaveAllowance: typeof data.monthlyPaidLeaveAllowance === "number" ? data.monthlyPaidLeaveAllowance : 2,
          unpaidDeductionPerDay: typeof data.unpaidDeductionPerDay === "number" ? data.unpaidDeductionPerDay : 1000,
          tiers: Array.isArray(data.tiers) && data.tiers.length > 0 ? data.tiers : FACTORY_DEFAULT_TIERS,
        });
        setInitialPolicy(JSON.stringify(data));
      }
    } catch (err) {
      toast.error(err.message || "Failed to load trainer leave policy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialPolicy) return false;
    return JSON.stringify(policy) !== initialPolicy;
  }, [policy, initialPolicy]);

  // Run Simulator
  const runSimulation = useCallback(async () => {
    if (!simStart || !simEnd) return;
    try {
      setSimulating(true);
      const res = await validateTrainerLeaveNotice({
        startDate: simStart,
        endDate: simEnd,
        submittedOn: simSubmitted || todayStr,
      });
      setSimResult(res);
    } catch (err) {
      setSimResult({
        isValid: false,
        message: err.message || "Validation failed.",
      });
    } finally {
      setSimulating(false);
    }
  }, [simStart, simEnd, simSubmitted, todayStr]);

  useEffect(() => {
    if (simStart && simEnd) {
      runSimulation();
    }
  }, [simStart, simEnd, simSubmitted, runSimulation]);

  // Tier field updater
  const handleUpdateTier = (index, field, value) => {
    setPolicy((prev) => {
      const nextTiers = [...prev.tiers];
      nextTiers[index] = {
        ...nextTiers[index],
        [field]: value,
      };
      return { ...prev, tiers: nextTiers };
    });
  };

  const handleAddTier = () => {
    setPolicy((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          minDays: 0,
          maxDays: 3,
          requiredNoticeDays: 7,
          label: "Custom Notice Tier",
        },
      ],
    }));
  };

  const handleRemoveTier = (index) => {
    if (policy.tiers.length <= 1) {
      toast.error("Policy must maintain at least one tier.");
      return;
    }
    setPolicy((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, idx) => idx !== index),
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset policy rules back to standard default tiers?")) {
      setPolicy((prev) => ({
        ...prev,
        isActive: true,
        tiers: FACTORY_DEFAULT_TIERS,
      }));
      toast.info("Rules reset to default tiers. Click 'Save Policy' to apply.");
    }
  };

  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      const res = await saveTrainerLeavePolicy(policy);
      setPolicy(res);
      setInitialPolicy(JSON.stringify(res));
      toast.success("Trainer leave policy saved and enforced successfully.");
      runSimulation();
    } catch (err) {
      toast.error(err.message || "Failed to save leave policy.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/20" />
          <div className="h-4 w-44 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1 pb-4">
      {/* KPI Stats */}
      <div className="shrink-0 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Enforcement Status</span>
            {policy.isActive ? (
              <ShieldCheck size={16} className="text-emerald-500" />
            ) : (
              <ShieldAlert size={16} className="text-amber-500" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                policy.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="text-lg sm:text-xl font-extrabold text-foreground">
              {policy.isActive ? "Active & Enforced" : "Disabled (Dry Run)"}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {policy.isActive ? "Rules applied to all trainer leave logs" : "Leaves recorded without restriction"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Configured Tiers</span>
            <Clock size={16} className="text-primary" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">
            {policy.tiers.length}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Advance notice thresholds</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Notice Spectrum</span>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-extrabold text-foreground">
            7 to 60 Days
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">1 week up to 2 months advance notice</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Effective Date</span>
            <Calendar size={16} className="text-emerald-500" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-extrabold text-foreground">
            {policy.effectiveFrom || todayStr}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Current policy version origin</p>
        </div>
      </div>

      {/* Main Content Layout: Tier Configurator + Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tier Configurator Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span>Duration-Based Notice Tiers</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure required advance notice days based on the length of requested leave.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Reset to default 4 tiers"
                >
                  <RotateCcw size={13} />
                  <span>Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Tier</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePolicy}
                  disabled={saving || !hasUnsavedChanges}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                    hasUnsavedChanges
                      ? "bg-primary text-background hover:bg-primary/90 active:scale-95 animate-pulse"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  }`}
                >
                  <Save size={13} />
                  <span>{saving ? "Saving..." : "Save Policy"}</span>
                </button>
              </div>
            </div>

            {/* General Policy Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-border/60">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-background border border-border/60 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={policy.isActive}
                  onChange={(e) => setPolicy((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Enforce Policy Validation</span>
                  <span className="text-[10px] text-muted-foreground">
                    When enabled, trainer leave applications must meet advance notice rules.
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/60">
                <Calendar size={15} className="text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Effective From</span>
                  <input
                    type="date"
                    value={policy.effectiveFrom || todayStr}
                    onChange={(e) => setPolicy((p) => ({ ...p, effectiveFrom: e.target.value }))}
                    className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tiers List */}
            <div className="mt-3 flex flex-col gap-2.5">
              {policy.tiers.map((tier, idx) => {
                const isOver10 = tier.maxDays === null || tier.maxDays === undefined;
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border/70 bg-background/50 hover:border-primary/40 transition-colors"
                  >
                    {/* Index Badge */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground sm:hidden">
                        {tier.label || `Tier ${idx + 1}`}
                      </span>
                    </div>

                    {/* Tier Name / Label */}
                    <div className="flex-1 min-w-35">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Tier Name / Rule Label
                      </label>
                      <input
                        type="text"
                        value={tier.label || ""}
                        onChange={(e) => handleUpdateTier(idx, "label", e.target.value)}
                        placeholder="e.g. 0–2 Days Leave"
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Leave Duration Range */}
                    <div className="w-full sm:w-44">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Leave Duration Range
                      </label>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={tier.minDays ?? 0}
                          onChange={(e) => handleUpdateTier(idx, "minDays", parseFloat(e.target.value) || 0)}
                          className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-xs text-center font-bold text-foreground focus:border-primary focus:outline-none"
                          title="Minimum days"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        {isOver10 ? (
                          <div className="flex-1 flex items-center justify-between px-2 py-1 bg-card rounded-lg border border-border text-[11px] font-bold text-primary">
                            <span>Open (&gt; {tier.minDays ?? 10}d)</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateTier(idx, "maxDays", 15)}
                              className="text-[10px] underline text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Set upper limit"
                            >
                              Limit
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={tier.minDays ?? 0}
                              step="1"
                              value={tier.maxDays ?? 0}
                              onChange={(e) =>
                                handleUpdateTier(idx, "maxDays", parseFloat(e.target.value) || 0)
                              }
                              className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-xs text-center font-bold text-foreground focus:border-primary focus:outline-none"
                              title="Maximum days"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateTier(idx, "maxDays", null)}
                              className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
                              title="Set open ended (> min)"
                            >
                              ∞
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Notice Days */}
                    <div className="w-full sm:w-36">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Required Notice
                      </label>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={tier.requiredNoticeDays ?? 0}
                          onChange={(e) =>
                            handleUpdateTier(idx, "requiredNoticeDays", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-xs text-center font-extrabold text-amber-500 focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-muted-foreground">Days</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({Math.round((tier.requiredNoticeDays || 0) / 7)}w)
                        </span>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      disabled={policy.tiers.length <= 1}
                      className="self-end sm:self-center p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                      title="Remove this tier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Monthly Allowance & Payroll Deduction Governance */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Monthly Paid Leave Allowance &amp; Payroll Deduction Rate
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Determines how many days of approved leave are compensated, and the deduction rate for excess days.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Paid Leave Allowance (Monthly)
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="1"
                        value={policy.monthlyPaidLeaveAllowance ?? 2}
                        onChange={(e) =>
                          setPolicy((p) => ({
                            ...p,
                            monthlyPaidLeaveAllowance: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="w-20 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-center font-bold text-emerald-500 focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">Days per month</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Leaves up to this limit incur no salary reduction.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Unpaid Deduction Rate
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={policy.unpaidDeductionPerDay ?? 1000}
                        onChange={(e) =>
                          setPolicy((p) => ({
                            ...p,
                            unpaidDeductionPerDay: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="w-24 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-center font-bold text-amber-500 focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">per unpaid day</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Subtracted from monthly coach compensation ledger.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Notes / Description */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                <FileText size={13} />
                <span>Policy Governance &amp; Operating Guidelines</span>
              </label>
              <textarea
                rows={2}
                value={policy.description || ""}
                onChange={(e) => setPolicy((p) => ({ ...p, description: e.target.value }))}
                placeholder="Additional notes for coaches, emergency exemptions, medical leave requirements..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Live Simulator Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Policy Rule Simulator</h3>
                <p className="text-[11px] text-muted-foreground">
                  Test dates in real time against the leave rules
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Application / Submission Date
                </label>
                <input
                  type="date"
                  value={simSubmitted}
                  onChange={(e) => setSimSubmitted(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Leave Start Date
                  </label>
                  <input
                    type="date"
                    value={simStart}
                    onChange={(e) => setSimStart(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Leave End Date
                  </label>
                  <input
                    type="date"
                    value={simEnd}
                    min={simStart}
                    onChange={(e) => setSimEnd(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Validation Output Card */}
            {simResult && (
              <div
                className={`mt-1 rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                  simResult.isValid
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {simResult.isValid ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-500" />
                    )}
                    <span>
                      {simResult.isValid ? "Eligible (Notice Met)" : "Non-Compliant (Short Notice)"}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border/80">
                    {simResult.totalDays} Day{simResult.totalDays > 1 ? "s" : ""} Leave
                  </span>
                </div>

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

                {simResult.tier && (
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Applied Rule:</span>{" "}
                    {simResult.tier.label}
                  </div>
                )}

                {!simResult.isValid && simResult.earliestEligibleStartDate && (
                  <div className="rounded-lg bg-rose-500/10 p-2 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                    Earliest permitted start date:{" "}
                    <span className="underline font-bold">
                      {simResult.earliestEligibleStartDate}
                    </span>
                  </div>
                )}

                <p className="text-[10px] opacity-90 leading-relaxed mt-0.5">
                  {simResult.message}
                </p>
              </div>
            )}

            {/* Quick Policy Reference Cards */}
            <div className="mt-2 pt-2 border-t border-border/60 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Policy Rule Cheat Sheet
              </span>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">0 – 2 Days:</span>
                  <span className="font-bold text-foreground">1 Week Notice (7d)</span>
                </div>
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">2 – 5 Days:</span>
                  <span className="font-bold text-foreground">2 Weeks Notice (14d)</span>
                </div>
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">5 – 10 Days:</span>
                  <span className="font-bold text-foreground">1 Month Notice (30d)</span>
                </div>
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">&gt; 10 Days:</span>
                  <span className="font-bold text-foreground">2 Months Notice (60d)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TrainerLeavePolicyTab;
