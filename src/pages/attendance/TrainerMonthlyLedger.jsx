import { Award, Users, Repeat } from "lucide-react";

export function TrainerMonthlyLedger({
  formattedSelectedMonth,
  paginatedMonthlySummary,
  monthlySubstituteLogs,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar">
      {/* Monthly Matrix Table */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <span>Faculty Coaching Ledger — {formattedSelectedMonth}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aggregate coaching performance, total athletes reached, and substitute coverages.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-95 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-3 px-4 sm:px-6">Faculty Member</th>
                <th className="py-3 px-4 sm:px-5">Shift</th>
                <th className="py-3 px-4 sm:px-5 text-center">Classes Conducted</th>
                <th className="py-3 px-4 sm:px-5 text-center">Athletes Reached</th>
                <th className="py-3 px-4 sm:px-5 text-center">Substitute Delivered</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {paginatedMonthlySummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users size={28} className="mx-auto text-muted-foreground/50" />
                      <p className="font-bold text-foreground text-sm">No Faculty Activity Recorded</p>
                      <p className="text-xs text-muted-foreground">No coaching logs found for {formattedSelectedMonth}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMonthlySummary.map(({ trainer, conductedCount, substituteDeliveredCount, totalAttendees }) => (
                  <tr key={trainer.id} className="group transition-all duration-150 hover:-translate-y-px">
                    {/* Faculty Member */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm border border-accent/25 uppercase">
                          {trainer.name ? trainer.name.charAt(0) : "T"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              {trainer.name}
                            </span>
                            <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                              #{trainer.id?.length > 7 ? trainer.id.slice(-6).toUpperCase() : trainer.id}
                            </span>
                          </div>
                          {trainer.specialization && (
                            <span className="text-[11px] text-muted-foreground block mt-0.5 font-normal">
                              {trainer.specialization}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Shift */}
                    <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {trainer.shift || "General Shift"}
                      </span>
                    </td>

                    {/* Classes Conducted */}
                    <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                          {conductedCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">sessions</span>
                      </div>
                    </td>

                    {/* Athletes Reached */}
                    <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                          {totalAttendees}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">athletes</span>
                      </div>
                    </td>

                    {/* Substitute Delivered */}
                    <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-base text-primary">
                          {substituteDeliveredCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">coverages</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Substitute Coaching Ledger */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Substitute Coaching Ledger — {formattedSelectedMonth}
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {monthlySubstituteLogs.length} Sessions Reassigned
          </span>
        </div>

        {monthlySubstituteLogs.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-85 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Date & Time</th>
                  <th className="py-2.5 px-4 sm:px-5">Batch Container</th>
                  <th className="py-2.5 px-4 sm:px-5">Scheduled Coach</th>
                  <th className="py-2.5 px-4 sm:px-5">Substitute Coach</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Attendees</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {monthlySubstituteLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="group transition-all duration-150 hover:-translate-y-px">
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <span className="font-semibold text-foreground block">{log.date}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {log.checkInTime || "Scheduled"}
                      </span>
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors font-bold text-foreground">
                      {log.batchName || log.batchId}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-muted-foreground font-semibold">
                      {log.trainerName || log.trainerId}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-amber-600 dark:text-amber-400 font-bold">
                      {log.substituteTrainerName || log.substituteTrainerId || "Substitute Coach"}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono font-bold">
                      {log.attendeesCount || 0}
                    </td>
                    <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right text-muted-foreground italic text-xs">
                      {log.notes || "Substitute coverage"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No substitute coaching sessions recorded in {formattedSelectedMonth}. All classes were delivered by their assigned primary coaches.
          </div>
        )}
      </div>
    </div>
  );
}
