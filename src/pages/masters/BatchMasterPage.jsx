/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  X,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from "@/lib/batchesService";

export default function BatchMasterPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [patternFilter, setPatternFilter] = useState("ALL"); // "ALL" | "MWF" | "TTS"

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState({
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
      if (patternFilter !== "ALL" && b.daysPattern !== patternFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name?.toLowerCase().includes(q) ||
        b.timingLabel?.toLowerCase().includes(q) ||
        b.daysPattern?.toLowerCase().includes(q)
      );
    });
  }, [batches, patternFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = batches.length;
    const active = batches.filter((b) => b.status === "Active").length;
    const totalCap = batches.reduce((acc, b) => acc + (b.maxPax || 28), 0);
    const totalPax = batches.reduce((acc, b) => acc + (b.currentPax || 0), 0);
    return { total, active, totalCap, totalPax };
  }, [batches]);

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setForm({
      name: `BATCH ${batches.length + 1}`,
      startTime: "06:00 AM",
      endTime: "07:00 AM",
      daysPattern: "MWF",
      maxPax: 28,
      status: "Active",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setForm({
      name: batch.name,
      startTime: batch.startTime || "06:00 AM",
      endTime: batch.endTime || "07:00 AM",
      daysPattern: batch.daysPattern || "MWF",
      maxPax: batch.maxPax || 28,
      status: batch.status || "Active",
      description: batch.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        const updated = updateBatch(editingBatch.id, form);
        if (updated) {
          toast.success(`${updated.name} updated successfully.`);
        }
      } else {
        const created = createBatch(form);
        toast.success(`${created.name} created successfully.`);
      }
      loadBatches();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save batch.");
    }
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteBatch(id);
      loadBatches();
      toast.success(`${name} deleted.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Batch Master
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Configure master gym batches, time slots, days distribution, and maximum capacities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Add Batch
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Total Batches</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Active Slots</span>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{stats.active}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Total Capacity</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{stats.totalCap} Pax</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Total Enrolled</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{stats.totalPax} Trainees</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground px-2">Days:</span>
          <button
            onClick={() => setPatternFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              patternFilter === "ALL"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPatternFilter("MWF")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              patternFilter === "MWF"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            M W F
          </button>
          <button
            onClick={() => setPatternFilter("TTS")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              patternFilter === "TTS"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            T T S
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Master Table Matching Requirement Table 1 */}
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
                    {b.daysPattern === "MWF" ? "M W F" : b.daysPattern === "TTS" ? "T T S" : b.daysPattern}
                  </span>
                </td>
                <td className="px-5 py-4 text-center font-bold text-foreground">{b.maxPax}</td>
                <td className="px-5 py-4 text-center">
                  <span className="font-semibold text-emerald-400">
                    {b.currentPax || 0}
                  </span>
                  <span className="text-xs text-muted-foreground"> / {b.maxPax}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/batches/${b.id}`)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                      title="View Details"
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
                      onClick={() => handleDelete(b.id, b.name)}
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

      {/* --- ADD / EDIT BATCH MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
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

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    placeholder="6:00 AM"
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
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    placeholder="7:00 AM"
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
                    value={form.daysPattern}
                    onChange={(e) => setForm({ ...form, daysPattern: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="MWF">M W F (Mon • Wed • Fri)</option>
                    <option value="TTS">T T S (Tue • Thu • Sat)</option>
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
                    value={form.maxPax}
                    onChange={(e) => setForm({ ...form, maxPax: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

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
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
