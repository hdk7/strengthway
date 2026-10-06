import {
  Boxes,
  Users,
  Eye,
  Edit3,
  Power,
  Trash2,
} from "lucide-react";

export function ScheduleProgramCard({
  schedule,
  batches,
  onOpenAssignModal,
  onOpenViewClasses,
  onOpenEdit,
  onToggleStatus,
  onDelete,
}) {
  const isActive = schedule.status === "Active";
  const assignedBatchIds = Array.isArray(schedule.batchIds)
    ? schedule.batchIds
    : schedule.batchId
      ? [schedule.batchId]
      : [];
  const assignedBatchObjs = assignedBatchIds
    .map((id) => batches.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      <div>
        {/* Top Bar: Title, Batch Count, & Status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                {schedule.totalClasses || 12}
              </span>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {schedule.name}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {schedule.description || "Reusable 12-class progressive periodization program."}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${
              isActive
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`}
            />
            {schedule.status}
          </span>
        </div>

        {/* Multi-Batch Assignment Highlight Section */}
        <div className="mt-4 rounded-xl border border-border/80 bg-accent/5 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Boxes size={13} className="text-primary" />
              <span>Assigned Batches ({assignedBatchObjs.length}):</span>
            </span>
            <button
              onClick={() => onOpenAssignModal(schedule)}
              className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Users size={12} />
              <span>Manage Batches</span>
            </button>
          </div>

          {assignedBatchObjs.length === 0 ? (
            <div className="text-xs text-muted-foreground italic flex items-center justify-between">
              <span>Reusable Template (Not assigned to any batch yet)</span>
              <button
                onClick={() => onOpenAssignModal(schedule)}
                className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 cursor-pointer"
              >
                + Assign to Batches
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {assignedBatchObjs.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{b.name || b.shortName}</span>
                  <span className="text-[11px] text-muted-foreground">({b.startTime})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onOpenViewClasses(schedule, "curriculum")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
            title="Configure and manage schedule curriculum classes"
          >
            <Eye size={14} />
            <span>Configure Syllabus</span>
          </button>

          <button
            onClick={() => onOpenEdit(schedule)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            title="Edit program configuration"
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleStatus(schedule.id)}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isActive ? "text-amber-500 hover:bg-amber-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
            }`}
            title={isActive ? "Deactivate program" : "Activate program"}
          >
            <Power size={13} />
            <span>{isActive ? "Deactivate" : "Activate"}</span>
          </button>

          <button
            onClick={() => onDelete(schedule.id, schedule.name)}
            className="inline-flex items-center p-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
            title="Delete program"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
