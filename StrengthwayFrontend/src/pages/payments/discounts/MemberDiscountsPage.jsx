/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tag,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  IndianRupee,
  ShieldCheck,
  Send,
  Eye,
  Copy,
  Users,
  Plus,
  Filter,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  Percent,
  Trash2,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { getMembers } from "@/lib/membersService";
import { getMembershipPlans } from "@/lib/membershipPlans";
import { getBatches } from "@/lib/batchesService";
import {
  getDiscounts,
  assignBulkDiscounts,
  resendDiscountNotification,
  cancelDiscount,
} from "@/lib/memberDiscountsService";
import { KpiCard, SearchInput } from "@/components/ui";
import { formatINR } from "@/lib/formatters";
import DiscountDetailModal from "./DiscountDetailModal";

const DISCOUNT_STATUS_OPTIONS = [
  "ALL",
  "Assigned",
  "Notified",
  "Payment Pending",
  "Redeemed",
  "Expired",
  "Cancelled",
];

export default function MemberDiscountsPage() {
  const navigate = useNavigate();

  // Top-level Navigation: "tracking" (History & Active) vs "configurator" (New Bulk Assignment)
  const [activeView, setActiveView] = useState("tracking"); // "tracking" | "configurator"

  // ─── Tracking View State ──────────────────────────────────────────────────────────
  const [discounts, setDiscounts] = useState([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);
  const [discountSearch, setDiscountSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedDiscountForDossier, setSelectedDiscountForDossier] = useState(null);

  // ─── Configurator Wizard State (3 Steps) ──────────────────────────────────────────
  // Step 1: Member Selection
  // Step 2: Individual Configuration
  // Step 3: Review & Assign
  const [wizardStep, setWizardStep] = useState(1);

  // All Members & Plans Data
  const [allMembers, setAllMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);

  // Step 1 Filtering
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPlanFilter, setMemberPlanFilter] = useState("ALL");
  const [memberBatchFilter, setMemberBatchFilter] = useState("ALL");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL");

  // Selection Map: memberId -> Member Object
  const [selectedMembersMap, setSelectedMembersMap] = useState({});

  // Step 2: Configurations Map: memberId -> { planId, standardPrice, discountType, discountValue, discountAmount, finalPayableAmount, expiryDate }
  const [configsMap, setConfigsMap] = useState({});

  // Quick Preset Helper Bar State
  const [presetType, setPresetType] = useState("percentage");
  const [presetValue, setPresetValue] = useState("10");
  const [presetExpiry, setPresetExpiry] = useState("");

  // Step 3 Metadata
  const [campaignName, setCampaignName] = useState("");
  const [campaignNotes, setCampaignNotes] = useState("");
  const [sendNotificationNow, setSendNotificationNow] = useState(true);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // ─── Load Initial Data ────────────────────────────────────────────────────────────
  const loadDiscountsList = useCallback(async () => {
    setIsLoadingDiscounts(true);
    try {
      const res = await getDiscounts({
        status: statusFilter,
        search: discountSearch,
        discountType: typeFilter !== "ALL" ? typeFilter : undefined,
      });
      const list = res?.discounts || res?.data || (Array.isArray(res) ? res : []);
      setDiscounts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load discounts:", err);
      toast.error("Failed to load discounts list.");
    } finally {
      setIsLoadingDiscounts(false);
    }
  }, [statusFilter, discountSearch, typeFilter]);

  useEffect(() => {
    loadDiscountsList();
  }, [loadDiscountsList]);

  // Load plans, batches, and members for the wizard
  useEffect(() => {
    async function loadMetadata() {
      setIsLoadingMembers(true);
      try {
        const [membersData, plansData, batchesData] = await Promise.all([
          getMembers(true),
          getMembershipPlans(true),
          getBatches().catch(() => []),
        ]);
        setAllMembers(Array.isArray(membersData) ? membersData : []);
        setPlans(Array.isArray(plansData) ? plansData : []);
        setBatches(Array.isArray(batchesData) ? batchesData : []);
      } catch (err) {
        console.error("Failed to load wizard metadata:", err);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadMetadata();
  }, []);

  // ─── KPI Calculations ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalOffers = discounts.length;
    const activeOffers = discounts.filter(
      (d) => d.status === "Assigned" || d.status === "Notified" || d.status === "Payment Pending"
    ).length;
    const redeemedOffers = discounts.filter((d) => d.status === "Redeemed").length;
    const totalDiscountAmount = discounts.reduce(
      (sum, d) => sum + (Number(d.discountAmount) || 0),
      0
    );
    const totalCollected = discounts
      .filter((d) => d.status === "Redeemed")
      .reduce((sum, d) => sum + (Number(d.appliedToInvoice?.amountPaid || d.finalPayableAmount) || 0), 0);

    return {
      totalOffers,
      activeOffers,
      redeemedOffers,
      totalDiscountAmount,
      totalCollected,
    };
  }, [discounts]);

  // ─── Step 1 Filtered Members ──────────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase();
        const matchesName = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`)
          .toLowerCase()
          .includes(q);
        const matchesId = (m.id || "").toLowerCase().includes(q);
        const matchesMobile = (m.mobile || "").includes(q);
        const matchesEmail = (m.email || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesMobile && !matchesEmail) return false;
      }
      if (memberPlanFilter !== "ALL") {
        const pId = m.membershipPlan?.id || m.membershipPlan?.planId;
        if (pId !== memberPlanFilter) return false;
      }
      if (memberBatchFilter !== "ALL") {
        if (m.assignedBatch?.batchId !== memberBatchFilter && m.batchId !== memberBatchFilter) {
          return false;
        }
      }
      if (memberStatusFilter !== "ALL") {
        if ((m.status || "Active").toLowerCase() !== memberStatusFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [allMembers, memberSearch, memberPlanFilter, memberBatchFilter, memberStatusFilter]);

  // Toggle Single Member Selection
  const toggleMemberSelection = (member) => {
    setSelectedMembersMap((prev) => {
      const next = { ...prev };
      if (next[member.id]) {
        delete next[member.id];
      } else {
        next[member.id] = member;
        // Pre-populate initial config row for this member
        initializeMemberConfig(member);
      }
      return next;
    });
  };

  // Select / Deselect All Filtered
  const toggleSelectAllFiltered = () => {
    const allSelected = filteredMembers.every((m) => selectedMembersMap[m.id]);
    setSelectedMembersMap((prev) => {
      const next = { ...prev };
      if (allSelected) {
        filteredMembers.forEach((m) => delete next[m.id]);
      } else {
        filteredMembers.forEach((m) => {
          next[m.id] = m;
          initializeMemberConfig(m);
        });
      }
      return next;
    });
  };

  // Helper to initialize or update a member's row config
  const initializeMemberConfig = (member) => {
    setConfigsMap((prev) => {
      if (prev[member.id]) return prev;

      // Find plan: member's current plan or first available plan
      const defaultPlan =
        plans.find((p) => p.id === member.membershipPlan?.id) || plans[0] || {};
      const standardPrice = Number(defaultPlan.price || 0);
      const discountType = "percentage";
      const discountValue = 10;
      const discountAmount = Math.round((standardPrice * discountValue) / 100);
      const finalPayableAmount = Math.max(0, standardPrice - discountAmount);

      return {
        ...prev,
        [member.id]: {
          memberId: member.id,
          memberName: member.fullName || `${member.firstName || ""} ${member.lastName || ""}`.trim(),
          planId: defaultPlan.id || "plan-monthly",
          planName: defaultPlan.name || "Default Plan",
          standardPrice,
          discountType,
          discountValue,
          discountAmount,
          finalPayableAmount,
          expiryDate: "",
        },
      };
    });
  };

  // Live Recalculate Member Row
  const updateMemberConfigField = (memberId, field, value) => {
    setConfigsMap((prev) => {
      const current = prev[memberId] || {};
      const updated = { ...current, [field]: value };

      // If plan changed, update planName and standardPrice
      if (field === "planId") {
        const foundPlan = plans.find((p) => p.id === value);
        if (foundPlan) {
          updated.planName = foundPlan.name;
          updated.standardPrice = Number(foundPlan.price || 0);
        }
      }

      // Re-calculate math
      const price = Number(updated.standardPrice || 0);
      const val = Number(updated.discountValue || 0);
      let calculatedDiscount = 0;

      if (updated.discountType === "percentage") {
        const clampedPct = Math.min(100, Math.max(0, val));
        calculatedDiscount = Math.round((price * clampedPct) / 100);
      } else {
        calculatedDiscount = Math.min(price, Math.max(0, val));
      }

      updated.discountAmount = calculatedDiscount;
      updated.finalPayableAmount = Math.max(0, price - calculatedDiscount);

      return {
        ...prev,
        [memberId]: updated,
      };
    });
  };

  // Remove single member from configuration
  const removeMemberFromConfig = (memberId) => {
    setSelectedMembersMap((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    setConfigsMap((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  // Quick Preset Helper: Apply to empty or all
  const handleApplyPreset = (onlyEmpty = false) => {
    const val = Number(presetValue || 0);
    setConfigsMap((prev) => {
      const next = { ...prev };
      Object.keys(selectedMembersMap).forEach((id) => {
        const row = next[id] || {};
        if (onlyEmpty && row.discountValue && row.discountValue > 0) {
          return;
        }

        const price = Number(row.standardPrice || 0);
        let discAmount = 0;
        if (presetType === "percentage") {
          const clamped = Math.min(100, Math.max(0, val));
          discAmount = Math.round((price * clamped) / 100);
        } else {
          discAmount = Math.min(price, Math.max(0, val));
        }

        next[id] = {
          ...row,
          discountType: presetType,
          discountValue: val,
          discountAmount: discAmount,
          finalPayableAmount: Math.max(0, price - discAmount),
          ...(presetExpiry ? { expiryDate: presetExpiry } : {}),
        };
      });
      return next;
    });
    toast.success("Preset applied! You can still edit any individual member's row below.");
  };

  // Step 3 Confirmation Submission
  const handleConfirmBulkAssignment = async () => {
    const selectedIds = Object.keys(selectedMembersMap);
    if (selectedIds.length === 0) {
      toast.error("No members selected for discount assignment.");
      return;
    }

    // Validate each member configuration before submitting
    for (const id of selectedIds) {
      const c = configsMap[id];
      const memberName = selectedMembersMap[id]?.fullName || c?.memberName || id;
      if (!c?.planId) {
        toast.error(`Please select a membership plan for ${memberName}.`);
        return;
      }
      const val = Number(c?.discountValue);
      if (isNaN(val) || val <= 0) {
        toast.error(`Please enter a valid discount value greater than 0 for ${memberName}.`);
        return;
      }
      if (c.discountType === "percentage" && val > 100) {
        toast.error(`Discount percentage cannot exceed 100% for ${memberName}.`);
        return;
      }
      if (c.expiryDate) {
        const expDate = new Date(c.expiryDate);
        if (isNaN(expDate.getTime()) || expDate <= new Date()) {
          toast.error(`Expiry date for ${memberName} must be a future date.`);
          return;
        }
      }
    }

    // Build payload items
    const items = selectedIds.map((id) => {
      const c = configsMap[id];
      return {
        memberId: c.memberId,
        planId: c.planId,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString() : null,
        applicationRule: "NEXT_PAYMENT_ONLY",
      };
    });

    setIsSubmittingBulk(true);
    try {
      const payload = {
        campaignName: campaignName.trim() || undefined,
        notes: campaignNotes.trim() || undefined,
        notifyMembers: sendNotificationNow,
        sendNotification: sendNotificationNow,
        discounts: items,
        items,
      };

      const result = await assignBulkDiscounts(payload);
      toast.success(
        `Successfully assigned individual discounts to ${result.totalAssigned || result.createdCount || items.length} members!`,
        {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        }
      );

      // Reset wizard and switch back to tracking view
      setSelectedMembersMap({});
      setConfigsMap({});
      setCampaignName("");
      setCampaignNotes("");
      setWizardStep(1);
      setStatusFilter("ALL");
      setDiscountSearch("");
      setTypeFilter("ALL");
      setActiveView("tracking");
      await loadDiscountsList();
    } catch (err) {
      console.error("Bulk assign failed:", err);
      const detail = err.data?.errors?.map((e) => e.message).join(", ");
      toast.error(detail || err.message || "Failed to assign discounts. Please verify member configurations.");
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Helper for status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "Redeemed":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Notified":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Payment Pending":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Assigned":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "Expired":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "Cancelled":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const selectedCount = Object.keys(selectedMembersMap).length;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3.5 animate-in fade-in duration-200">
      {/* ─── Top Page Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Link to="/admin/payments/members" className="hover:text-primary transition-colors">
              Payments
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-medium">Individual Member Discounts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Tag className="h-6 w-6 text-primary" />
            <span>Member Discounts Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
            Configure custom, independently-edited discounts for selected members, notify them
            privately through their login, and automatically apply savings on their next payment.
          </p>
        </div>

        {/* View Switcher Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {activeView === "tracking" ? (
            <button
              type="button"
              onClick={() => {
                setActiveView("configurator");
                setWizardStep(1);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Configure Member Discounts</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView("tracking")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Back to Discounts Tracking</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── KPI Cards (Always visible on tracking view) ─────────────────────────────── */}
      {activeView === "tracking" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard
            title="Total Assigned"
            value={kpis.totalOffers}
            icon={Tag}
            colorScheme="default"
          />
          <KpiCard
            title="Active & Notified"
            value={kpis.activeOffers}
            icon={Clock}
            colorScheme="sky"
          />
          <KpiCard
            title="Redeemed"
            value={kpis.redeemedOffers}
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <KpiCard
            title="Total Discounts"
            value={formatINR(kpis.totalDiscountAmount)}
            icon={Percent}
            colorScheme="rose"
          />
          <KpiCard
            title="Renewals Collected"
            value={formatINR(kpis.totalCollected)}
            icon={IndianRupee}
            colorScheme="emerald"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          VIEW 1: DISCOUNTS TRACKING TABLE
         ════════════════════════════════════════════════════════════════════════════════ */}
      {activeView === "tracking" && (
        <div className="space-y-3 flex-1 min-h-0 flex flex-col">
          {/* Filter Toolbar */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="flex-1">
              <SearchInput
                value={discountSearch}
                onChange={(e) => setDiscountSearch(e.target.value)}
                placeholder="Search by member name, member ID, campaign..."
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {DISCOUNT_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "All Statuses" : st}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border/80 bg-card shadow-xs flex-1 min-h-0 overflow-hidden flex flex-col">
            {isLoadingDiscounts ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs">Loading member discounts...</span>
              </div>
            ) : discounts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Tag size={24} />
                </div>
                <h3 className="font-semibold text-foreground text-sm">No Member Discounts Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {discountSearch || statusFilter !== "ALL"
                    ? "No discounts match your current search and filter criteria."
                    : "No individual member discounts have been created yet."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("configurator");
                    setWizardStep(1);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create First Discount Campaign</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Target Plan</th>
                      <th className="py-3 px-4 text-right">Standard Price</th>
                      <th className="py-3 px-4 text-center">Discount</th>
                      <th className="py-3 px-4 text-right">Final Payable</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Notification</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {discounts.map((disc) => (
                      <tr key={disc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {disc.memberName?.charAt(0) || "M"}
                            </div>
                            <div>
                              <span className="font-semibold text-foreground block">
                                {disc.memberName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {disc.memberId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground block">{disc.planName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Rule: Next payment only
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-muted-foreground">
                          {formatINR(disc.standardPrice || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-primary">
                            {disc.discountType === "percentage"
                              ? `${disc.discountValue}%`
                              : formatINR(disc.discountValue)}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              (-{formatINR(disc.discountAmount || 0)})
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-extrabold text-emerald-400">
                            {formatINR(disc.finalPayableAmount || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              disc.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {disc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              disc.notificationStatus === "SENT"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {disc.notificationStatus || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          {disc.expiryDate
                            ? new Date(disc.expiryDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "No Expiry"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDiscountForDossier(disc)}
                              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                              title="View Full Offer Dossier & History"
                            >
                              <Eye size={13} />
                            </button>

                            {disc.status !== "Redeemed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/payment/checkout?discountId=${encodeURIComponent(disc.id)}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success("Checkout link copied to clipboard!");
                                }}
                                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                                title="Copy Online Checkout Link"
                              >
                                <Copy size={13} />
                              </button>
                            )}

                            {disc.status !== "Redeemed" && disc.status !== "Cancelled" && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await resendDiscountNotification(disc.id);
                                    toast.success("Notification resent to member login!");
                                    loadDiscountsList();
                                  } catch (err) {
                                    toast.error(err.message || "Failed to resend notification.");
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                                title="Resend In-App Notification"
                              >
                                <Send size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          VIEW 2: INDIVIDUAL MEMBER DISCOUNT CONFIGURATOR (3-STEP WIZARD)
         ════════════════════════════════════════════════════════════════════════════════ */}
      {activeView === "configurator" && (
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Wizard Step Indicator Bar */}
          <div className="p-3 rounded-xl border border-border/80 bg-card shadow-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 sm:gap-8 flex-wrap">
              {/* Step 1 */}
              <div
                onClick={() => setWizardStep(1)}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  wizardStep === 1
                    ? "text-primary font-bold"
                    : wizardStep > 1
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 1
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : wizardStep > 1
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {wizardStep > 1 ? <Check size={14} /> : "1"}
                </div>
                <span className="text-xs">1. Select Members</span>
              </div>

              <ChevronRight size={14} className="text-muted-foreground hidden sm:block" />

              {/* Step 2 */}
              <div
                onClick={() => selectedCount > 0 && setWizardStep(2)}
                className={`flex items-center gap-2 transition-colors ${
                  selectedCount === 0
                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                    : "cursor-pointer"
                } ${
                  wizardStep === 2
                    ? "text-primary font-bold"
                    : wizardStep > 2
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 2
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : wizardStep > 2
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {wizardStep > 2 ? <Check size={14} /> : "2"}
                </div>
                <span className="text-xs">2. Configure Individual Discounts</span>
              </div>

              <ChevronRight size={14} className="text-muted-foreground hidden sm:block" />

              {/* Step 3 */}
              <div
                onClick={() => selectedCount > 0 && setWizardStep(3)}
                className={`flex items-center gap-2 transition-colors ${
                  selectedCount === 0
                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                    : "cursor-pointer"
                } ${wizardStep === 3 ? "text-primary font-bold" : "text-muted-foreground"}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 3
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <span className="text-xs">3. Review & Confirm</span>
              </div>
            </div>

            {/* Selected Count Indicator */}
            <div className="text-xs font-medium text-muted-foreground hidden md:block">
              <span className="font-bold text-foreground">{selectedCount}</span> members selected
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              STEP 1: SELECT MEMBERS
             ───────────────────────────────────────────────────────────────────────────── */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              {/* Member Search & Filters */}
              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <SearchInput
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search member name, ID, phone..."
                  />
                </div>

                {/* Plan Filter */}
                <select
                  value={memberPlanFilter}
                  onChange={(e) => setMemberPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Membership Plans</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>

                {/* Batch Filter */}
                <select
                  value={memberBatchFilter}
                  onChange={(e) => setMemberBatchFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {b.name || b.batchName}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Members Selection Table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all-checkbox"
                      checked={
                        filteredMembers.length > 0 &&
                        filteredMembers.every((m) => selectedMembersMap[m.id])
                      }
                      onChange={toggleSelectAllFiltered}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <label
                      htmlFor="select-all-checkbox"
                      className="font-semibold text-foreground cursor-pointer"
                    >
                      Select All Filtered ({filteredMembers.length})
                    </label>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Showing {filteredMembers.length} of {allMembers.length} total members
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold sticky top-0 bg-card z-10">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">Select</th>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Current Plan</th>
                        <th className="py-2.5 px-4">Assigned Batch</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredMembers.map((member) => {
                        const isSelected = Boolean(selectedMembersMap[member.id]);
                        return (
                          <tr
                            key={member.id}
                            onClick={() => toggleMemberSelection(member)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                            }`}
                          >
                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleMemberSelection(member)}
                                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                  {member.fullName?.charAt(0) || "M"}
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground block">
                                    {member.fullName}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                    <span>{member.id}</span>
                                    {member.mobile && <span>• {member.mobile}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-foreground">
                                {member.membershipPlan?.name || "None / Expired"}
                              </span>
                              {member.membershipPlan?.price && (
                                <span className="block text-[10px] text-muted-foreground">
                                  ₹{member.membershipPlan.price}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {member.assignedBatch?.batchName || member.batchName || "Flexible Slot"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  member.status === "Active"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {member.status || "Active"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Step 1 Action Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm">
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{selectedCount}</strong> members selected for
                  individual discount assignment.
                </span>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => setWizardStep(2)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                    selectedCount > 0
                      ? "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 cursor-pointer"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span>Proceed to Individual Configuration</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              STEP 2: CONFIGURE INDIVIDUAL DISCOUNTS
             ───────────────────────────────────────────────────────────────────────────── */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              {/* Important Banner: Clarifying independent editable rows */}
              <div className="p-4 rounded-2xl border border-primary/25 bg-primary/5 flex items-start gap-3">
                <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-foreground">
                    Independent Member Discount Configuration
                  </h4>
                  <p className="text-muted-foreground">
                    Every member below has their own independent discount configuration. You can
                    freely adjust the target plan, choose between percentage (%) or fixed (₹)
                    discount, and set different amounts for each member. Changing one member will
                    never modify another.
                  </p>
                </div>
              </div>

              {/* Quick Preset Helper Bar (Optional convenience helper) */}
              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Quick Preset Tool (Optional)
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Use to quickly set values across rows, then customize rows as needed
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Preset Type */}
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPresetType("percentage")}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        presetType === "percentage"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetType("fixed")}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        presetType === "fixed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Fixed Amount (₹)
                    </button>
                  </div>

                  {/* Preset Value */}
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      value={presetValue}
                      onChange={(e) => setPresetValue(e.target.value)}
                      placeholder={presetType === "percentage" ? "e.g. 15%" : "e.g. ₹500"}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Preset Expiry */}
                  <div className="w-40">
                    <input
                      type="date"
                      value={presetExpiry}
                      onChange={(e) => setPresetExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      Apply to All Rows
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                    >
                      Apply to Empty Rows Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Member Configurations Table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4 min-w-[200px]">Member</th>
                        <th className="py-3 px-4 min-w-[180px]">Target Plan</th>
                        <th className="py-3 px-4 text-right min-w-[110px]">Standard Price</th>
                        <th className="py-3 px-4 min-w-[140px]">Discount Type</th>
                        <th className="py-3 px-4 min-w-[110px]">Discount Value</th>
                        <th className="py-3 px-4 text-right min-w-[110px]">Calculated Off</th>
                        <th className="py-3 px-4 text-right min-w-[110px]">Final Amount</th>
                        <th className="py-3 px-4 min-w-[130px]">Expiry Date</th>
                        <th className="py-3 px-4 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.keys(selectedMembersMap).map((memberId) => {
                        const m = selectedMembersMap[memberId];
                        const cfg = configsMap[memberId] || {};
                        const valNum = Number(cfg.discountValue || 0);
                        const isInvalidVal =
                          cfg.discountType === "percentage"
                            ? valNum < 0 || valNum > 100
                            : valNum < 0 || valNum > Number(cfg.standardPrice || 0);

                        return (
                          <tr key={memberId} className="hover:bg-muted/20 transition-colors">
                            {/* Member Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                                  {m.fullName?.charAt(0) || "M"}
                                </div>
                                <div className="truncate">
                                  <span className="font-semibold text-foreground block truncate">
                                    {m.fullName}
                                  </span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {m.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Plan Selection Dropdown */}
                            <td className="py-3 px-4">
                              <select
                                value={cfg.planId || ""}
                                onChange={(e) =>
                                  updateMemberConfigField(memberId, "planId", e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                {plans.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Standard Price Badge */}
                            <td className="py-3 px-4 text-right font-medium text-foreground">
                              {formatINR(cfg.standardPrice || 0)}
                            </td>

                            {/* Discount Type segmented button */}
                            <td className="py-3 px-4">
                              <div className="flex rounded-lg border border-border overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMemberConfigField(memberId, "discountType", "percentage")
                                  }
                                  className={`flex-1 py-1 px-2 text-[11px] font-semibold text-center transition-colors cursor-pointer ${
                                    cfg.discountType === "percentage"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-card text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMemberConfigField(memberId, "discountType", "fixed")
                                  }
                                  className={`flex-1 py-1 px-2 text-[11px] font-semibold text-center transition-colors cursor-pointer ${
                                    cfg.discountType === "fixed"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-card text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  ₹
                                </button>
                              </div>
                            </td>

                            {/* Discount Value Input */}
                            <td className="py-3 px-4">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max={cfg.discountType === "percentage" ? 100 : cfg.standardPrice}
                                  value={cfg.discountValue !== undefined ? cfg.discountValue : ""}
                                  onChange={(e) =>
                                    updateMemberConfigField(memberId, "discountValue", e.target.value)
                                  }
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs bg-muted/40 border text-foreground focus:outline-none focus:ring-1 ${
                                    isInvalidVal
                                      ? "border-rose-500 focus:ring-rose-500 text-rose-400"
                                      : "border-border focus:ring-primary"
                                  }`}
                                />
                                {isInvalidVal && (
                                  <span className="block text-[9px] text-rose-400 mt-0.5">
                                    {cfg.discountType === "percentage"
                                      ? "Must be 0-100%"
                                      : `Max ₹${cfg.standardPrice}`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Calculated Off */}
                            <td className="py-3 px-4 text-right font-medium text-rose-400">
                              - ₹{Number(cfg.discountAmount || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Final Amount */}
                            <td className="py-3 px-4 text-right">
                              <span className="font-extrabold text-emerald-400">
                                ₹{Number(cfg.finalPayableAmount || 0).toLocaleString("en-IN")}
                              </span>
                            </td>

                            {/* Expiry Date */}
                            <td className="py-3 px-4">
                              <input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={cfg.expiryDate || ""}
                                onChange={(e) =>
                                  updateMemberConfigField(memberId, "expiryDate", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              />
                            </td>

                            {/* Remove Row */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeMemberFromConfig(memberId)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Remove member from this discount offer batch"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Step 2 Navigation Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Member Selection</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const invalidMembers = Object.keys(selectedMembersMap).filter((id) => {
                      const cfg = configsMap[id] || {};
                      const val = Number(cfg.discountValue || 0);
                      if (val <= 0) return true;
                      if (cfg.discountType === "percentage") return val > 100;
                      return val > Number(cfg.standardPrice || 0);
                    });
                    if (invalidMembers.length > 0) {
                      toast.error("Please enter valid discount values for all selected members before proceeding.");
                      return;
                    }
                    setWizardStep(3);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                  <span>Review & Finalize Discounts</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              STEP 3: REVIEW & ASSIGN
             ───────────────────────────────────────────────────────────────────────────── */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              {/* Campaign Info Inputs */}
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <ShieldCheck size={18} className="text-primary" />
                  <span>Campaign Details & Member Notification Dispatch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Campaign / Bulk Operation Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g. Festive Special Renewal Offer 2026"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Internal Admin Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={campaignNotes}
                      onChange={(e) => setCampaignNotes(e.target.value)}
                      placeholder="e.g. Target quarterly retention push for active athletes"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Member Login Notification Checkbox */}
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="send-notif-checkbox"
                    checked={sendNotificationNow}
                    onChange={(e) => setSendNotificationNow(e.target.checked)}
                    className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="send-notif-checkbox" className="text-xs cursor-pointer">
                    <span className="font-bold text-foreground block">
                      Notify each member individually through their login portal immediately
                    </span>
                    <span className="text-muted-foreground block mt-0.5">
                      Sends an in-app notification with their custom discounted price, plan details,
                      and payment link. No member will see another member&apos;s discount.
                    </span>
                  </label>
                </div>
              </div>

              {/* Aggregated Financial Review Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
                  <span className="text-xs text-muted-foreground font-medium block">
                    Members Configured
                  </span>
                  <span className="text-2xl font-bold text-foreground mt-1 block">
                    {selectedCount}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
                  <span className="text-xs text-muted-foreground font-medium block">
                    Total Standard Value
                  </span>
                  <span className="text-2xl font-bold text-foreground mt-1 block">
                    ₹
                    {Object.values(configsMap)
                      .reduce((sum, c) => sum + (Number(c.standardPrice) || 0), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-sm">
                  <span className="text-xs text-rose-400 font-medium block">
                    Total Discount Granted
                  </span>
                  <span className="text-2xl font-bold text-rose-400 mt-1 block">
                    ₹
                    {Object.values(configsMap)
                      .reduce((sum, c) => sum + (Number(c.discountAmount) || 0), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                  <span className="text-xs text-emerald-400 font-medium block">
                    Expected Collection
                  </span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    ₹
                    {Object.values(configsMap)
                      .reduce((sum, c) => sum + (Number(c.finalPayableAmount) || 0), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Review Table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Review Individual Member Discount Configurations ({selectedCount})
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Application rule: Immediate Next Payment Only
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Target Plan</th>
                        <th className="py-2.5 px-4 text-right">Standard Price</th>
                        <th className="py-2.5 px-4 text-center">Configured Discount</th>
                        <th className="py-2.5 px-4 text-right">Discount Amount</th>
                        <th className="py-2.5 px-4 text-right">Final Amount</th>
                        <th className="py-2.5 px-4">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.keys(selectedMembersMap).map((id) => {
                        const m = selectedMembersMap[id];
                        const c = configsMap[id] || {};
                        return (
                          <tr key={id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-foreground block">
                                {m.fullName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {m.id}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-medium text-foreground">
                              {c.planName || c.planId}
                            </td>
                            <td className="py-2.5 px-4 text-right text-muted-foreground">
                              ₹{Number(c.standardPrice || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-4 text-center font-bold text-primary">
                              {c.discountType === "percentage"
                                ? `${c.discountValue}%`
                                : `₹${c.discountValue}`}
                            </td>
                            <td className="py-2.5 px-4 text-right font-medium text-rose-400">
                              - ₹{Number(c.discountAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                              ₹{Number(c.finalPayableAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                              {c.expiryDate ? c.expiryDate : "No Expiry"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Confirm Buttons */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Edit Configurations</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmittingBulk || selectedCount === 0}
                  onClick={handleConfirmBulkAssignment}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all cursor-pointer"
                >
                  {isSubmittingBulk ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Assigning Discounts & Dispatching Notifications...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Assign {selectedCount} Individual Discounts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Detail Modal ───────────────────────────────────────────────────────────── */}
      {selectedDiscountForDossier && (
        <DiscountDetailModal
          discount={selectedDiscountForDossier}
          isOpen={Boolean(selectedDiscountForDossier)}
          onClose={() => setSelectedDiscountForDossier(null)}
          onDiscountUpdated={loadDiscountsList}
        />
      )}
    </div>
  );
}
