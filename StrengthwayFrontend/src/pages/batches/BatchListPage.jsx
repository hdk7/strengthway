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
import { DataTable, Pagination } from "@/components/table";
import {
  batchSchema,
  validateWithYup,
  validateFieldWithYup,
} from "@/lib/validation";
import { BatchFormModal } from "./components/BatchFormModal";
import { BatchDeleteModal } from "./components/BatchDeleteModal";
import { BatchGridCard } from "./components/BatchGridCard";
import { BatchTableRow } from "./components/BatchTableRow";
import { isAdmin, isMember, isTrainer } from "@/auth/currentUser";
import { KpiCard, SearchInput } from "@/components/ui";

const BATCH_COLUMNS = [
  { header: "Batch ID", width: "w-28" },
  { header: "Batch Name" },
  { header: "Timing" },
  { header: "Days" },
  { header: "Max Pax", align: "center" },
  { header: "Enrolled", align: "center" },
  { header: "Status", align: "center" },
  { header: "Actions", align: "right" },
];

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

      if (isMember() && synchronized.length > 0) {
        navigate(`/member/batches/${synchronized[0].id}`, { replace: true });
        return;
      }
    } catch (err) {
      console.error("Error loading batches:", err);
      setError(err?.message || "Failed to load batches from backend.");
      toast.error("Failed to load batches.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

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
  const pageSize = 12;

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

  const [errors, setErrors] = useState({});

  const handleFieldChange = (name, value) => {
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (errors[name]) {
      const fieldError = validateFieldWithYup(batchSchema, name, updated);
      setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }));
    }
    if (name === "daysPattern" && value !== "CUSTOM" && errors.customDays) {
      setErrors((prev) => ({ ...prev, customDays: undefined }));
    }
  };

  const handleFieldBlur = (name) => {
    const fieldError = validateFieldWithYup(batchSchema, name, form);
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }));
  };

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setForm({
      name: "",
      startTime: "",
      endTime: "",
      daysPattern: "MWF",
      daysLabel: "Monday • Wednesday • Friday",
      daysList: ["Monday", "Wednesday", "Friday"],
      customDays: [],
      capacity: 28,
      status: "Active",
      description: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    const customDays =
      batch.daysPattern === "CUSTOM"
        ? (batch.daysList || []).map((d) => SHORT_DAYS_MAP[d] || d.slice(0, 3))
        : [];
    setForm({
      name: batch.name || "",
      startTime: batch.startTime || "",
      endTime: batch.endTime || "",
      daysPattern: batch.daysPattern || "MWF",
      daysLabel: batch.daysLabel || "Monday • Wednesday • Friday",
      daysList: batch.daysList || ["Monday", "Wednesday", "Friday"],
      customDays,
      capacity: batch.capacity ?? batch.maxPax ?? 28,
      status: batch.status || "Active",
      description: batch.description || "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteBatch = (id, name) => {
    setBatchToDelete({ id, name });
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    const capacityVal = form.capacity !== "" && form.capacity !== undefined ? Number(form.capacity) : (form.maxPax !== "" && form.maxPax !== undefined ? Number(form.maxPax) : 28);
    const validationErrors = validateWithYup(batchSchema, {
      ...form,
      capacity: capacityVal,
    });
    if (form.daysPattern === "CUSTOM" && (!form.customDays || form.customDays.length === 0)) {
      validationErrors.customDays = "Please select at least one active training day.";
    }
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        maxPax: capacityVal || 28,
        capacity: capacityVal || 28,
      };
      if (editingBatch) {
        const updated = await updateBatch(editingBatch.id, payload);
        toast.success(`${updated?.name || form.name} updated successfully!`);
      } else {
        const created = await createBatch(payload);
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

  if (isMember()) {
    if (isLoading) {
      return (
        <div className="space-y-6 pb-12 animate-pulse">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-28 rounded-2xl border border-border bg-card p-6" />
          <div className="h-72 rounded-2xl border border-border bg-card" />
        </div>
      );
    }
    if (batches.length === 0) {
      return (
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center animate-in fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Boxes size={28} />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Enrolled Batch Found</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            You are not currently enrolled in any gym batch. Please contact the front desk or your coach to get assigned to a batch slot.
          </p>
          <button
            onClick={() => navigate(isMember() ? "/member/dashboard" : isTrainer() ? "/trainer/dashboard" : "/admin/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }
  }

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

        {isAdmin() && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99] self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Batch</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 shrink-0">
        <KpiCard
          title="Total Batches"
          value={stats.total}
          trend={`${stats.active} Active`}
          subtext="Operating time slots"
          icon={Boxes}
          colorScheme="terracotta"
        />
        <KpiCard
          title="Total Capacity"
          value={stats.totalCapacity}
          trend="Max Pax"
          subtext="Across all daily slots"
          icon={UserCheck}
          colorScheme="sky"
        />
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-xs shrink-0">
        {/* Search input */}
        <div className="flex-1 sm:max-w-xs md:max-w-sm">
          <SearchInput
            placeholder="Search batch by name, timing, or days..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  onView={(batchId) => {
                    const isSchedule = window.location.pathname.includes("/schedule");
                    const prefix = isTrainer() ? "/trainer" : isMember() ? "/member" : "/admin";
                    navigate(isSchedule ? `${prefix}/schedule/batches/${batchId}` : `${prefix}/batches/${batchId}`);
                  }}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteBatch}
                />
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={BATCH_COLUMNS}
            data={filteredBatches}
            pageSize={7}
            currentPage={safePage}
            onPageChange={setCurrentPage}
            totalItems={filteredBatches.length}
            totalPages={Math.max(1, Math.ceil(filteredBatches.length / 7))}
            itemLabel="batches"
            loading={isLoading}
            loadingRowsCount={7}
            showToolbar={false}
            renderRow={(b) => (
              <BatchTableRow
                key={b.id}
                batch={b}
                onView={(batchId) => {
                  const isSchedule = window.location.pathname.includes("/schedule");
                  const prefix = isTrainer() ? "/trainer" : isMember() ? "/member" : "/admin";
                  navigate(isSchedule ? `${prefix}/schedule/batches/${batchId}` : `${prefix}/batches/${batchId}`);
                }}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteBatch}
              />
            )}
            className="flex-1 min-h-0"
          />
        )}
      </div>

      {/* Pinned Bottom Pagination (Grid Mode Only) */}
      {viewMode === "grid" && (
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
      )}

      {/* --- CREATE / EDIT BATCH MODAL --- */}
      <BatchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBatch={editingBatch}
        form={form}
        setForm={setForm}
        errors={errors}
        handleFieldChange={handleFieldChange}
        handleFieldBlur={handleFieldBlur}
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
