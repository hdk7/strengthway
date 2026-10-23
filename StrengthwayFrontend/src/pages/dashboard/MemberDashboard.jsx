import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Radio,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  UserCheck,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Flame,
  Dumbbell,
} from "lucide-react";
import { getMemberDashboard } from "@/lib/dashboardService";
import DashboardBarChart from "@/components/charts/DashboardBarChart";
import DashboardDonutChart from "@/components/charts/DashboardDonutChart";
import DashboardCalendarHeatmap from "@/components/charts/DashboardCalendarHeatmap";
import DashboardProgressBar from "@/components/charts/DashboardProgressBar";

export default function MemberDashboard({ memberIdOverride = null }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMemberDashboard({
        year,
        month,
        memberId: memberIdOverride,
      });
      setData(res.data || res);
    } catch (err) {
      setError(err?.message || "Failed to load member dashboard.");
    } finally {
      setLoading(false);
    }
  }, [year, month, memberIdOverride]);

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
          Fetching your personal timetable, attendance record, and membership status...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl border border-destructive/40 bg-destructive/10 text-center flex flex-col items-center gap-3 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Member Sync Error</h3>
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

  const profile = data?.member || data?.memberProfile || {};
  const membership = data?.membership || {};
  const todayClasses = data?.todayClasses || [];
  const attendance = {
    summary: {
      eligibleSessions: data?.attendance?.eligibleSessionsCount ?? data?.attendance?.summary?.eligibleSessions ?? 0,
      present: data?.attendance?.presentSessionsCount ?? data?.attendance?.summary?.present ?? 0,
      absent: data?.attendance?.absentSessionsCount ?? data?.attendance?.summary?.absent ?? 0,
      unrecorded: data?.attendance?.summary?.unrecorded ?? 0,
      attendanceRate: data?.attendance?.attendanceRate ?? 0,
    },
    calendarRecords: data?.attendance?.recentLogs || data?.attendance?.calendarRecords || [],
    monthlyTrends: data?.attendance?.monthlyTrend || data?.attendance?.monthlyTrends || [],
  };

  // Attendance donut segments
  const attDonutSegments = [
    { label: "Present Sessions", value: attendance.summary.present || 0, color: "#10b981" },
    { label: "Absent Sessions", value: attendance.summary.absent || 0, color: "#f43f5e" },
    { label: "Unrecorded", value: attendance.summary.unrecorded || 0, color: "#64748b" },
  ];

  // Monthly attendance trend bar chart
  const monthlyTrendData = (attendance.monthlyTrends || []).map((t) => ({
    label: t.monthName?.slice(0, 3) || `M${t.month}`,
    value: t.attendanceRate || 0,
    formattedValue: `${t.attendanceRate}%`,
    subtitle: `${t.present}/${t.eligible} sessions`,
    color: t.attendanceRate >= 75 ? "#10b981" : t.attendanceRate >= 50 ? "#f59e0b" : "#c57463",
  }));

  const isExpiringSoon = membership.status === "Expiring Soon";
  const isExpired = membership.status === "Expired";

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Top Header & Global Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Athlete Dashboard
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                membership.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : isExpiringSoon
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {membership.status || "Active Athlete"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome, <strong className="text-foreground">{profile.name}</strong> ({profile.code || "Athlete"}) ·
            Batch: <span className="font-semibold text-foreground">{profile.batchName || "Standard Batch"}</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
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
        </div>
      </div>

      {/* ── 1. Active Membership & Expiration Card (Prominent Hero) ──────── */}
      <section className="relative p-6 rounded-3xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/90 shadow-md overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Active Membership Plan
              </span>
            </div>

            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {membership.planName || "Strength & Conditioning"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
              <div>
                <span>Started: </span>
                <span className="font-semibold text-foreground">
                  {membership.startDate ? new Date(membership.startDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <span className="text-border">•</span>
              <div>
                <span>Expires: </span>
                <span className="font-semibold text-foreground">
                  {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <span className="text-border">•</span>
              <div>
                <span>Assigned Slot: </span>
                <span className="font-semibold text-foreground">{membership.batchTiming || "Morning"}</span>
              </div>
            </div>

            {/* Expiration Progress Indicator */}
            <div className="mt-3 max-w-md">
              <DashboardProgressBar
                value={membership.progressPercent || 0}
                max={100}
                variant={isExpired ? "dynamic" : isExpiringSoon ? "amber" : "emerald"}
                height={8}
                label={`${membership.daysRemaining || 0} days remaining`}
                rightLabel={`${membership.progressPercent || 0}% elapsed`}
              />
            </div>
          </div>

          {/* Action & Status Card */}
          <div className="flex flex-col items-start md:items-end justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Plan Expired
                </span>
              ) : isExpiringSoon ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4" /> Renewal Due
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Subscription Active
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Payment Status</span>
              <span
                className={`font-black text-sm uppercase ${
                  membership.paymentStatus === "Paid"
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              >
                {membership.paymentStatus || "Paid"}
              </span>
            </div>

            <Link
              to="/member/schedule/batches"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              {isExpired || isExpiringSoon ? "Renew Plan Now" : "Manage Membership"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Today's Scheduled & Live Classes ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              Today's Workout Schedule
            </h2>
          </div>
          <Link
            to="/member/schedule/batches"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Weekly Timetable <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {todayClasses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No classes scheduled for today.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rest, recover, and hydrate for your upcoming sessions.
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
                      ? "bg-card border-border/80 opacity-80"
                      : "bg-card border-border/80 hover:border-primary/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        {cls.room || "Gym Floor"}
                      </span>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {cls.batchName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Coach: <strong className="text-foreground">{cls.coachName}</strong>
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

                  {cls.notes && (
                    <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] text-foreground/80 italic">
                      "{cls.notes}"
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Class Access:</span>
                    <span className="font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Eligible Athlete
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. Personal Attendance Analytics & Matrix ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Trend & Attendance Rate Bar Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                My Attendance Consistency ({year})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly workout attendance rate across your scheduled batch timetable
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-500 px-2.5 py-1 rounded-full bg-emerald-500/10">
              {attendance.summary?.attendanceRate || 0}% This Month
            </span>
          </div>

          <div className="py-2">
            <DashboardBarChart
              data={monthlyTrendData}
              height={220}
              barColor="#10b981"
              valueSuffix="%"
              emptyMessage="No attendance records recorded this year"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50 text-center text-xs">
            <div className="p-2 rounded-xl bg-muted/20">
              <span className="block text-[10px] text-muted-foreground">Eligible Sessions</span>
              <span className="font-bold text-foreground tabular-nums text-sm">
                {attendance.summary?.eligibleSessions || 0}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <span className="block text-[10px] text-emerald-500">Present</span>
              <span className="font-bold text-foreground tabular-nums text-sm">
                {attendance.summary?.present || 0}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10">
              <span className="block text-[10px] text-rose-500">Absent</span>
              <span className="font-bold text-foreground tabular-nums text-sm">
                {attendance.summary?.absent || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Present vs Absent Donut Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Attendance Ratio & Compliance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified biometric punches vs unexcused absences
            </p>
          </div>

          <DashboardDonutChart
            segments={attDonutSegments}
            centerLabel="Attendance"
            centerValue={`${attendance.summary?.attendanceRate || 0}%`}
            size={180}
          />

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
            <strong>Attendance Policy:</strong> Missing sessions without prior pause request are
            counted as absent according to gym terms. Keep your attendance above 75% for optimal athletic progression.
          </div>
        </div>
      </section>

      {/* ── 4. Calendar Heatmap View of Individual Dates ─────────────────── */}
      <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Daily Attendance Log & Biometric Check-ins
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click on any day to view your recorded check-in time and workout session details
            </p>
          </div>
          <Link
            to="/member/attendance/members"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Full Punch Log <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <DashboardCalendarHeatmap
          year={year}
          month={month}
          records={attendance.calendarRecords || []}
        />
      </section>
    </div>
  );
}
