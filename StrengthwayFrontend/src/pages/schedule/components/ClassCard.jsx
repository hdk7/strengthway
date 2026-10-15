import { useState } from "react";
import { Edit3, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { isAdmin } from "@/auth/currentUser";

export function ClassCard({
  classItem,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasBeginner =
    classItem.beginnerWorkouts &&
    classItem.beginnerWorkouts.trim() !== "Not specified";
  const hasIntermediate =
    classItem.intermediateWorkouts &&
    classItem.intermediateWorkouts.trim() !== "Not specified";
  const customWorkouts = Array.isArray(classItem.workouts) ? classItem.workouts : [];

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 bg-card shadow-xs flex flex-col justify-between overflow-hidden ${
        isSelected
          ? "border-accent ring-2 ring-accent/20 shadow-md"
          : "border-border hover:border-foreground/25 hover:shadow-md"
      }`}
    >
      {/* Top Bar with ID, Status, Selection Checkbox & Actions */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Multi-Select Checkbox (Admin Only) */}
            {isAdmin() && onToggleSelect && (
              <button
                type="button"
                onClick={() => onToggleSelect(classItem.id)}
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-border bg-background hover:border-accent"
                }`}
                title={isSelected ? "Deselect class" : "Select class"}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {classItem.id}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    classItem.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {classItem.status}
                </span>
              </div>
              <h3 className="mt-1 text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors truncate">
                {classItem.name}
              </h3>
            </div>
          </div>

          {/* Quick Actions (Admin Only) */}
          {isAdmin() && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(classItem)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 dark:text-muted-foreground dark:hover:text-primary dark:hover:bg-primary/10 cursor-pointer transition-colors"
                title="Edit class"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(classItem)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-muted-foreground dark:hover:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                title="Delete class"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Workouts Details Section */}
      <div className="px-3.5 py-1.5 space-y-2 flex-1">
        {/* Beginner Workouts Block */}
        <div className="rounded-lg border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/25 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Beginner Workouts
            </span>
            {!hasBeginner && (
              <span className="text-[10px] italic text-emerald-600/60 dark:text-emerald-400/60">
                Not specified
              </span>
            )}
          </div>
          <p
            className={`text-xs text-foreground/90 dark:text-slate-200 leading-relaxed font-normal ${
              !isExpanded ? "line-clamp-2" : ""
            }`}
          >
            {hasBeginner ? classItem.beginnerWorkouts : "No beginner-specific routine prescribed."}
          </p>
        </div>

        {/* Intermediate Workouts Block */}
        <div className="rounded-lg border border-blue-500/30 dark:border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/25 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              Intermediate Workouts
            </span>
            {!hasIntermediate && (
              <span className="text-[10px] italic text-blue-600/60 dark:text-blue-400/60">
                Not specified
              </span>
            )}
          </div>
          <p
            className={`text-xs text-foreground/90 dark:text-slate-200 leading-relaxed font-normal ${
              !isExpanded ? "line-clamp-2" : ""
            }`}
          >
            {hasIntermediate ? classItem.intermediateWorkouts : "No intermediate routine prescribed."}
          </p>
        </div>

        {/* Additional Custom Workouts */}
        {customWorkouts.map((w, idx) => {
          const isIntermediate =
            w.category === "intermediate" ||
            w.category === "int" ||
            (!w.category && (
              w.subject?.toLowerCase().includes("intermediate") ||
              w.subject?.toLowerCase().includes("int") ||
              idx % 2 === 1
            ));

          return isIntermediate ? (
            <div
              key={w.id || idx}
              className="rounded-lg border border-blue-500/30 dark:border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/25 p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                  {w.subject || `Intermediate Workout #${idx + 1}`}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  Intermediate
                </span>
              </div>
              {w.message && (
                <p
                  className={`text-xs text-foreground/90 dark:text-slate-200 leading-relaxed font-normal ${
                    !isExpanded ? "line-clamp-2" : ""
                  }`}
                >
                  {w.message}
                </p>
              )}
            </div>
          ) : (
            <div
              key={w.id || idx}
              className="rounded-lg border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/25 p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  {w.subject || `Beginner Workout #${idx + 1}`}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Beginner
                </span>
              </div>
              {w.message && (
                <p
                  className={`text-xs text-foreground/90 dark:text-slate-200 leading-relaxed font-normal ${
                    !isExpanded ? "line-clamp-2" : ""
                  }`}
                >
                  {w.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Card Footer: Expand toggle */}
      <div className="mt-1.5 border-t border-border/60 px-3.5 py-2 flex items-center justify-between bg-muted/10 text-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <span>{isExpanded ? "Show Less" : "View Full Workouts"}</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
}
