import { Users, ShieldCheck, XCircle, Repeat } from "lucide-react";

export function TrainerAttendanceStats({ dailyKpis = {} }) {
  const totalFaculty = dailyKpis.totalFaculty ?? dailyKpis.totalOnDuty ?? 0;
  const presentCount = dailyKpis.presentCount ?? dailyKpis.classesConducted ?? 0;
  const absentCount = dailyKpis.absentCount ?? 0;
  const turnoutRate = dailyKpis.turnoutRate ?? (totalFaculty > 0 ? Math.round((presentCount / totalFaculty) * 100) : 0);

  const substituteCount = dailyKpis.substituteCount ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
      {/* 1. Faculty on Roster */}
      <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider">Faculty Roster</span>
          <Users size={14} className="text-accent" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-foreground">{totalFaculty}</span>
          <span className="text-[10px] text-muted-foreground">coaches</span>
        </div>
      </div>

      {/* 2. Present Today */}
      <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
          <ShieldCheck size={14} className="text-emerald-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-emerald-500">{presentCount}</span>
          <span className="text-[10px] font-bold text-emerald-400/80">
            ({turnoutRate}%)
          </span>
        </div>
      </div>

      {/* 3. Absent / Missed */}
      <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
          <XCircle size={14} className="text-rose-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-rose-500">{absentCount}</span>
          <span className="text-[10px] text-muted-foreground">missed</span>
        </div>
      </div>


      {/* 5. Substitute Logs */}
      <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider">Substitutes</span>
          <Repeat size={14} className="text-amber-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-amber-500">{substituteCount}</span>
          <span className="text-[10px] text-muted-foreground">reassigned</span>
        </div>
      </div>
    </div>
  );
}
