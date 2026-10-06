import { Users, CheckCircle2, Clock, Repeat } from "lucide-react";

export function TrainerAttendanceStats({ dailyKpis, selectedDate }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* On Roster */}
      <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Faculty On Roster</span>
          <Users size={16} className="text-accent" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-black text-foreground">{dailyKpis.totalOnDuty}</span>
          <span className="text-xs text-muted-foreground">coaches</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Active coaches registered</p>
      </div>

      {/* Classes Conducted */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Classes Conducted</span>
          <CheckCircle2 size={16} className="text-emerald-500" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-500">
            {dailyKpis.classesConducted}
          </span>
          <span className="text-xs text-muted-foreground">sessions</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Conducted on {selectedDate}</p>
      </div>

      {/* Hours Logged */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Floor Hours</span>
          <Clock size={16} className="text-primary" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-black text-primary">{dailyKpis.totalHours}</span>
          <span className="text-xs text-muted-foreground">hrs logged</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Cumulative coaching duration</p>
      </div>

      {/* Substitute Reassignments */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold uppercase tracking-wider">Substitute Logs</span>
          <Repeat size={16} className="text-amber-500" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-500">
            {dailyKpis.substituteCount}
          </span>
          <span className="text-xs text-muted-foreground">substitutions</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Reassigned sessions today</p>
      </div>
    </div>
  );
}
