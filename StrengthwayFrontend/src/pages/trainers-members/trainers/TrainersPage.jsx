import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTrainers, createTrainer } from "@/lib/trainersService";
import { syncTrainerBatches } from "@/lib/batchesService";
import { DataTable } from "@/components/table";
import { TrainerModal } from "./TrainerModal";
import { getTrainerColumns } from "./trainerColumns";
import { isAdmin } from "@/auth/currentUser";
import { KpiCard } from "@/components/ui";

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
      .catch((e) => setError(e?.message || "Failed to load coaches."))
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
        if (!cancelled) setError(e?.message || "Failed to load coaches.");
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
      toast.success(`Coach ${created.name} added successfully!`);
    } catch (e) {
      toast.error(e?.message || "Failed to save coach record.");
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
            Coaches
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your certified fitness instructors, coaches, and staff roster.
          </p>
        </div>

        {isAdmin() && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <UserPlus size={16} />
            <span>Add Coach</span>
          </button>
        )}
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
        <KpiCard
          title="Total Coaches"
          value={loading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : stats.total}
          subtext="Registered coaches"
          icon={Users}
          variant="terracotta"
        />

        <KpiCard
          title="Active Coaches"
          value={loading ? <Loader2 size={20} className="animate-spin text-emerald-500" /> : stats.active}
          subtext="Available for coaching"
          icon={UserCheck}
          variant="emerald"
          valueColor="text-emerald-500"
        />

        <KpiCard
          title="Inactive Coaches"
          value={loading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : stats.inactive}
          subtext="On break / paused"
          icon={Users}
          variant="neutral"
          valueColor="text-muted-foreground"
        />
      </div>

      {/* Integrated Data Table */}
      <DataTable
        columns={columns}
        data={trainers}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search coaches by name, gender, blood group, email, or phone…"
        searchFields={["name", "gender", "bloodGroup", "phone", "email", "id"]}
        filterKey="gender"
        filterOptions={[
          { label: "All", value: "All" },
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ]}
        pageSize={7}
        itemLabel="coaches"
        emptyTitle="No coaches found"
        emptyMessage="Try adjusting your search query or filters."
        compact
        className="flex-1 min-h-0"
      />

      {/* Coach Add/Edit Modal */}
      <TrainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveTrainer}
      />
    </div>
  );
}
