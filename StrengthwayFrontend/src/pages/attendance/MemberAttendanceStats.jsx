import {
  Users,
  CheckCircle2,
  Sparkles,
  XCircle,
  ArrowRightLeft,
} from "lucide-react";

export function MemberAttendanceStats({ dailyKpis }) {
  return (
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
  );
}
