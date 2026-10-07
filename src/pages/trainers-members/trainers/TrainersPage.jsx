import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTrainers, createTrainer } from "@/lib/trainersService";
import { syncTrainerBatches } from "@/lib/batchesService";
import { DataTable } from "@/components/table";
import { TrainerModal } from "./TrainerModal";
import { getTrainerColumns } from "./trainerColumns";

export default function TrainersPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrainers = useCallback(() => {
    setLoading(true);
    setError(null);
    getTrainers()
      .then((data) => setTrainers(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || "Failed to load trainers."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTrainers()
      .then((data) => {
        if (!cancelled) setTrainers(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load trainers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenAddModal = () => {
    setIsModalOpen(true);
  };

  const handleSaveTrainer = async (formData) => {
    try {
      const created = await createTrainer(formData);
      if (created?.id && Array.isArray(formData.batchIds) && formData.batchIds.length > 0) {
        await syncTrainerBatches(created.id, formData.batchIds).catch(() => null);
      }
      setTrainers((prev) => [created, ...prev]);
      toast.success(`Trainer ${created.name} added successfully!`);
    } catch (e) {
      toast.error(e?.message || "Failed to save trainer record.");
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = trainers.length;
    const active = trainers.filter((t) => t.status === "Active" || !t.status).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [trainers]);

  const columns = useMemo(() => getTrainerColumns({ onNavigate: navigate }), [navigate]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2">
      {/* Top Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Trainers
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your certified fitness instructors, coaches, and staff roster.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
        >
          <UserPlus size={16} />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shrink-0">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchTrainers}
            className="ml-auto text-xs font-semibold underline cursor-pointer hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards (3 Cards: Total Staff, Active Now, Inactive) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 shrink-0">
        <div className="rounded-xl border border-border bg-card p-2 sm:p-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Staff
            </span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {loading ? (
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              ) : (
                stats.total
              )}
            </span>
            <p className="text-[11px] text-muted-foreground">Registered coaches</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-2 sm:p-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Now
            </span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-500 tracking-tight">
              {loading ? (
                <Loader2 size={20} className="animate-spin text-emerald-500" />
              ) : (
                stats.active
              )}
            </span>
            <p className="text-[11px] text-muted-foreground">Available for training</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-2 sm:p-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Inactive
            </span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-muted-foreground tracking-tight">
              {loading ? (
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              ) : (
                stats.inactive
              )}
            </span>
            <p className="text-[11px] text-muted-foreground">On break / paused</p>
          </div>
        </div>
      </div>

      {/* Integrated Data Table */}
      <DataTable
        columns={columns}
        data={trainers}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search trainers by name, gender, email, or phone…"
        searchFields={["name", "gender", "phone", "email", "id"]}
        filterKey="gender"
        filterOptions={[
          { label: "All", value: "All" },
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ]}
        pageSize={5}
        itemLabel="trainers"
        emptyTitle="No trainers found"
        emptyMessage="Try adjusting your search query or filters."
        compact
        className="flex-1 min-h-0"
      />

      {/* Trainer Add/Edit Modal */}
      <TrainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveTrainer}
      />
    </div>
  );
}
