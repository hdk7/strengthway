/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  Calendar,
  Users,
  UserCheck,
  Edit3,
  Dumbbell,
  Flame,
  MapPin,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  X,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBatchById,
  updateBatch,
  getBatchTrainers,
  getBatchMembers,
  getScheduledClassesByBatch,
  updateDayClass,
} from "@/lib/batchesService";
import { getTrainerPhoto } from "@/lib/trainersService";

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trainers" | "members"
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);

  // Search filter for members
  const [memberSearch, setMemberSearch] = useState("");

  // Modals state
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [editBatchForm, setEditBatchForm] = useState({});

  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const loadBatchData = () => {
    const found = getBatchById(id || "BATCH-01");
    if (found) {
      setBatch(found);
      setEditBatchForm({
        name: found.name,
        startTime: found.startTime,
        endTime: found.endTime,
        daysPattern: found.daysPattern,
        maxPax: found.maxPax,
        status: found.status,
      });
      const cls = getScheduledClassesByBatch(found.id);
      setScheduledClasses(cls);
      const trns = getBatchTrainers(found.trainerIds);
      setTrainers(trns);
      const mems = getBatchMembers(found.id, found.currentPax || 18);
      setMembers(mems);
    }
  };

  if (!batch) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Batch Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The requested batch does not exist or has been removed.</p>
        <button
          onClick={() => navigate("/admin/batches/list")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/80"
        >
          <ArrowLeft size={16} /> Back to Batches
        </button>
      </div>
    );
  }

  // Occupancy stats
  const capacity = batch.maxPax || 28;
  const currentPax = batch.currentPax || members.length;
  const occupancyPercent = Math.min(100, Math.round((currentPax / capacity) * 100));
  const remainingSlots = Math.max(0, capacity - currentPax);

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.mobile?.includes(q)
    );
  });

  const handleSaveBatch = (e) => {
    e.preventDefault();
    try {
      const updated = updateBatch(batch.id, {
        name: editBatchForm.name,
        startTime: editBatchForm.startTime,
        endTime: editBatchForm.endTime,
        daysPattern: editBatchForm.daysPattern,
        maxPax: Number(editBatchForm.maxPax),
        status: editBatchForm.status,
      });
      if (updated) {
        setBatch(updated);
        setIsEditBatchOpen(false);
        toast.success(`${updated.name} updated successfully!`);
      }
    } catch {
      toast.error("Failed to update batch details.");
    }
  };

  const handleSaveScheduledClass = (e) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      const updated = updateDayClass(editingClass.id, editingClass);
      if (updated) {
        setScheduledClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setIsEditClassOpen(false);
        toast.success(`Scheduled class for ${updated.day} updated!`);
      }
    } catch {
      toast.error("Failed to update scheduled class.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/admin/batches/list"
          className="hover:text-foreground transition-colors"
        >
          Batches
        </Link>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="font-semibold text-foreground">{batch.shortName || batch.name}</span>
      </nav>

      {/* 2. Hero Card matching requirement wireframe */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all">
        {/* Glow Accent Effect */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            {/* Title & Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {batch.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Timings & Days */}
            <div className="space-y-1.5 text-sm sm:text-base">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Clock size={16} className="text-muted-foreground shrink-0" />
                <span>{batch.timingLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={16} className="text-muted-foreground shrink-0" />
                <span>{batch.daysLabel}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Capacity</span>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">{currentPax}</span>
                  <span className="text-sm text-muted-foreground font-medium">/ {capacity}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyPercent >= 90
                        ? "bg-red-500"
                        : occupancyPercent >= 75
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Trainers</span>
                <div className="mt-0.5 text-xl font-bold text-foreground">
                  {trainers.length || batch.trainerIds?.length || 2}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Assigned on floor</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => setIsEditBatchOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/80 transition-all border border-border shadow-sm cursor-pointer"
            >
              <Edit3 size={16} />
              [ Edit Batch ]
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles size={16} />
          Overview
        </button>

        <button
          onClick={() => setActiveTab("trainers")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === "trainers"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck size={16} />
          Trainers ({trainers.length})
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === "members"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={16} />
          Members ({members.length})
        </button>
      </div>

      {/* 4. Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Overview 3 Metric Cards */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Overview</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Card 1: Members */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Members</span>
                  <Users size={18} />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-foreground">{currentPax}</div>
                <p className="mt-1 text-xs text-muted-foreground">Currently enrolled in this batch</p>
              </div>

              {/* Card 2: Trainers */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Trainers</span>
                  <UserCheck size={18} />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-foreground">
                  {trainers.length || 2}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Supervising this time slot</p>
              </div>

              {/* Card 3: Capacity */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Capacity</span>
                  <Dumbbell size={18} />
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground">{currentPax}</span>
                  <span className="text-lg font-semibold text-muted-foreground">/ {capacity}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-emerald-400">
                  {remainingSlots} spots remaining ({occupancyPercent}% full)
                </p>
              </div>
            </div>
          </div>

          {/* Scheduled Classes for Prospective Days Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="text-foreground" size={18} />
                  Scheduled Classes for Perspective Days
                </h3>
                <p className="text-xs text-muted-foreground">
                  Weekly workout curriculum and assigned trainers for {batch.daysLabel}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {scheduledClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-foreground/30 hover:bg-card shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Day Pill & Intensity */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-accent/40 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                        {cls.day}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          cls.intensity === "Peak"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : cls.intensity === "High"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        <Flame size={12} />
                        {cls.intensity}
                      </span>
                    </div>

                    {/* Class Name */}
                    <div>
                      <h4 className="text-base font-bold text-foreground leading-snug">
                        {cls.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {cls.focus}
                      </p>
                    </div>

                    {/* Zone & Category */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {cls.room || "Main Floor"}
                      </span>
                      <span>•</span>
                      <span>{cls.category}</span>
                    </div>
                  </div>

                  {/* Coach Info & Edit Trigger */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
                        {cls.coachName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-none">
                          {cls.coachName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Coach</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setIsEditClassOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                      title="Edit class details"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: TRAINERS */}
      {activeTab === "trainers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Assigned Trainers</h3>
              <p className="text-xs text-muted-foreground">
                Coaches actively assigned to {batch.name} during {batch.timingLabel}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trainers.map((trn) => (
              <div
                key={trn.id}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-accent">
                  {getTrainerPhoto(trn) ? (
                    <img
                      src={getTrainerPhoto(trn)}
                      alt={trn.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-foreground">
                      {trn.name?.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-base truncate">{trn.name}</h4>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {trn.status || "Active"}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {trn.specialization || "Fitness Coach"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {trn.phone || "+91 98000 00000"}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-400" /> {trn.experience || "5+ Yrs"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Enrolled Members ({members.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Trainees scheduled for {batch.name} ({batch.timingLabel}, {batch.daysPattern}).
              </p>
            </div>

            {/* Member Search */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search member..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Member</th>
                  <th className="px-4 py-3.5 font-semibold">Contact</th>
                  <th className="px-4 py-3.5 font-semibold">Gender</th>
                  <th className="px-4 py-3.5 font-semibold">Joined</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((mem) => (
                  <tr key={mem.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground">
                          {mem.firstName?.charAt(0)}
                          {mem.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {mem.firstName} {mem.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{mem.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{mem.mobile}</p>
                      <p className="text-[11px] opacity-75">{mem.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{mem.gender || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {mem.registeredAt ? new Date(mem.registeredAt).toLocaleDateString() : "Active"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-400">
                        {mem.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toast.info(`Transfer batch option for ${mem.firstName}`)}
                        className="rounded-lg bg-accent/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- EDIT BATCH MODAL --- */}
      {isEditBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Edit {batch.name}</h3>
              <button
                onClick={() => setIsEditBatchOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={editBatchForm.name}
                  onChange={(e) =>
                    setEditBatchForm({ ...editBatchForm, name: e.target.value })
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
                    value={editBatchForm.startTime}
                    onChange={(e) =>
                      setEditBatchForm({ ...editBatchForm, startTime: e.target.value })
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
                    value={editBatchForm.endTime}
                    onChange={(e) =>
                      setEditBatchForm({ ...editBatchForm, endTime: e.target.value })
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
                    value={editBatchForm.daysPattern}
                    onChange={(e) =>
                      setEditBatchForm({ ...editBatchForm, daysPattern: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="MWF">MWF (Mon • Wed • Fri)</option>
                    <option value="TTS">TTS (Tue • Thu • Sat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Max Pax (Capacity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editBatchForm.maxPax}
                    onChange={(e) =>
                      setEditBatchForm({ ...editBatchForm, maxPax: e.target.value })
                    }
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
                  value={editBatchForm.status}
                  onChange={(e) =>
                    setEditBatchForm({ ...editBatchForm, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditBatchOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT SCHEDULED CLASS MODAL --- */}
      {isEditClassOpen && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Edit Scheduled Class ({editingClass.day})
                </h3>
                <p className="text-xs text-muted-foreground">{batch.name} • {batch.timingLabel}</p>
              </div>
              <button
                onClick={() => setIsEditClassOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScheduledClass} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Class Title
                </label>
                <input
                  type="text"
                  value={editingClass.title}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Workout Focus & Description
                </label>
                <textarea
                  rows={2}
                  value={editingClass.focus}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, focus: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Intensity
                  </label>
                  <select
                    value={editingClass.intensity}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, intensity: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Peak">Peak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Room / Floor Zone
                  </label>
                  <input
                    type="text"
                    value={editingClass.room || "Main Floor"}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, room: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Assigned Coach
                </label>
                <input
                  type="text"
                  value={editingClass.coachName}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, coachName: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditClassOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
