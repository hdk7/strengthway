import { useState, useEffect } from "react";
import {
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  XCircle,
  ShieldCheck,
  Flame,
  Layers,
  Loader2,
} from "lucide-react";
import { getCurrentUser } from "@/auth/currentUser";
import { getMemberById } from "@/lib/membersService";
import { getBatches } from "@/lib/batchesService";
import { useMemberProfileTracking } from "@/pages/trainers-members/members/profile/useMemberProfileTracking";
import { MemberAttendanceCalendar } from "@/pages/trainers-members/members/profile/MemberAttendanceCalendar";
import { getTailwindWidth } from "@/lib/tailwindUtils";

export function MemberPersonalAttendanceView() {
  const currentUser = getCurrentUser();
  const memberId = currentUser.memberId || "MEM-2001";

  const [member, setMember] = useState(null);
  const [allBatches, setAllBatches] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingProfile(true);

    Promise.all([
      getMemberById(memberId).catch(() => null),
      getBatches().catch(() => []),
    ])
      .then(([memberData, batchesData]) => {
        if (cancelled) return;
        setMember(memberData);
        setAllBatches(Array.isArray(batchesData) ? batchesData : []);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const {
    selectedMonth,
    setSelectedMonth,
    formattedSelectedMonth,
    handlePrevMonth,
    handleNextMonth,
    handleCurrentMonth,
    primaryBatchDetails,
    attendanceSummary,
    calendarDays,
    isTrackingLoading,
  } = useMemberProfileTracking({
    id: memberId,
    member,
    allBatches,
  });

  const memberName = member
    ? `${member.firstName || ""} ${member.lastName || ""}`.trim() || currentUser.name
    : currentUser.name;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-mono font-semibold">
            <ShieldCheck size={14} />
            <span>Personal Biometric Attendance • #{memberId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-display tracking-tight mt-1">
            My Attendance Ledger
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Personal month-by-month biometric punch records, attendance streak, and schedule compliance.
          </p>
        </div>

        {primaryBatchDetails && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Enrolled Slot
              </span>
              <span className="text-xs font-bold text-foreground block truncate">
                {primaryBatchDetails.name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono block">
                {primaryBatchDetails.timingLabel} • {primaryBatchDetails.daysLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Personal Attendance KPI Summary Strip ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Attendance Percentage */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              {attendanceSummary.attendancePercentage}%
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                attendanceSummary.attendancePercentage >= 75
                  ? "bg-emerald-500/15 text-emerald-500"
                  : attendanceSummary.attendancePercentage >= 50
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-rose-500/15 text-rose-500"
              }`}
            >
              {attendanceSummary.attendancePercentage >= 75 ? "Consistent" : "Needs Regularity"}
            </span>
          </div>
          <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className={`bg-primary h-1.5 rounded-full transition-all duration-300 ${getTailwindWidth(
                attendanceSummary.attendancePercentage
              )}`}
            />
          </div>
        </div>

        {/* KPI 2: Sessions Present */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Days Present</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
              {attendanceSummary.presentCount}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              of {attendanceSummary.totalLoggedSessions || 0} logged
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {attendanceSummary.flexPresentCount > 0
              ? `${attendanceSummary.primaryPresentCount} primary + ${attendanceSummary.flexPresentCount} flex pass`
              : "Standard slot sessions attended"}
          </p>
        </div>

        {/* KPI 3: Sessions Missed / Absent */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Days Absent</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-rose-600 dark:text-rose-400">
              {attendanceSummary.absentCount}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">sessions</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {attendanceSummary.absentCount === 0
              ? "Flawless streak this month!"
              : "Missed scheduled training days"}
          </p>
        </div>

        {/* KPI 4: Biometric Integration Note */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Punch System</span>
            <Clock size={16} className="text-accent" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-foreground block">
              Biometric Hardware
            </span>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Punches are captured instantly at the turnstile reader upon fingerprint or facial scan.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Biometric Sync Online</span>
          </div>
        </div>
      </div>

      {/* ─── Interactive Month-Wise Visual Attendance Calendar ──────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        {isTrackingLoading || isLoadingProfile ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">
              Retrieving your biometric attendance records…
            </p>
          </div>
        ) : (
          <MemberAttendanceCalendar
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            formattedSelectedMonth={formattedSelectedMonth}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            handleCurrentMonth={handleCurrentMonth}
            attendanceSummary={attendanceSummary}
            calendarDays={calendarDays}
          />
        )}
      </div>
    </div>
  );
}
