/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  MapPin,
  Plus,
  Search,
  Edit3,
  X,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllScheduledClasses,
  getBatches,
  updateDayClass,
  createDayClass,
} from "@/lib/batchesService";

const DAYS = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ScheduleMasterPage() {
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedDay, setSelectedDay] = useState("All Days");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit/Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({
    batchId: "BATCH-01",
    day: "Monday",
    title: "",
    category: "Strength & Hypertrophy",
    focus: "",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClasses(getAllScheduledClasses());
    setBatches(getBatches());
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDay !== "All Days" && c.day !== selectedDay) return false;
      if (selectedBatch !== "ALL" && c.batchId !== selectedBatch) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.focus?.toLowerCase().includes(q) ||
        c.coachName?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    });
  }, [classes, selectedDay, selectedBatch, searchQuery]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setForm({
      batchId: "BATCH-01",
      day: selectedDay !== "All Days" ? selectedDay : "Monday",
      title: "",
      category: "Strength & Hypertrophy",
      focus: "",
      intensity: "High",
      room: "Main Floor",
      coachName: "Dolliee Ellens",
      time: "06:00 AM - 07:00 AM",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setForm({ ...cls });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        const updated = updateDayClass(editingClass.id, form);
        if (updated) {
          toast.success(`Schedule for ${updated.day} updated.`);
        }
      } else {
        const created = createDayClass(form);
        toast.success(`Scheduled class created for ${created.day}.`);
      }
      loadData();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save scheduled class.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Schedule Master
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Plan and manage scheduled training classes across perspective days for all batches.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Schedule Class
        </button>
      </div>

      {/* Days Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDay === day
                ? "bg-foreground text-background shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground px-2">Batch:</span>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.timingLabel})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search class, workout, coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => {
          const batchInfo = batches.find((b) => b.id === cls.batchId);
          return (
            <div
              key={cls.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Day & Batch Tag */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-accent/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                    {cls.day}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {batchInfo?.name || cls.batchId}
                  </span>
                </div>

                {/* Timing */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={13} />
                  <span>{cls.time || batchInfo?.timingLabel}</span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-foreground text-base leading-snug">
                    {cls.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {cls.focus}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      cls.intensity === "Peak"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : cls.intensity === "High"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    <Flame size={11} />
                    {cls.intensity}
                  </span>
                  <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {cls.category}
                  </span>
                </div>
              </div>

              {/* Coach and Room */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <UserCheck size={14} className="text-emerald-400" />
                  <span className="font-semibold text-foreground">{cls.coachName}</span>
                </div>

                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Edit Class Schedule"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD / EDIT CLASS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingClass ? `Edit Class (${form.day})` : "Schedule New Class"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Batch
                  </label>
                  <select
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Day
                  </label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    {DAYS.filter((d) => d !== "All Days").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Class Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Barbell Foundations & Upper Strength"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                  placeholder="Focus movements, sets, and goals..."
                  value={form.focus}
                  onChange={(e) => setForm({ ...form, focus: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="Strength & Hypertrophy">Strength & Hypertrophy</option>
                    <option value="Functional HIIT">Functional HIIT</option>
                    <option value="Olympic Lifting">Olympic Lifting</option>
                    <option value="Cardio & Engine">Cardio & Engine</option>
                    <option value="Strength & Mobility">Strength & Mobility</option>
                    <option value="Powerlifting">Powerlifting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Intensity
                  </label>
                  <select
                    value={form.intensity}
                    onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Peak">Peak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Assigned Coach
                  </label>
                  <input
                    type="text"
                    value={form.coachName}
                    onChange={(e) => setForm({ ...form, coachName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Room / Zone
                  </label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
