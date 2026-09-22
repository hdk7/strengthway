import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Dumbbell, ArrowUpRight } from "lucide-react";
import { getMembers } from "@/lib/membersService";
import { getTrainers } from "@/lib/trainersService";

export default function DashboardHome() {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    const loadData = () => {
      setMembers(getMembers(true) || []);
      setTrainers(getTrainers() || []);
    };

    loadData();

    window.addEventListener("focus", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("focus", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Real calculations - Members
  const nonDeletedMembers = useMemo(() => members.filter((m) => !m.isDeleted), [members]);
  const totalMembers = nonDeletedMembers.length;
  const activeMembers = useMemo(
    () =>
      nonDeletedMembers.filter(
        (m) => m.status === "Active" || (!m.status && m.status !== "Inactive"),
      ).length,
    [nonDeletedMembers],
  );
  const inactiveMembers = totalMembers - activeMembers;
  const memberActiveRate =
    totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 100;

  // Real calculations - Trainers
  const totalTrainers = trainers.length;
  const activeTrainers = useMemo(
    () => trainers.filter((t) => t.status === "Active").length,
    [trainers],
  );
  const inactiveTrainers = totalTrainers - activeTrainers;
  const trainerActiveRate =
    totalTrainers > 0 ? Math.round((activeTrainers / totalTrainers) * 100) : 100;

  const stats = [
    {
      title: "Total Members",
      value: totalMembers.toLocaleString(),
      change: `${activeMembers} active accounts · ${inactiveMembers} inactive`,
      icon: Users,
      path: "/admin/trainers-members/members",
      badge: `${memberActiveRate}% Active`,
      badgeColor: "emerald",
      description: "Registered gym athletes, active memberships, and fitness records",
    },
    {
      title: "Total Trainers",
      value: totalTrainers.toLocaleString(),
      change: `${activeTrainers} active on roster · ${inactiveTrainers} off-duty`,
      icon: Dumbbell,
      path: "/admin/trainers-members/trainers",
      badge: `${trainerActiveRate}% Active`,
      badgeColor: "emerald",
      description: "Certified coaches, coaching specialties, and roster status",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live overview of registered athletes and certified coaching staff.
        </p>
      </div>

      {/* 2 Primary Calculated Stat Cards: Total Members & Total Trainers */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              to={stat.path}
              className="group relative overflow-hidden block rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent/50 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-2">
                <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">
                  {stat.value}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                  {stat.badge}
                </span>
              </div>

              <p className="mt-2 text-xs font-medium text-foreground/80">{stat.change}</p>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>{stat.description}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:underline">
                  <span>View Details</span>
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
