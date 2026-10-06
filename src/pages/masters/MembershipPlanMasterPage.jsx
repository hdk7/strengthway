/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  softDeleteMembershipPlan,
  restoreMembershipPlan,
  permanentDeleteMembershipPlan,
  toggleMembershipPlanStatus,
} from "@/lib/membershipPlans";
import { getMembers } from "@/lib/membersService";
import { Pagination } from "@/components/table";
import { MembershipPlanModal } from "./components/MembershipPlanModal";
import { MembershipPlanCard } from "./components/MembershipPlanCard";
import { MembershipPlanTableRow } from "./components/MembershipPlanTableRow";
import { MembershipPlanStats } from "./components/MembershipPlanStats";
import { MembershipPlanToolbar } from "./components/MembershipPlanToolbar";

export default function MembershipPlanMasterPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansData, membersData] = await Promise.all([
        getMembershipPlans(true, true),
        getMembers(true).catch(() => []),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error("Failed to load membership plans:", err);
      setError(err.message || "Failed to load membership plans from server.");
      toast.error("Failed to load membership plans from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map enrolled members count per plan
  const enrolledCountByPlan = useMemo(() => {
    const counts = {};
    if (Array.isArray(members)) {
      members.forEach((m) => {
        if (!m.isDeleted && m.membershipPlan) {
          const planKey = m.membershipPlan.id || m.membershipPlan.name;
          counts[planKey] = (counts[planKey] || 0) + 1;
          if (m.membershipPlan.id) {
            counts[m.membershipPlan.id] = (counts[m.membershipPlan.id] || 0) + 1;
          }
        }
      });
    }
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

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedPlans = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, safePage, pageSize]);

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

  const handleToggleStatus = async (id) => {
    try {
      const updated = await toggleMembershipPlanStatus(id);
      if (updated) {
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success(`Plan marked as ${updated.status}.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle plan status.");
    }
  };

  const handleDelete = async (id, name) => {
    const enrolled = enrolledCountByPlan[id] || 0;
    const warningMsg =
      enrolled > 0
        ? `Warning: ${enrolled} member(s) are currently enrolled in "${name}". Are you sure you want to archive (soft delete) this plan? It will be safely archived without affecting existing members.`
        : `Are you sure you want to archive (soft delete) "${name}"? You can restore it anytime from the Archived tab.`;

    if (window.confirm(warningMsg)) {
      try {
        const updated = await softDeleteMembershipPlan(id);
        if (updated) {
          setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        } else {
          await loadData();
        }
        toast.success(`"${name}" plan archived.`);
      } catch (err) {
        toast.error(err.message || "Failed to archive plan.");
      }
    }
  };

  const handleRestore = async (id, name) => {
    try {
      const restored = await restoreMembershipPlan(id);
      if (restored) {
        setPlans((prev) => prev.map((p) => (p.id === id ? restored : p)));
      } else {
        await loadData();
      }
      toast.success(`"${name}" restored to Active status.`);
    } catch (err) {
      toast.error(err.message || "Failed to restore plan.");
    }
  };

  const handlePermanentDelete = async (id, name) => {
    const enrolled = enrolledCountByPlan[id] || 0;
    const warningMsg =
      enrolled > 0
        ? `CAUTION: ${enrolled} member(s) are enrolled in "${name}". Permanently deleting will completely erase this plan from database. Are you sure?`
        : `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;

    if (window.confirm(warningMsg)) {
      try {
        await permanentDeleteMembershipPlan(id);
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast.success(`"${name}" permanently deleted.`);
      } catch (err) {
        toast.error(err.message || "Failed to delete plan.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }
    if (Number(form.price) < 0) {
      toast.error("Price must be a valid positive amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        const updated = await updateMembershipPlan(editingPlan.id, form);
        if (updated) {
          setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
          toast.success(`${updated.name} updated successfully!`);
        }
      } else {
        const created = await createMembershipPlan(form);
        setPlans((prev) => [...prev, created]);
        toast.success(`${created.name} plan created!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save membership plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
            Membership Plan
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configure gym commitment tiers, pricing, and benefits mapped dynamically across member
            registration and the landing page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="shrink-0 flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1 font-semibold text-destructive-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <MembershipPlanStats stats={stats} />

      {/* Toolbar: Search, Filters & View Toggle */}
      <MembershipPlanToolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content: Loading Skeleton, Grid or Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 p-3 sm:p-4 no-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-5 w-32 bg-muted rounded-lg" />
                      <div className="h-4 w-14 bg-muted rounded-full" />
                    </div>
                    <div className="h-8 w-24 bg-muted rounded-lg" />
                    <div className="h-3 w-40 bg-muted rounded" />
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="h-3 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-5/6 bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-6 w-16 bg-muted rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPlans.length === 0 ? (
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
              {paginatedPlans.map((plan) => (
                <MembershipPlanCard
                  key={plan.id}
                  plan={plan}
                  enrolled={enrolledCountByPlan[plan.id] || 0}
                  onToggleStatus={handleToggleStatus}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
        /* --- TABLE VIEW WITH SEPARATED ROWS & INDEPENDENT SCROLL --- */
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Plan ID</th>
                  <th className="py-2.5 px-4 sm:px-5">Plan Name</th>
                  <th className="py-2.5 px-4 sm:px-5">Duration</th>
                  <th className="py-2.5 px-4 sm:px-5">Price & Billing</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Benefits</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Enrolled Athletes</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Status</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {paginatedPlans.map((plan) => (
                  <MembershipPlanTableRow
                    key={plan.id}
                    plan={plan}
                    enrolled={enrolledCountByPlan[plan.id] || 0}
                    onToggleStatus={handleToggleStatus}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Pinned Bottom Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filteredPlans.length}
        pageSize={pageSize}
        itemName="plans"
        compact
        className="shrink-0 mt-auto"
      />

      {/* Create / Edit Plan Modal */}
      <MembershipPlanModal
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        editingPlan={editingPlan}
        form={form}
        setForm={setForm}
        featureInput={featureInput}
        setFeatureInput={setFeatureInput}
        handleAddFeature={handleAddFeature}
        handleRemoveFeature={handleRemoveFeature}
        handleSave={handleSave}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
