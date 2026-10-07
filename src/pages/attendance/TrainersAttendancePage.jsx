/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarCheck,
  Grid3X3,
  UserCheck,
  CalendarOff,
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
import { TrainerDailyCheckInTable } from "./TrainerDailyCheckInTable";
import { TrainerMonthlyLedger } from "./TrainerMonthlyLedger";
import { TrainerAttendanceToolbar } from "./TrainerAttendanceToolbar";
import { TrainerAttendanceDetailModal } from "./TrainerAttendanceDetailModal";
import { TrainerLeaveRequestDrawer } from "./TrainerLeaveRequestDrawer";
import { TrainerLeaveTrackerView } from "./TrainerLeaveTrackerView";
import {
  getTrainerLeaves,
  getTrainerLeaveMonthlySummary,
} from "@/lib/trainerLeaveService";
import SubstituteCoachModal from "@/pages/batches/detail/SubstituteCoachModal";

import {
  isDateToday,
  isDatePast,
  checkTrainerScheduleAccess,
  getTrainerScheduleDetails,
  getEffectiveTrainerStatus,
  isTrainerAttendancePeriodExpired,
  calculateTrainerDailyKpis,
  getCurrentTimeString,
  parseTimeToMinutes,
} from "./trainerAttendanceUtils";

const SHIFT_OPTIONS = ["All", "Morning", "Evening", "General"];

