import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getTrainers, createTrainer } from "@/lib/trainersService";
import { syncTrainerBatches } from "@/lib/batchesService";
import { DataTable } from "@/components/table";
import { TrainerModal } from "./TrainerModal";
import { getTrainerColumns } from "./trainerColumns";

export default function TrainersPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const data = getTrainers();
      setTrainers(data);
    } catch {
      setTrainers([]);
    }
  }, []);

  const handleOpenAddModal = () => {
    setIsModalOpen(true);
  };

  const handleSaveTrainer = (formData) => {
    try {
      const created = createTrainer(formData);
      if (created?.id && Array.isArray(formData.batchIds) && formData.batchIds.length > 0) {
        syncTrainerBatches(created.id, formData.batchIds);
      }
      setTrainers((prev) => [created, ...prev]);
    } catch {
      toast.error("Failed to save trainer record.");
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-background transition-all hover:opacity-90 shadow-xs cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Add Trainer</span>
        </button>
      </div>

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
              {stats.total}
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
              {stats.active}
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
              {stats.inactive}
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
        searchable
        searchPlaceholder="Search trainers by name, gender, email, or phone…"
        searchFields={["name", "gender", "phone", "email", "id"]}
        filterKey="gender"
        filterOptions={[
          { label: "All", value: "All" },
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ]}
        pageSize={6}
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
