/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Pagination } from "@/components/table";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "National Holiday",
    customType: "",
    affectedBatches: "ALL",
    description: "",
  });

  const loadHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHolidays();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load holidays");
      toast.error("Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
    getBatches()
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch(() => setBatches([]));
  }, [loadHolidays]);

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

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredHolidays.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedHolidays = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredHolidays.slice(start, start + pageSize);
  }, [filteredHolidays, safePage, pageSize]);

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

  const handleSave = async (e) => {
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
      setIsSubmitting(true);
      if (editingHolidayId) {
        await updateHoliday(editingHolidayId, payload);
        toast.success(`Holiday "${payload.name}" updated successfully.`);
      } else {
        await addHoliday(payload);
        toast.success(`Holiday "${payload.name}" added successfully.`);
      }
      setIsModalOpen(false);
      setEditingHolidayId(null);
      await loadHolidays();
    } catch (err) {
      toast.error(err.message || (editingHolidayId ? "Failed to update holiday." : "Failed to add holiday."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete holiday "${name}"?`)) {
      try {
        await deleteHoliday(id);
        toast.success(`Holiday "${name}" deleted.`);
        await loadHolidays();
      } catch (err) {
        toast.error(err.message || "Failed to delete holiday.");
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* Page Header */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Attendance Policy
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage scheduled gym closures, festival blackout dates, and batch attendance exemptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-background shadow-xs transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="shrink-0 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadHolidays}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-1 text-xs font-semibold hover:bg-destructive/20 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="shrink-0 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Holidays</span>
            <CalendarDays size={16} className="text-primary" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">
            {stats.total}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Configured in system</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming Dates</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-500">
            {stats.upcoming}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Future closures in 2026</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Passed Closures</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">
            {stats.past}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Archived this calendar year</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="shrink-0 rounded-2xl border border-border bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search holiday by name, type, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Holidays List Table Container */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-2.5 px-4 sm:px-5">Holiday Date</th>
                <th className="py-2.5 px-4 sm:px-5">Name / Occasion</th>
                <th className="py-2.5 px-4 sm:px-5">Type</th>
                <th className="py-2.5 px-4 sm:px-5">Affected Batches</th>
                <th className="py-2.5 px-4 sm:px-5">Description</th>
                <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="bg-card py-4 px-4 sm:px-5 border-y border-border/50 first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="bg-card py-8 px-4 text-center text-muted-foreground border-y border-border/50 rounded-2xl border-x">
                    No holidays found.
                  </td>
                </tr>
              ) : (
                paginatedHolidays.map((holiday) => {
                  const isPast = holiday.date < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={holiday.id} className="group transition-all duration-150 hover:translate-y-[-1px]">
                      {/* Holiday Date */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                          <Calendar size={13} className="text-primary shrink-0" />
                          <span>{holiday.date}</span>
                          {isPast && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Past
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Name / Occasion */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors font-extrabold text-foreground">
                        {holiday.name}
                      </td>

                      {/* Type */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          {holiday.type}
                        </span>
                      </td>

                      {/* Affected Batches */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground font-medium">
                        {holiday.affectedBatches === "ALL"
                          ? "All Batches & Shifts"
                          : holiday.affectedBatches}
                      </td>

                      {/* Description */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground max-w-[260px] truncate">
                        {holiday.description || "—"}
                      </td>

                      {/* Actions */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(holiday)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Edit holiday"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id, holiday.name)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Delete holiday"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pinned Bottom Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filteredHolidays.length}
        pageSize={pageSize}
        itemName="holidays"
        compact
        className="shrink-0 mt-auto"
      />

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
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
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
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-primary px-4.5 py-2 text-xs font-bold text-background hover:bg-primary/90 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingHolidayId
                        ? "Update Holiday"
                        : "Save Holiday"}
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
