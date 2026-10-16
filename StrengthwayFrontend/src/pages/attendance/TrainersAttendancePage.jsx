/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarCheck,
  Grid3X3,
  UserCheck,
  CalendarOff,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { getTrainers } from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import {
  recordTrainerLog,
  getAllTrainerLogs,
  trainerCheckIn,
  trainerCheckOut,
  trainerAddAnotherSession,
  getTrainerDailySchedule,
  getTrainerIntervals,
  adminOverrideTrainerAttendance,
} from "@/lib/attendanceService";
import { isAdmin, isTrainer, getCurrentUser } from "@/auth/currentUser";
import { Pagination } from "@/components/table";
import { TrainerAttendanceStats } from "./TrainerAttendanceStats";
import { TrainerAttendanceModal } from "./TrainerAttendanceModal";
import { TrainerDailyCheckInTable } from "./TrainerDailyCheckInTable";
import { TrainerMonthlyLedger } from "./TrainerMonthlyLedger";
import { TrainerAttendanceToolbar } from "./TrainerAttendanceToolbar";
import { TrainerAttendanceDetailModal } from "./TrainerAttendanceDetailModal";
import { TrainerLeaveRequestDrawer } from "./TrainerLeaveRequestDrawer";
import { TrainerLeaveTrackerView } from "./TrainerLeaveTrackerView";
import { AttendanceAuditModal } from "./AttendanceAuditModal";
import {
  getTrainerLeaves,
  getTrainerLeaveMonthlySummary,
} from "@/lib/trainerLeaveService";
import { getCurrentYearMonth } from "@/components/ui/MonthPicker";

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
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth());
  const [selectedShift, setSelectedShift] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PRESENT" | "ABSENT" | "LEAVE"
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainerLogs, setTrainerLogs] = useState([]);
  const [trainerIntervals, setTrainerIntervals] = useState([]);
  const [trainerSchedulesMap, setTrainerSchedulesMap] = useState({});
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [monthlyLeaveSummary, setMonthlyLeaveSummary] = useState(null);
  const [monthlyLeaves, setMonthlyLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

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

  // ─── 2. Load Daily Logs, Intervals & Trainer Schedules ─────────────────────────
  const loadDailyLogs = useCallback(async () => {
    try {
      const [logs, intervals] = await Promise.all([
        getAllTrainerLogs({ date: selectedDate }),
        getTrainerIntervals({ date: selectedDate }).catch(() => []),
      ]);
      setTrainerLogs(Array.isArray(logs) ? logs : []);
      setTrainerIntervals(Array.isArray(intervals) ? intervals : []);

      if (trainers.length > 0) {
        const schedulePromises = trainers.map((t) =>
          getTrainerDailySchedule(t.id, selectedDate).catch(() => null)
        );
        const schedules = await Promise.all(schedulePromises);
        const schedMap = {};
        schedules.forEach((sch) => {
          if (sch?.trainerId) {
            schedMap[sch.trainerId] = sch;
          }
        });
        setTrainerSchedulesMap(schedMap);
      }
    } catch (err) {
      console.error("Failed to load daily trainer logs & intervals:", err);
    }
  }, [selectedDate, trainers]);

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

  // Daily continuous intervals map keyed by trainerId
  const trainerIntervalsMap = useMemo(() => {
    const map = {};
    (trainerIntervals || []).forEach((inv) => {
      if (inv.trainerId) {
        map[inv.trainerId] = inv;
      }
    });
    return map;
  }, [trainerIntervals]);

  // ─── 4. Quick Check-In (Supports Consecutive Sessions & Continuous Shift) ────
  const handleQuickCheckIn = async (trainer) => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Check-in is permitted only for the current day.");
    }
    const access = checkTrainerScheduleAccess(selectedDate, trainer, batches);
    if (!access.isAllowed && !isAdmin()) {
      return toast.error(access.reason);
    }

    const nowTime = getCurrentTimeString();

    try {
      await trainerCheckIn({
        date: selectedDate,
        trainerId: trainer.id,
        checkInTime: nowTime,
        isAdminOverride: !access.isAllowed && isAdmin(),
        overrideReason: !access.isAllowed && isAdmin() ? "Admin shift window override" : undefined,
      });
      toast.success(`${trainer.name} checked in (Status: Present).`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check in trainer:", err);
      toast.error(err?.message || "Failed to check in faculty coach.");
    }
  };

  // ─── 5. Quick Check-Out (Calculates Overlap & Excludes Off-Schedule Time) ───────
  const handleQuickCheckOut = async (trainer, record) => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Check-out is permitted only for the current day.");
    }
    if (!record?.checkInTime) {
      return toast.error("Check Out is available only after a successful check-in.");
    }

    const nowTime = getCurrentTimeString();

    try {
      await trainerCheckOut({
        date: selectedDate,
        trainerId: trainer.id,
        intervalId: record.intervalId || record.id,
        sessionId: record.sessionId,
        checkOutTime: nowTime,
      });
      toast.success(`${trainer.name} checked out at ${nowTime}.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check out trainer:", err);
      toast.error(err?.message || "Failed to check out faculty coach.");
    }
  };

  // ─── 4b. Session-Specific Quick Check-In (Targeted Session Window) ────────────
  const handleQuickCheckInSession = async ({ trainerId, date, sessionId, batchId }) => {
    const targetDate = date || selectedDate;
    if (!isDateToday(targetDate) && !isAdmin()) {
      return toast.error("Check-in is permitted only for the current day.");
    }
    const trainerObj = trainers.find((t) => t.id === trainerId);
    const nowTime = getCurrentTimeString();
    try {
      await trainerCheckIn({
        date: targetDate,
        trainerId,
        sessionId,
        batchId,
        checkInTime: nowTime,
        isAdminOverride: isAdmin(),
        overrideReason: isAdmin() ? "Admin recorded session check-in" : undefined,
      });
      toast.success(`${trainerObj?.name || "Trainer"} checked in for scheduled session.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check in trainer session:", err);
      toast.error(err?.message || "Failed to check in session.");
    }
  };

  // ─── 5c. Session-Specific Quick Check-Out (Targeted Session Window) ───────────
  const handleQuickCheckOutSession = async ({ trainerId, date, sessionId, batchId }) => {
    const targetDate = date || selectedDate;
    if (!isDateToday(targetDate) && !isAdmin()) {
      return toast.error("Check-out is permitted only for the current day.");
    }
    const trainerObj = trainers.find((t) => t.id === trainerId);
    const nowTime = getCurrentTimeString();
    try {
      await trainerCheckOut({
        date: targetDate,
        trainerId,
        sessionId,
        batchId,
        checkOutTime: nowTime,
        isAdminOverride: isAdmin(),
        overrideReason: isAdmin() ? "Admin recorded session check-out" : undefined,
      });
      toast.success(`${trainerObj?.name || "Trainer"} checked out of scheduled session.`);
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to check out trainer session:", err);
      toast.error(err?.message || "Failed to check out session.");
    }
  };

  // ─── 5b. Add Another Session (Consecutive Session Transition) ────────────────
  const handleTrainerAddAnotherSession = async (trainer, currentSession, nextSession) => {
    if (!isDateToday(selectedDate)) {
      return toast.error("Session transitions are permitted only for the current day.");
    }
    const nowTime = getCurrentTimeString();
    try {
      await trainerAddAnotherSession({
        trainerId: trainer.id,
        date: selectedDate,
        currentSessionId: currentSession.id || currentSession.sessionId,
        nextSessionId: nextSession.id || nextSession.sessionId,
        transitionTime: nowTime,
      });
      toast.success(
        `Transitioned from ${currentSession.batchName || currentSession.id} to ${nextSession.batchName || nextSession.id}.`
      );
      loadDailyLogs();
    } catch (err) {
      console.error("Failed to add consecutive session:", err);
      toast.error(err?.message || "Failed to transition to next session.");
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

  // ─── 8. Manual Class Conduction Log Modal / Admin Override ─────────────────────
  const handleOpenEditModal = (trainer, sessionOrRecord = null) => {
    const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);
    const isSessionObj = sessionOrRecord?.startTime && sessionOrRecord?.endTime;
    const sessionLog = isSessionObj ? sessionOrRecord.attendanceLog : null;
    const actualRecord = isSessionObj ? sessionLog : sessionOrRecord;

    setModalFormData({
      date: selectedDate,
      trainerId: trainer?.id || "",
      batchId: sessionOrRecord?.batchId || actualRecord?.batchId || schedule?.primaryBatchId || trainer?.batchIds?.[0] || "",
      sessionId: isSessionObj ? sessionOrRecord.id : (actualRecord?.sessionId || ""),
      status: actualRecord?.status || "PRESENT",
      checkInTime: actualRecord?.checkInTime || "",
      checkOutTime: actualRecord?.checkOutTime || "",
      durationMinutes: actualRecord?.durationMinutes || 60,
      attendeesCount: actualRecord?.attendeesCount || 0,
      notes: actualRecord?.notes || actualRecord?.remarks || "",
      recordId: actualRecord?.id || "",
      intervalId: actualRecord?.intervalId || "",
      isOverride: Boolean(actualRecord?.checkInTime),
      overrideReason: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!modalFormData.trainerId || (!modalFormData.batchId && !modalFormData.sessionId)) {
      toast.error("Coach and batch container / scheduled session are required.");
      return;
    }

    if (modalFormData.isOverride && (!modalFormData.overrideReason || !modalFormData.overrideReason.trim())) {
      toast.error("Override reason is mandatory for manual attendance entries and corrections.");
      return;
    }

    setIsSubmitting(true);
    const trainerObj = trainers.find((t) => t.id === modalFormData.trainerId);
    const nowTime = getCurrentTimeString();

    try {
      if (modalFormData.isOverride) {
        await adminOverrideTrainerAttendance({
          recordId: modalFormData.recordId,
          trainerId: modalFormData.trainerId,
          batchId: modalFormData.batchId,
          sessionId: modalFormData.sessionId,
          intervalId: modalFormData.intervalId,
          date: modalFormData.date,
          status: modalFormData.status,
          checkInTime: modalFormData.checkInTime || nowTime,
          checkOutTime: modalFormData.checkOutTime || "",
          notes: modalFormData.notes,
          reason: modalFormData.overrideReason?.trim() || "Administrative manual attendance adjustment",
        });
        toast.success("Attendance correction saved and audited.");
      } else {
        // Normal attendance mode from modal using server timestamps
        if (!modalFormData.checkInTime) {
          await trainerCheckIn({
            date: modalFormData.date,
            trainerId: modalFormData.trainerId,
            sessionId: modalFormData.sessionId,
            batchId: modalFormData.batchId,
            checkInTime: nowTime,
            isAdminOverride: isAdmin(),
            overrideReason: isAdmin() ? "Admin recorded session check-in" : undefined,
          });
          toast.success(`${trainerObj?.name || "Trainer"} checked in for scheduled session.`);
        } else if (!modalFormData.checkOutTime) {
          await trainerCheckOut({
            date: modalFormData.date,
            trainerId: modalFormData.trainerId,
            sessionId: modalFormData.sessionId,
            batchId: modalFormData.batchId,
            checkOutTime: nowTime,
            isAdminOverride: isAdmin(),
            overrideReason: isAdmin() ? "Admin recorded session check-out" : undefined,
          });
          toast.success(`${trainerObj?.name || "Trainer"} checked out of scheduled session.`);
        } else {
          await recordTrainerLog({
            ...modalFormData,
            trainerName: trainerObj?.name || modalFormData.trainerId,
            durationMinutes: Number(modalFormData.durationMinutes) || 60,
            attendeesCount: Number(modalFormData.attendeesCount) || 0,
          });
          toast.success("Session attendance record saved.");
        }
      }
      setIsModalOpen(false);
      loadDailyLogs();
      if (viewMode === "monthly") loadMonthlyLogs();
    } catch (err) {
      console.error("Failed to save trainer log:", err);
      toast.error(err?.message || "Failed to record class log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 10. Filtered Faculty Computation ────────────────────────────────────────
  const filteredTrainers = useMemo(() => {
    const isPast = isDatePast(selectedDate);
    const currentUser = getCurrentUser();
    const isTrainerUser = isTrainer();

    return trainers.filter((t) => {
      // Role scope: trainer only sees themselves
      if (isTrainerUser && currentUser?.trainerId && t.id !== currentUser.trainerId) {
        return false;
      }

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
    const annualAllowance = monthlyLeaveSummary?.annualAllowance ?? 36;
    const monthlyAllowance = monthlyLeaveSummary?.monthlyAllowance ?? 3;
    const deductionRate = monthlyLeaveSummary?.deductionPerDay ?? 1000;

    trainers.forEach((t) => {
      summaryMap[t.id] = {
        trainer: t,
        conductedCount: 0,
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
        } else if (log.status === "LEAVE") {
          summaryMap[log.trainerId].leaveDates.add(log.date);
        }
      }
    });

    return Object.values(summaryMap).map((item) => {
      // Cross reference with backend summary aggregation if present
      const beItem = monthlyLeaveSummary?.trainersSummary?.find(
        (ts) => ts.trainerId === item.trainer.id
      );

      let leaveDaysCount = item.leaveDates.size;
      let paidLeaveDays = leaveDaysCount;
      let unpaidLeaveDays = 0;
      let deductionAmount = 0;
      let remainingBalance = annualAllowance;
      let trainerAnnualAllowance = annualAllowance;

      if (beItem) {
        leaveDaysCount = Math.max(item.leaveDates.size, beItem.approvedDays ?? 0);
        paidLeaveDays = beItem.paidDays ?? leaveDaysCount;
        unpaidLeaveDays = beItem.unpaidDays ?? 0;
        deductionAmount = beItem.totalDeduction ?? (unpaidLeaveDays * deductionRate);
        remainingBalance = beItem.annualRemainingDays ?? beItem.remainingBalance ?? Math.max(0, annualAllowance - leaveDaysCount);
        trainerAnnualAllowance = beItem.annualAllowance ?? annualAllowance;
      } else {
        paidLeaveDays = Math.min(leaveDaysCount, monthlyAllowance);
        unpaidLeaveDays = Math.max(0, leaveDaysCount - monthlyAllowance);
        deductionAmount = unpaidLeaveDays * deductionRate;
        remainingBalance = Math.max(0, annualAllowance - leaveDaysCount);
      }

      return {
        ...item,
        leaveDaysCount,
        monthlyAllowance,
        annualAllowance: trainerAnnualAllowance,
        annualRemainingDays: remainingBalance,
        paidLeaveDays,
        unpaidLeaveDays,
        remainingBalance,
        deductionAmount,
      };
    });
  }, [trainers, monthlyLogs, monthlyLeaveSummary]);

  // Pagination State for Daily Faculty Roster
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 7;
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
  const monthlyPageSize = 7;
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
            Coach Attendance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Faculty shift, daily check-in / check-out operations, and attendance tracking.
          </p>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          {isAdmin() && (
            <button
              type="button"
              onClick={() => {
                const firstTrainer = filteredTrainers[0] || trainers[0];
                handleOpenEditModal(firstTrainer || null, null);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-accent/40 bg-accent text-accent-foreground hover:bg-accent/90 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <CalendarCheck size={15} />
              <span>Mark Attendance</span>
            </button>
          )}

          {isAdmin() && (
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card hover:bg-muted/60 px-3.5 py-2 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
            >
              <History size={15} className="text-accent" />
              <span>Audit Trail</span>
            </button>
          )}
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
          trainerIntervalsMap={trainerIntervalsMap}
          trainerSchedulesMap={trainerSchedulesMap}
          handleQuickCheckIn={handleQuickCheckIn}
          handleQuickCheckOut={handleQuickCheckOut}
          handleQuickCheckInSession={handleQuickCheckInSession}
          handleQuickCheckOutSession={handleQuickCheckOutSession}
          handleTrainerAddAnotherSession={handleTrainerAddAnotherSession}
          onOpenViewModal={onOpenViewModal}
          onOpenEditModal={handleOpenEditModal}
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
        <div className="shrink-0 mt-auto pt-2 border-t border-border/40 bg-background/95 backdrop-blur-xs">
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
        handleQuickCheckInSession={handleQuickCheckInSession}
        handleQuickCheckOutSession={handleQuickCheckOutSession}
        isSubmitting={isSubmitting}
        trainers={trainers}
        batches={batches}
        selectedDate={selectedDate}
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

      {/* ─── DRAWER: Faculty Leave Request Panel ──────────────────────────────── */}
      <TrainerLeaveRequestDrawer
        isOpen={isLeaveDrawerOpen}
        onClose={() => setIsLeaveDrawerOpen(false)}
        trainer={leaveDrawerTrainer}
        trainers={trainers}
        batches={batches}
        onLeaveSubmitted={handleLeaveSubmitted}
      />

      {/* ─── MODAL: Attendance Audit Trail ─────────────────────────────────── */}
      <AttendanceAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        defaultType="TRAINER"
      />
    </div>
  );
}

