import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Dumbbell,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";
import { getMembers } from "@/lib/membersService";
import { getTrainers } from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import {
  getCurrentUser,
  isAdmin,
  isTrainer,
  isMember,
} from "@/auth/currentUser";

export default function DashboardHome() {
  const currentUser = getCurrentUser();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    const promises = [getMembers(true).catch(() => [])];
    if (isAdmin()) {
      promises.push(getTrainers().catch(() => []));
      promises.push(getBatches().catch(() => []));
    } else if (isTrainer()) {
      promises.push(Promise.resolve([]));
      promises.push(getBatches().catch(() => []));
    } else {
      promises.push(Promise.resolve([]));
      promises.push(getBatches().catch(() => []));
    }

    Promise.all(promises)
      .then(([membersData, trainersData, batchesData]) => {
        setMembers(membersData || []);
        setTrainers(trainersData || []);
        setBatches(batchesData || []);
      })
      .catch((e) => setError(e?.message || "Failed to load dashboard data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const promises = [getMembers(true).catch(() => [])];
    if (isAdmin()) {
      promises.push(getTrainers().catch(() => []));
      promises.push(getBatches().catch(() => []));
    } else if (isTrainer()) {
      promises.push(Promise.resolve([]));
      promises.push(getBatches().catch(() => []));
    } else {
      promises.push(Promise.resolve([]));
      promises.push(getBatches().catch(() => []));
    }

    Promise.all(promises)
      .then(([membersData, trainersData, batchesData]) => {
        if (cancelled) return;
        setMembers(membersData || []);
        setTrainers(trainersData || []);
        setBatches(batchesData || []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e?.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Admin calculations
  const nonDeletedMembers = useMemo(
    () => members.filter((m) => !m.isDeleted),
    [members],
  );
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

  const totalTrainers = trainers.length;
  const activeTrainers = useMemo(
    () => trainers.filter((t) => t.status === "Active").length,
    [trainers],
  );
  const inactiveTrainers = totalTrainers - activeTrainers;
  const trainerActiveRate =
    totalTrainers > 0
      ? Math.round((activeTrainers / totalTrainers) * 100)
      : 100;

  // Role-Specific Stats Configuration
  const stats = useMemo(() => {
    if (isMember()) {
      const myRecord = members[0] || {};
      const myBatch =
        batches.find(
          (b) =>
            b.id === myRecord.batchId || b.id === myRecord.schedule?.batchId,
        ) || batches[0];
      return [
        {
          title: "My Profile",
          value: myRecord.status || "Active",
          change: myRecord.planName || "Member Profile",
          icon: UserCheck,
          path: `/member/trainers-members/members/${currentUser?.memberId || myRecord.id || "MEM-2001"}`,
          badge: "Enrolled",
          description:
            "Personal biometric attendance, body vitals, and plan dossier",
        },
        {
          title: "My Batch",
          value: myBatch?.name || "Strength Slot",
          change: myBatch?.timingLabel || myBatch?.timing || "Morning MWF",
          icon: CalendarDays,
          path: "/member/schedule/batches",
          badge: myBatch?.daysLabel || "Assigned",
          description:
            "Assigned training batch slot, timetable, and curriculum classes",
        },
        {
          title: "My Attendance",
          value: "Biometric",
          change: "Punch logs & daily schedule tracking",
          icon: ClipboardCheck,
          path: "/member/attendance/members",
          badge: "Active",
          description:
            "Live punch status, monthly presence ledger, and timetable calendar",
        },
      ];
    }

    if (isTrainer()) {
      return [
        {
          title: "Assigned Members",
          value: totalMembers.toLocaleString(),
          change: `${activeMembers} active athletes under coaching`,
          icon: Users,
          path: "/trainer/trainers-members/members",
          badge: "Assigned",
          description:
            "Gym athletes enrolled in your assigned training batches",
        },
        {
          title: "My Batches",
          value: batches.length.toLocaleString(),
          change: "Scheduled coaching slots",
          icon: CalendarDays,
          path: "/trainer/schedule/batches",
          badge: "Active",
          description:
            "Assigned batch schedules, curriculum classes, and athlete roster",
        },
        {
          title: "My Attendance",
          value: "Biometric Sync",
          change: "Daily shifts & attendance summary",
          icon: ClipboardCheck,
          path: "/trainer/attendance/trainers",
          badge: "Faculty",
          description:
            "View shift logs, biometric punches, and submit leave requests",
        },
      ];
    }

    // Default: Admin
    return [
      {
        title: "Total Members",
        value: totalMembers.toLocaleString(),
        change: `${activeMembers} active accounts · ${inactiveMembers} inactive`,
        icon: Users,
        path: "/admin/trainers-members/members",
        badge: `${memberActiveRate}% Active`,
        description:
          "Registered gym athletes, active memberships, and fitness records",
      },
      {
        title: "Total Trainers",
        value: totalTrainers.toLocaleString(),
        change: `${activeTrainers} active on roster · ${inactiveTrainers} off-duty`,
        icon: Dumbbell,
        path: "/admin/trainers-members/trainers",
        badge: `${trainerActiveRate}% Active`,
        description:
          "Certified coaches, coaching specialties, and roster status",
      },
      {
        title: "Operating Batches",
        value: batches.length.toLocaleString(),
        change: "Active time slots & capacity distribution",
        icon: CalendarDays,
        path: "/admin/schedule/batches",
        badge: "Configured",
        description:
          "Gym schedules, capacity occupancy, and master class curriculum",
      },
    ];
  }, [
    members,
    batches,
    trainers,
    totalMembers,
    activeMembers,
    inactiveMembers,
    memberActiveRate,
    totalTrainers,
    activeTrainers,
    inactiveTrainers,
    trainerActiveRate,
    currentUser,
  ]);

  const greetingRole = currentUser?.displayRole || "Administrator";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Welcome back, {currentUser?.name || "StrengthWay"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin() &&
            "Live overview of registered athletes, faculty roster, and facility operations."}
          {isTrainer() &&
            "Live overview of your assigned athletes, coaching batches, and training curriculum."}
          {isMember() &&
            "Live overview of your athlete profile, batch schedule, and biometric attendance."}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="ml-auto shrink-0 text-xs font-semibold underline cursor-pointer hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Role Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.path}
              className="group relative overflow-hidden block rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-background">
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-2">
                {loading ? (
                  <Loader2
                    size={28}
                    className="animate-spin text-muted-foreground"
                  />
                ) : (
                  <span className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                    {stat.value}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                  {stat.badge}
                </span>
              </div>

              <p className="mt-2 text-xs font-medium text-foreground/80">
                {stat.change}
              </p>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="line-clamp-1">{stat.description}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline shrink-0 ml-2">
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
