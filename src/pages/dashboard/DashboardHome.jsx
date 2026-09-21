import { Users, IndianRupee, Calendar, TrendingUp } from "lucide-react";

const STATS = [
  {
    title: "Total Members",
    value: "1,248",
    change: "+12% from last month",
    icon: Users,
  },
  {
    title: "Monthly Revenue",
    value: "₹4,82,500",
    change: "+8.4% from last month",
    icon: IndianRupee,
  },
  {
    title: "Active Batches",
    value: "24",
    change: "4 running today",
    icon: Calendar,
  },
  {
    title: "Attendance Rate",
    value: "91.2%",
    change: "+3.1% this week",
    icon: TrendingUp,
  },
];

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is an overview of your gym operations and performance metrics today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-border/80 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Live Activity</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          You are signed in to The Strength Way Admin Panel. Use the sidebar on the left to manage
          trainers, members, batches, attendance, payments, inquiries, reports, and system masters.
        </p>
      </div>
    </div>
  );
}
