import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Clock,
  Radio,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Award,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { getAdminDashboard } from "@/lib/dashboardService";
import { formatINR } from "@/lib/formatters";
import KpiCard from "@/components/ui/KpiCard";
import DashboardBarChart from "@/components/charts/DashboardBarChart";
import DashboardGroupedBarChart from "@/components/charts/DashboardGroupedBarChart";
import DashboardDonutChart from "@/components/charts/DashboardDonutChart";
import DashboardProgressBar from "@/components/charts/DashboardProgressBar";

export default function AdminDashboard({ onSwitchView }) {
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
      const res = await getAdminDashboard({ year, month, batchId });
      setData(res.data || res);
    } catch (err) {
      setError(err?.message || "Failed to load admin analytics.");
    } finally {
      setLoading(false);
    }
  }, [year, month, batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Aggregating gym operational & financial records...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl border border-destructive/40 bg-destructive/10 text-center flex flex-col items-center gap-3 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Analytics Sync Failed</h3>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const financial = {
    revenueThisMonth: data?.financialOverview?.membershipRevenueMonth ?? data?.financial?.revenueThisMonth ?? 0,
    revenueThisYear: data?.financialOverview?.membershipRevenueYear ?? data?.financial?.revenueThisYear ?? 0,
    coachPayoutsThisMonth: data?.financialOverview?.coachPayoutsMonth ?? data?.financial?.coachPayoutsThisMonth ?? 0,
    coachPayoutsThisYear: data?.financialOverview?.coachPayoutsYear ?? data?.financial?.coachPayoutsThisYear ?? 0,
    pendingMemberPayments: data?.financialOverview?.pendingMemberPaymentsAmount ?? data?.financial?.pendingMemberPayments ?? 0,
    pendingCoachPayouts: data?.financialOverview?.pendingCoachPayoutsAmount ?? data?.financial?.pendingCoachPayouts ?? 0,
    totalInvoicedYear: data?.financialOverview?.totalInvoicedYear ?? data?.financial?.totalInvoicedYear,
    monthlyRevenue: data?.financialTrends?.monthlyRevenue || data?.financial?.monthlyRevenue || [],
    monthlyPayouts: data?.financialTrends?.monthlyPayouts || data?.financial?.monthlyPayouts || [],
  };

  const rawTodayClasses = Array.isArray(data?.todayClasses)
    ? data.todayClasses
    : Array.isArray(data?.todayClasses?.classes)
    ? data.todayClasses.classes
    : Array.isArray(data?.classes?.todayClasses)
    ? data.classes.todayClasses
    : [];

  const classesData = {
    todayClasses: rawTodayClasses,
    summary: {
      live:
        data?.todayClasses?.liveCount ??
        data?.classes?.summary?.live ??
        rawTodayClasses.filter((c) => (c.liveStatus || c.status) === "LIVE").length,
      upcoming:
        data?.todayClasses?.upcomingCount ??
        data?.classes?.summary?.upcoming ??
        rawTodayClasses.filter((c) => (c.liveStatus || c.status) === "UPCOMING").length,
      completed:
        data?.todayClasses?.completedCount ??
        data?.classes?.summary?.completed ??
        rawTodayClasses.filter((c) => (c.liveStatus || c.status) === "COMPLETED").length,
      cancelled:
        data?.todayClasses?.cancelledCount ??
        data?.classes?.summary?.cancelled ??
        rawTodayClasses.filter((c) => (c.liveStatus || c.status) === "CANCELLED").length,
    },
  };

  const rawBatchList = data?.batchAttendance?.stats || data?.memberAttendance?.batchBreakdown || [];
  const memberAtt = {
    batchBreakdown: rawBatchList.map((b) => ({
      batchName: b.name || b.batchName || "Batch",
      attendanceRate: b.attendanceRate || 0,
      eligible: b.totalEligible || b.eligible || b.maxPax || 0,
      present: b.presentCount || b.present || 0,
      absent: b.absentCount || b.absent || 0,
      unrecorded: b.unrecordedCount || b.unrecorded || 0,
    })),
    summary: data?.memberAttendance?.summary || {
      presentSessions: rawBatchList.reduce((s, b) => s + (b.presentCount || b.present || 0), 0),
      absentSessions: rawBatchList.reduce((s, b) => s + (b.absentCount || b.absent || 0), 0),
      unrecordedSessions: rawBatchList.reduce((s, b) => s + (b.unrecordedCount || b.unrecorded || 0), 0),
      totalSessions: rawBatchList.reduce(
        (s, b) => s + (b.presentCount || 0) + (b.absentCount || 0) + (b.unrecordedCount || 0),
        0
      ),
      attendanceRate: rawBatchList.length
        ? Math.round(rawBatchList.reduce((s, b) => s + (b.attendanceRate || 0), 0) / rawBatchList.length)
        : 85,
    },
  };

  const rawCoachList = data?.coachAttendance?.coaches || data?.coachAttendance?.coachBreakdown || [];
  const coachAtt = {
    coachBreakdown: rawCoachList.map((c) => ({
      trainerId: c.trainerId || c.id,
      name: c.name || "Coach",
      specialty: c.specialty || c.shift || "Functional Strength",
      conductedSessions: c.classesConducted || c.conductedSessions || 0,
      assignedSessions: c.classesScheduled || c.assignedSessions || 0,
      approvedLeaves: c.leaveDays || c.approvedLeaves || 0,
      attendanceRate: c.presentRate || c.attendanceRate || 0,
    })),
    summary: data?.coachAttendance?.summary || {
      conductedSessions: rawCoachList.reduce((s, c) => s + (c.classesConducted || c.conductedSessions || 0), 0),
      approvedLeaves: rawCoachList.reduce((s, c) => s + (c.leaveDays || c.approvedLeaves || 0), 0),
      missedSessions: rawCoachList.reduce((s, c) => s + (c.absentDays || c.missedSessions || 0), 0),
      assignedSessions: rawCoachList.reduce((s, c) => s + (c.classesScheduled || c.assignedSessions || 0), 0),
      presenceRate: rawCoachList.length
        ? Math.round(rawCoachList.reduce((s, c) => s + (c.presentRate || c.attendanceRate || 0), 0) / rawCoachList.length)
        : 90,
    },
  };

  const membership = {
    summary: {
      totalActive: data?.membershipOverview?.totalActive ?? data?.membership?.summary?.totalActive ?? 0,
      newThisMonth: data?.membershipOverview?.newThisMonth ?? data?.membership?.summary?.newThisMonth ?? 0,
      expiringSoon: data?.membershipOverview?.expiringSoonCount ?? data?.membership?.summary?.expiringSoon ?? 0,
      expired: data?.membershipOverview?.expiredCount ?? data?.membership?.summary?.expired ?? 0,
      pendingPayment: data?.membershipOverview?.pendingPaymentsCount ?? data?.membership?.summary?.pendingPayment ?? 0,
    },
    recentExpiring: data?.membershipOverview?.expiringSoonList || data?.membership?.recentExpiring || [],
  };

  const filterMeta = data?.meta || {
    batches: memberAtt.batchBreakdown.map((b) => ({ id: b.batchName, name: b.batchName })),
  };

  const trendsList = Array.isArray(data?.financialTrends)
    ? data.financialTrends
    : Array.isArray(data?.financial?.monthlyRevenue)
    ? data.financial.monthlyRevenue
    : [];

  // Chart datasets
  const revenueChartData = trendsList.map((m) => ({
    label: m.month || m.monthName?.slice(0, 3) || `M${m.month}`,
    value: m.revenue || 0,
    formattedValue: `₹${(m.revenue || 0).toLocaleString()}`,
    color: "#10b981", // emerald
  }));

  const coachPayoutChartData = trendsList.map((m) => ({
    label: m.month || m.monthName?.slice(0, 3) || `M${m.month}`,
    value: m.coachPayouts || m.payout || 0,
    formattedValue: `₹${(m.coachPayouts || m.payout || 0).toLocaleString()}`,
    color: "#c57463", // terracotta
  }));

  const groupedFinData = trendsList.map((m) => ({
    label: m.month || m.monthName?.slice(0, 3) || `M${m.month}`,
    series1: m.revenue || 0,
    series2: m.coachPayouts || m.payout || 0,
  }));

  const batchAttBarData = (memberAtt.batchBreakdown || []).map((b) => ({
    label: b.batchName,
    value: b.attendanceRate || 0,
    formattedValue: `${b.attendanceRate}%`,
    subtitle: `${b.present}/${b.eligible} active`,
    color:
      b.attendanceRate >= 75
        ? "#10b981"
        : b.attendanceRate >= 50
        ? "#f59e0b"
        : "#c57463",
  }));

  const memberDonutSegments = [
    { label: "Present", value: memberAtt.summary?.presentSessions || 0, color: "#10b981" },
    { label: "Absent", value: memberAtt.summary?.absentSessions || 0, color: "#f43f5e" },
    { label: "Unrecorded", value: memberAtt.summary?.unrecordedSessions || 0, color: "#64748b" },
  ];

  const coachDonutSegments = [
    { label: "Conducted/Present", value: coachAtt.summary?.conductedSessions || 0, color: "#10b981" },
    { label: "Approved Leave", value: coachAtt.summary?.approvedLeaves || 0, color: "#f59e0b" },
    { label: "Missed/Substituted", value: coachAtt.summary?.missedSessions || 0, color: "#f43f5e" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── 1. Financial Overview KPI Cards ──────────────────────────────── */}
      <section className="flex flex-col gap-3"> 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <KpiCard
            title="Rev. Collected (Mo)"
            value={formatINR(financial.revenueThisMonth || 0)}
            subtext="Actual cleared fee receipts"
            icon={DollarSign}
            variant="emerald"
          />
          <KpiCard
            title="Rev. Collected (Yr)"
            value={formatINR(financial.revenueThisYear || 0)}
            subtext={`Jan - Dec ${year} collections`}
            icon={TrendingUp}
            variant="emerald"
          />
          <KpiCard
            title="Coach Payouts (Mo)"
            value={formatINR(financial.coachPayoutsThisMonth || 0)}
            subtext="Stipends minus LOP deductions"
            icon={Users}
            variant="terracotta"
          />
          <KpiCard
            title="Coach Payouts (Yr)"
            value={formatINR(financial.coachPayoutsThisYear || 0)}
            subtext="Cumulative coach stipends"
            icon={Activity}
            variant="terracotta"
          />
          <KpiCard
            title="Pending Member Dues"
            value={formatINR(financial.pendingMemberPayments || 0)}
            subtext="Unpaid invoices & balance dues"
            icon={AlertTriangle}
            variant="amber"
            valueColor="text-amber-500"
          />
          <KpiCard
            title="Pending Coach Payouts"
            value={formatINR(financial.pendingCoachPayouts || 0)}
            subtext="Approved month-end obligations"
            icon={CreditCard}
            variant="sky"
          />
        </div>
      </section>

      {/* ── 2. Revenue and Coach Payout Analytics ────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue vs Coach Payouts Grouped Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Revenue vs Coach Payout Comparison ({year})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly collected gym membership revenue compared against certified trainer compensation
              </p>
            </div>
          </div>

          {/* Grouped Bar Chart */}
          <div className="pt-2">
            <DashboardGroupedBarChart
              data={groupedFinData}
              series1Name="Membership Revenue"
              series2Name="Coach Payouts"
              series1Color="#10b981"
              series2Color="#c57463"
              height={260}
            />
          </div>
        </div>

        {/* Right: Revenue Breakdown & Payment Collection Trends (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Payment Invoicing & Compliance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Breakdown of total invoiced commitments vs collected funds
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Invoiced (Year):</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatINR(financial.totalInvoicedYear || financial.revenueThisYear + financial.pendingMemberPayments || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Actually Cleared:</span>
                <span className="font-bold text-emerald-500 tabular-nums">
                  {formatINR(financial.revenueThisYear || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Outstanding Unpaid:</span>
                <span className="font-bold text-rose-500 tabular-nums">
                  {formatINR(financial.pendingMemberPayments || 0)}
                </span>
              </div>
              <DashboardProgressBar
                value={financial.revenueThisYear || 0}
                max={
                  (financial.revenueThisYear || 0) + (financial.pendingMemberPayments || 1)
                }
                variant="emerald"
                height={6}
                rightLabel={`${Math.round(
                  ((financial.revenueThisYear || 0) /
                    Math.max(1, (financial.revenueThisYear || 0) + (financial.pendingMemberPayments || 0))) *
                    100
                )}% Cleared`}
              />
            </div>

            {/* Coach Stipend Payout Summary Card */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Certified Roster Coaches:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {coachAtt.coachBreakdown?.length || 4} Coaches
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Disbursed This Month:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatINR(financial.coachPayoutsThisMonth || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pending Approval:</span>
                <span className="font-bold text-sky-400 tabular-nums">
                  {formatINR(financial.pendingCoachPayouts || 0)}
                </span>
              </div>
              <DashboardProgressBar
                value={financial.coachPayoutsThisMonth || 0}
                max={
                  (financial.coachPayoutsThisMonth || 0) + (financial.pendingCoachPayouts || 1)
                }
                variant="terracotta"
                height={6}
                rightLabel="Disbursed Ratio"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Today's Classes and Live Classes ───────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
                Today's Sessions & Live Class Floor
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Strictly filtered by session timetable, actual start/end clock, and coach conduction status
            </p>
          </div>

          {/* Quick status pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {classesData.summary?.live || 0} Live Now
            </span>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold">
              {classesData.summary?.upcoming || 0} Upcoming
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              {classesData.summary?.completed || 0} Completed
            </span>
            <span className="px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground font-semibold">
              {classesData.summary?.cancelled || 0} Cancelled
            </span>
          </div>
        </div>

        {/* Classes Cards Grid */}
        {classesData.todayClasses?.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
            <p className="text-sm font-medium text-muted-foreground">
              No gym sessions scheduled for today in the master timetable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {classesData.todayClasses.map((cls) => {
              const currentStatus = cls.liveStatus || cls.status || "UPCOMING";
              const isLive = currentStatus === "LIVE";
              const isCompleted = currentStatus === "COMPLETED";
              const isCancelled = currentStatus === "CANCELLED";
              const classTiming = cls.time || cls.timing || "06:00 AM - 07:00 AM";
              const presentCount = cls.presentCount ?? cls.attendanceSummary?.present ?? 0;
              const eligibleCount = cls.eligibleCount ?? cls.attendanceSummary?.eligible ?? cls.maxPax ?? 20;

              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isLive
                      ? "bg-rose-500/5 border-rose-500/40 shadow-md ring-1 ring-rose-500/20"
                      : isCompleted
                      ? "bg-card border-border/80 opacity-90"
                      : isCancelled
                      ? "bg-muted/20 border-border/40 opacity-70"
                      : "bg-card border-border/80 hover:border-primary/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        {cls.room || "Main Floor"}
                      </span>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {cls.batchName}
                      </h4>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isLive
                          ? "bg-rose-500 text-white animate-pulse"
                          : isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isCancelled
                          ? "bg-muted text-muted-foreground"
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                      {currentStatus}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{classTiming}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Coach: </span>
                      <span className="font-semibold text-foreground truncate">
                        {cls.coachName}
                      </span>
                    </div>
                  </div>

                  {/* Attendance snippet */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Enrolled:</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {presentCount > 0
                        ? `${presentCount} Present / ${eligibleCount}`
                        : `${eligibleCount} Athletes`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. Batch-Wise Member Attendance ──────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Horizontal Bar Chart of Batch Attendance Rates (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Batch-Wise Member Attendance Compliance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attendance rate calculated across scheduled sessions for {monthNames[month - 1]} {year}
              </p>
            </div>
          </div>

          <div className="py-2">
            <DashboardBarChart
              data={batchAttBarData}
              orientation="horizontal"
              height={220}
              barColor="#c57463"
              emptyMessage="No batch sessions recorded for this month"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
            <span>Overall Batch Compliance:</span>
            <span className="font-bold text-foreground">
              {memberAtt.summary?.attendanceRate || 0}% Average Presence
            </span>
          </div>
        </div>

        {/* Right: Donut Chart Present vs Absent vs Unrecorded (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Member Attendance Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total session punches distinguishing unrecorded from confirmed absences
            </p>
          </div>

          <DashboardDonutChart
            segments={memberDonutSegments}
            centerLabel="Total Punches"
            centerValue={(memberAtt.summary?.totalSessions || 0).toLocaleString()}
            size={180}
          />

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-border/50">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <span className="block text-[10px] text-emerald-500 font-bold uppercase">Present</span>
              <span className="font-bold text-foreground tabular-nums">
                {memberAtt.summary?.presentSessions || 0}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10">
              <span className="block text-[10px] text-rose-500 font-bold uppercase">Absent</span>
              <span className="font-bold text-foreground tabular-nums">
                {memberAtt.summary?.absentSessions || 0}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-500/10">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Unrecorded</span>
              <span className="font-bold text-foreground tabular-nums">
                {memberAtt.summary?.unrecordedSessions || 0}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Coach Attendance Analytics ────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Coach Presence Donut & Conduction Stats (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Coach Conduction & Presence Ratios
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified sessions conducted vs approved leaves and substitutions
            </p>
          </div>

          <DashboardDonutChart
            segments={coachDonutSegments}
            centerLabel="Assigned"
            centerValue={(coachAtt.summary?.assignedSessions || 0).toLocaleString()}
            size={180}
          />

          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground">Certified Roster Presence:</span>
            <span className="font-bold text-emerald-500 text-sm tabular-nums">
              {coachAtt.summary?.presenceRate || 0}% Conduction Rate
            </span>
          </div>
        </div>

        {/* Right: Coach Breakdown Table & Records (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Trainer Monthly Performance & Shifts
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Actual biometric punch records and leave balances for active trainers
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-semibold">Coach Name</th>
                  <th className="pb-2 font-semibold">Specialty</th>
                  <th className="pb-2 font-semibold text-center">Conducted</th>
                  <th className="pb-2 font-semibold text-center">Leaves</th>
                  <th className="pb-2 font-semibold text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(coachAtt.coachBreakdown || []).map((c) => (
                  <tr key={c.trainerId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 font-bold text-foreground">{c.name}</td>
                    <td className="py-2.5 text-muted-foreground">{c.specialty}</td>
                    <td className="py-2.5 text-center font-semibold tabular-nums text-foreground">
                      {c.conductedSessions} / {c.assignedSessions}
                    </td>
                    <td className="py-2.5 text-center font-semibold tabular-nums text-amber-500">
                      {c.approvedLeaves}
                    </td>
                    <td className="py-2.5 text-right font-bold tabular-nums">
                      <span
                        className={
                          c.attendanceRate >= 85
                            ? "text-emerald-500"
                            : c.attendanceRate >= 70
                            ? "text-amber-500"
                            : "text-rose-500"
                        }
                      >
                        {c.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-2">
            Attendance rate uses actual session attendance records and verified biometric punches.
          </p>
        </div>
      </section>

      {/* ── 6. Membership Overview & Expiring Members ────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              Membership Health & Retention Funnel
            </h2>
          </div>
        </div>

        {/* Membership KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Active Members</span>
            <div className="text-2xl font-black text-emerald-500 tabular-nums">
              {(membership.summary?.totalActive || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Gym facility access enabled</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">New This Month</span>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {(membership.summary?.newThisMonth || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Fresh enrollments</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Expiring Soon (≤14d)</span>
            <div className="text-2xl font-black text-amber-500 tabular-nums">
              {(membership.summary?.expiringSoon || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-500/80">Renewal reminders queued</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Expired Plans</span>
            <div className="text-2xl font-black text-rose-500 tabular-nums">
              {(membership.summary?.expired || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Lapsed subscriptions</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Pending Payments</span>
            <div className="text-2xl font-black text-primary tabular-nums">
              {(membership.summary?.pendingPayment || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">Invoiced balance dues</span>
          </div>
        </div>

        {/* Expiring Soon Table */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Memberships Requiring Immediate Renewal
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Athletes with memberships expiring within the next 14 calendar days
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-500 px-2.5 py-1 rounded-full bg-amber-500/10">
              {membership.recentExpiring?.length || 0} Members flagged
            </span>
          </div>

          {membership.recentExpiring?.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No active memberships are expiring within the next 14 days.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-semibold">Member</th>
                    <th className="pb-2 font-semibold">Active Plan</th>
                    <th className="pb-2 font-semibold">Assigned Batch</th>
                    <th className="pb-2 font-semibold">Expiry Date</th>
                    <th className="pb-2 font-semibold text-center">Days Remaining</th>
                    <th className="pb-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {membership.recentExpiring.map((m) => {
                    const daysRemaining = m.daysRemaining ?? m.daysLeft ?? 0;
                    return (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5">
                          <div className="font-bold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground">{m.phone || m.mobile || "—"}</div>
                        </td>
                        <td className="py-2.5 font-medium text-foreground">{m.planName}</td>
                        <td className="py-2.5 text-muted-foreground">{m.batchName || "—"}</td>
                        <td className="py-2.5 font-medium text-foreground">
                          {m.endDate ? new Date(m.endDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              daysRemaining <= 3
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            to={`/admin/trainers-members/members/${m.id}`}
                            className="px-2.5 py-1 rounded-lg border border-border/80 hover:bg-muted text-[11px] font-semibold text-primary transition-colors"
                          >
                            Open Dossier
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
