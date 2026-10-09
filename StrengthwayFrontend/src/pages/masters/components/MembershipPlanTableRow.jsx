import {
  Archive,
  Sparkles,
  RotateCcw,
  Trash2,
  Edit3,
} from "lucide-react";

export function MembershipPlanTableRow({
  plan,
  enrolled,
  onToggleStatus,
  onRestore,
  onPermanentDelete,
  onEdit,
  onDelete,
}) {
  return (
    <tr
      className={`group transition-all duration-150 hover:-translate-y-px ${
        plan.isDeleted ? "opacity-75" : ""
      }`}
    >
      {/* Plan ID Badge */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/70 text-foreground/85 font-mono text-xs font-semibold tracking-tight shadow-2xs">
          #{plan.id}
        </span>
      </td>

      {/* Plan Name */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-sm font-display">
            {plan.name}
          </span>
          {plan.isDeleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive border border-destructive/30">
              <Archive size={9} />
              Archived
            </span>
          ) : plan.popular ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
              <Sparkles size={10} />
              {plan.badge || "Featured"}
            </span>
          ) : (
            plan.badge && (
              <span className="rounded-full bg-accent/20 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/30">
                {plan.badge}
              </span>
            )
          )}
        </div>
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground">
        {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""}
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="font-bold text-foreground text-sm font-display">
          {plan.formattedPrice}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {plan.period}
          </span>
        </div>
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center text-xs font-semibold text-muted-foreground">
        {plan.features?.length || 0} features
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-500 border border-blue-500/20">
          {enrolled} Athletes
        </span>
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
        {plan.isDeleted ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
            Archived
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggleStatus(plan.id)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold border cursor-pointer transition-all inline-flex items-center gap-1.5 ${
              plan.status === "Active"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
            title={`Click to ${plan.status === "Active" ? "deactivate" : "activate"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                plan.status === "Active" ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            <span>{plan.status}</span>
          </button>
        )}
      </td>

      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right">
        <div className="flex items-center justify-end gap-1.5">
          {plan.isDeleted ? (
            <>
              <button
                type="button"
                onClick={() => onRestore(plan.id, plan.name)}
                className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                title="Restore Plan to Active"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete(plan.id, plan.name)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                title="Delete Permanently"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(plan)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Edit Plan"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(plan.id, plan.name)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                title="Archive Plan (Soft Delete)"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
