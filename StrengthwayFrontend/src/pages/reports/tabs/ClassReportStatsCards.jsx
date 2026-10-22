import { CalendarDays, CheckCircle2, Clock, Award, Users, Dumbbell } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";

export function ClassReportStatsCards({ classesReport }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
      <KpiCard
        title="Total Sessions"
        value={classesReport?.summary?.totalSessions ?? 0}
        subtext="classes"
        icon={CalendarDays}
        colorScheme="default"
      />
      <KpiCard
        title="Conducted"
        value={classesReport?.summary?.completedCount ?? 0}
        subtext="completed"
        icon={CheckCircle2}
        colorScheme="emerald"
      />
      <KpiCard
        title="Upcoming"
        value={classesReport?.summary?.scheduledCount ?? 0}
        subtext="on calendar"
        icon={Clock}
        colorScheme="sky"
      />
      <KpiCard
        title="Completion"
        value={`${classesReport?.summary?.completionRatePercent ?? 0}%`}
        subtext="rate"
        icon={Award}
        colorScheme="terracotta"
      />
      <KpiCard
        title="Total Attendees"
        value={classesReport?.summary?.totalAttendeesCount ?? 0}
        subtext="check-ins"
        icon={Users}
        colorScheme="default"
      />
      <KpiCard
        title="Avg Class Size"
        value={classesReport?.summary?.averageAttendancePerClass ?? 0}
        subtext="athletes"
        icon={Dumbbell}
        colorScheme="terracotta"
      />
    </div>
  );
}
