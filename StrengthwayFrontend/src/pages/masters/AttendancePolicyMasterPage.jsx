/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/lib/masterScheduleService";
import { getBatches } from "@/lib/batchesService";
import { DataTable, Pagination } from "@/components/table";
import { HolidayModal } from "./HolidayModal";
import { TrainerLeavePolicyTab } from "./TrainerLeavePolicyTab";
import { KpiCard, SearchInput } from "@/components/ui";


const STANDARD_CATEGORIES = [
  "National Holiday",
  "Festival Holiday",
  "Public Holiday",
  "Facility Maintenance",
  "Special Event",
];

export default function AttendancePolicyMasterPage() {
  const [activeTab, setActiveTab] = useState("holidays"); // "holidays" | "trainer-leave"
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
  const pageSize = 7;
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredHolidays.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const columns = useMemo(() => [
    {
      header: "Holiday Date",
      accessorKey: "date",
      cell: (holiday) => {
        const isPast = holiday.date < new Date().toISOString().slice(0, 10);
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
            <Calendar size={13} className="text-primary shrink-0" />
            <span>{holiday.date}</span>
            {isPast && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Past
              </span>
            )}
          </span>
        );
      },
    },
    {
      header: "Name / Occasion",
      accessorKey: "name",
      className: "font-extrabold text-foreground",
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (holiday) => (
        <span className="rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
          {holiday.type}
        </span>
      ),
    },
    {
      header: "Affected Batches",
      accessorKey: "affectedBatches",
      className: "text-xs text-muted-foreground font-medium",
      cell: (holiday) => (
        holiday.affectedBatches === "ALL" ? "All Batches & Shifts" : holiday.affectedBatches
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      className: "text-xs text-muted-foreground max-w-65 truncate",
      cell: (holiday) => holiday.description || "—",
    },
    {
      header: "Actions",
      align: "right",
      cell: (holiday) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(holiday)}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Edit holiday"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(holiday.id, holiday.name)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Delete holiday"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], []);

  const handleOpenAdd = () => {
    setEditingHolidayId(null);
    setForm({
      name: "",
      date: "",
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
            {activeTab === "holidays"
              ? "Manage scheduled gym closures, festival blackout dates, and batch attendance exemptions."
              : "Configure coach leave notice duration tiers and advance-application compliance rules."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Navigation Pill */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("holidays")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "holidays"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays size={14} />
              <span>Holiday Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("trainer-leave")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "trainer-leave"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck size={14} />
              <span>Coach Leave Policy</span>
            </button>
          </div>

          {activeTab === "holidays" && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-background shadow-xs transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "trainer-leave" ? (
        <TrainerLeavePolicyTab />
      ) : (
        <>
          {/* Error Alert */}
          {error && (
            <div className="shrink-0 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadHolidays}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-1 text-xs font-semibold hover:bg-destructive/20 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="shrink-0 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <KpiCard
              title="Total Holidays"
              value={stats.total}
              subtext="Configured in system"
              icon={CalendarDays}
              colorScheme="default"
            />
            <KpiCard
              title="Upcoming Dates"
              value={stats.upcoming}
              subtext="Future closures in 2026"
              icon={AlertCircle}
              colorScheme="amber"
            />
            <KpiCard
              title="Passed Closures"
              value={stats.past}
              subtext="Archived this calendar year"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
          </div>

          {/* Search Bar */}
          <div className="shrink-0 rounded-2xl border border-border bg-card p-2 sm:p-2.5 shadow-xs">
            <SearchInput
              placeholder="Search holiday by name, type, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Standardized Holidays List Data Table */}
          <DataTable
            columns={columns}
            data={filteredHolidays}
            pageSize={pageSize}
            currentPage={safePage}
            onPageChange={setPage}
            totalItems={filteredHolidays.length}
            totalPages={totalPages}
            itemLabel="holidays"
            loading={loading}
            loadingRowsCount={7}
            showToolbar={false}
            emptyTitle="No holidays found."
            emptyMessage="Try adjusting your search query or add a new scheduled holiday."
            className="flex-1 min-h-0"
          />
        </>
      )}


      {/* Add / Edit Holiday Modal */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingHolidayId={editingHolidayId}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        isSubmitting={isSubmitting}
        batches={batches}
      />
    </div>
  );
}
