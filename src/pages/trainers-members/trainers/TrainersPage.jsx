import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getTrainers, createTrainer } from "@/lib/trainersService";
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Trainers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your certified fitness instructors, coaches, and staff roster.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 shadow-sm cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* KPI Cards (3 Cards: Total Staff, Active Now, Inactive) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Staff</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Registered coaches</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Now</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-500">{stats.active}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Available for training</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Inactive</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-muted-foreground">{stats.inactive}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">On break / paused</p>
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
          { label: "Female", value: "Female" },
          { label: "Male", value: "Male" },
        ]}
        pageSize={8}
        itemLabel="trainers"
        emptyTitle="No trainers found"
        emptyMessage="Try adjusting your search query or filters."
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
