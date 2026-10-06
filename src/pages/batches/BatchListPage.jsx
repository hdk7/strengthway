/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Clock,
  Users,
  UserCheck,
  Plus,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches, createBatch, updateBatch, deleteBatch } from "@/lib/batchesService";
import { getMembers } from "@/lib/membersService";
import { getTrainers } from "@/lib/trainersService";
import { Pagination } from "@/components/table";
import { BatchFormModal } from "./components/BatchFormModal";
import { BatchDeleteModal } from "./components/BatchDeleteModal";
import { BatchGridCard } from "./components/BatchGridCard";
import { BatchTableRow } from "./components/BatchTableRow";

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
              {paginatedBatches.map((b) => (
                <BatchGridCard
                  key={b.id}
                  batch={b}
                  onView={(batchId) => navigate(`/admin/batches/${batchId}`)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteBatch}
                />
              ))}
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
                  <BatchTableRow
                    key={b.id}
                    batch={b}
                    onView={(batchId) => navigate(`/admin/batches/${batchId}`)}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteBatch}
                  />
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
      <BatchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBatch={editingBatch}
        form={form}
        setForm={setForm}
        handleSaveBatch={handleSaveBatch}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <BatchDeleteModal
        batchToDelete={batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirmDelete={async () => {
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
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export { BatchListPage as BatchesPage };
export default BatchListPage;
