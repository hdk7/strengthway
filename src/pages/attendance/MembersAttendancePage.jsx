/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { getBatches, getBatchEffectiveAttendees } from "@/lib/batchesService";
import {
  getBatchAttendanceGrid,
  markAttendance,
  bulkMarkAttendance,
  getDailyAttendanceRecords,
} from "@/lib/attendanceService";
import { Pagination } from "@/components/table";
import { MemberAttendanceHeader } from "./MemberAttendanceHeader";
import { MemberAttendanceStats } from "./MemberAttendanceStats";
import { MemberAttendanceToolbar } from "./MemberAttendanceToolbar";
import { MemberDailyCheckInTable } from "./MemberDailyCheckInTable";
import { MemberMonthlyMatrixTable } from "./MemberMonthlyMatrixTable";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { AttendanceEditModal } from "./AttendanceEditModal";
import {
  DAY_NAMES,
  exportMatrixCSV,
  getTodayDateString,
  getCurrentTimeString,
  isDateToday,
  isDatePast,
  isDateFuture,
  isAttendancePeriodExpired,
  checkBatchScheduleAccess,
  calculateDailyKpis,
} from "./memberAttendanceUtils";

export default function MembersAttendancePage() {
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "matrix"
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Data State
  const [batches, setBatches] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [dailyAttendees, setDailyAttendees] = useState([]);
  const [dailyRecordsMap, setDailyRecordsMap] = useState({});
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Matrix View State
  const [matrixData, setMatrixData] = useState(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // Modals
  const [viewModalData, setViewModalData] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Filters & Search: All, Present, Absent
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const isToday = isDateToday(selectedDate);
  const isPast = isDatePast(selectedDate);
  const isFuture = isDateFuture(selectedDate);
  const periodExpired = isAttendancePeriodExpired(selectedDate, currentBatch);

  // 1. Load Batches on Mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingBatches(true);
    getBatches()
      .then((list) => {
        if (cancelled) return;
        const valid = Array.isArray(list) ? list : [];
        setBatches(valid);
        if (valid.length > 0) {
          setSelectedBatchId((prev) => prev || valid[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load batches:", err);
        toast.error("Failed to load gym batches.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDayOfWeek = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return DAY_NAMES[d.getDay()] || "";
    } catch {
      return "";
    }
  }, [selectedDate]);

  // 2. Load Daily Attendees & Attendance Records
  const loadDailyData = useCallback(async () => {
    if (!selectedBatchId || !selectedDate) return;
    setIsLoadingDaily(true);
    try {
      const rosterRes = await getBatchEffectiveAttendees(selectedBatchId, selectedDate);
      setDailyAttendees(rosterRes?.attendees || []);

      const recordsRes = await getDailyAttendanceRecords({
        batchId: selectedBatchId,
        date: selectedDate,
      });

      const map = {};
      if (Array.isArray(recordsRes)) {
        recordsRes.forEach((rec) => {
          map[rec.memberId] = rec;
        });
      }
      setDailyRecordsMap(map);
    } catch (err) {
      console.error("Failed to load daily attendance data:", err);
      toast.error("Failed to load daily attendance roster.");
    } finally {
      setIsLoadingDaily(false);
    }
  }, [selectedBatchId, selectedDate]);

  useEffect(() => {
    if (viewMode === "daily") {
      loadDailyData();
    }
  }, [viewMode, selectedBatchId, selectedDate, loadDailyData]);

  // 3. Load Monthly Attendance Matrix
  const loadMatrixData = useCallback(async () => {
    if (!selectedBatchId || !selectedMonth) return;
    setIsLoadingMatrix(true);
    try {
      const data = await getBatchAttendanceGrid(selectedBatchId, selectedMonth);
      setMatrixData(data);
    } catch (err) {
      console.error("Failed to load attendance matrix:", err);
      toast.error("Failed to load monthly attendance grid.");
    } finally {
      setIsLoadingMatrix(false);
    }
  }, [selectedBatchId, selectedMonth]);

  useEffect(() => {
    if (viewMode === "matrix") {
      loadMatrixData();
    }
  }, [viewMode, selectedBatchId, selectedMonth, loadMatrixData]);

  // 4. Quick Check-In (Automatically Marks Status as Present)
  const handleQuickCheckIn = async (attendee) => {
    if (!isToday) return toast.error("Check-in is permitted only for the current day.");
    const attendeeBatch = (attendee.batchId && batches.find((b) => b.id === attendee.batchId)) || currentBatch;
    const access = checkBatchScheduleAccess(selectedDate, attendeeBatch);
    if (!access.isAllowed) return toast.error(access.reason);

    const nowTime = getCurrentTimeString();
    try {
      const result = await markAttendance({
        batchId: selectedBatchId,
        memberId: attendee.memberId,
        memberName: attendee.name,
        date: selectedDate,
        status: "PRESENT",
        checkInTime: nowTime,
        isFlexAttendance: Boolean(attendee.isFlexIn),
        originalPrimaryBatchId: attendee.primaryBatchId || attendee.batchId,
        assignmentId: attendee.assignmentId || undefined,
        markedBy: "Admin Faculty",
      });
      setDailyRecordsMap((prev) => ({ ...prev, [attendee.memberId]: result }));
      toast.success(`${attendee.name} checked in (Status: Present).`);
    } catch (err) {
      toast.error(err?.message || "Failed to check in athlete.");
    }
  };

  // 5. Quick Check-Out (Available ONLY after check-in, records checkOutTime)
  const handleQuickCheckOut = async (attendee, record) => {
    if (!isToday) return toast.error("Check-out is permitted only for the current day.");
    if (!record?.checkInTime) return toast.error("Check Out is available only after a successful check-in.");

    const nowTime = getCurrentTimeString();
    try {
      const result = await markAttendance({
        batchId: selectedBatchId,
        memberId: attendee.memberId,
        memberName: attendee.name,
        date: selectedDate,
        status: "PRESENT",
        checkInTime: record.checkInTime,
        checkOutTime: nowTime,
        isFlexAttendance: Boolean(attendee.isFlexIn || record?.isFlexAttendance),
        originalPrimaryBatchId: attendee.primaryBatchId || attendee.batchId,
        assignmentId: attendee.assignmentId || record?.assignmentId || undefined,
        markedBy: "Admin Faculty",
      });
      setDailyRecordsMap((prev) => ({ ...prev, [attendee.memberId]: result }));
      toast.success(`${attendee.name} checked out at ${nowTime}.`);
    } catch (err) {
      toast.error(err?.message || "Failed to check out athlete.");
    }
  };

  // 6. Bulk Mark Present
  const handleMarkAllPresent = async () => {
    if (!isToday) {
      toast.error("Bulk attendance is permitted only for the current day.");
      return;
    }

    const currentAccess = checkBatchScheduleAccess(selectedDate, currentBatch);
    if (!currentAccess.isAllowed) {
      toast.error(currentAccess.reason);
      return;
    }

    const eligibleAttendees = dailyAttendees.filter((a) => !a.isFlexOut);
    if (eligibleAttendees.length === 0) {
      toast.error("No eligible athletes to mark present.");
      return;
    }

    setIsBulkSubmitting(true);
    const nowTime = getCurrentTimeString();
    const records = eligibleAttendees.map((a) => ({
      memberId: a.memberId,
      memberName: a.name,
      status: "PRESENT",
      checkInTime: nowTime,
      isFlexAttendance: Boolean(a.isFlexIn),
      originalPrimaryBatchId: a.primaryBatchId || a.batchId,
      assignmentId: a.assignmentId,
    }));

    try {
      const res = await bulkMarkAttendance({
        batchId: selectedBatchId,
        date: selectedDate,
        attendees: records,
        markedBy: "Admin Faculty",
      });

      const updatedMap = { ...dailyRecordsMap };
      (res?.records || []).forEach((r) => {
        updatedMap[r.memberId] = r;
      });
      setDailyRecordsMap(updatedMap);
      toast.success(`Marked all ${records.length} athletes present.`);
    } catch (err) {
      toast.error(err?.message || "Failed to bulk mark attendance.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // 7. Modals
  const handleOpenViewModal = (attendee, record, date) => {
    const effectiveDate = date || selectedDate;
    if (isDateFuture(effectiveDate)) return toast.error("Future attendance records are disabled and cannot be viewed.");
    setViewModalData({ attendee, record: record || dailyRecordsMap[attendee?.memberId], date: effectiveDate });
  };

  const handleOpenEditModal = (attendee, record, date) => {
    const effectiveDate = date || selectedDate;
    if (!isDateToday(effectiveDate)) return toast.error("Editing attendance is permitted only for the current day.");
    const attendeeBatch = (attendee?.batchId && batches.find((b) => b.id === attendee.batchId)) || currentBatch;
    const access = checkBatchScheduleAccess(effectiveDate, attendeeBatch);
    if (!access.isAllowed && !record?.checkInTime) return toast.error(access.reason);
    setEditModalData({ attendee, record: record || dailyRecordsMap[attendee?.memberId], date: effectiveDate });
  };

  const handleSaveEditModal = async (payload) => {
    setIsSubmittingEdit(true);
    try {
      const result = await markAttendance({ ...payload, batchId: selectedBatchId, markedBy: "Admin Faculty" });
      setDailyRecordsMap((prev) => ({ ...prev, [payload.memberId]: result }));
      if (viewMode === "matrix") loadMatrixData();
      toast.success(`${payload.memberName || "Athlete"} attendance saved.`);
      setEditModalData(null);
    } catch (err) {
      toast.error(err?.message || "Failed to save attendance.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 8. Filtered Attendees (All, Present, Absent)
  const filteredAttendees = useMemo(() => {
    return dailyAttendees.filter((attendee) => {
      const record = dailyRecordsMap[attendee.memberId];
      const isCheckedIn = Boolean(record?.checkInTime || record?.status === "PRESENT");
      const isAbsent = record?.status === "ABSENT" || (!isCheckedIn && (isPast || periodExpired));

      if (statusFilter === "PRESENT" && !isCheckedIn) return false;
      if (statusFilter === "ABSENT" && !isAbsent) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          attendee.name?.toLowerCase().includes(q) ||
          attendee.memberId?.toLowerCase().includes(q) ||
          attendee.mobile?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dailyAttendees, dailyRecordsMap, statusFilter, searchQuery, isPast, periodExpired]);

  // 9. Daily KPIs
  const dailyKpis = useMemo(() => {
    return calculateDailyKpis(dailyAttendees, dailyRecordsMap, selectedDate, currentBatch);
  }, [dailyAttendees, dailyRecordsMap, selectedDate, currentBatch]);

  // Pagination
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 8;
  useEffect(() => {
    setDailyPage(1);
  }, [searchQuery, statusFilter, selectedBatchId, selectedDate]);

  const totalDailyPages = Math.max(1, Math.ceil(filteredAttendees.length / dailyPageSize));
  const safeDailyPage = Math.max(1, Math.min(dailyPage, totalDailyPages));
  const paginatedAttendees = useMemo(() => {
    const start = (safeDailyPage - 1) * dailyPageSize;
    return filteredAttendees.slice(start, start + dailyPageSize);
  }, [filteredAttendees, safeDailyPage, dailyPageSize]);

  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPageSize = 10;
  useEffect(() => {
    setMatrixPage(1);
  }, [selectedBatchId, selectedMonth]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const matrixMembers = matrixData?.members || [];
  const totalMatrixPages = Math.max(1, Math.ceil(matrixMembers.length / matrixPageSize));
  const safeMatrixPage = Math.max(1, Math.min(matrixPage, totalMatrixPages));
  const paginatedMatrixMembers = useMemo(() => {
    const start = (safeMatrixPage - 1) * matrixPageSize;
    return matrixMembers.slice(start, start + matrixPageSize);
  }, [matrixMembers, safeMatrixPage, matrixPageSize]);

  const formattedSelectedMonth = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      <MemberAttendanceHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleExportMatrixCSV={() => exportMatrixCSV(matrixData, selectedMonth)}
      />

      <MemberAttendanceToolbar
        selectedBatchId={selectedBatchId}
        setSelectedBatchId={setSelectedBatchId}
        batches={batches}
        isLoadingBatches={isLoadingBatches}
        currentBatch={currentBatch}
        viewMode={viewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDayOfWeek={selectedDayOfWeek}
        handlePrevDay={() => setSelectedDate((d) => {
          const dt = new Date(d);
          dt.setDate(dt.getDate() - 1);
          return dt.toISOString().slice(0, 10);
        })}
        handleNextDay={() => setSelectedDate((d) => {
          const dt = new Date(d);
          dt.setDate(dt.getDate() + 1);
          return dt.toISOString().slice(0, 10);
        })}
        handleToday={() => setSelectedDate(getTodayDateString())}
        loadDailyData={loadDailyData}
        isLoadingDaily={isLoadingDaily}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        formattedSelectedMonth={formattedSelectedMonth}
        handlePrevMonth={() => setSelectedMonth((m) => {
          const [y, mon] = m.split("-").map(Number);
          return new Date(y, mon - 2, 1).toISOString().slice(0, 7);
        })}
        handleNextMonth={() => setSelectedMonth((m) => {
          const [y, mon] = m.split("-").map(Number);
          return new Date(y, mon, 1).toISOString().slice(0, 7);
        })}
        loadMatrixData={loadMatrixData}
        isLoadingMatrix={isLoadingMatrix}
      />

      <MemberAttendanceStats dailyKpis={dailyKpis} />

      {viewMode === "daily" && (
        <MemberDailyCheckInTable
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          handleMarkAllPresent={handleMarkAllPresent}
          isBulkSubmitting={isBulkSubmitting}
          isLoadingDaily={isLoadingDaily}
          filteredAttendees={filteredAttendees}
          paginatedAttendees={paginatedAttendees}
          dailyRecordsMap={dailyRecordsMap}
          handleQuickCheckIn={handleQuickCheckIn}
          handleQuickCheckOut={handleQuickCheckOut}
          onOpenViewModal={handleOpenViewModal}
          currentBatch={currentBatch}
          batches={batches}
          selectedDate={selectedDate}
        />
      )}

      {viewMode === "matrix" && (
        <MemberMonthlyMatrixTable
          currentBatch={currentBatch}
          handleExportMatrixCSV={() => exportMatrixCSV(matrixData, selectedMonth)}
          isLoadingMatrix={isLoadingMatrix}
          matrixData={matrixData}
          selectedMonth={selectedMonth}
          paginatedMatrixMembers={paginatedMatrixMembers}
          formattedSelectedMonth={formattedSelectedMonth}
          onOpenEditModal={handleOpenEditModal}
          onOpenViewModal={handleOpenViewModal}
        />
      )}

      <Pagination
        currentPage={viewMode === "daily" ? safeDailyPage : safeMatrixPage}
        totalPages={viewMode === "daily" ? totalDailyPages : totalMatrixPages}
        totalItems={viewMode === "daily" ? filteredAttendees.length : matrixMembers.length}
        pageSize={viewMode === "daily" ? dailyPageSize : matrixPageSize}
        onPageChange={(p) => (viewMode === "daily" ? setDailyPage(p) : setMatrixPage(p))}
        itemLabel="athletes"
        compact
        className="shrink-0 mt-auto"
      />

      <AttendanceDetailModal
        isOpen={Boolean(viewModalData)}
        onClose={() => setViewModalData(null)}
        attendee={viewModalData?.attendee}
        record={viewModalData?.record}
        selectedDate={viewModalData?.date || selectedDate}
        batchName={currentBatch?.name}
      />

      <AttendanceEditModal
        isOpen={Boolean(editModalData)}
        onClose={() => setEditModalData(null)}
        attendee={editModalData?.attendee}
        record={editModalData?.record}
        selectedDate={editModalData?.date || selectedDate}
        batchName={currentBatch?.name}
        onSave={handleSaveEditModal}
        isSubmitting={isSubmittingEdit}
      />
    </div>
  );
}
