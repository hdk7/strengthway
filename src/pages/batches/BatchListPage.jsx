/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Clock,
  Users,
  UserCheck,
  Plus,
  ArrowRight,
  X,
  Edit3,
  Trash2,
  Eye,
  Search,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches, createBatch, updateBatch, deleteBatch } from "@/lib/batchesService";
import { getMembers } from "@/lib/membersService";
import { getTrainers } from "@/lib/trainersService";
import { InputField, SelectField, TextareaField, TimePickerField } from "@/components/form";
import { Pagination } from "@/components/table";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS_MAP = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const SHORT_DAYS_MAP = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function BatchListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "Active" | "Inactive"
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal State for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [form, setForm] = useState({
    name: "",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    customDays: [],
    maxPax: 28,
    status: "Active",
    description: "",
  });

  const loadBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, allMembers, allTrainers] = await Promise.all([
        getBatches(),
        getMembers(true).catch(() => []),
        getTrainers().catch(() => []),
      ]);

      const batchesList = Array.isArray(data) ? data : [];
      const memList = Array.isArray(allMembers) ? allMembers : [];
      const trnList = Array.isArray(allTrainers) ? allTrainers : [];

      const synchronized = batchesList.map((b) => {
        const assignedMembers = memList.filter(
          (m) => !m.isDeleted && (m.batchId === b.id || m.schedule?.batchId === b.id)
        );
        const assignedTrainers = trnList.filter(
          (t) =>
            !t.isDeleted &&
            (t.batchIds?.includes(b.id) ||
              (Array.isArray(b.trainerIds) && b.trainerIds.includes(t.id)))
        );

        const currentPax = memList.length > 0 ? assignedMembers.length : (b.currentPax || 0);
        const trainerIds =
          trnList.length > 0
            ? assignedTrainers.map((t) => t.id)
            : Array.isArray(b.trainerIds)
              ? b.trainerIds
              : [];

        return {
          ...b,
          currentPax,
          trainerIds,
          assignedTrainersList: assignedTrainers,
        };
      });

      setBatches(synchronized);
    } catch (err) {
      console.error("Error loading batches:", err);
      setError(err?.message || "Failed to load batches from backend.");
      toast.error("Failed to load batches.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = b.name?.toLowerCase().includes(q);
        const matchTiming =
          b.timingLabel?.toLowerCase().includes(q) || b.startTime?.toLowerCase().includes(q);
        const matchDays =
          b.daysLabel?.toLowerCase().includes(q) || b.daysPattern?.toLowerCase().includes(q);
        const matchId = b.id?.toLowerCase().includes(q);
        if (!matchName && !matchTiming && !matchDays && !matchId) return false;
      }
      return true;
    });
  }, [batches, statusFilter, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedBatches = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, safePage, pageSize]);

  // KPIs
  const stats = useMemo(() => {
    const total = batches.length;
    const active = batches.filter((b) => b.status === "Active").length;
    const totalCapacity = batches.reduce((acc, b) => acc + (b.maxPax || 28), 0);
    const totalEnrolled = batches.reduce((acc, b) => acc + (b.currentPax || 0), 0);
    const avgUtilization =
      totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    return { total, active, totalCapacity, totalEnrolled, avgUtilization };
  }, [batches]);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setForm({
      name: `BATCH ${batches.length + 1}`,
      startTime: "06:00 AM",
      endTime: "07:00 AM",
      daysPattern: "MWF",
      daysLabel: "Monday • Wednesday • Friday",
      daysList: ["Monday", "Wednesday", "Friday"],
      customDays: [],
      maxPax: 28,
      status: "Active",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    const customDays =
      batch.daysPattern === "CUSTOM"
        ? (batch.daysList || []).map((d) => SHORT_DAYS_MAP[d] || d.slice(0, 3))
        : [];
    setForm({
      name: batch.name,
      startTime: batch.startTime || "06:00 AM",
      endTime: batch.endTime || "07:00 AM",
      daysPattern: batch.daysPattern || "MWF",
      daysLabel: batch.daysLabel || "Monday • Wednesday • Friday",
      daysList: batch.daysList || ["Monday", "Wednesday", "Friday"],
      customDays,
      maxPax: batch.maxPax || 28,
      status: batch.status || "Active",
      description: batch.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteBatch = (id, name) => {
    setBatchToDelete({ id, name });
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (form.daysPattern === "CUSTOM" && (!form.customDays || form.customDays.length === 0)) {
      toast.error("Please select at least one day for the custom schedule.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBatch) {
        const updated = await updateBatch(editingBatch.id, form);
        toast.success(`${updated?.name || form.name} updated successfully!`);
      } else {
        const created = await createBatch(form);
        toast.success(`${created?.name || form.name} created successfully!`);
      }
      setIsModalOpen(false);
      await loadBatches();
    } catch (err) {
      toast.error(err?.message || "Failed to save batch details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-display">
            Batch Schedule
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Overview of all scheduled training batches, active slots, and capacity distribution.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-background hover:opacity-90 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus size={15} />
          Create Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 shrink-0">
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Batches</span>
            <Boxes size={16} />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{stats.total}</span>
            <span className="text-xs text-emerald-400 font-semibold">{stats.active} Active</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Operating time slots</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Enrolled Members</span>
            <Users size={16} />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{stats.totalEnrolled}</div>
          <p className="text-[11px] text-muted-foreground">Across all batches</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Capacity</span>
            <UserCheck size={16} />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{stats.totalCapacity}</span>
            <span className="text-xs text-muted-foreground">Max Pax</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Across all daily slots</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-xs shrink-0">
        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search batch by name, timing, or days..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>

        {/* Right side controls: Status, View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-background">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadBatches}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-0.5 text-xs font-semibold hover:bg-destructive/20 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area - Expands vertically to anchor pagination to the bottom */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        {isLoading ? (
          <div className="flex-1 min-h-0 p-4 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs animate-pulse space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-28 rounded-md bg-muted" />
                      <div className="h-3 w-40 rounded-md bg-muted/60" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-muted" />
                  </div>
                  <div className="h-4 w-32 rounded-md bg-muted/60" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-md bg-muted/40" />
                    <div className="h-2 w-full rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center">
            <Boxes size={40} className="text-muted-foreground/40 mb-2.5" />
            <h3 className="text-sm font-bold text-foreground">No Batches Found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {searchQuery
                ? `No training batches match "${searchQuery}".`
                : "No batches are currently configured in the system."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus size={13} /> Create First Batch
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="overflow-y-auto flex-1 min-h-0 p-3.5 no-scrollbar">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedBatches.map((b) => {
                const cap = b.maxPax || 28;
                const pax = b.currentPax || 0;
                const pct = Math.min(100, Math.round((pax / cap) * 100));
                const remaining = Math.max(0, cap - pax);

                return (
                  <div
                    key={b.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/30 hover:shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Header & Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold tracking-tight text-foreground">{b.name}</h3>
                          <p className="text-xs text-muted-foreground">{b.daysLabel}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                            b.status === "Inactive"
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {b.status !== "Inactive" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                          {b.status || "Active"}
                        </span>
                      </div>

                      {/* Timing */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                        <Clock size={15} className="text-muted-foreground shrink-0" />
                        <span>{b.timingLabel}</span>
                      </div>

                      {/* Capacity Gauge */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Capacity Occupancy</span>
                          <span className="font-bold text-foreground">
                            {pax} / {cap}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {remaining} seats left for registration
                        </p>
                      </div>

                      {/* Trainers */}
                      <div className="flex items-center justify-between border-t border-border/80 pt-2.5 text-xs">
                        <span className="text-muted-foreground">Assigned Trainers:</span>
                        <span className="font-semibold text-foreground">
                          {Array.isArray(b.trainerIds) ? b.trainerIds.length : 0} Trainer
                          {b.trainerIds?.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-2.5 border-t border-border flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/batches/${b.id}`)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                      >
                        <span>View Details</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(b.id, b.name)}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Batch ID</th>
                  <th className="py-2.5 px-4 sm:px-5">Batch Name</th>
                  <th className="py-2.5 px-4 sm:px-5">Timing</th>
                  <th className="py-2.5 px-4 sm:px-5">Days</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Max Pax</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Enrolled</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Status</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {paginatedBatches.map((b) => (
                  <tr key={b.id} className="group transition-all duration-150 hover:translate-y-[-1px]">
                    {/* Batch ID */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40">
                        #{b.id?.length > 7 ? b.id.slice(-6).toUpperCase() : b.id}
                      </span>
                    </td>

                    {/* Batch Name */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div
                        onClick={() => navigate(`/admin/batches/${b.id}`)}
                        className="font-bold text-foreground text-xs sm:text-sm hover:text-accent hover:underline cursor-pointer transition-colors"
                      >
                        {b.name}
                      </div>
                    </td>

                    {/* Timing */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Clock size={12} className="text-amber-600/80 dark:text-amber-400 shrink-0" />
                        <span>{b.startTime || b.timingLabel}</span>
                      </div>
                    </td>

                    {/* Days */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {b.daysPattern === "MWF"
                          ? "M W F"
                          : b.daysPattern === "TTS"
                            ? "T T S"
                            : b.daysList
                                ?.map((d) => SHORT_DAYS_MAP[d] || d.slice(0, 3))
                                .join(" • ") || b.daysPattern}
                      </span>
                    </td>

                    {/* Max Pax */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center font-bold text-foreground">
                      {b.maxPax}
                    </td>

                    {/* Enrolled */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{b.currentPax || 0}</span>
                      <span className="text-xs text-muted-foreground"> / {b.maxPax}</span>
                    </td>

                    {/* Status */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          b.status === "Inactive"
                            ? "bg-muted/60 text-muted-foreground border-border/60"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${b.status === "Inactive" ? "bg-muted-foreground" : "bg-emerald-500"}`} />
                        {b.status || "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/batches/${b.id}`)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="View Details & Schedule"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="Edit Batch"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(b.id, b.name)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Delete Batch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pinned Bottom Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredBatches.length}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        itemLabel="batches"
        compact
        className="shrink-0 mt-auto"
      />

      {/* --- CREATE / EDIT BATCH MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingBatch ? `Edit ${editingBatch.name}` : "Create New Batch"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-sm">
              <InputField
                label="Batch Name"
                placeholder="e.g. BATCH 7"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                size="sm"
                labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <TimePickerField
                  label="Start Time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  size="sm"
                  labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                  required
                />
                <TimePickerField
                  label="End Time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  size="sm"
                  labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Days Pattern"
                  value={form.daysPattern}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CUSTOM") {
                      setForm({
                        ...form,
                        daysPattern: "CUSTOM",
                        customDays: [],
                        daysList: [],
                        daysLabel: "",
                      });
                    } else if (val === "TTS") {
                      setForm({
                        ...form,
                        daysPattern: "TTS",
                        daysLabel: "Tuesday • Thursday • Saturday",
                        daysList: ["Tuesday", "Thursday", "Saturday"],
                        customDays: [],
                      });
                    } else {
                      setForm({
                        ...form,
                        daysPattern: "MWF",
                        daysLabel: "Monday • Wednesday • Friday",
                        daysList: ["Monday", "Wednesday", "Friday"],
                        customDays: [],
                      });
                    }
                  }}
                  size="sm"
                  labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                  options={[
                    { value: "MWF", label: "MWF (Mon • Wed • Fri)" },
                    { value: "TTS", label: "TTS (Tue • Thu • Sat)" },
                    { value: "CUSTOM", label: "Custom Days" },
                  ]}
                />

                <InputField
                  type="number"
                  min="1"
                  max="100"
                  label="Max Pax"
                  value={form.maxPax}
                  onChange={(e) => setForm({ ...form, maxPax: e.target.value })}
                  size="sm"
                  labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                  required
                />
              </div>

              {form.daysPattern === "CUSTOM" && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Training Days
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {(form.customDays || []).length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {ALL_DAYS.map((day) => {
                      const active = (form.customDays || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const cur = form.customDays || [];
                            const next = cur.includes(day)
                              ? cur.filter((d) => d !== day)
                              : [...cur, day];
                            const ordered = ALL_DAYS.filter((d) => next.includes(d));
                            const fullList = ordered.map((d) => FULL_DAYS_MAP[d]);
                            setForm({
                              ...form,
                              customDays: ordered,
                              daysList: fullList,
                              daysLabel: fullList.join(" • "),
                            });
                          }}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                            active
                              ? "bg-foreground text-background border-foreground shadow-sm"
                              : "bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <SelectField
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                size="sm"
                labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
              />

              <TextareaField
                rows={2}
                label="Description"
                placeholder="Workout style or target group..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                size="sm"
                labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isSubmitting
                    ? "Saving..."
                    : editingBatch
                      ? "Save Changes"
                      : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-full bg-destructive/10 grid place-items-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Batch</h3>
                <p className="text-xs text-muted-foreground">Permanent action</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <strong className="text-foreground">{batchToDelete.name}</strong> from the training schedule? All associated floor class records will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setBatchToDelete(null)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await deleteBatch(batchToDelete.id);
                    toast.success(`${batchToDelete.name} has been removed.`);
                    setBatchToDelete(null);
                    await loadBatches();
                  } catch (err) {
                    toast.error(err?.message || `Failed to remove ${batchToDelete.name}.`);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                <span>{isSubmitting ? "Deleting..." : "Delete Batch"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { BatchListPage as BatchesPage };
export default BatchListPage;
