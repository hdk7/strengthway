import { CreditCard, CheckCircle2, Users, Archive } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";

export function MembershipPlanStats({ stats }) {
  return (
    <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <KpiCard
        title="Total Plans"
        value={stats.total}
        subtext="Configured membership tiers"
        icon={CreditCard}
        colorScheme="terracotta"
      />
      <KpiCard
        title="Active Tiers"
        value={stats.active}
        subtext="Available for enrollment"
        icon={CheckCircle2}
        colorScheme="emerald"
      />
      <KpiCard
        title="Enrolled Athletes"
        value={stats.totalEnrolled}
        subtext="Active subscriptions"
        icon={Users}
        colorScheme="sky"
      />
      <KpiCard
        title="Archived"
        value={stats.archived}
        subtext="Soft-deleted plans"
        icon={Archive}
        colorScheme="default"
      />
    </div>
  );
}
