/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CalendarCheck,
  Grid3X3,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Repeat,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { getTrainers } from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import {
  recordTrainerLog,
  getAllTrainerLogs,
} from "@/lib/attendanceService";
import { Pagination } from "@/components/table";

const SHIFT_OPTIONS = ["All", "Morning", "Evening", "General"];

export default function TrainersAttendancePage() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [selectedShift, setSelectedShift] = useState("All");

  // Data State
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainerLogs, setTrainerLogs] = useState([]);
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    trainerId: "",
    batchId: "",
    status: "CONDUCTED",
    substituteTrainerId: "",
    checkInTime: "06:00 AM",
    durationMinutes: 60,
    attendeesCount: 15,
    notes: "",
  });

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // ─── 1. Load Trainers & Batches on Mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getTrainers(), getBatches()])
      .then(([trainersList, batchesList]) => {
        if (cancelled) return;
        setTrainers(Array.isArray(trainersList) ? trainersList : []);
        setBatches(Array.isArray(batchesList) ? batchesList : []);
      })
      .catch((err) => {
        console.error("Failed to load initial data:", err);
        toast.error("Failed to load faculty and batches.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── 2. Load Daily Logs ──────────────────────────────────────────────────────
  const loadDailyLogs = useCallback(async () => {
    try {
      const logs = await getAllTrainerLogs({ date: selectedDate });
      setTrainerLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to load daily trainer logs:", err);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (viewMode === "daily") {
      loadDailyLogs();
    }
  }, [viewMode, selectedDate, loadDailyLogs]);

  // ─── 3. Load Monthly Logs ────────────────────────────────────────────────────
  const loadMonthlyLogs = useCallback(async () => {
    try {
      const logs = await getAllTrainerLogs({ month: selectedMonth });
      setMonthlyLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to load monthly trainer logs:", err);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (viewMode === "monthly") {
      loadMonthlyLogs();
    }
  }, [viewMode, selectedMonth, loadMonthlyLogs]);

  // ─── 4. Quick Actions on Trainers ───────────────────────────────────────────
  const handleQuickMark = async (trainer, batchId, status) => {
    const checkInTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      await recordTrainerLog({
        date: selectedDate,
        trainerId: trainer.id,
        trainerName: trainer.name,
        batchId: batchId || trainer.batchIds?.[0] || "BATCH-DEFAULT",
        status,
        checkInTime,
        durationMinutes: 60,
        attendeesCount: status === "CONDUCTED" ? 15 : 0,
        notes: `Quick marked as ${status} on ${selectedDate}`,
      });
      toast.success(`${trainer.name} marked as ${status}.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to record trainer status:", err);
      toast.error("Failed to record coaching status.");
    }
  };

  const handleOpenSubstituteModal = (trainer, batchId) => {
    setModalFormData({
      date: selectedDate,
      trainerId: trainer.id,
      batchId: batchId || trainer.batchIds?.[0] || batches[0]?.id || "",
      status: "SUBSTITUTE",
      substituteTrainerId: "",
      checkInTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      durationMinutes: 60,
      attendeesCount: 15,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalFormData.trainerId || !modalFormData.batchId) {
      toast.error("Trainer and batch container are required.");
      return;
    }
    if (modalFormData.status === "SUBSTITUTE" && !modalFormData.substituteTrainerId) {
      toast.error("Please select a substitute coach from faculty.");
      return;
    }

    setIsSubmitting(true);
    const trainerObj = trainers.find((t) => t.id === modalFormData.trainerId);

    try {
      await recordTrainerLog({
        ...modalFormData,
        trainerName: trainerObj?.name || modalFormData.trainerId,
        durationMinutes: Number(modalFormData.durationMinutes) || 60,
        attendeesCount: Number(modalFormData.attendeesCount) || 0,
      });
      toast.success("Class conduction record logged successfully.");
      setIsModalOpen(false);
      loadDailyLogs();
      if (viewMode === "monthly") loadMonthlyLogs();
    } catch (err) {
      console.error("Failed to save trainer log:", err);
      toast.error("Failed to record class log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 5. Filtered Faculty Computation ─────────────────────────────────────────
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      // Shift filter
      if (selectedShift !== "All" && t.shift !== selectedShift) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name?.toLowerCase().includes(q);
        const matchesId = t.id?.toLowerCase().includes(q);
        const matchesPhone = t.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }

      return true;
    });
  }, [trainers, selectedShift, searchQuery]);

  // Daily KPIs
  const dailyKpis = useMemo(() => {
    const totalOnDuty = trainers.filter((t) => t.status !== "Inactive").length;
    const conducted = trainerLogs.filter((l) => l.status === "CONDUCTED");
    const substitutes = trainerLogs.filter((l) => l.status === "SUBSTITUTE" || l.substituteTrainerId);
    const totalMinutes = conducted.reduce((acc, l) => acc + (l.durationMinutes || 60), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      totalOnDuty,
      classesConducted: conducted.length,
      totalHours,
      substituteCount: substitutes.length,
    };
  }, [trainers, trainerLogs]);

  // Monthly Faculty Summary Matrix
  const monthlySummary = useMemo(() => {
    const summaryMap = {};

    trainers.forEach((t) => {
      summaryMap[t.id] = {
        trainer: t,
        conductedCount: 0,
        substituteDeliveredCount: 0,
        substituteCoveredCount: 0,
        totalMinutes: 0,
        totalAttendees: 0,
      };
    });

    monthlyLogs.forEach((log) => {
      // Primary coach log
      if (summaryMap[log.trainerId]) {
        if (log.status === "CONDUCTED") {
          summaryMap[log.trainerId].conductedCount++;
          summaryMap[log.trainerId].totalMinutes += log.durationMinutes || 60;
          summaryMap[log.trainerId].totalAttendees += log.attendeesCount || 0;
        } else if (log.status === "SUBSTITUTE") {
          summaryMap[log.trainerId].substituteCoveredCount++;
        }
      }

      // Substitute coach stepped in
      if (log.substituteTrainerId && summaryMap[log.substituteTrainerId]) {
        summaryMap[log.substituteTrainerId].substituteDeliveredCount++;
        summaryMap[log.substituteTrainerId].totalMinutes += log.durationMinutes || 60;
        summaryMap[log.substituteTrainerId].totalAttendees += log.attendeesCount || 0;
      }
    });

    return Object.values(summaryMap);
  }, [trainers, monthlyLogs]);

  // Monthly Substitute Sessions List
  const monthlySubstituteLogs = useMemo(() => {
    return monthlyLogs.filter(
      (l) => l.status === "SUBSTITUTE" || Boolean(l.substituteTrainerId)
    );
  }, [monthlyLogs]);

  // Pagination State for Daily Faculty Conduction
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 5;
  useEffect(() => {
    setDailyPage(1);
  }, [selectedShift, searchQuery, selectedDate]);

  const totalDailyPages = Math.max(1, Math.ceil(filteredTrainers.length / dailyPageSize));
  const safeDailyPage = Math.max(1, Math.min(dailyPage, totalDailyPages));
  const paginatedTrainers = useMemo(() => {
    const start = (safeDailyPage - 1) * dailyPageSize;
    return filteredTrainers.slice(start, start + dailyPageSize);
  }, [filteredTrainers, safeDailyPage, dailyPageSize]);

  // Pagination State for Monthly Faculty Ledger
  const [monthlyPage, setMonthlyPage] = useState(1);
  const monthlyPageSize = 5;
  useEffect(() => {
    setMonthlyPage(1);
  }, [selectedShift, selectedMonth]);

  const totalMonthlyPages = Math.max(1, Math.ceil(monthlySummary.length / monthlyPageSize));
  const safeMonthlyPage = Math.max(1, Math.min(monthlyPage, totalMonthlyPages));
  const paginatedMonthlySummary = useMemo(() => {
    const start = (safeMonthlyPage - 1) * monthlyPageSize;
    return monthlySummary.slice(start, start + monthlyPageSize);
  }, [monthlySummary, safeMonthlyPage, monthlyPageSize]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formattedSelectedMonth = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header & Primary Controls ──────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Faculty Operations • Class Conduction
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-1">
            Trainer Attendance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Faculty shift logs, daily scheduled class conduction, substitute coach reassignments, and floor hours ledger.
          </p>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center rounded-2xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "daily"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CalendarCheck size={15} />
              <span>Daily Conduction</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "monthly"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Grid3X3 size={15} />
              <span>Monthly Summary</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalFormData({
                date: selectedDate,
                trainerId: trainers[0]?.id || "",
                batchId: batches[0]?.id || "",
                status: "CONDUCTED",
                substituteTrainerId: "",
                checkInTime: "06:00 AM",
                durationMinutes: 60,
                attendeesCount: 15,
                notes: "",
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:bg-accent/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} />
            <span>Log Class / Substitute</span>
          </button>
        </div>
      </div>

      {/* ─── Control Bar: Shift & Date / Month Navigator ─────────────────────── */}
      <div className="shrink-0 rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Shift Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Faculty Shift:
          </span>
          {SHIFT_OPTIONS.map((shift) => (
            <button
              key={shift}
              type="button"
              onClick={() => setSelectedShift(shift)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedShift === shift
                  ? "bg-accent/15 text-accent border border-accent/25"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {shift}
            </button>
          ))}
        </div>

        {/* Date / Month Navigator */}
        {viewMode === "daily" ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background p-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center gap-2 px-2.5">
                <Calendar size={14} className="text-accent" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border-0 bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              Today
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background p-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = selectedMonth.split("-").map(Number);
                  const d = new Date(y, m - 2, 1);
                  setSelectedMonth(d.toISOString().slice(0, 7));
                }}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="relative px-3">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Select Month"
                />
                <span className="text-xs sm:text-sm font-black text-foreground font-mono cursor-pointer select-none">
                  {formattedSelectedMonth}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const [y, m] = selectedMonth.split("-").map(Number);
                  const d = new Date(y, m, 1);
                  setSelectedMonth(d.toISOString().slice(0, 7));
                }}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              Current Month
            </button>
          </div>
        )}
      </div>

      {/* ─── Top KPI Cards ──────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* On Duty */}
        <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faculty On Roster</span>
            <Users size={16} className="text-accent" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{dailyKpis.totalOnDuty}</span>
            <span className="text-xs text-muted-foreground">coaches</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Active coaches registered</p>
        </div>

        {/* Classes Conducted */}
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Classes Conducted</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">
              {dailyKpis.classesConducted}
            </span>
            <span className="text-xs text-muted-foreground">sessions</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Conducted on {selectedDate}</p>
        </div>

        {/* Hours Logged */}
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Floor Hours</span>
            <Clock size={16} className="text-primary" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{dailyKpis.totalHours}</span>
            <span className="text-xs text-muted-foreground">hrs logged</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Cumulative coaching duration</p>
        </div>

        {/* Substitute Reassignments */}
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Substitute Logs</span>
            <Repeat size={16} className="text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">
              {dailyKpis.substituteCount}
            </span>
            <span className="text-xs text-muted-foreground">substitutions</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Reassigned sessions today</p>
        </div>
      </div>

      {/* ─── VIEW 1: DAILY CLASS CONDUCTION ROSTER ───────────────────────────── */}
      {viewMode === "daily" && (
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search faculty by name, ID, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* <span className="text-[11px] font-mono text-muted-foreground">
              {filteredTrainers.length} Faculty Members Listed
            </span> */}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 p-3 sm:p-4 no-scrollbar">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
                <p className="mt-3 text-xs font-semibold">Loading faculty roster…</p>
              </div>
            ) : paginatedTrainers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {paginatedTrainers.map((trainer) => {
                // Find all logs for this trainer today
                const logsForTrainer = trainerLogs.filter(
                  (l) => l.trainerId === trainer.id || l.substituteTrainerId === trainer.id
                );
                const assignedBatchObjects = batches.filter((b) =>
                  trainer.batchIds?.includes(b.id)
                );

                return (
                  <div
                    key={trainer.id}
                    className="rounded-3xl border border-border/80 bg-background/60 p-5 sm:p-6 space-y-4 hover:border-accent/40 transition-all shadow-xs"
                  >
                    {/* Trainer Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent font-bold text-sm uppercase">
                          {trainer.name?.[0] || "T"}
                        </div>
                        <div>
                          <Link
                            to={`/admin/trainers-members/trainers/${trainer.id}`}
                            className="font-bold text-foreground text-sm hover:text-accent transition-colors flex items-center gap-1.5"
                          >
                            <span>{trainer.name}</span>
                            <ExternalLink size={12} className="text-muted-foreground" />
                          </Link>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                            <span>ID: {trainer.id}</span>
                            <span>•</span>
                            <span className="text-foreground font-semibold">
                              {trainer.shift || "General Shift"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          trainer.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {trainer.status || "Active"}
                      </span>
                    </div>

                    {/* Assigned Batches Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Assigned Containers
                      </span>
                      {assignedBatchObjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedBatchObjects.map((b) => (
                            <Link
                              key={b.id}
                              to={`/admin/batches/${b.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-card border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                            >
                              <Layers size={11} className="text-accent" />
                              <span>{b.name}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No containers assigned
                        </span>
                      )}
                    </div>

                    {/* Today's Logged Conductions */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Logged Conduction for {selectedDate}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {logsForTrainer.length} {logsForTrainer.length === 1 ? "Class" : "Classes"}
                        </span>
                      </div>

                      {logsForTrainer.length > 0 ? (
                        <div className="space-y-2">
                          {logsForTrainer.map((l, idx) => {
                            const isSub = l.status === "SUBSTITUTE" || l.substituteTrainerId;
                            const isSteppedIn = l.substituteTrainerId === trainer.id;

                            return (
                              <div
                                key={l.id || idx}
                                className="rounded-2xl border border-border/80 bg-card p-3 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-foreground">
                                      {l.batchName || l.batchId}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold ${
                                        l.status === "CONDUCTED"
                                          ? "bg-emerald-500/10 text-emerald-400"
                                          : isSub
                                          ? "bg-amber-500/10 text-amber-400"
                                          : "bg-rose-500/10 text-rose-400"
                                      }`}
                                    >
                                      {l.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <Clock size={11} className="text-accent" />
                                    <span>{l.checkInTime || "Logged"}</span>
                                    <span>•</span>
                                    <span>{l.attendeesCount || 0} Athletes</span>
                                    {isSteppedIn && (
                                      <span className="text-amber-400 font-semibold">
                                        (Subbed for {l.trainerName || l.trainerId})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenSubstituteModal(trainer, l.batchId)}
                                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  Edit Log
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                          No coaching sessions logged yet today.
                        </div>
                      )}
                    </div>

                    {/* Single-Click Conduction Actions */}
                    <div className="pt-2 border-t border-border/40 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "CONDUCTED")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 size={13} />
                        <span>Conducted</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSubstituteModal(trainer, trainer.batchIds?.[0])}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <Repeat size={13} />
                        <span>Assign Substitute</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "ABSENT")}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "LEAVE")}
                        className="rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
              <Users size={32} className="mx-auto text-muted-foreground/60" />
              <h4 className="text-sm font-bold text-foreground">No Faculty Found</h4>
              <p className="text-xs text-muted-foreground">
                No trainers found matching the selected shift and search query.
              </p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: MONTHLY FACULTY CONDUCTION SUMMARY ──────────────────────── */}
      {viewMode === "monthly" && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar">
          {/* Monthly Matrix Table */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Award size={16} className="text-accent" />
                  <span>Faculty Coaching Ledger — {formattedSelectedMonth}</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Aggregate coaching performance, total athletes reached, and substitute coverages.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[380px] no-scrollbar pr-1">
              <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Faculty Member</th>
                    <th className="py-3 px-4 sm:px-5">Shift</th>
                    <th className="py-3 px-4 sm:px-5 text-center">Classes Conducted</th>
                    <th className="py-3 px-4 sm:px-5 text-center">Athletes Reached</th>
                    <th className="py-3 px-4 sm:px-5 text-center">Substitute Delivered</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium">
                  {paginatedMonthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Users size={28} className="mx-auto text-muted-foreground/50" />
                          <p className="font-bold text-foreground text-sm">No Faculty Activity Recorded</p>
                          <p className="text-xs text-muted-foreground">No coaching logs found for {formattedSelectedMonth}.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMonthlySummary.map(({ trainer, conductedCount, substituteDeliveredCount, totalAttendees }) => (
                      <tr key={trainer.id} className="group transition-all duration-150 hover:translate-y-[-1px]">
                        {/* Faculty Member */}
                        <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm border border-accent/25 uppercase">
                              {trainer.name ? trainer.name.charAt(0) : "T"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">
                                  {trainer.name}
                                </span>
                                <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                                  #{trainer.id?.length > 7 ? trainer.id.slice(-6).toUpperCase() : trainer.id}
                                </span>
                              </div>
                              {trainer.specialization && (
                                <span className="text-[11px] text-muted-foreground block mt-0.5 font-normal">
                                  {trainer.specialization}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Shift */}
                        <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            {trainer.shift || "General Shift"}
                          </span>
                        </td>

                        {/* Classes Conducted */}
                        <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                              {conductedCount}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">sessions</span>
                          </div>
                        </td>

                        {/* Athletes Reached */}
                        <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                              {totalAttendees}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">athletes</span>
                          </div>
                        </td>

                        {/* Substitute Delivered */}
                        <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-base text-primary">
                              {substituteDeliveredCount}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">coverages</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Substitute Coaching Ledger */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Repeat size={18} className="text-amber-500" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Substitute Coaching Ledger — {formattedSelectedMonth}
                </h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {monthlySubstituteLogs.length} Sessions Reassigned
              </span>
            </div>

            {monthlySubstituteLogs.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto max-h-[340px] no-scrollbar pr-1">
                <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                  <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                    <tr>
                      <th className="py-2.5 px-4 sm:px-5">Date & Time</th>
                      <th className="py-2.5 px-4 sm:px-5">Batch Container</th>
                      <th className="py-2.5 px-4 sm:px-5">Scheduled Coach</th>
                      <th className="py-2.5 px-4 sm:px-5">Substitute Coach</th>
                      <th className="py-2.5 px-4 sm:px-5 text-center">Attendees</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm font-medium">
                    {monthlySubstituteLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="group transition-all duration-150 hover:translate-y-[-1px]">
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <span className="font-semibold text-foreground block">{log.date}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {log.checkInTime || "Scheduled"}
                          </span>
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors font-bold text-foreground">
                          {log.batchName || log.batchId}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-muted-foreground font-semibold">
                          {log.trainerName || log.trainerId}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-amber-600 dark:text-amber-400 font-bold">
                          {log.substituteTrainerName || log.substituteTrainerId || "Substitute Coach"}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono font-bold">
                          {log.attendeesCount || 0}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right text-muted-foreground italic text-xs">
                          {log.notes || "Substitute coverage"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No substitute coaching sessions recorded in {formattedSelectedMonth}. All classes were delivered by their assigned primary coaches.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed / Sticky Viewport Bottom Pagination */}
      <div className="shrink-0 mt-auto">
        {viewMode === "daily" ? (
          <Pagination
            currentPage={safeDailyPage}
            totalPages={totalDailyPages}
            onPageChange={setDailyPage}
            totalItems={filteredTrainers.length}
            pageSize={dailyPageSize}
            itemName="coaches"
            compact
          />
        ) : (
          <Pagination
            currentPage={safeMonthlyPage}
            totalPages={totalMonthlyPages}
            onPageChange={setMonthlyPage}
            totalItems={monthlySummary.length}
            pageSize={monthlyPageSize}
            itemName="faculty"
            compact
          />
        )}
      </div>

      {/* ─── MODAL: Log Class Conduction / Substitute Reassignment ───────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Repeat size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Log Class Conduction & Substitute
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Record session execution or reassign to a substitute faculty coach.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Date */}
              <div>
                <label className="font-bold text-foreground block mb-1">Session Date</label>
                <input
                  type="date"
                  value={modalFormData.date}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Trainer */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Scheduled Primary Coach
                </label>
                <select
                  value={modalFormData.trainerId}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, trainerId: e.target.value }))
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">Select Trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shift || "General Shift"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Container */}
              <div>
                <label className="font-bold text-foreground block mb-1">Batch Container</label>
                <select
                  value={modalFormData.batchId}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, batchId: e.target.value }))
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">Select Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timingLabel || b.timing})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-foreground block mb-1">Conduction Status</label>
                <select
                  value={modalFormData.status}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer font-bold"
                >
                  <option value="CONDUCTED">CONDUCTED (Conducted normally)</option>
                  <option value="SUBSTITUTE">SUBSTITUTE (Covered by another trainer)</option>
                  <option value="ABSENT">ABSENT (Missed class)</option>
                  <option value="LEAVE">LEAVE (Approved faculty leave)</option>
                </select>
              </div>

              {/* Substitute Coach Selector (Conditional) */}
              {modalFormData.status === "SUBSTITUTE" && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <Repeat size={14} />
                    <span>Assign Substitute Faculty Coach</span>
                  </div>
                  <select
                    value={modalFormData.substituteTrainerId}
                    onChange={(e) =>
                      setModalFormData((prev) => ({
                        ...prev,
                        substituteTrainerId: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-amber-500/40 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">Select Substitute Coach</option>
                    {trainers
                      .filter((t) => t.id !== modalFormData.trainerId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shift || "General Shift"})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Check-in Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={modalFormData.checkInTime}
                    onChange={(e) =>
                      setModalFormData((prev) => ({ ...prev, checkInTime: e.target.value }))
                    }
                    placeholder="e.g. 06:05 AM"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Attendees Count</label>
                  <input
                    type="number"
                    min="0"
                    value={modalFormData.attendeesCount}
                    onChange={(e) =>
                      setModalFormData((prev) => ({ ...prev, attendeesCount: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-foreground block mb-1">Session Notes / Reason</label>
                <textarea
                  rows="2"
                  value={modalFormData.notes}
                  onChange={(e) =>
                    setModalFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. High intensity conditioning split, Coach stepped in due to illness..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Log…</span>
                    </>
                  ) : (
                    <span>Save Conduction Record</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
