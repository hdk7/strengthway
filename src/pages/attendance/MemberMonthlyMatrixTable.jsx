/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FileSpreadsheet, Download, Edit3, Eye, Lock } from "lucide-react";
import {
  DAY_NAMES,
  isDateToday,
  isDatePast,
  isDateFuture,
  checkBatchScheduleAccess,
  getBatchDaysList,
} from "./memberAttendanceUtils";

export function MemberMonthlyMatrixTable({
  currentBatch,
  handleExportMatrixCSV,
  isLoadingMatrix,
  matrixData,
  selectedMonth,
  paginatedMatrixMembers,
  formattedSelectedMonth,
  onOpenEditModal,
  onOpenViewModal,
}) {
  return (
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
            Calendar attendance compliance tracking. Editing is permitted exclusively for today; past and future dates are locked.
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
                  <th className="sticky left-0 z-20 bg-card px-3 py-2 font-bold border-r border-border/60 min-w-40">
                    Athlete
                  </th>
                  <th className="px-2.5 py-2 font-bold text-center border-r border-border/60 min-w-17.5">
                    Type
                  </th>
                  {(() => {
                    const scheduledDays = getBatchDaysList(currentBatch);
                    return Array.from({ length: matrixData.daysInMonth }, (_, i) => {
                      const dayNum = i + 1;
                      const dayStr = String(dayNum).padStart(2, "0");
                      const dateStr = `${selectedMonth}-${dayStr}`;
                      const isToday = isDateToday(dateStr);
                      const isFuture = isDateFuture(dateStr);
                      let weekday = "";
                      let fullWeekday = "";
                      try {
                        const [y, mon, d] = dateStr.split("-").map(Number);
                        fullWeekday = DAY_NAMES[new Date(y, mon - 1, d).getDay()] || "";
                        weekday = fullWeekday.slice(0, 2);
                      } catch {
                        weekday = "";
                      }
                      const isBatchDay = scheduledDays.includes(fullWeekday);

                      return (
                        <th
                          key={dayNum}
                          className={`px-1 py-1.5 text-center border-r border-border/40 font-mono min-w-8 ${
                            isToday
                              ? "bg-accent/15 border-b-2 border-b-accent text-accent"
                              : !isBatchDay
                              ? "opacity-45 bg-muted/10"
                              : isFuture
                              ? "opacity-50"
                              : ""
                          }`}
                          title={
                            isToday
                              ? `${dateStr} (Today • ${isBatchDay ? "Scheduled Day" : "Non-Batch Day"})`
                              : !isBatchDay
                              ? `${dateStr} (${fullWeekday}): Non-batch day`
                              : dateStr
                          }
                        >
                          <span
                            className={`block text-[10px] font-bold ${
                              isToday ? "text-accent font-black" : "text-foreground"
                            }`}
                          >
                            {dayNum}
                          </span>
                          <span className="block text-[8px] text-muted-foreground">{weekday}</span>
                        </th>
                      );
                    });
                  })()}
                  <th className="px-3 py-2 font-bold text-right min-w-23.75">Turnout Rate</th>
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
                      <td className="sticky left-0 z-10 bg-card px-3 py-2 font-bold text-foreground border-r border-border/60 truncate max-w-40">
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
                        const isToday = isDateToday(dateStr);
                        const isPast = isDatePast(dateStr);
                        const isFuture = isDateFuture(dateStr);

                        let code = "—";
                        let cellClass = "text-muted-foreground/40";
                        let title = `${dateStr}: No session recorded`;

                        if (att) {
                          loggedCount++;
                          const st = att.status;
                          if (att.isFlexAttendance) {
                            code = "F";
                            cellClass =
                              "bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/30";
                            title = `${dateStr}: Flex Attendance • In: ${att.checkInTime || "—"}${
                              att.checkOutTime ? ` • Out: ${att.checkOutTime}` : ""
                            }`;
                            presentCount++;
                          } else if (st === "PRESENT" || att.checkInTime || st === "CHECKED_IN" || st === "CHECKED_OUT") {
                            code = "P";
                            cellClass =
                              "bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30";
                            title = `${dateStr}: Present • In: ${att.checkInTime || "—"}${
                              att.checkOutTime ? ` • Out: ${att.checkOutTime}` : ""
                            }`;
                            presentCount++;
                          } else if (st === "ABSENT") {
                            code = "A";
                            cellClass =
                              "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30";
                            title = `${dateStr}: Absent`;
                          }
                        }

                        // CALENDAR RULES:
                        // 1. Current day (isToday): Allow Edit option only.
                        // 2. Past dates (isPast): Disable editing. Retain View only if record exists.
                        // 3. Future dates (isFuture): Disable editing; not accessible through View option; remain disabled.
                        const handleCellClick = () => {
                          if (isToday) {
                            const schedule = checkBatchScheduleAccess(dateStr, currentBatch);
                            if (!schedule.isAllowed && !att?.checkInTime) {
                              toast.error(schedule.reason);
                              return;
                            }
                            onOpenEditModal?.(
                              { memberId: mem.id, name: mem.name, isFlexIn: mem.isFlexIn },
                              att ? { ...att, date: dateStr, memberId: mem.id, memberName: mem.name } : null,
                              dateStr
                            );
                          } else if (isPast && att) {
                            onOpenViewModal?.(
                              { memberId: mem.id, name: mem.name, isFlexIn: mem.isFlexIn },
                              { ...att, date: dateStr, memberId: mem.id, memberName: mem.name },
                              dateStr
                            );
                          }
                          // Future dates: do nothing (disabled)
                        };

                        return (
                          <td
                            key={dayNum}
                            title={
                              isToday
                                ? `${title} (Today — Click to Check In/Out)`
                                : isFuture
                                ? `${dateStr}: Future scheduled date (Locked)`
                                : isPast && att
                                ? `${title} (Past — Click to View)`
                                : title
                            }
                            onClick={handleCellClick}
                            className={`px-1 py-1 text-center border-r border-border/40 font-mono transition-all select-none ${
                              isToday
                                ? "bg-accent/5 ring-1 ring-inset ring-accent/30 cursor-pointer hover:bg-accent/20"
                                : isPast && att
                                ? "cursor-pointer hover:bg-muted/30"
                                : isFuture
                                ? "opacity-35 cursor-not-allowed"
                                : "cursor-default"
                            }`}
                          >
                            <span
                              className={`inline-grid min-w-5 h-5 px-0.5 place-items-center rounded-md text-[8.5px] ${cellClass}`}
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

          {/* Matrix Legend & Calendar Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 border-t border-border/60 text-[11px] text-muted-foreground shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                Legend:
              </span>
              <div className="inline-flex items-center gap-1">
                <span className="grid h-4 w-4 place-items-center rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                  P
                </span>
                <span>Present</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="grid h-4 w-4 place-items-center rounded bg-rose-500/20 text-rose-400 text-[9px] font-black border border-rose-500/30">
                  A
                </span>
                <span>Absent</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="grid h-4 w-4 place-items-center rounded bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30">
                  F
                </span>
                <span>Flex</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/80">
              <span className="inline-flex items-center gap-1 text-accent font-semibold">
                <Edit3 size={11} />
                <span>Today: Edit Enabled</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Lock size={11} />
                <span>Past & Future: Edit Disabled</span>
              </span>
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
  );
}
