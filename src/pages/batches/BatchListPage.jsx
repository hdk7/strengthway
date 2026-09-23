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
} from "lucide-react";
import { toast } from "sonner";
import { getBatches, createBatch, updateBatch } from "@/lib/batchesService";

export default function BatchListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [daysFilter, setDaysFilter] = useState("ALL"); // "ALL" | "MWF" | "TTS"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "Active" | "Inactive"

  // Create Batch Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    name: "",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    daysPattern: "MWF",
    maxPax: 28,
    status: "Active",
    description: "",
  });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = () => {
    setBatches(getBatches());
  };

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (daysFilter !== "ALL" && b.daysPattern !== daysFilter) return false;
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      return true;
    });
  }, [batches, daysFilter, statusFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = batches.length;
    const active = batches.filter((b) => b.status === "Active").length;
    const totalCapacity = batches.reduce((acc, b) => acc + (b.maxPax || 28), 0);
    const totalEnrolled = batches.reduce((acc, b) => acc + (b.currentPax || 0), 0);
    const avgUtilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    return { total, active, totalCapacity, totalEnrolled, avgUtilization };
  }, [batches]);

  const handleCreateBatch = (e) => {
    e.preventDefault();
    try {
      const created = createBatch(newBatchForm);
      setBatches(getBatches());
      setIsCreateOpen(false);
      toast.success(`${created.name} created successfully!`);
      setNewBatchForm({
        name: "",
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        daysPattern: "MWF",
        maxPax: 28,
        status: "Active",
        description: "",
      });
    } catch {
      toast.error("Failed to create new batch.");
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
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all cursor-pointer shadow-sm"
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
          <p className="mt-1 text-xs text-muted-foreground">Across 6 daily slots</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Utilization</span>
            <Sparkles size={18} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{stats.avgUtilization}%</span>
            <span className="text-xs text-muted-foreground">Avg occupancy</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${stats.avgUtilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground px-2">Days:</span>
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground px-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Batches Grid */}
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
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {b.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{b.daysLabel}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {b.status}
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
                        pct >= 90
                          ? "bg-red-500"
                          : pct >= 75
                          ? "bg-amber-500"
                          : "bg-emerald-500"
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

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-border">
                <button
                  onClick={() => navigate(`/admin/batches/${b.id}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent/60 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                >
                  <span>View Details & Schedule</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- CREATE BATCH MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Create New Batch</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH 7"
                  value={newBatchForm.name}
                  onChange={(e) =>
                    setNewBatchForm({ ...newBatchForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newBatchForm.startTime}
                    onChange={(e) =>
                      setNewBatchForm({ ...newBatchForm, startTime: e.target.value })
                    }
                    placeholder="06:00 AM"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newBatchForm.endTime}
                    onChange={(e) =>
                      setNewBatchForm({ ...newBatchForm, endTime: e.target.value })
                    }
                    placeholder="07:00 AM"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Days Pattern
                  </label>
                  <select
                    value={newBatchForm.daysPattern}
                    onChange={(e) =>
                      setNewBatchForm({ ...newBatchForm, daysPattern: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="MWF">MWF (Mon • Wed • Fri)</option>
                    <option value="TTS">TTS (Tue • Thu • Sat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Max Pax
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newBatchForm.maxPax}
                    onChange={(e) =>
                      setNewBatchForm({ ...newBatchForm, maxPax: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Workout style or target group..."
                  value={newBatchForm.description}
                  onChange={(e) =>
                    setNewBatchForm({ ...newBatchForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 cursor-pointer"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
