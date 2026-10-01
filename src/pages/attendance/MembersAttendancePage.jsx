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
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Check,
  ExternalLink,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches, getBatchEffectiveAttendees } from "@/lib/batchesService";
import {
  getBatchAttendanceGrid,
  markAttendance,
  bulkMarkAttendance,
  getDailyAttendanceRecords,
} from "@/lib/attendanceService";
import { Pagination } from "@/components/table";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function MembersAttendancePage() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "matrix"
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PRESENT" | "FLEX_IN" | "ABSENT" | "UNMARKED"

  // ─── 1. Load Batches on Mount ────────────────────────────────────────────────
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

  // Selected Batch Object
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Day of week for selected date
  const selectedDayOfWeek = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return DAY_NAMES[d.getDay()] || "";
    } catch {
      return "";
    }
  }, [selectedDate]);

  // ─── 2. Load Daily Attendees & Attendance Records ────────────────────────────
  const loadDailyData = useCallback(async () => {
    if (!selectedBatchId || !selectedDate) return;
    setIsLoadingDaily(true);
    try {
      // 1. Fetch effective attendee roster (primary + flex-in + flex-out markers)
      const rosterRes = await getBatchEffectiveAttendees(selectedBatchId, selectedDate);
      const attendees = rosterRes?.attendees || [];
      setDailyAttendees(attendees);

      // 2. Fetch logged attendance records for this date and batch
      const records = await getDailyAttendanceRecords({
        date: selectedDate,
        batchId: selectedBatchId,
      });

      const map = {};
      (Array.isArray(records) ? records : []).forEach((rec) => {
        if (rec.memberId) {
          map[rec.memberId] = rec;
        }
      });
      setDailyRecordsMap(map);
    } catch (err) {
      console.error("Failed to load daily attendance data:", err);
      toast.error("Failed to load attendance roster.");
    } finally {
      setIsLoadingDaily(false);
    }
  }, [selectedBatchId, selectedDate]);

  useEffect(() => {
    if (viewMode === "daily" && selectedBatchId) {
      loadDailyData();
    }
  }, [viewMode, selectedBatchId, selectedDate, loadDailyData]);

  // ─── 3. Load Monthly Matrix Data ─────────────────────────────────────────────
  const loadMatrixData = useCallback(async () => {
    if (!selectedBatchId || !selectedMonth) return;
    setIsLoadingMatrix(true);
    try {
      const res = await getBatchAttendanceGrid(selectedBatchId, selectedMonth);
      setMatrixData(res);
    } catch (err) {
      console.error("Failed to load monthly attendance grid:", err);
      toast.error("Failed to load monthly attendance grid.");
    } finally {
      setIsLoadingMatrix(false);
    }
  }, [selectedBatchId, selectedMonth]);

  useEffect(() => {
    if (viewMode === "matrix" && selectedBatchId) {
      loadMatrixData();
    }
  }, [viewMode, selectedBatchId, selectedMonth, loadMatrixData]);

  // ─── 4. Quick Attendance Actions ─────────────────────────────────────────────
  const handleMarkStatus = async (attendee, status) => {
    if (attendee.isFlexOut) {
      toast.info(
        `${attendee.name} has a Flex Pass and is attending ${attendee.flexDestination || "another batch"} today.`
      );
      return;
    }

    const checkInTime =
      status === "PRESENT" || status === "LATE"
        ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "";

    // Optimistic local state update
    const previousRecord = dailyRecordsMap[attendee.memberId];
    setDailyRecordsMap((prev) => ({
      ...prev,
      [attendee.memberId]: {
        ...(prev[attendee.memberId] || {}),
        date: selectedDate,
        batchId: selectedBatchId,
        memberId: attendee.memberId,
        memberName: attendee.name,
        status,
        isFlexAttendance: Boolean(attendee.isFlexIn),
        checkInTime,
      },
    }));

    try {
      await markAttendance({
        date: selectedDate,
        batchId: selectedBatchId,
        memberId: attendee.memberId,
        memberName: attendee.name,
        status,
        isFlexAttendance: Boolean(attendee.isFlexIn),
        originalPrimaryBatchId: attendee.flexFromBatchId || null,
        assignmentId: attendee.assignmentId || null,
        checkInTime,
        markedBy: "Admin / Coach",
      });
      toast.success(`${attendee.name} marked as ${status}.`);
    } catch (err) {
      console.error("Failed to mark attendance:", err);
      toast.error("Failed to record attendance.");
      // Rollback on failure
      setDailyRecordsMap((prev) => {
        const next = { ...prev };
        if (previousRecord) {
          next[attendee.memberId] = previousRecord;
        } else {
          delete next[attendee.memberId];
        }
        return next;
      });
    }
  };

  const handleMarkAllPresent = async () => {
    const eligible = dailyAttendees.filter((a) => !a.isFlexOut);
    if (eligible.length === 0) {
      toast.info("No eligible attendees to mark present.");
      return;
    }

    setIsBulkSubmitting(true);
    const checkInTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const attendeesPayload = eligible.map((a) => ({
      memberId: a.memberId,
      memberName: a.name,
      status: "PRESENT",
      isFlexAttendance: Boolean(a.isFlexIn),
      originalPrimaryBatchId: a.flexFromBatchId || null,
      assignmentId: a.assignmentId || null,
      checkInTime,
    }));

    try {
      await bulkMarkAttendance({
        date: selectedDate,
        batchId: selectedBatchId,
        attendees: attendeesPayload,
        markedBy: "Admin / Coach",
      });

      // Update local state
      const updatedMap = { ...dailyRecordsMap };
      attendeesPayload.forEach((att) => {
        updatedMap[att.memberId] = {
          date: selectedDate,
          batchId: selectedBatchId,
          memberId: att.memberId,
          memberName: att.memberName,
          status: "PRESENT",
          isFlexAttendance: att.isFlexAttendance,
          checkInTime,
        };
      });
      setDailyRecordsMap(updatedMap);
      toast.success(`Successfully marked all ${eligible.length} athletes Present.`);
    } catch (err) {
      console.error("Bulk mark failed:", err);
      toast.error("Failed to mark all athletes present.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // ─── 5. Filtered Attendee Calculations ───────────────────────────────────────
  const filteredAttendees = useMemo(() => {
    return dailyAttendees.filter((attendee) => {
      const rec = dailyRecordsMap[attendee.memberId];
      const currentStatus = rec?.status || (attendee.isFlexOut ? "FLEX_OUT" : "UNMARKED");

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = attendee.name?.toLowerCase().includes(q);
        const matchesId = attendee.memberId?.toLowerCase().includes(q);
        const matchesPhone = attendee.mobile?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }

      // Status filter
      if (statusFilter === "ALL") return true;
      if (statusFilter === "PRESENT") return currentStatus === "PRESENT" || currentStatus === "LATE";
      if (statusFilter === "FLEX_IN") return attendee.isFlexIn;
      if (statusFilter === "ABSENT") return currentStatus === "ABSENT" || currentStatus === "EXCUSED";
      if (statusFilter === "UNMARKED") return currentStatus === "UNMARKED";
      return true;
    });
  }, [dailyAttendees, dailyRecordsMap, searchQuery, statusFilter]);

  // Pagination State for Daily Attendee Roster
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

  // Pagination State for Monthly Matrix Roster
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPageSize = 10;
  useEffect(() => {
    setMatrixPage(1);
  }, [selectedBatchId, selectedMonth]);

  const matrixMembers = useMemo(() => matrixData?.members || [], [matrixData]);
  const totalMatrixPages = Math.max(1, Math.ceil(matrixMembers.length / matrixPageSize));
  const safeMatrixPage = Math.max(1, Math.min(matrixPage, totalMatrixPages));
  const paginatedMatrixMembers = useMemo(() => {
    const start = (safeMatrixPage - 1) * matrixPageSize;
    return matrixMembers.slice(start, start + matrixPageSize);
  }, [matrixMembers, safeMatrixPage, matrixPageSize]);

  // KPI Metrics for Daily Session
  const dailyKpis = useMemo(() => {
    const eligibleAttendees = dailyAttendees.filter((a) => !a.isFlexOut);
    const totalEligible = eligibleAttendees.length;
    let presentCount = 0;
    let flexInCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    eligibleAttendees.forEach((a) => {
      const rec = dailyRecordsMap[a.memberId];
      if (!rec || !rec.status) {
        unmarkedCount++;
      } else if (rec.status === "PRESENT" || rec.status === "LATE") {
        presentCount++;
        if (a.isFlexIn || rec.isFlexAttendance) flexInCount++;
      } else if (rec.status === "ABSENT" || rec.status === "EXCUSED") {
        absentCount++;
      }
    });

    const flexOutCount = dailyAttendees.filter((a) => a.isFlexOut).length;
    const turnoutRate = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;

    return {
      totalEligible,
      presentCount,
      flexInCount,
      absentCount,
      unmarkedCount,
      flexOutCount,
      turnoutRate,
    };
  }, [dailyAttendees, dailyRecordsMap]);

  // ─── 6. Date & Month Navigation ─────────────────────────────────────────────
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

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
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

  // ─── 7. Export Monthly Matrix to CSV ─────────────────────────────────────────
  const handleExportMatrixCSV = () => {
    if (!matrixData || !matrixData.members || matrixData.members.length === 0) {
      toast.error("No matrix attendance records available to export.");
      return;
    }

    const { daysInMonth, members, matrix, batchName } = matrixData;
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
    const headers = [
      "Member ID",
      "Athlete Name",
      "Enrolled Type",
      ...dayHeaders,
      "Present Count",
      "Total Logged",
      "Compliance Rate %",
    ];

    const rows = members.map((mem) => {
      const memberMatrix = matrix[mem.id] || {};
      let present = 0;
      let total = 0;

      const dailyCols = Array.from({ length: daysInMonth }, (_, i) => {
        const dayStr = String(i + 1).padStart(2, "0");
        const dateStr = `${selectedMonth}-${dayStr}`;
        const record = memberMatrix[dateStr];
        if (!record) return "—";

        total++;
        if (record.status === "PRESENT" || record.status === "LATE") {
          present++;
          return record.isFlexAttendance ? "FLEX" : "P";
        }
        if (record.status === "ABSENT") return "A";
        if (record.status === "EXCUSED") return "E";
        return record.status;
      });

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return [
        `"${mem.id}"`,
        `"${mem.name}"`,
        `"${mem.isFlexIn ? "Inbound Flex Pass" : "Permanent Member"}"`,
        ...dailyCols.map((c) => `"${c}"`),
        present,
        total,
        `${rate}%`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${batchName.replace(/\s+/g, "_")}_Attendance_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance matrix CSV downloaded.");
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header & Top Control Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Facility Operations • Athlete Turnout
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Members Attendance Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time daily session check-ins, automated flexible pass attendee routing, and full monthly attendance compliance matrices.
          </p>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "daily"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CalendarCheck size={14} />
              <span>Daily Check-in</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Grid3X3 size={14} />
              <span>Monthly Matrix</span>
            </button>
          </div>

          {viewMode === "matrix" && (
            <button
              type="button"
              onClick={handleExportMatrixCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-xs cursor-pointer hover:border-foreground/30"
            >
              <Download size={13} className="text-accent" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Control Bar: Batch Selector & Date / Month Navigator ────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Batch Container Selector */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-tight">
              Active Batch
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={isLoadingBatches}
              className="mt-0.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.timingLabel || b.timing} • {b.daysLabel || b.daysPattern})
                </option>
              ))}
            </select>
          </div>

          {currentBatch && (
            <Link
              to={`/admin/batches/${currentBatch.id}`}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 ml-1"
            >
              <span>Batch Details</span>
              <ExternalLink size={11} />
            </Link>
          )}
        </div>

        {/* Date Navigator (Daily Mode) or Month Navigator (Matrix Mode) */}
        {viewMode === "daily" ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={13} className="text-accent" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-md border-0 bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                />
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                  {selectedDayOfWeek}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              Today
            </button>

            <button
              type="button"
              onClick={loadDailyData}
              disabled={isLoadingDaily}
              className="rounded-xl border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh Roster"
            >
              <RefreshCw size={14} className={isLoadingDaily ? "animate-spin text-accent" : ""} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="relative px-2.5">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Select Month"
                />
                <span className="text-xs font-black text-foreground font-mono cursor-pointer select-none">
                  {formattedSelectedMonth}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              Current Month
            </button>

            <button
              type="button"
              onClick={loadMatrixData}
              disabled={isLoadingMatrix}
              className="rounded-xl border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh Grid"
            >
              <RefreshCw size={14} className={isLoadingMatrix ? "animate-spin text-accent" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* ─── KPI Metric Tiles Banner ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
        {/* Total Eligible */}
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Eligible</span>
            <Users size={14} className="text-accent" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">{dailyKpis.totalEligible}</span>
            <span className="text-[10px] text-muted-foreground">in session</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-500">{dailyKpis.presentCount}</span>
            <span className="text-[10px] font-bold text-emerald-400/80">
              ({dailyKpis.turnoutRate}%)
            </span>
          </div>
        </div>

        {/* Inbound Flex Attendees */}
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Flex-In</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-500">{dailyKpis.flexInCount}</span>
            <span className="text-[10px] text-muted-foreground">temporary</span>
          </div>
        </div>

        {/* Absent / Excused */}
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
            <XCircle size={14} className="text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-500">{dailyKpis.absentCount}</span>
            <span className="text-[10px] text-muted-foreground">missed</span>
          </div>
        </div>

        {/* Flexed Out */}
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Flex-Out</span>
            <ArrowRightLeft size={14} className="text-primary" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">{dailyKpis.flexOutCount}</span>
            <span className="text-[10px] text-muted-foreground">away</span>
          </div>
        </div>
      </div>

      {/* ─── VIEW 1: DAILY SESSION CHECK-IN ─────────────────────────────────── */}
      {viewMode === "daily" && (
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
          {/* Action Toolbar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search athlete by name, ID, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Quick Filter & Mark All Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
                {["ALL", "PRESENT", "FLEX_IN", "ABSENT", "UNMARKED"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      statusFilter === f
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "ALL"
                      ? "All"
                      : f === "FLEX_IN"
                      ? "Flex-In"
                      : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={isBulkSubmitting || isLoadingDaily}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                <span>Mark All Present</span>
              </button>
            </div>
          </div>

          {/* Attendee Roster Table */}
          {isLoadingDaily ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent" />
              <p className="mt-2 text-xs font-semibold">Loading daily session roster…</p>
            </div>
          ) : filteredAttendees.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar flex flex-col">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-card border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground shadow-xs">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Athlete</th>
                    <th className="px-4 py-2.5 font-bold">Attendance Allocation</th>
                    <th className="px-4 py-2.5 font-bold">Time Stamp</th>
                    <th className="px-4 py-2.5 font-bold text-center">Status Action</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {paginatedAttendees.map((attendee) => {
                    const record = dailyRecordsMap[attendee.memberId];
                    const currentStatus = record?.status || null;

                    return (
                      <tr
                        key={attendee.memberId}
                        className={`hover:bg-muted/20 transition-colors ${
                          attendee.isFlexOut ? "opacity-60 bg-muted/10" : ""
                        }`}
                      >
                        {/* Athlete Info */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase">
                              {attendee.name?.[0] || "A"}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/trainers-members/members/${attendee.memberId}`}
                                className="font-bold text-foreground hover:text-accent transition-colors block truncate"
                              >
                                {attendee.name}
                              </Link>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                <span>{attendee.memberId}</span>
                                {attendee.mobile && <span>• {attendee.mobile}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Allocation Badge */}
                        <td className="px-4 py-2.5">
                          {attendee.isFlexOut ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[9px] font-bold text-purple-400">
                                <ArrowRightLeft size={10} />
                                <span>Flexed Out</span>
                              </span>
                              <p className="text-[10px] text-muted-foreground">
                                Attending {attendee.flexDestination || "another batch"}
                              </p>
                            </div>
                          ) : attendee.isFlexIn ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                                <Sparkles size={10} />
                                <span>Inbound Flex Pass</span>
                              </span>
                              <p className="text-[10px] text-muted-foreground">
                                From: {attendee.flexFromBatchName || attendee.flexFromBatchId || "Home Batch"}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                              <Check size={10} />
                              <span>Permanent Member</span>
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {record?.checkInTime ? (
                            <span className="font-mono text-foreground font-semibold flex items-center gap-1">
                              <Clock size={11} className="text-accent" />
                              <span>{record.checkInTime}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Status Action Buttons */}
                        <td className="px-4 py-2.5 text-center">
                          {attendee.isFlexOut ? (
                            <span className="text-xs font-semibold text-muted-foreground italic">
                              Check-in handled at target batch
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                              {/* Present */}
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(attendee, "PRESENT")}
                                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "border border-border bg-card text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
                                }`}
                              >
                                Present
                              </button>

                              {/* Late */}
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(attendee, "LATE")}
                                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === "LATE"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "border border-border bg-card text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
                                }`}
                              >
                                Late
                              </button>

                              {/* Absent */}
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(attendee, "ABSENT")}
                                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "border border-border bg-card text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                }`}
                              >
                                Absent
                              </button>

                              {/* Excused */}
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(attendee, "EXCUSED")}
                                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === "EXCUSED"
                                    ? "bg-sky-600 text-white shadow-xs"
                                    : "border border-border bg-card text-muted-foreground hover:bg-sky-500/10 hover:text-sky-500"
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          )}
                        </td>

                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <Users size={32} className="mx-auto text-muted-foreground/60" />
              <h4 className="text-sm font-bold text-foreground">No Athletes Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No athletes matched the selected filter for {currentBatch?.name || "this batch"} on {selectedDate}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 2: MONTHLY ATTENDANCE GRID MATRIX ─────────────────────────── */}
      {viewMode === "matrix" && (
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border/70 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-accent" />
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Monthly Attendance Matrix — {currentBatch?.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                30-day compliance tracking for permanent athletes and flex pass visitors.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportMatrixCSV}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-xs hover:bg-accent/90 transition-all cursor-pointer shrink-0"
            >
              <Download size={13} />
              <span>Export Monthly CSV</span>
            </button>
          </div>

          {isLoadingMatrix ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent" />
              <p className="mt-2 text-xs font-semibold">Generating monthly matrix…</p>
            </div>
          ) : matrixData && matrixData.members?.length > 0 ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-card border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground shadow-xs">
                    <tr>
                      <th className="sticky left-0 z-20 bg-card px-3 py-2 font-bold border-r border-border/60 min-w-[160px]">
                        Athlete
                      </th>
                      <th className="px-2.5 py-2 font-bold text-center border-r border-border/60 min-w-[70px]">
                        Type
                      </th>
                      {Array.from({ length: matrixData.daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const dayStr = String(dayNum).padStart(2, "0");
                        const dateStr = `${selectedMonth}-${dayStr}`;
                        let weekday = "";
                        try {
                          weekday = DAY_NAMES[new Date(dateStr).getDay()]?.slice(0, 2) || "";
                        } catch {
                          weekday = "";
                        }

                        return (
                          <th
                            key={dayNum}
                            className="px-1 py-1.5 text-center border-r border-border/40 font-mono min-w-[28px]"
                            title={dateStr}
                          >
                            <span className="block text-[10px] font-bold text-foreground">
                              {dayNum}
                            </span>
                            <span className="block text-[8px] text-muted-foreground">{weekday}</span>
                          </th>
                        );
                      })}
                      <th className="px-3 py-2 font-bold text-right min-w-[95px]">Turnout Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card">
                    {paginatedMatrixMembers.map((mem) => {
                      const memberMatrix = matrixData.matrix[mem.id] || {};
                      let presentCount = 0;
                      let loggedCount = 0;

                      return (
                        <tr key={mem.id} className="hover:bg-muted/20 transition-colors">
                          {/* Sticky Member Name */}
                          <td className="sticky left-0 z-10 bg-card px-3 py-2 font-bold text-foreground border-r border-border/60 truncate max-w-[160px]">
                            <Link
                              to={`/admin/trainers-members/members/${mem.id}`}
                              className="hover:text-accent transition-colors truncate block"
                            >
                              {mem.name}
                            </Link>
                            <span className="text-[9px] font-mono text-muted-foreground block">
                              {mem.id}
                            </span>
                          </td>

                          {/* Member Type */}
                          <td className="px-2.5 py-2 text-center border-r border-border/60">
                            {mem.isFlexIn ? (
                              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 whitespace-nowrap">
                                Flex
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 whitespace-nowrap">
                                Primary
                              </span>
                            )}
                          </td>

                          {/* 1 to daysInMonth Cells */}
                          {Array.from({ length: matrixData.daysInMonth }, (_, i) => {
                            const dayNum = i + 1;
                            const dayStr = String(dayNum).padStart(2, "0");
                            const dateStr = `${selectedMonth}-${dayStr}`;
                            const att = memberMatrix[dateStr];

                            let code = "—";
                            let cellClass = "text-muted-foreground/40";
                            let title = `${dateStr}: No session recorded`;

                            if (att) {
                              loggedCount++;
                              if (att.isFlexAttendance) {
                                code = "F";
                                cellClass =
                                  "bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/30";
                                title = `${dateStr}: Flex Attendance • ${att.checkInTime || ""}`;
                                presentCount++;
                              } else if (att.status === "PRESENT") {
                                code = "P";
                                cellClass =
                                  "bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30";
                                title = `${dateStr}: Present • ${att.checkInTime || ""}`;
                                presentCount++;
                              } else if (att.status === "LATE") {
                                code = "L";
                                cellClass =
                                  "bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30";
                                title = `${dateStr}: Late Check-in • ${att.checkInTime || ""}`;
                                presentCount++;
                              } else if (att.status === "ABSENT") {
                                code = "A";
                                cellClass =
                                  "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30";
                                title = `${dateStr}: Absent`;
                              } else if (att.status === "EXCUSED") {
                                code = "E";
                                cellClass =
                                  "bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30";
                                title = `${dateStr}: Excused Absence`;
                              }
                            }

                            return (
                              <td
                                key={dayNum}
                                title={title}
                                className="px-1 py-1 text-center border-r border-border/40 font-mono cursor-default"
                              >
                                <span
                                  className={`inline-grid h-5 w-5 place-items-center rounded-md text-[9px] ${cellClass}`}
                                >
                                  {code}
                                </span>
                              </td>
                            );
                          })}

                          {/* Rate Column */}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <span className="font-bold text-foreground font-mono">
                              {loggedCount > 0
                                ? `${Math.round((presentCount / loggedCount) * 100)}%`
                                : "—"}
                            </span>
                            <span className="block text-[9px] text-muted-foreground">
                              ({presentCount}/{loggedCount})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Matrix Legend */}
              <div className="flex items-center gap-3 flex-wrap px-3 py-1.5 border-t border-border/60 text-[11px] text-muted-foreground shrink-0">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Legend:
                </span>
                <div className="inline-flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                    P
                  </span>
                  <span>Present</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                    F
                  </span>
                  <span>Flex</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-black border border-yellow-500/30">
                    L
                  </span>
                  <span>Late</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                    A
                  </span>
                  <span>Absent</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded bg-sky-500/20 text-sky-400 text-[10px] font-black border border-sky-500/30">
                    E
                  </span>
                  <span>Excused</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <FileSpreadsheet size={32} className="mx-auto text-muted-foreground/60" />
              <h4 className="text-sm font-bold text-foreground">No Matrix Records</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No attendance matrix records found for {currentBatch?.name || "this batch"} in {formattedSelectedMonth}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pinned Bottom Pagination */}
      {viewMode === "daily" ? (
        <Pagination
          currentPage={safeDailyPage}
          totalPages={totalDailyPages}
          totalItems={filteredAttendees.length}
          pageSize={dailyPageSize}
          onPageChange={(p) => setDailyPage(p)}
          itemLabel="athletes"
          compact
          className="shrink-0 mt-auto"
        />
      ) : (
        <Pagination
          currentPage={safeMatrixPage}
          totalPages={totalMatrixPages}
          totalItems={matrixMembers.length}
          pageSize={matrixPageSize}
          onPageChange={(p) => setMatrixPage(p)}
          itemLabel="athletes"
          compact
          className="shrink-0 mt-auto"
        />
      )}
    </div>
  );
}
