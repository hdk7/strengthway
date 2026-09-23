/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCoachShiftMatrix,
  toggleCoachSlot,
  SHIFT_SLOTS,
} from "@/lib/batchesService";

export default function ShiftMasterPage() {
  const [matrix, setMatrix] = useState([]);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = () => {
    setMatrix(getCoachShiftMatrix());
  };

  const handleToggle = (coachId, slotKey, coachName, slotLabel) => {
    try {
      const updatedCoach = toggleCoachSlot(coachId, slotKey);
      if (updatedCoach) {
        const isAssigned = !!updatedCoach.shifts[slotKey];
        toast.success(
          isAssigned
            ? `${coachName} assigned to ${slotLabel}`
            : `${coachName} removed from ${slotLabel}`
        );
        loadMatrix();
      }
    } catch {
      toast.error("Failed to update coach shift.");
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const totalCoaches = matrix.length;
    let totalAssignments = 0;
    matrix.forEach((c) => {
      Object.values(c.shifts || {}).forEach((val) => {
        if (val) totalAssignments += 1;
      });
    });
    const avgShifts = totalCoaches > 0 ? (totalAssignments / totalCoaches).toFixed(1) : 0;
    return { totalCoaches, totalAssignments, avgShifts };
  }, [matrix]);

  // Slot coverage summary
  const slotCoverage = useMemo(() => {
    const coverage = {};
    SHIFT_SLOTS.forEach((s) => {
      coverage[s.key] = matrix.filter((c) => !!c.shifts[s.key]).length;
    });
    return coverage;
  }, [matrix]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Coach Batch Timings / Shift Master
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Weekly coach shift roster and floor assignment matrix across all batches.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Info size={14} className="text-emerald-400" />
          <span>Click any cell to toggle coach assignment</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Coaches</span>
            <UserCheck size={18} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.totalCoaches}</div>
          <p className="mt-1 text-xs text-muted-foreground">Staffed on rotation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Shifts Scheduled</span>
            <Clock size={18} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">{stats.totalAssignments}</div>
          <p className="mt-1 text-xs text-muted-foreground">Shift slots per week</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Average Shift Load</span>
            <Sparkles size={18} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.avgShifts}</div>
          <p className="mt-1 text-xs text-muted-foreground">Shifts per coach</p>
        </div>
      </div>

      {/* Table 2: Coach Batch Timings / Shift Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm text-foreground border-collapse">
          <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 border-r border-border min-w-[180px]">Coach</th>
              {SHIFT_SLOTS.map((slot) => (
                <th
                  key={slot.key}
                  className="px-4 py-4 text-center border-r border-border min-w-[130px]"
                >
                  <div className="font-bold text-foreground">{slot.label}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{slot.time}</div>
                </th>
              ))}
              <th className="px-4 py-4 text-center min-w-[110px]">Total Shifts</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {matrix.map((row) => {
              const activeCount = Object.values(row.shifts || {}).filter(Boolean).length;
              return (
                <tr key={row.coachId} className="hover:bg-muted/20 transition-colors">
                  {/* Coach Column */}
                  <td className="px-5 py-4 font-bold text-foreground border-r border-border bg-card/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-xs font-extrabold text-foreground">
                        {row.coachName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm uppercase tracking-wide">
                          {row.coachName}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {row.role || row.fullName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Shift Slots Columns */}
                  {SHIFT_SLOTS.map((slot) => {
                    const isYes = !!row.shifts[slot.key];
                    return (
                      <td
                        key={slot.key}
                        className="px-3 py-4 text-center border-r border-border"
                      >
                        <button
                          onClick={() =>
                            handleToggle(row.coachId, slot.key, row.coachName, slot.label)
                          }
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isYes
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm hover:bg-emerald-500/25"
                              : "text-muted-foreground/40 hover:bg-accent/40 hover:text-foreground"
                          }`}
                          title={`Click to ${isYes ? "remove" : "assign"} ${row.coachName} for ${slot.label}`}
                        >
                          {isYes ? (
                            <span className="inline-flex items-center gap-1">
                              <span>YES</span>
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            </span>
                          ) : (
                            <span className="text-sm font-semibold opacity-40">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Total Shifts */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1 text-xs font-bold text-foreground">
                      {activeCount} / 6
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Coverage Row */}
          <tfoot className="border-t-2 border-border bg-muted/30 text-xs font-semibold">
            <tr>
              <td className="px-5 py-3.5 text-muted-foreground border-r border-border uppercase tracking-wider">
                Staff Coverage
              </td>
              {SHIFT_SLOTS.map((slot) => {
                const count = slotCoverage[slot.key] || 0;
                return (
                  <td
                    key={slot.key}
                    className="px-3 py-3.5 text-center border-r border-border"
                  >
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        count >= 2
                          ? "text-emerald-400"
                          : count === 1
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {count} {count === 1 ? "Coach" : "Coaches"}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-3.5 text-center text-muted-foreground">
                {stats.totalAssignments} Total
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