export default function TrainersAttendancePage() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly" | "leaveTracker"
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [selectedShift, setSelectedShift] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PRESENT" | "ABSENT" | "SUBSTITUTE"
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainerLogs, setTrainerLogs] = useState([]);
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [monthlyLeaveSummary, setMonthlyLeaveSummary] = useState(null);
  const [monthlyLeaves, setMonthlyLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // View Record Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalTrainer, setViewModalTrainer] = useState(null);
  const [viewModalRecord, setViewModalRecord] = useState(null);
  const [viewModalSchedule, setViewModalSchedule] = useState(null);

  // Manual Conduction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    trainerId: "",
    batchId: "",
    status: "CONDUCTED",
    checkInTime: "06:00 AM",
    checkOutTime: "",
    durationMinutes: 60,
    attendeesCount: 15,
    notes: "",
  });

  // Substitute Modal State (shared standard form)
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [isSubstituteSubmitting, setIsSubstituteSubmitting] = useState(false);
  const [substituteForm, setSubstituteForm] = useState({
    batchId: "",
    primaryTrainerId: "",
    substituteTrainerId: "",
    date: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  // Leave Request Drawer State
  const [isLeaveDrawerOpen, setIsLeaveDrawerOpen] = useState(false);
  const [leaveDrawerTrainer, setLeaveDrawerTrainer] = useState(null);


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
      const [logs, leaveSum, leaves] = await Promise.all([
        getAllTrainerLogs({ month: selectedMonth }),
        getTrainerLeaveMonthlySummary(selectedMonth).catch(() => null),
        getTrainerLeaves({ month: selectedMonth }).catch(() => []),
      ]);
      setMonthlyLogs(Array.isArray(logs) ? logs : []);
      setMonthlyLeaveSummary(leaveSum);
      setMonthlyLeaves(Array.isArray(leaves) ? leaves : []);
    } catch (err) {
      console.error("Failed to load monthly trainer logs and leaves:", err);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (viewMode === "monthly") {
      loadMonthlyLogs();
    }
  }, [viewMode, selectedMonth, loadMonthlyLogs]);

  // Daily records map keyed by trainerId
  const dailyRecordsMap = useMemo(() => {
    const map = {};
    (trainerLogs || []).forEach((log) => {
      if (log.trainerId) {
        map[log.trainerId] = log;
      }
    });
    return map;
  }, [trainerLogs]);

  // ─── 4. Quick Check-In (Automatically Marks Status as Present) ───────────────
  const handleQuickCheckIn = async (trainer) => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Check-in is permitted only for the current day.");
    }
    const access = checkTrainerScheduleAccess(selectedDate, trainer, batches);
    if (!access.isAllowed) {
      return toast.error(access.reason);
    }

    const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);
    const nowTime = getCurrentTimeString();

    try {
      await recordTrainerLog({
        date: selectedDate,
        trainerId: trainer.id,
        trainerName: trainer.name,
        batchId: schedule.primaryBatchId || trainer.batchIds?.[0] || "BATCH-DEFAULT",
        status: "PRESENT",
        checkInTime: nowTime,
        durationMinutes: 60,
        attendeesCount: 0,
        notes: `Checked in on ${selectedDate} at ${nowTime}`,
      });
      toast.success(`${trainer.name} checked in (Status: Present).`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check in trainer:", err);
      toast.error(err?.message || "Failed to check in faculty coach.");
    }
  };

  // ─── 5. Quick Check-Out (Only Available After Successful Check-In) ───────────
  const handleQuickCheckOut = async (trainer, record) => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Check-out is permitted only for the current day.");
    }
    if (!record?.checkInTime) {
      return toast.error("Check Out is available only after a successful check-in.");
    }

    const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);
    const nowTime = getCurrentTimeString();
    const inM = parseTimeToMinutes(record.checkInTime);
    const outM = parseTimeToMinutes(nowTime);
    let durationMinutes = record.durationMinutes || 60;
    if (inM !== null && outM !== null && outM > inM) {
      durationMinutes = outM - inM;
    }

    try {
      await recordTrainerLog({
        ...record,
        date: selectedDate,
        trainerId: trainer.id,
        trainerName: trainer.name,
        batchId: record.batchId || schedule.primaryBatchId || "BATCH-DEFAULT",
        status: "PRESENT",
        checkInTime: record.checkInTime,
        checkOutTime: nowTime,
        durationMinutes,
        notes: record.notes || `Checked out at ${nowTime}`,
      });
      toast.success(`${trainer.name} checked out at ${nowTime}.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check out trainer:", err);
      toast.error(err?.message || "Failed to check out faculty coach.");
    }
  };

  // ─── 6. Bulk Mark Present ────────────────────────────────────────────────────
  const handleMarkAllPresent = async () => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Bulk check-in is permitted only for the current day.");
    }

    const eligibleCoaches = trainers.filter((t) => {
      if (t.status === "Inactive") return false;
      const rec = dailyRecordsMap[t.id];
      if (rec?.checkInTime) return false;
      const access = checkTrainerScheduleAccess(selectedDate, t, batches);
      return access.isAllowed;
    });

    if (eligibleCoaches.length === 0) {
      return toast.error("No eligible coaches currently have an open shift to mark present.");
    }

    setIsBulkSubmitting(true);
    const nowTime = getCurrentTimeString();

    try {
      await Promise.all(
        eligibleCoaches.map((t) => {
          const schedule = getTrainerScheduleDetails(t, batches, selectedDate);
          return recordTrainerLog({
            date: selectedDate,
            trainerId: t.id,
            trainerName: t.name,
            batchId: schedule.primaryBatchId || t.batchIds?.[0] || "BATCH-DEFAULT",
            status: "PRESENT",
            checkInTime: nowTime,
            durationMinutes: 60,
            attendeesCount: 0,
            notes: `Bulk checked in on ${selectedDate} at ${nowTime}`,
          });
        })
      );
      toast.success(`Marked all ${eligibleCoaches.length} eligible coaches present.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to bulk check in trainers:", err);
      toast.error("Failed to mark all coaches present.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // ─── 7. View Record Modal Handler ─────────────────────────────────────────────
  const onOpenViewModal = (trainer, record) => {
    const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);
    setViewModalTrainer(trainer);
    setViewModalRecord(record);
    setViewModalSchedule(schedule);
    setIsViewModalOpen(true);
  };

  // ─── 8. Substitute Modal Handlers ─────────────────────────────────────────────
  const handleOpenSubstituteModal = (trainer = null, batchId = null, log = null) => {
    const defaultTrainer = trainer || trainers[0];
    const defaultBatchId =
      log?.batchId ||
      batchId ||
      defaultTrainer?.batchIds?.[0] ||
      batches[0]?.id ||
      "";

    const priId =
      log?.status === "SUBSTITUTE"
        ? log.substituteTrainerId || defaultTrainer?.id || ""
        : defaultTrainer?.id || "";

    const subId =
      log?.status === "SUBSTITUTE" ? log.trainerId || "" : "";

    setSubstituteForm({
      batchId: defaultBatchId,
      primaryTrainerId: priId,
      substituteTrainerId: subId,
      date: log?.date || selectedDate || new Date().toISOString().slice(0, 10),
      reason: log?.notes || "",
    });
    setIsSubstituteModalOpen(true);
  };

  const handleAssignSubstitute = async (e) => {
    e.preventDefault();
    if (!substituteForm.batchId) {
      toast.error("Please select a batch container.");
      return;
    }
    if (!substituteForm.substituteTrainerId) {
      toast.error("Please select a substitute coach.");
      return;
    }
    if (substituteForm.substituteTrainerId === substituteForm.primaryTrainerId) {
      toast.error("Substitute coach cannot be the same as the primary coach.");
      return;
    }

    setIsSubstituteSubmitting(true);
    const subTrainer = trainers.find((t) => t.id === substituteForm.substituteTrainerId);
    const priTrainer = trainers.find((t) => t.id === substituteForm.primaryTrainerId);
    const chosenBatch = batches.find((b) => b.id === substituteForm.batchId);

    try {
      await recordTrainerLog({
        date: substituteForm.date || selectedDate || new Date().toISOString().slice(0, 10),
        trainerId: substituteForm.substituteTrainerId,
        trainerName: subTrainer?.name || "Substitute Coach",
        batchId: substituteForm.batchId,
        batchName: chosenBatch?.name || substituteForm.batchId,
        status: "SUBSTITUTE",
        substituteTrainerId: substituteForm.primaryTrainerId || null,
        durationMinutes: 60,
        attendeesCount: 15,
        notes: substituteForm.reason || `Substitute coach for ${priTrainer?.name || "Primary Coach"}`,
      });

      toast.success(
        `${subTrainer?.name || "Coach"} assigned as substitute coach${chosenBatch ? ` for ${chosenBatch.name}` : ""}!`
      );
      setIsSubstituteModalOpen(false);
      setSubstituteForm({
        batchId: "",
        primaryTrainerId: "",
        substituteTrainerId: "",
        date: selectedDate || new Date().toISOString().slice(0, 10),
        reason: "",
      });
      loadDailyLogs();
      if (viewMode === "monthly") loadMonthlyLogs();
    } catch (err) {
      console.error("Failed to assign substitute coach:", err);
      toast.error("Failed to assign substitute coach.");
    } finally {
      setIsSubstituteSubmitting(false);
    }
  };

  // ─── 9. Manual Class Conduction Log Modal ─────────────────────────────────────
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalFormData.trainerId || !modalFormData.batchId) {
      toast.error("Trainer and batch container are required.");
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

  // ─── 10. Filtered Faculty Computation ────────────────────────────────────────
  const filteredTrainers = useMemo(() => {
    const isPast = isDatePast(selectedDate);
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

      // Status filter
      if (statusFilter !== "ALL") {
        const record = dailyRecordsMap[t.id];
        const scheduleAccess = checkTrainerScheduleAccess(selectedDate, t, batches);
        const periodExpired = isTrainerAttendancePeriodExpired(selectedDate, t, batches);
        const effectiveStatus = getEffectiveTrainerStatus(
          t,
          record,
          scheduleAccess,
          isPast,
          periodExpired
        );
        if (effectiveStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [trainers, selectedShift, searchQuery, statusFilter, selectedDate, dailyRecordsMap, batches]);

  // Daily KPIs
  const dailyKpis = useMemo(() => {
    return calculateTrainerDailyKpis(trainers, dailyRecordsMap, selectedDate, batches);
  }, [trainers, dailyRecordsMap, selectedDate, batches]);

  // Monthly Faculty Summary Matrix
  const monthlySummary = useMemo(() => {
    const summaryMap = {};
    const allowance = monthlyLeaveSummary?.monthlyAllowance ?? 2;
    const deductionRate = monthlyLeaveSummary?.deductionPerDay ?? 1000;

    trainers.forEach((t) => {
      summaryMap[t.id] = {
        trainer: t,
        conductedCount: 0,
        substituteDeliveredCount: 0,
        substituteCoveredCount: 0,
        totalMinutes: 0,
        totalAttendees: 0,
        leaveDates: new Set(),
      };
    });

    monthlyLogs.forEach((log) => {
      // Primary coach log
      if (summaryMap[log.trainerId]) {
        if (log.status === "CONDUCTED" || log.status === "PRESENT") {
          summaryMap[log.trainerId].conductedCount++;
          summaryMap[log.trainerId].totalMinutes += log.durationMinutes || 60;
          summaryMap[log.trainerId].totalAttendees += log.attendeesCount || 0;
        } else if (log.status === "SUBSTITUTE") {
          summaryMap[log.trainerId].substituteCoveredCount++;
        } else if (log.status === "LEAVE") {
          summaryMap[log.trainerId].leaveDates.add(log.date);
        }
      }

      // Substitute coach stepped in
      if (log.substituteTrainerId && summaryMap[log.substituteTrainerId]) {
        summaryMap[log.substituteTrainerId].substituteDeliveredCount++;
        summaryMap[log.substituteTrainerId].totalMinutes += log.durationMinutes || 60;
        summaryMap[log.substituteTrainerId].totalAttendees += log.attendeesCount || 0;
      }
    });

    return Object.values(summaryMap).map((item) => {
      // Cross reference with backend summary aggregation if present
      const beItem = monthlyLeaveSummary?.trainersSummary?.find(
        (ts) => ts.trainerId === item.trainer.id
      );

      const leaveDaysCount = Math.max(item.leaveDates.size, beItem?.approvedDays ?? 0);
      const paidLeaveDays = Math.min(leaveDaysCount, allowance);
      const unpaidLeaveDays = Math.max(0, leaveDaysCount - allowance);
      const deductionAmount = unpaidLeaveDays * deductionRate;
      const remainingBalance = Math.max(0, allowance - leaveDaysCount);

      return {
        ...item,
        leaveDaysCount,
        monthlyAllowance: allowance,
        paidLeaveDays,
        unpaidLeaveDays,
        remainingBalance,
        deductionAmount,
      };
    });
  }, [trainers, monthlyLogs, monthlyLeaveSummary]);

  // Monthly Substitute Sessions List
  const monthlySubstituteLogs = useMemo(() => {
    return monthlyLogs.filter(
      (l) => l.status === "SUBSTITUTE" || Boolean(l.substituteTrainerId)
    );
  }, [monthlyLogs]);

  // Pagination State for Daily Faculty Roster
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 5;
  useEffect(() => {
    setDailyPage(1);
  }, [selectedShift, searchQuery, selectedDate, statusFilter]);

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

  const handleOpenLeaveDrawer = (trainer = null) => {
    setLeaveDrawerTrainer(trainer);
    setIsLeaveDrawerOpen(true);
  };

  const handleLeaveSubmitted = async () => {
    await Promise.all([loadDailyLogs(), loadMonthlyLogs()]);
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
            Faculty shift, daily check-in / check-out operations and substitute Trainer reassignments.
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
              <span>Daily Check-In</span>
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
            <button
              type="button"
              onClick={() => setViewMode("leaveTracker")}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "leaveTracker"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CalendarOff size={15} />
              <span>Leave Tracker</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenSubstituteModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:bg-accent/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCheck size={15} />
            <span>Assign Substitute</span>
          </button>
        </div>
      </div>


      {/* ─── Control Bar: Shift & Date / Month Navigator (Daily / Monthly) ─── */}
      {viewMode !== "leaveTracker" && (
        <>
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

          {/* ─── Top KPI Cards ──────────────────────────────────────────────── */}
          <TrainerAttendanceStats dailyKpis={dailyKpis} selectedDate={selectedDate} />
        </>
      )}

      {/* ─── VIEW 1: DAILY FACULTY CHECK-IN TABLE ────────────────────────────── */}
      {viewMode === "daily" && (
        <TrainerDailyCheckInTable
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          handleMarkAllPresent={handleMarkAllPresent}
          isBulkSubmitting={isBulkSubmitting}
          isLoadingDaily={isLoading}
          filteredTrainers={filteredTrainers}
          paginatedTrainers={paginatedTrainers}
          dailyRecordsMap={dailyRecordsMap}
          handleQuickCheckIn={handleQuickCheckIn}
          handleQuickCheckOut={handleQuickCheckOut}
          handleOpenSubstituteModal={handleOpenSubstituteModal}
          onOpenViewModal={onOpenViewModal}
          onOpenLeaveDrawer={handleOpenLeaveDrawer}
          batches={batches}
          selectedDate={selectedDate}
        />
      )}

      {/* ─── VIEW 2: MONTHLY FACULTY SUMMARY MATRIX ──────────────────────────── */}
      {viewMode === "monthly" && (
        <TrainerMonthlyLedger
          formattedSelectedMonth={formattedSelectedMonth}
          paginatedMonthlySummary={paginatedMonthlySummary}
          monthlySubstituteLogs={monthlySubstituteLogs}
          monthlyLeaveSummary={monthlyLeaveSummary}
          monthlyLeaves={monthlyLeaves}
          onOpenLeaveDrawer={handleOpenLeaveDrawer}
        />
      )}

      {/* ─── VIEW 3: CENTRALIZED LEAVE TRACKER & APPROVAL WORKFLOW ─────────── */}
      {viewMode === "leaveTracker" && (
        <TrainerLeaveTrackerView
          trainers={trainers}
          batches={batches}
          onOpenLeaveDrawer={handleOpenLeaveDrawer}
          onLeavesUpdated={handleLeaveSubmitted}
        />
      )}

      {/* Fixed / Sticky Viewport Bottom Pagination (Daily & Monthly) */}
      {viewMode !== "leaveTracker" && (
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
      )}

      {/* ─── MODAL: Manual Shift Conduction ─────────────────────────────────── */}
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

      {/* ─── MODAL: View Historical Faculty Attendance Record ────────────────── */}
      <TrainerAttendanceDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        trainer={viewModalTrainer}
        record={viewModalRecord}
        selectedDate={selectedDate}
        scheduleDetails={viewModalSchedule}
      />

      {/* ─── MODAL: Designate Substitute Coach (Shared Standard Form) ────────── */}
      <SubstituteCoachModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
        batches={batches}
        trainers={trainers}
        allTrainers={trainers}
        substituteForm={substituteForm}
        setSubstituteForm={setSubstituteForm}
        onAssignSubstitute={handleAssignSubstitute}
        isSubmitting={isSubstituteSubmitting}
      />

      {/* ─── DRAWER: Faculty Leave Request Panel ──────────────────────────────── */}
      <TrainerLeaveRequestDrawer
        isOpen={isLeaveDrawerOpen}
        onClose={() => setIsLeaveDrawerOpen(false)}
        trainer={leaveDrawerTrainer}
        trainers={trainers}
        batches={batches}
        onLeaveSubmitted={handleLeaveSubmitted}
      />
    </div>
  );
}

