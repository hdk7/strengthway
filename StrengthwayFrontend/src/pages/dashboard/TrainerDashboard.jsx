import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Radio,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
  CalendarCheck2,
  UserCheck,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { getTrainerDashboard } from "@/lib/dashboardService";
import DashboardBarChart from "@/components/charts/DashboardBarChart";
import DashboardDonutChart from "@/components/charts/DashboardDonutChart";
import DashboardCalendarHeatmap from "@/components/charts/DashboardCalendarHeatmap";
import DashboardProgressBar from "@/components/charts/DashboardProgressBar";

export default function TrainerDashboard({ trainerIdOverride = null }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [batchId, setBatchId] = useState("ALL");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrainerDashboard({
        year,
        month,
        batchId,
        trainerId: trainerIdOverride,
      });
      setData(res.data || res);
    } catch (err) {
      setError(err?.message || "Failed to load trainer dashboard.");
    } finally {
      setLoading(false);
    }
  }, [year, month, batchId, trainerIdOverride]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading assigned coaching timetable & student rosters...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl border border-destructive/40 bg-destructive/10 text-center flex flex-col items-center gap-3 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Trainer Sync Error</h3>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  const profile = data?.trainer || data?.trainerProfile || {};
  const overview = data?.overviewCards || data?.overview || {};
  const todayClasses = data?.todayClasses || [];
  const handledBatches = data?.handledBatches || [];
  const trainerAtt = {
    summary: {
      presentDays: data?.trainerAttendance?.presentDays ?? 0,
      absentDays: data?.trainerAttendance?.absentDays ?? 0,
      approvedLeaveDays: data?.trainerAttendance?.approvedLeaveDays ?? 0,
      attendanceRate: data?.trainerAttendance?.attendanceRate ?? overview?.monthlyAttendanceRate ?? 0,
      annualAllowance: data?.trainerAttendance?.annualAllowance ?? 36,
      annualRemainingDays: data?.trainerAttendance?.annualRemainingDays ?? 34,
      annualLopDays: data?.trainerAttendance?.annualLopDays ?? 0,
    },
    calendarRecords: data?.trainerAttendance?.calendarDays || data?.trainerAttendance?.calendarRecords || [],
    monthlyTrends: data?.trainerAttendance?.monthlyTrend || data?.trainerAttendance?.monthlyTrends || [],
  };
  const classStats = {
    totalSessionsHandled: data?.handledClassStats?.totalConducted ?? data?.classStats?.totalSessionsHandled ?? 0,
    completionRate: data?.handledClassStats?.completionRate ?? data?.classStats?.completionRate ?? 100,
    totalCoachingHours: data?.handledClassStats?.totalHours ?? data?.classStats?.totalCoachingHours ?? 0,
    averageStudentAttendance: data?.handledClassStats?.avgClassAttendance ?? data?.classStats?.averageStudentAttendance ?? 0,
  };

  // Batch attendance horizontal bar data
  const batchAttBarData = handledBatches.map((b) => ({
    label: b.batchName,
    value: b.periodAttendanceRate || 0,
    formattedValue: `${b.periodAttendanceRate}%`,
    subtitle: `${b.eligibleStudents} students · ${b.sessionsHandled} sessions`,
    color:
      b.periodAttendanceRate >= 75
        ? "#10b981"
        : b.periodAttendanceRate >= 50
        ? "#f59e0b"
        : "#c57463",
  }));

  // Trainer attendance monthly trend chart
  const monthlyTrendData = (trainerAtt.monthlyTrends || []).map((t) => ({
    label: t.monthName?.slice(0, 3) || `M${t.month}`,
    value: t.conducted || 0,
    formattedValue: `${t.conducted} sessions`,
    subtitle: `${t.attendanceRate}% presence`,
    color: "#10b981",
  }));

  // Personal presence donut segments
  const personalDonutSegments = [
    { label: "Present Days", value: trainerAtt.summary?.presentDays || 0, color: "#10b981" },
    { label: "Approved Leave", value: trainerAtt.summary?.approvedLeaveDays || 0, color: "#f59e0b" },
    { label: "Absent Days", value: trainerAtt.summary?.absentDays || 0, color: "#f43f5e" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Top Header & Global Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Coach Workspace & Roster
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
              {profile.specialty || "Certified Trainer"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, <strong className="text-foreground">{profile.name}</strong> ({profile.code || "Faculty"}) ·
            Track daily class floor, athlete check-ins, and personal shift logs
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year select */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y} className="bg-popover text-popover-foreground">
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month select */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-popover text-popover-foreground">
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-xl px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="ALL" className="bg-popover text-popover-foreground">
                All My Batches
              </option>
              {handledBatches.map((b) => (
                <option key={b.batchId} value={b.batchId} className="bg-popover text-popover-foreground">
                  {b.batchName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 1. Trainer Overview KPI Cards ────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Assigned Batches */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">My Batches</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground tabular-nums">
            {overview.assignedBatchesCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Coaching slots</span>
        </div>

        {/* Card 2: Today's Classes */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Today's Classes</span>
            <CalendarCheck2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-foreground tabular-nums">
            {overview.todayClassesCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Timetable sessions</span>
        </div>

        {/* Card 3: Live Now */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Live Now</span>
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-500 tabular-nums">
            {overview.liveClassesCount || 0}
          </div>
          <span className="text-[10px] text-rose-400">On gym floor</span>
        </div>

        {/* Card 4: Classes Completed in Period */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Conducted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 tabular-nums">
            {overview.completedClassesCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Completed in {monthNames[month - 1]?.slice(0, 3)}</span>
        </div>

        {/* Card 5: Unique Students */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Total Students</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground tabular-nums">
            {overview.totalUniqueStudents || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Deduplicated athletes</span>
        </div>

        {/* Card 6: Monthly Attendance Rate */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1 group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Attendance %</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 tabular-nums">
            {overview.monthlyAttendanceRate || 0}%
          </div>
          <span className="text-[10px] text-muted-foreground">Biometric compliance</span>
        </div>
      </section>

      {/* ── 2. Today's Classes & Live Classes Timeline ────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              Today's Coaching Schedule & Live Floor
            </h2>
          </div>
          <Link
            to="/trainer/schedule/batches"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            My Batches & Timetable <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {todayClasses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No coaching classes scheduled for today.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enjoy your rest day or check upcoming batch timetables.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls) => {
              const isLive = cls.status === "LIVE";
              const isCompleted = cls.status === "COMPLETED";

              return (
                <div
                  key={cls.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isLive
                      ? "bg-rose-500/5 border-rose-500/40 shadow-md ring-1 ring-rose-500/20"
                      : isCompleted
                      ? "bg-card border-border/80 opacity-90"
                      : "bg-card border-border/80 hover:border-primary/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        {cls.room || "Main Studio"}
                      </span>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {cls.batchName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cls.trainingDays || "Assigned Days"}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isLive
                          ? "bg-rose-500 text-white animate-pulse"
                          : isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                      {cls.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-bold text-foreground text-sm">{cls.time}</span>
                  </div>

                  {/* Attendance Card Strip */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Athletes Enrolled:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {cls.attendanceSummary?.present !== undefined
                        ? `${cls.attendanceSummary.present} Present / ${cls.eligibleCount}`
                        : `${cls.eligibleCount} Eligible`}
                    </span>
                  </div>

                  {/* Permitted Action Button */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <Link
                      to="/trainer/attendance/members"
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Take / View Attendance
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. Handled Batches and Student Attendance ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Handled Batches List & Today's Attendance (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Batches Handled by Coach
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authorized rosters, athlete counts, and session compliance
              </p>
            </div>
            <Link
              to="/trainer/trainers-members/members"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Athlete Roster <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {handledBatches.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No active batches assigned to your coaching profile.
              </p>
            ) : (
              handledBatches.map((b) => (
                <div
                  key={b.batchId}
                  className="p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{b.batchName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                        {b.trainingDays}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{b.timing}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground">Athletes</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {b.eligibleStudents}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground">Sessions</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {b.sessionsHandled}
                      </span>
                    </div>

                    <div className="text-right pl-2 border-l border-border/60">
                      <span className="block text-[10px] text-muted-foreground">Rate</span>
                      <span
                        className={`font-black tabular-nums ${
                          b.periodAttendanceRate >= 75
                            ? "text-emerald-500"
                            : b.periodAttendanceRate >= 50
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        {b.periodAttendanceRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <DashboardBarChart
              data={batchAttBarData}
              orientation="horizontal"
              height={180}
              barColor="#c57463"
              emptyMessage="No handled batch sessions"
            />
          </div>
        </div>

        {/* Right: Personal Biometric Shift Calendar (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Coach Biometric Shift Calendar
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily verified biometric punches and approved leave tracking
            </p>
          </div>

          <DashboardCalendarHeatmap
            year={year}
            month={month}
            records={trainerAtt.calendarRecords || []}
          />

          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Verified Shift Presence:</span>
            <span className="font-bold text-emerald-500 tabular-nums">
              {trainerAtt.summary?.attendanceRate || 0}% Monthly Compliance
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. Monthly Trainer Attendance & Leave Policy ──────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Trend Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Month-by-Month Conduction Trends ({year})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Coaching sessions conducted each month across assigned gym batches
            </p>
          </div>

          <div className="py-2">
            <DashboardBarChart
              data={monthlyTrendData}
              height={220}
              barColor="#10b981"
              valueSuffix=" sessions"
              emptyMessage="No conduction records logged this year"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span>Annual Total Sessions:</span>
            <span className="font-bold text-foreground">
              {classStats.totalSessionsHandled || 0} Sessions Handled
            </span>
          </div>
        </div>

        {/* Right: Personal Attendance & Leave Balance (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Leave Allowance & Shift Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official Strengthway leave allowance (36 annual paid leaves)
            </p>
          </div>

          <DashboardDonutChart
            segments={personalDonutSegments}
            centerLabel="Days Logged"
            centerValue={(
              (trainerAtt.summary?.presentDays || 0) +
              (trainerAtt.summary?.approvedLeaveDays || 0) +
              (trainerAtt.summary?.absentDays || 0)
            ).toLocaleString()}
            size={180}
          />

          {/* Leave Balance Progress Card */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Annual Leave Used:</span>
              <span className="font-bold text-foreground tabular-nums">
                {trainerAtt.summary?.approvedLeaveDays || 0} / 36 Days
              </span>
            </div>
            <DashboardProgressBar
              value={trainerAtt.summary?.approvedLeaveDays || 0}
              max={36}
              variant="amber"
              height={6}
              rightLabel={`${Math.max(
                0,
                36 - (trainerAtt.summary?.approvedLeaveDays || 0)
              )} Days Left`}
            />
          </div>

          <Link
            to="/trainer/attendance/trainers"
            className="w-full py-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Submit Leave Request / Check Shift Logs
          </Link>
        </div>
      </section>

      {/* ── 5. Handled Class Statistics ──────────────────────────────────── */}
      <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Coaching Efficiency & Performance Summary
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Class completion and athlete engagement calculated strictly from active session logs
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground font-semibold">Total Sessions</span>
            <span className="text-xl font-black text-foreground tabular-nums">
              {classStats.totalSessionsHandled || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">Class slots conducted</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground font-semibold">Completion Rate</span>
            <span className="text-xl font-black text-emerald-500 tabular-nums">
              {classStats.completionRate || 100}%
            </span>
            <span className="text-[10px] text-muted-foreground">Excluding cancellations</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground font-semibold">Coaching Hours</span>
            <span className="text-xl font-black text-foreground tabular-nums">
              {classStats.totalCoachingHours || 0} hrs
            </span>
            <span className="text-[10px] text-muted-foreground">Verified floor time</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground font-semibold">Average Student Turnout</span>
            <span className="text-xl font-black text-primary tabular-nums">
              {classStats.averageStudentAttendance || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">Athletes per class</span>
          </div>
        </div>
      </section>
    </div>
  );
}
