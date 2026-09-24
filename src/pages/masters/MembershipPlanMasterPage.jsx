/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CreditCard,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Users,
  Clock,
  Tag,
  Star,
  Layers,
  FileText,
  IndianRupee,
  Sliders,
  CheckSquare,
  Archive,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  softDeleteMembershipPlan,
  restoreMembershipPlan,
  permanentDeleteMembershipPlan,
  toggleMembershipPlanStatus,
} from "@/lib/membershipPlans";
import { getMembers } from "@/lib/membersService";

export default function MembershipPlanMasterPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [featureInput, setFeatureInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    durationMonths: 1,
    price: 7000,
    period: "/mo",
    billing: "",
    badge: "",
    popular: false,
    status: "Active",
    description: "",
    features: [],
  });

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const loadData = () => {
    setPlans(getMembershipPlans(true, true));
    try {
      setMembers(getMembers(true) || []);
    } catch {
      setMembers([]);
    }
  };

  // Map enrolled members count per plan
  const enrolledCountByPlan = useMemo(() => {
    const counts = {};
    members.forEach((m) => {
      if (!m.isDeleted && m.membershipPlan) {
        const planKey = m.membershipPlan.id || m.membershipPlan.name;
        counts[planKey] = (counts[planKey] || 0) + 1;
        if (m.membershipPlan.id) {
          counts[m.membershipPlan.id] = (counts[m.membershipPlan.id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [members]);

  const stats = useMemo(() => {
    const nonDeleted = plans.filter((p) => !p.isDeleted);
    const total = nonDeleted.length;
    const active = nonDeleted.filter((p) => p.status === "Active").length;
    const archived = plans.filter((p) => p.isDeleted).length;
    const totalEnrolled = Object.values(enrolledCountByPlan).reduce((acc, c) => acc + c, 0) / 2;
    return {
      total,
      active,
      archived,
      totalEnrolled: Math.round(totalEnrolled),
    };
  }, [plans, enrolledCountByPlan]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter === "Archived") {
        if (!p.isDeleted) return false;
      } else {
        if (p.isDeleted) return false;
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.badge?.toLowerCase().includes(q) ||
        p.features?.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [plans, statusFilter, searchQuery]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingPlan(null);
    setForm({
      name: "",
      durationMonths: 1,
      price: 7000,
      period: "/mo",
      billing: "Billed ₹7,000 every month",
      badge: "",
      popular: false,
      status: "Active",
      description: "",
      features: [
        "Full gym and training floor access",
        "Unlimited group training classes",
        "Certified floor coach supervision",
        "Locker & shower facilities access",
      ],
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      durationMonths: plan.durationMonths || 1,
      price: plan.price || 0,
      period: plan.period || "/mo",
      billing: plan.billing || "",
      badge: plan.badge || "",
      popular: Boolean(plan.popular),
      status: plan.status || "Active",
      description: plan.description || "",
      features: Array.isArray(plan.features) ? [...plan.features] : [],
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleAddFeature = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const text = featureInput.trim();
    if (!text) return;
    if (form.features.includes(text)) {
      toast.info("This feature is already in the list.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, text],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleToggleStatus = (id) => {
    try {
      const updated = toggleMembershipPlanStatus(id);
      if (updated) {
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success(`Plan marked as ${updated.status}.`);
      }
    } catch {
      toast.error("Failed to toggle plan status.");
    }
  };

  const handleDelete = (id, name) => {
    const enrolled = enrolledCountByPlan[id] || 0;
    const warningMsg =
      enrolled > 0
        ? `Warning: ${enrolled} member(s) are currently enrolled in "${name}". Are you sure you want to archive (soft delete) this plan? It will be safely archived without affecting existing members.`
        : `Are you sure you want to archive (soft delete) "${name}"? You can restore it anytime from the Archived tab.`;

    if (window.confirm(warningMsg)) {
      softDeleteMembershipPlan(id);
      loadData();
      toast.success(`"${name}" plan archived.`);
    }
  };

  const handleRestore = (id, name) => {
    restoreMembershipPlan(id);
    loadData();
    toast.success(`"${name}" restored to Active status.`);
  };

  const handlePermanentDelete = (id, name) => {
    const enrolled = enrolledCountByPlan[id] || 0;
    const warningMsg =
      enrolled > 0
        ? `CAUTION: ${enrolled} member(s) are enrolled in "${name}". Permanently deleting will completely erase this plan from storage. Are you sure?`
        : `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;

    if (window.confirm(warningMsg)) {
      permanentDeleteMembershipPlan(id);
      loadData();
      toast.success(`"${name}" permanently deleted.`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }
    if (Number(form.price) < 0) {
      toast.error("Price must be a valid positive amount.");
      return;
    }

    try {
      if (editingPlan) {
        const updated = updateMembershipPlan(editingPlan.id, form);
        if (updated) {
          setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
          toast.success(`${updated.name} updated successfully!`);
        }
      } else {
        const created = createMembershipPlan(form);
        setPlans((prev) => [...prev, created]);
        toast.success(`${created.name} plan created!`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save membership plan.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            Membership Plan
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Configure gym commitment tiers, pricing, and benefits mapped dynamically across member
            registration and the landing page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Plans</span>
            <CreditCard size={18} className="text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Configured membership tiers</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Tiers</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">{stats.active}</div>
          <p className="mt-1 text-xs text-muted-foreground">Available for enrollment</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Enrolled Athletes
            </span>
            <Users size={18} className="text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.totalEnrolled}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active subscriptions</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Archived</span>
            <Archive size={18} className="text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.archived}</div>
          <p className="mt-1 text-xs text-muted-foreground">Soft-deleted plans</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "Active", "Inactive", "Archived"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "All Plans" : s}
              {s === "Archived" && stats.archived > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive/20 border border-destructive/30 px-1.5 py-0.2 text-[10px] text-destructive font-extrabold">
                  {stats.archived}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search plans, features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No membership plans found</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search criteria."
              : "Create your first membership plan to make it available for member enrollment."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={14} />
            Create Plan
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* --- GRID CARDS VIEW --- */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlans.map((plan) => {
            const enrolled = enrolledCountByPlan[plan.id] || 0;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${
                  plan.isDeleted
                    ? "border-destructive/30 border-dashed bg-card/60 opacity-80"
                    : plan.popular
                      ? "border-amber-500/80 ring-2 ring-amber-500/40 shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] bg-gradient-to-b from-amber-500/[0.08] via-card to-card hover:border-amber-400"
                      : "border-border bg-card hover:border-foreground/30"
                } ${!plan.isDeleted && plan.status === "Inactive" ? "opacity-60" : ""}`}
              >
                {/* Highlighted / Featured Badge */}
                {plan.isDeleted ? (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                    <Archive size={11} />
                    Archived Plan
                  </span>
                ) : plan.popular ? (
                  <span className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/30">
                    <Sparkles size={12} className="fill-black" />
                    {plan.badge || "FEATURED TIER"}
                  </span>
                ) : (
                  plan.badge && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground shadow-sm">
                      {plan.badge}
                    </span>
                  )
                )}

                <div className="space-y-4">
                  {/* Top Bar: Name, Status & Duration */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-bold text-foreground font-display">
                          {plan.name}
                        </h3>
                        {plan.popular && !plan.isDeleted && (
                          <Sparkles
                            size={14}
                            className="text-amber-400 fill-amber-400 shrink-0"
                            title="Featured Tier"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""} Commitment
                      </span>
                    </div>

                    {plan.isDeleted ? (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-destructive/15 text-destructive border-destructive/30">
                        Archived
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(plan.id)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          plan.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                        title={`Click to ${plan.status === "Active" ? "deactivate" : "activate"}`}
                      >
                        {plan.status}
                      </button>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground font-display">
                        {plan.formattedPrice}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {plan.period}
                      </span>
                    </div>
                    {plan.billing && (
                      <p className="mt-1 text-[11px] text-muted-foreground">{plan.billing}</p>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Features */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Included Benefits:
                    </span>
                    <ul className="space-y-2">
                      {plan.features?.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                          <span className="line-clamp-2">{f}</span>
                        </li>
                      ))}
                      {plan.features?.length > 4 && (
                        <li className="text-[11px] text-muted-foreground font-medium pl-5">
                          + {plan.features.length - 4} more benefits
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users size={13} className="text-blue-400" />
                    <span>
                      <strong className="text-foreground">{enrolled}</strong> Enrolled
                    </span>
                  </div>

                  {plan.isDeleted ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(plan.id, plan.name)}
                        className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                        title="Restore Plan to Active"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(plan.id, plan.name)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Archive Plan (Soft Delete)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- TABLE VIEW --- */
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Plan Name</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Price & Billing</th>
                <th className="px-5 py-3.5 text-center">Benefits</th>
                <th className="px-5 py-3.5 text-center">Enrolled Athletes</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredPlans.map((plan) => {
                const enrolled = enrolledCountByPlan[plan.id] || 0;
                return (
                  <tr
                    key={plan.id}
                    className={`hover:bg-muted/20 transition-colors ${
                      plan.isDeleted
                        ? "opacity-75 bg-muted/20"
                        : plan.popular
                          ? "bg-amber-500/[0.03]"
                          : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm font-display">
                          {plan.name}
                        </span>
                        {plan.isDeleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive border border-destructive/30">
                            <Archive size={9} />
                            Archived
                          </span>
                        ) : plan.popular ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                            <Sparkles size={10} />
                            {plan.badge || "Featured"}
                          </span>
                        ) : (
                          plan.badge && (
                            <span className="rounded-full bg-accent/20 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/30">
                              {plan.badge}
                            </span>
                          )
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{plan.id}</span>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-foreground">
                      {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground text-sm font-display">
                        {plan.formattedPrice}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {plan.period}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center text-xs font-semibold text-muted-foreground">
                      {plan.features?.length || 0} features
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                        {enrolled} Athletes
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {plan.isDeleted ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                          Archived
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(plan.id)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold border cursor-pointer transition-all ${
                            plan.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                          title={`Click to ${plan.status === "Active" ? "deactivate" : "activate"}`}
                        >
                          {plan.status}
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {plan.isDeleted ? (
                          <>
                            <button
                              onClick={() => handleRestore(plan.id, plan.name)}
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                              title="Restore Plan to Active"
                            >
                              <RotateCcw size={15} />
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(plan.id, plan.name)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(plan)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Plan"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(plan.id, plan.name)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                              title="Archive Plan (Soft Delete)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- PROPER, USER-FRIENDLY CREATE / EDIT PLAN MODAL (PORTALED TO BODY TO PREVENT HEADER OVERLAP) --- */}
      <DialogPrimitive.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <DialogPrimitive.Content
            aria-describedby="plan-modal-description"
            className="fixed left-[50%] top-[50%] z-[100] w-[95vw] max-w-2xl max-h-[88vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
          >
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-6 py-4 sm:px-7 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    form.popular
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-foreground/10 text-foreground border border-border"
                  }`}
                >
                  {form.popular ? <Sparkles size={20} /> : <CreditCard size={20} />}
                </div>
                <div>
                  <DialogPrimitive.Title className="text-lg font-bold text-foreground font-display">
                    {editingPlan ? `Edit ${editingPlan.name}` : "Create Membership Plan"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description id="plan-modal-description" className="text-xs text-muted-foreground">
                    Configure tier pricing, privileges, and status dynamically mapped across the gym.
                  </DialogPrimitive.Description>
                </div>
              </div>
              <DialogPrimitive.Close
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable Form Body with custom-scrollbar */}
            <form
              id="plan-form"
              onSubmit={handleSave}
              className="flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-7 space-y-5 custom-scrollbar text-xs"
            >
              {/* SECTION 1: Plan Identity & Status */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <Tag size={15} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Plan Identity & Status
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quarterly Pro, Annual Champion"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Status *
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Promotional Tag / Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BEST VALUE, VIP ACCESS"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Pricing & Billing Structure */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <IndianRupee size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Pricing & Billing Structure
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Price (₹ INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="18000"
                        value={form.price}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setForm({
                            ...form,
                            price: p,
                            billing: `Billed ₹${p.toLocaleString("en-IN")}`,
                          });
                        }}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-8 pr-3.5 text-sm font-bold text-foreground focus:border-foreground focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Period Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /mo, /3mo, /yr"
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                      Billing Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Billed every 3 months"
                      value={form.billing}
                      onChange={(e) => setForm({ ...form, billing: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Featured / Most Popular Tier Showcase */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                  form.popular
                    ? "border-amber-500/80 bg-gradient-to-r from-amber-500/[0.12] via-amber-500/[0.05] to-transparent ring-2 ring-amber-500/30 shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]"
                    : "border-border/80 bg-muted/20 hover:border-amber-500/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                        form.popular
                          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Sparkles size={20} className={form.popular ? "fill-black" : ""} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-foreground">
                          Highlight as Featured / Most Popular Tier
                        </span>
                        {form.popular && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Prominently highlights this plan with a glowing border and prime visibility
                        in the member registration form and landing page.
                      </p>
                    </div>
                  </div>

                  {/* iOS Style Glowing Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, popular: !form.popular })}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.popular
                        ? "bg-amber-500 shadow-md shadow-amber-500/40"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        form.popular ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SECTION 4: Plan Benefits & Features */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Included Privileges & Benefits
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {form.features.length} Features
                  </span>
                </div>

                {/* Add Feature Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type custom benefit (e.g. Dedicated coach session)..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 font-bold text-background hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Configured Plan Features:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {form.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 text-xs text-foreground group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Remove benefit"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {form.features.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic py-3 text-center border border-dashed border-border rounded-xl">
                        No benefits added yet. Type a benefit above and click Add.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Fixed Sticky Footer */}
            <div className="flex items-center justify-end border-t border-border/80 bg-muted/20 px-6 py-4 sm:px-7 shrink-0">
              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2.5 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button
                  type="submit"
                  form="plan-form"
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                >
                  <Check size={16} />
                  <span>{editingPlan ? "Save Changes" : "Create Plan"}</span>
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
