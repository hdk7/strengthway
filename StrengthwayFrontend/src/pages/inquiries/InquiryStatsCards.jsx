import { Inbox, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";

export default function InquiryStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 shrink-0">
      <KpiCard
        title="Total"
        value={stats.total}
        subtext="Lifetime inquiries"
        icon={Inbox}
        colorScheme="terracotta"
      />
      <KpiCard
        title="Inquiries"
        value={stats.pendingInquiries}
        subtext="Pending inquiries"
        icon={Clock}
        colorScheme="amber"
      />
      <KpiCard
        title="Contacted"
        value={stats.contacted}
        subtext="In communication"
        icon={MessageSquare}
        colorScheme="sky"
      />
      <KpiCard
        title="Converted"
        value={stats.converted}
        subtext="Active members"
        icon={CheckCircle2}
        colorScheme="emerald"
      />
    </div>
  );
}
