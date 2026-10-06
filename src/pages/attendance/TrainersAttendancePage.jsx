/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  CalendarCheck,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { getTrainers } from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import {
  recordTrainerLog,
  getAllTrainerLogs,
} from "@/lib/attendanceService";
import { Pagination } from "@/components/table";
import { TrainerAttendanceStats } from "./TrainerAttendanceStats";
import { TrainerAttendanceModal } from "./TrainerAttendanceModal";
import { TrainerDailyRoster } from "./TrainerDailyRoster";
import { TrainerMonthlyLedger } from "./TrainerMonthlyLedger";
import { TrainerAttendanceToolbar } from "./TrainerAttendanceToolbar";


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
  }, [selectedMonth]);

  const totalMonthlyPages = Math.max(1, Math.ceil(monthlySummary.length / monthlyPageSize));
  const safeMonthlyPage = Math.max(1, Math.min(monthlyPage, totalMonthlyPages));
  const paginatedMonthlySummary = useMemo(() => {
    const start = (safeMonthlyPage - 1) * monthlyPageSize;
    return monthlySummary.slice(start, start + monthlyPageSize);
  }, [monthlySummary, safeMonthlyPage, monthlyPageSize]);

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
      <TrainerAttendanceToolbar
        shiftOptions={SHIFT_OPTIONS}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        viewMode={viewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        handlePrevDay={handlePrevDay}
        handleNextDay={handleNextDay}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        formattedSelectedMonth={formattedSelectedMonth}
      />


      {/* ─── Top KPI Cards ──────────────────────────────────────────────────── */}
      <TrainerAttendanceStats dailyKpis={dailyKpis} selectedDate={selectedDate} />

      {/* ─── VIEW 1: DAILY CLASS CONDUCTION ROSTER ───────────────────────────── */}
      {viewMode === "daily" && (
        <TrainerDailyRoster
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoading={isLoading}
          paginatedTrainers={paginatedTrainers}
          trainerLogs={trainerLogs}
          batches={batches}
          selectedDate={selectedDate}
          handleOpenSubstituteModal={handleOpenSubstituteModal}
          handleQuickMark={handleQuickMark}
        />
      )}

      {/* ─── VIEW 2: MONTHLY FACULTY CONDUCTION SUMMARY ──────────────────────── */}
      {viewMode === "monthly" && (
        <TrainerMonthlyLedger
          formattedSelectedMonth={formattedSelectedMonth}
          paginatedMonthlySummary={paginatedMonthlySummary}
          monthlySubstituteLogs={monthlySubstituteLogs}
        />
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
      <TrainerAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalFormData={modalFormData}
        setModalFormData={setModalFormData}
        handleSaveModal={handleSaveModal}
        isSubmitting={isSubmitting}
        trainers={trainers}
        batches={batches}
      />
    </div>
  );
}
