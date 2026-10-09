import {
  Sparkles,
  Archive,
  Check,
  Users,
  RotateCcw,
  Trash2,
  Edit3,
} from "lucide-react";

export function MembershipPlanCard({
  plan,
  enrolled,
  onToggleStatus,
  onRestore,
  onPermanentDelete,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${
        plan.isDeleted
          ? "border-destructive/30 border-dashed bg-card/60 opacity-80"
          : plan.popular
            ? "border-amber-500/80 ring-2 ring-amber-500/40 shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] bg-linear-to-b from-amber-500/8 via-card to-card hover:border-amber-400"
            : "border-border bg-card hover:border-foreground/30"
      } ${!plan.isDeleted && plan.status === "Inactive" ? "opacity-60" : ""}`}
    >
      {/* Highlighted / Featured Badge */}
      {plan.isDeleted ? (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
          <Archive size={11} />
          Archived Plan
        </span>
      ) : plan.popular ? (
        <span className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/30">
          <Sparkles size={12} className="fill-black" />
          {plan.badge || "FEATURED TIER"}
        </span>
      ) : (
        plan.badge && (
          <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-background shadow-sm">
            {plan.badge}
          </span>
        )
      )}

      <div className="space-y-4">
        {/* Top Bar: Name, Status & Duration */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-foreground font-display">
                {plan.name}
              </h3>
              {plan.popular && !plan.isDeleted && (
                <Sparkles
                  size={14}
                  className="text-amber-400 fill-amber-400 shrink-0"
                  title="Featured Tier"
                />
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""} Commitment
            </span>
          </div>

          {plan.isDeleted ? (
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-destructive/15 text-destructive border-destructive/30">
              Archived
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus(plan.id)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                plan.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
              }`}
              title={`Click to ${plan.status === "Active" ? "deactivate" : "activate"}`}
            >
              {plan.status}
            </button>
          )}
        </div>

        {/* Price */}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-display">
              {plan.formattedPrice}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {plan.period}
            </span>
          </div>
          {plan.billing && (
            <p className="mt-1 text-[11px] text-muted-foreground">{plan.billing}</p>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Features */}
        <div className="space-y-2 border-t border-border pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Included Benefits:
          </span>
          <ul className="space-y-2">
            {plan.features?.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                <span className="line-clamp-2">{f}</span>
              </li>
            ))}
            {plan.features?.length > 4 && (
              <li className="text-[11px] text-muted-foreground font-medium pl-5">
                + {plan.features.length - 4} more benefits
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users size={13} className="text-blue-400" />
          <span>
            <strong className="text-foreground">{enrolled}</strong> Enrolled
          </span>
        </div>

        {plan.isDeleted ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRestore(plan.id, plan.name)}
              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
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
          </div>
        ) : (
          <div className="flex items-center gap-1">
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
          </div>
        )}
      </div>
    </div>
  );
}
