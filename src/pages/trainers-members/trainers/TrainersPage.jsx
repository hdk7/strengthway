/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Phone,
  Mail,
  Filter,
  Award,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getTrainers, createTrainer, toggleTrainerStatus } from "@/lib/trainersService";
import { TrainerModal } from "./TrainerModal";

export default function TrainersPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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

  const handleToggleStatus = (id) => {
    try {
      const updated = toggleTrainerStatus(id);
      if (updated) {
        setTrainers((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.success(`Status changed to ${updated.status}.`);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      if (statusFilter !== "All" && trainer.status !== statusFilter) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        trainer.name?.toLowerCase().includes(query) ||
        trainer.specialization?.toLowerCase().includes(query) ||
        trainer.phone?.toLowerCase().includes(query) ||
        trainer.email?.toLowerCase().includes(query) ||
        trainer.id?.toLowerCase().includes(query)
      );
    });
  }, [trainers, searchQuery, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = trainers.length;
    const active = trainers.filter((t) => t.status === "Active" || !t.status).length;
    const specializationsCount = new Set(trainers.map((t) => t.specialization)).size;
    return { total, active, specializationsCount };
  }, [trainers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Trainers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage fitness Traineres, specializations, shift schedules, and profiles.
          </p>
        </div>

        {/* Add Trainer CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Total Trainers */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Traineres</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">On gym roster</p>
          </div>
        </div>

        {/* Active Trainers */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Today</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-500">{stats.active}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Taking sessions</p>
          </div>
        </div>

        {/* Specializations */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Disciplines</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.specializationsCount}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Unique workout disciplines</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainers by name, discipline, email, or phone…"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 text-xs">
          <Filter size={14} className="ml-1.5 text-muted-foreground" />
          {["All", "Active", "Inactive"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Trainer</th>
                <th className="py-3.5 px-4">Discipline / Specialization</th>
                <th className="py-3.5 px-4">Assigned Shift</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => {
                  const initials = (trainer.name || "T")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={trainer.id}
                      className="hover:bg-accent/5 transition-colors duration-150"
                    >
                      {/* Trainer Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/trainers-members/trainers/${trainer.id}`)
                            }
                            title="View full Trainer profile"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs border border-accent/20 hover:scale-105 hover:ring-2 hover:ring-accent/40 transition-all cursor-pointer focus:outline-none"
                          >
                            {initials}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/trainers-members/trainers/${trainer.id}`)
                              }
                              className="font-semibold text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
                            >
                              {trainer.name}
                            </button>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {trainer.id} • {trainer.experience}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                          <Award size={13} className="text-accent" />
                          <span>{trainer.specialization}</span>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={13} />
                          <span>{trainer.shift || "Morning"}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Phone size={12} className="text-muted-foreground shrink-0" />
                            <span>{trainer.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail size={12} className="text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[150px]">{trainer.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(trainer.id)}
                          title="Click to toggle status"
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${
                            trainer.status === "Inactive"
                              ? "bg-muted text-muted-foreground"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {trainer.status || "Active"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={36} className="text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No Traineres found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery
                          ? "Try adjusting your search query or filters."
                          : "Get started by registering gym Traineres."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainer Add/Edit Modal */}
      <TrainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveTrainer}
      />
    </div>
  );
}
