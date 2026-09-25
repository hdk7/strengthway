/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/lib/masterScheduleService";
import { getBatches } from "@/lib/batchesService";
import { InputField, TextareaField } from "@/components/form";

const STANDARD_CATEGORIES = [
  "National Holiday",
  "Festival Holiday",
  "Public Holiday",
  "Facility Maintenance",
  "Special Event",
];

export default function AttendancePolicyMasterPage() {
  const [holidays, setHolidays] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "National Holiday",
    customType: "",
    affectedBatches: "ALL",
    description: "",
  });

  useEffect(() => {
    loadHolidays();
    setBatches(getBatches());
    window.addEventListener("storage", loadHolidays);
    return () => window.removeEventListener("storage", loadHolidays);
  }, []);

  const loadHolidays = () => {
    setHolidays(getHolidays());
  };

  const filteredHolidays = useMemo(() => {
    if (!searchQuery.trim()) return holidays;
    const q = searchQuery.toLowerCase().trim();
    return holidays.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
    );
  }, [holidays, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = holidays.filter((h) => h.date >= today).length;
    const past = holidays.filter((h) => h.date < today).length;
    return { total: holidays.length, upcoming, past };
  }, [holidays]);

  const handleOpenAdd = () => {
    setEditingHolidayId(null);
    setForm({
      name: "",
      date: new Date().toISOString().slice(0, 10),
      type: "National Holiday",
      customType: "",
      affectedBatches: "ALL",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (holiday) => {
    setEditingHolidayId(holiday.id);
    const isStandard = STANDARD_CATEGORIES.includes(holiday.type);
    setForm({
      name: holiday.name,
      date: holiday.date,
      type: isStandard ? holiday.type : "Others",
      customType: isStandard ? "" : holiday.type === "Others" ? "" : holiday.type,
      affectedBatches: holiday.affectedBatches || "ALL",
      description: holiday.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a holiday name.");
      return;
    }
    if (!form.date) {
      toast.error("Please select a holiday date.");
      return;
    }

    const resolvedCategory =
      form.type === "Others" ? form.customType?.trim() || "Others" : form.type;

    const payload = {
      name: form.name.trim(),
      date: form.date,
      type: resolvedCategory,
      affectedBatches: form.affectedBatches || "ALL",
      description: form.description?.trim() || "",
    };

    try {
      if (editingHolidayId) {
        updateHoliday(editingHolidayId, payload);
        toast.success(`Holiday "${payload.name}" updated successfully.`);
      } else {
        addHoliday(payload);
        toast.success(`Holiday "${payload.name}" added successfully.`);
      }
      setIsModalOpen(false);
      setEditingHolidayId(null);
      loadHolidays();
    } catch {
      toast.error(editingHolidayId ? "Failed to update holiday." : "Failed to add holiday.");
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete holiday "${name}"?`)) {
      try {
        deleteHoliday(id);
        toast.success(`Holiday "${name}" deleted.`);
        loadHolidays();
      } catch {
        toast.error("Failed to delete holiday.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Attendance Policy
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage scheduled gym closures, festival blackout dates, and batch attendance exemptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-background shadow-md transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Holidays</span>
            <CalendarDays size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Configured in system</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Dates</span>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-500">
            {stats.upcoming}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Future closures in 2026</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Passed Closures</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.past}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Archived this calendar year</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search holiday by name, type, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9.5 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Holidays List Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Holiday Date</th>
              <th className="px-4 py-3">Name / Occasion</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Affected Batches</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredHolidays.map((holiday) => {
              const isPast = holiday.date < new Date().toISOString().slice(0, 10);
              return (
                <tr key={holiday.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      <span>{holiday.date}</span>
                      {isPast && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Past
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-foreground">
                    {holiday.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-accent/20 px-2 py-0.5 text-xs font-semibold text-foreground">
                      {holiday.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                    {holiday.affectedBatches === "ALL"
                      ? "All Batches & Shifts"
                      : holiday.affectedBatches}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[260px] truncate">
                    {holiday.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(holiday)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit holiday"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id, holiday.name)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete holiday"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Holiday Modal */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-foreground text-base">
                  {editingHolidayId ? "Edit Holiday" : "Add New Holiday"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent/20 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                <InputField
                  label="Holiday Name / Occasion"
                  required
                  placeholder="e.g. Diwali Festivities"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <InputField
                  label="Date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <div className="flex flex-col text-left">
                  <label className="mb-1 text-xs font-medium text-foreground">Holiday Category</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="National Holiday">National Holiday</option>
                    <option value="Festival Holiday">Festival Holiday</option>
                    <option value="Public Holiday">Public Holiday</option>
                    <option value="Facility Maintenance">Facility Maintenance</option>
                    <option value="Special Event">Special Event</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {form.type === "Others" && (
                  <InputField
                    label="Specify Category (Optional)"
                    placeholder="e.g. State Holiday, Observance, etc."
                    value={form.customType}
                    onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  />
                )}

                <div className="flex flex-col text-left">
                  <label className="mb-1 text-xs font-medium text-foreground">Affected Batches</label>
                  <select
                    value={form.affectedBatches}
                    onChange={(e) => setForm({ ...form, affectedBatches: e.target.value })}
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="ALL">All Batches & Shifts</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.name || b.shortName}>
                        {b.name || b.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <TextareaField
                  label="Closure Details / Description"
                  rows={2}
                  placeholder="e.g. Morning open gym only; regular class batches suspended."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4.5 py-2 text-xs font-bold text-background hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    {editingHolidayId ? "Update Holiday" : "Save Holiday"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
