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
import { PolicyRuleSimulator } from "@/pages/attendance/PolicyRuleSimulator";
import { KpiCard } from "@/components/ui";
import { formatINR } from "@/lib/formatters";

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
    annualPaidLeaveAllowance: 36,
    monthlyPaidLeaveAllowance: 3,
    unpaidDeductionPerDay: 1000,
    maxConsecutiveEmergencyDays: 3,
    description: "Standard Coach Leave Policy with duration-based advance notice requirements and 36-day annual leave allowance.",
    tiers: FACTORY_DEFAULT_TIERS,
  });
  const [initialPolicy, setInitialPolicy] = useState(null);

  // Load Policy from Backend
  const loadPolicy = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrainerLeavePolicy();
      if (data) {
        setPolicy({
          ...data,
          annualPaidLeaveAllowance: typeof data.annualPaidLeaveAllowance === "number" ? data.annualPaidLeaveAllowance : 36,
          monthlyPaidLeaveAllowance: typeof data.monthlyPaidLeaveAllowance === "number" ? data.monthlyPaidLeaveAllowance : 3,
          unpaidDeductionPerDay: typeof data.unpaidDeductionPerDay === "number" ? data.unpaidDeductionPerDay : 1000,
          maxConsecutiveEmergencyDays: typeof data.maxConsecutiveEmergencyDays === "number" ? data.maxConsecutiveEmergencyDays : 3,
          tiers: Array.isArray(data.tiers) && data.tiers.length > 0 ? data.tiers : FACTORY_DEFAULT_TIERS,
        });
        setInitialPolicy(JSON.stringify(data));
      }
    } catch (err) {
      toast.error(err.message || "Failed to load coach leave policy.");
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

  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      const res = await saveTrainerLeavePolicy(policy);
      setPolicy(res);
      setInitialPolicy(JSON.stringify(res));
      toast.success("Coach leave policy saved successfully.");
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
        <KpiCard
          label="Annual Allowance"
          value={`${policy.annualPaidLeaveAllowance ?? 36} Days`}
          subtext="Paid leave without Loss of Pay (LOP)"
          icon={ShieldCheck}
          color="emerald"
        />

        <KpiCard
          label="Configured Tiers"
          value={`${policy.tiers.length} Tiers`}
          subtext="Advance notice thresholds"
          icon={Clock}
          color="sky"
        />

        <KpiCard
          label="Notice Spectrum"
          value="7 to 60 Days"
          subtext="1 week up to 2 months advance notice"
          icon={Sparkles}
          color="amber"
        />

        <KpiCard
          label="Loss of Pay (LOP) Rate"
          value={`${formatINR(policy.unpaidDeductionPerDay ?? 1000)} / day`}
          subtext="Applied to every day beyond 36 days"
          icon={AlertCircle}
          color="rose"
        />
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

            {/* Annual Allowance & Loss of Pay (LOP) Governance */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span>Annual Paid Leave Allowance (36 Days) &amp; Loss of Pay (LOP)</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Each faculty coach is granted 36 paid leave days per calendar year. Excess days automatically incur Loss of Pay (LOP).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Annual Paid Allowance
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="365"
                        step="1"
                        value={policy.annualPaidLeaveAllowance ?? 36}
                        onChange={(e) =>
                          setPolicy((p) => ({
                            ...p,
                            annualPaidLeaveAllowance: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="w-20 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-center font-bold text-emerald-500 focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">Days/year</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Both informed &amp; uninformed leaves count toward this allowance.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Loss of Pay (LOP) Deduction
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
                        className="w-24 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-center font-bold text-rose-500 focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">/LOP day</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Deducted per leave day taken beyond the 36-day annual limit.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Max Emergency Duration
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="14"
                        step="1"
                        value={policy.maxConsecutiveEmergencyDays ?? 3}
                        onChange={(e) =>
                          setPolicy((p) => ({
                            ...p,
                            maxConsecutiveEmergencyDays: parseInt(e.target.value, 10) || 3,
                          }))
                        }
                        className="w-20 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-center font-bold text-primary focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">Consecutive days</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Maximum emergency span bypassing advance notice requirements.
                    </span>
                  </div>
                </div>

                {/* Annual Leave Governance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
                  <div className="p-2.5 rounded-lg border border-border/60 bg-background/50 text-[11px] space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Combined Allowance Counting
                    </span>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Both informed leave (approved leave applications) and uninformed leave (unexcused absences) deduct from the same 36-day allowance based on actual dates taken.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border/60 bg-background/50 text-[11px] space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-amber-500" />
                      Dynamic LOP &amp; Annual Reset
                    </span>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Excess days beyond 36 incur LOP (e.g., 34 used + 5 requested = 2 paid, 3 LOP). Allowance resets at the start of each calendar year while preserving historical archives.
                    </p>
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
          <PolicyRuleSimulator
            title="Policy Rule Simulator"
            allowTypeToggle={true}
          />
        </div>
      </div>
    </div>
  );
}
export default TrainerLeavePolicyTab;
