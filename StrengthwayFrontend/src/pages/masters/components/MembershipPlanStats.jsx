import { CreditCard, CheckCircle2, Users, Archive } from "lucide-react";

export function MembershipPlanStats({ stats }) {
  return (
    <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Plans</span>
          <CreditCard size={16} className="text-muted-foreground" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">{stats.total}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Configured membership tiers</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Active Tiers</span>
          <CheckCircle2 size={16} className="text-emerald-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400">{stats.active}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Available for enrollment</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Enrolled Athletes
          </span>
          <Users size={16} className="text-blue-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">{stats.totalEnrolled}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Active subscriptions</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Archived</span>
          <Archive size={16} className="text-muted-foreground" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">{stats.archived}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Soft-deleted plans</p>
      </div>
    </div>
  );
}
