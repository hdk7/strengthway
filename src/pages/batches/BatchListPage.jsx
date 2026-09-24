/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Clock,
  Calendar,
  Users,
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Eye,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches, createBatch, updateBatch, deleteBatch } from "@/lib/batchesService";
import { InputField, SelectField, TextareaField, TimePickerField } from "@/components/form";

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
  const [daysFilter, setDaysFilter] = useState("ALL"); // "ALL" | "MWF" | "TTS" | "CUSTOM"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "Active" | "Inactive"
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal State for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
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

  useEffect(() => {
    loadBatches();
    window.addEventListener("storage", loadBatches);
    return () => window.removeEventListener("storage", loadBatches);
  }, []);

  const loadBatches = () => {
    setBatches(getBatches());
  };

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (daysFilter !== "ALL" && b.daysPattern !== daysFilter) return false;
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
  }, [batches, daysFilter, statusFilter, searchQuery]);

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
    if (window.confirm(`Are you sure you want to remove ${name} from the training schedule?`)) {
      deleteBatch(id);
      loadBatches();
      toast.success(`${name} has been removed.`);
    }
  };

  const handleSaveBatch = (e) => {
    e.preventDefault();
    if (form.daysPattern === "CUSTOM" && (!form.customDays || form.customDays.length === 0)) {
      toast.error("Please select at least one day for the custom schedule.");
      return;
    }
    try {
      if (editingBatch) {
        const updated = updateBatch(editingBatch.id, form);
        if (updated) {
          toast.success(`${updated.name} updated successfully!`);
        }
      } else {
        const created = createBatch(form);
        toast.success(`${created.name} created successfully!`);
      }
      loadBatches();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save batch details.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gym Batches
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Overview of all scheduled training batches, active slots, and capacity distribution.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Batches</span>
            <Boxes size={18} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{stats.total}</span>
            <span className="text-xs text-emerald-400 font-semibold">{stats.active} Active</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Operating time slots</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Enrolled Members</span>
            <Users size={18} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.totalEnrolled}</div>
          <p className="mt-1 text-xs text-muted-foreground">Across all batches</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Capacity</span>
            <UserCheck size={18} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{stats.totalCapacity}</span>
            <span className="text-xs text-muted-foreground">Max Pax</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across all daily slots</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        {/* Days Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground px-1">Days:</span>
          <button
            onClick={() => setDaysFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              daysFilter === "ALL"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setDaysFilter("MWF")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              daysFilter === "MWF"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Mon • Wed • Fri (MWF)
          </button>
          <button
            onClick={() => setDaysFilter("TTS")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              daysFilter === "TTS"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Tue • Thu • Sat (TTS)
          </button>
          <button
            onClick={() => setDaysFilter("CUSTOM")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              daysFilter === "CUSTOM"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Right side controls: Search, Status, View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 sm:w-48 md:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* View Toggle */}
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

      {/* Batches Display: Grid or Table View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((b) => {
            const cap = b.maxPax || 28;
            const pax = b.currentPax || 0;
            const pct = Math.min(100, Math.round((pax / cap) * 100));
            const remaining = Math.max(0, cap - pax);

            return (
              <div
                key={b.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{b.name}</h3>
                      <p className="text-xs text-muted-foreground">{b.daysLabel}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
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
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock size={16} className="text-muted-foreground shrink-0" />
                    <span>{b.timingLabel}</span>
                  </div>

                  {/* Capacity Gauge */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Capacity Occupancy</span>
                      <span className="font-bold text-foreground">
                        {pax} / {cap} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
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
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">Assigned Trainers:</span>
                    <span className="font-semibold text-foreground">
                      {b.trainerIds?.length || 2} Trainers
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/batches/${b.id}`)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent/60 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                  >
                    <span>View Details & Schedule</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors cursor-pointer"
                    title="Edit Batch"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(b.id, b.name)}
                    className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                    title="Delete Batch"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Timing</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5 text-center">Max Pax</th>
                <th className="px-5 py-3.5 text-center">Enrolled</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{b.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">({b.id})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground/70" />
                      <span>{b.startTime || b.timingLabel}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-lg bg-accent/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                      {b.daysPattern === "MWF"
                        ? "M W F"
                        : b.daysPattern === "TTS"
                          ? "T T S"
                          : b.daysList
                              ?.map((d) => SHORT_DAYS_MAP[d] || d.slice(0, 3))
                              .join(" • ") || b.daysPattern}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-foreground">{b.maxPax}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-semibold text-emerald-400">{b.currentPax || 0}</span>
                    <span className="text-xs text-muted-foreground"> / {b.maxPax}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
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
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/batches/${b.id}`)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                        title="View Details & Schedule"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(b.id, b.name)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredBatches.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Boxes size={36} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No Batches Found</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {searchQuery
              ? "Try adjusting your search query or filters."
              : "Get started by creating a new gym batch."}
          </p>
        </div>
      )}

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
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
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
                  className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 cursor-pointer"
                >
                  {editingBatch ? "Save Changes" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { BatchListPage as BatchesPage };
export default BatchListPage;
