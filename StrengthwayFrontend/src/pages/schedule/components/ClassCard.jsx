import { useState } from "react";
import { Edit3, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";

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
      className={`group relative rounded-2xl border transition-all duration-200 bg-white dark:bg-card shadow-xs flex flex-col justify-between overflow-hidden ${
        isSelected
          ? "border-blue-600 dark:border-primary ring-2 ring-blue-600/20 dark:ring-primary/25 shadow-md"
          : "border-slate-200/90 dark:border-border hover:border-slate-300 dark:hover:border-foreground/25 hover:shadow-md"
      }`}
    >
      {/* Top Bar with ID, Status, Selection Checkbox & Actions */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Multi-Select Checkbox */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={() => onToggleSelect(classItem.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-blue-700 dark:bg-primary border-blue-700 dark:border-primary text-white"
                    : "border-slate-300 dark:border-muted-foreground/40 bg-white dark:bg-background hover:border-blue-600 dark:hover:border-primary"
                }`}
                title={isSelected ? "Deselect class" : "Select class"}
              >
                {isSelected && <Check size={13} strokeWidth={3} />}
              </button>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-primary bg-blue-50 dark:bg-primary/10 px-2 py-0.5 rounded-md">
                  {classItem.id}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    classItem.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground"
                  }`}
                >
                  {classItem.status}
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-foreground group-hover:text-blue-700 dark:group-hover:text-primary transition-colors">
                {classItem.name}
              </h3>
            </div>
          </div>

          {/* Quick Actions */}
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
        </div>
      </div>

      {/* Workouts Details Section */}
      <div className="px-5 py-2 space-y-3 flex-1">
        {/* Beginner Workouts Block */}
        <div className="rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/70 dark:bg-muted/30 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Beginner Workouts
            </span>
            {!hasBeginner && (
              <span className="text-[10px] italic text-slate-400 dark:text-muted-foreground">
                Not specified
              </span>
            )}
          </div>
          <p
            className={`text-xs text-slate-700 dark:text-foreground/90 leading-relaxed ${
              !isExpanded ? "line-clamp-2" : ""
            }`}
          >
            {hasBeginner ? classItem.beginnerWorkouts : "No beginner-specific routine prescribed."}
          </p>
        </div>

        {/* Intermediate Workouts Block */}
        <div className="rounded-xl border border-blue-100/70 dark:border-primary/20 bg-blue-50/40 dark:bg-primary/5 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-primary" />
              Intermediate Workouts
            </span>
            {!hasIntermediate && (
              <span className="text-[10px] italic text-slate-400 dark:text-muted-foreground">
                Not specified
              </span>
            )}
          </div>
          <p
            className={`text-xs text-slate-800 dark:text-foreground leading-relaxed ${
              !isExpanded ? "line-clamp-2" : ""
            }`}
          >
            {hasIntermediate ? classItem.intermediateWorkouts : "No intermediate routine prescribed."}
          </p>
        </div>

        {/* Additional Custom Workouts */}
        {customWorkouts.map((w, idx) => (
          <div
            key={w.id || idx}
            className="rounded-xl border border-indigo-100/70 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {w.subject || `Workout #${idx + 1}`}
              </span>
            </div>
            {w.message && (
              <p
                className={`text-xs text-slate-800 dark:text-foreground leading-relaxed ${
                  !isExpanded ? "line-clamp-2" : ""
                }`}
              >
                {w.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Card Footer: Expand toggle */}
      <div className="mt-2 border-t border-slate-100 dark:border-border/70 px-5 py-2.5 flex items-center justify-between bg-slate-50/40 dark:bg-card/50 text-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground cursor-pointer transition-colors"
        >
          <span>{isExpanded ? "Show Less" : "View Full Workouts"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
}
