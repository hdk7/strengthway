/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  LogOut,
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  Inbox,
  Users,
  ClipboardCheck,
  Wallet,
  Database,
  Settings,
  CalendarDays,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { STORAGE_KEYS } from "@/config/storageKeys";

import { getCurrentUser } from "@/auth/currentUser";
import { can } from "@/auth/permissions";

const navConfig = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "inquiries", label: "Inquiries", icon: Inbox, path: "/admin/inquiries" },
  {
    id: "trainers-members",
    label: "Coaches & Members",
    icon: Users,
    children: [
      { id: "member-list", label: "Members", path: "/admin/trainers-members/members" },
      { id: "trainer-list", label: "Coaches", path: "/admin/trainers-members/trainers" },
    ],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: CalendarDays,
    children: [
      { id: "batch-schedule", label: "Batch Schedule", path: "/admin/schedule/batches" },
      {
        id: "master-class-schedule",
        label: "Class Schedule",
        path: "/admin/schedule/master-class",
      },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    children: [
      { id: "members-attendance", label: "Members Attendance", path: "/admin/attendance/members" },
      {
        id: "trainers-attendance",
        label: "Coaches Attendance",
        path: "/admin/attendance/trainers",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: Wallet,
    children: [
      { id: "members", label: "Members Payments", path: "/admin/payments/members" },
      { id: "discounts", label: "Member Discounts", path: "/admin/payments/discounts" },
      { id: "trainers", label: "Coaches Payments", path: "/admin/payments/trainers" },
    ],
  },
  {
    id: "masters",
    label: "Masters",
    icon: Database,
    children: [
      {
        id: "membership-plan",
        label: "Membership Plan",
        path: "/admin/masters/membership-plan",
      },
      {
        id: "attendance-policy",
        label: "Attendance Policy",
        path: "/admin/masters/attendance-policy",
      },
      { id: "portfolio-master", label: "Portfolio Master", path: "/admin/masters/portfolio" },
    ],
  },
  { id: "users", label: "Users & Access", icon: ShieldCheck, path: "/admin/users" },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
];

function filterNavByPermissions(items) {
  return items
    .map((item) => {
      // Direct module permission check
      if (item.id === "dashboard" && !can("dashboard", "view")) return null;
      if (item.id === "inquiries" && !can("inquiries", "view")) return null;
      if (item.id === "reports" && !can("reports", "view")) return null;
      if (item.id === "users" && !can("settings", "view")) return null;
      if (item.id === "settings" && !can("settings", "view")) return null;
      if (item.id === "my-profile" && !can("members", "view") && !can("members", "view_own")) return null;
      if (item.id === "schedule" && !item.children && !can("batches", "view") && !can("batches", "view_assigned")) return null;
      if (item.id === "attendance" && !item.children && !can("attendance", "view") && !can("attendance", "view_own")) return null;
      if (item.id === "payments" && !item.children && !can("payments", "view") && !can("payments", "view_own")) return null;

      if (item.children) {
        const filteredChildren = item.children.filter((child) => {
          if (child.id === "member-list") return can("members", "view") || can("members", "view_assigned");
          if (child.id === "trainer-list") return can("trainers", "view") || true;
          if (child.id === "batch-schedule") return can("batches", "view") || can("batches", "view_assigned");
          if (child.id === "master-class-schedule") return can("classes", "view");
          if (child.id === "members-attendance") return can("attendance", "view") || can("attendance", "view_own");
          if (child.id === "trainers-attendance") return can("attendance", "view") || can("attendance", "view_own");
          if (child.id === "members") return can("payments", "view") || can("payments", "view_own");
          if (child.id === "discounts") return can("payments", "view");
          if (child.id === "trainers") return can("payments", "view") || can("payments", "view_own");
          if (child.id === "membership-plan" || child.id === "attendance-policy" || child.id === "payment-fee") {
            return can("masters", "view");
          }
          return true;
        });

        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      return item;
    })
    .filter(Boolean);
}

function getNavConfigForUser(user) {
  const role = user?.role || "admin";
  const memberId = user?.memberId || "MEM-2001";
  const trainerId = user?.trainerId || "TRN-101";

  if (role === "admin") {
    return navConfig;
  }

  if (role === "trainer") {
    const rawTrainerNav = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/trainer/dashboard" },
      {
        id: "trainers-members",
        label: "Coaches & Members",
        icon: Users,
        children: [
          { id: "member-list", label: "Assigned Members", path: "/trainer/trainers-members/members" },
          { id: "trainer-list", label: "My Profile", path: `/trainer/trainers-members/trainers/${trainerId}` },
        ],
      },
      {
        id: "schedule",
        label: "Schedule",
        icon: CalendarDays,
        children: [
          { id: "batch-schedule", label: "Assigned Batches", path: "/trainer/schedule/batches" },
          { id: "master-class-schedule", label: "Class Schedule", path: "/trainer/schedule/master-class" },
        ],
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: ClipboardCheck,
        children: [
          { id: "members-attendance", label: "Members Attendance", path: "/trainer/attendance/members" },
          { id: "trainers-attendance", label: "My Attendance", path: "/trainer/attendance/trainers" },
        ],
      },
      {
        id: "payments",
        label: "Payments",
        icon: Wallet,
        children: [
          { id: "trainers", label: "My Payouts", path: "/trainer/payments/trainers" },
        ],
      },
      { id: "reports", label: "My Reports", icon: BarChart3, path: "/trainer/reports" },
    ];
    return filterNavByPermissions(rawTrainerNav);
  }

  if (role === "member") {
    const rawMemberNav = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/member/dashboard" },
      {
        id: "my-profile",
        label: "My Profile",
        icon: Users,
        path: `/member/trainers-members/members/${memberId}`,
      },
      {
        id: "schedule",
        label: "My Batch Schedule",
        icon: CalendarDays,
        path: "/member/schedule/batches",
      },
      {
        id: "attendance",
        label: "My Attendance",
        icon: ClipboardCheck,
        path: "/member/attendance/members",
      },
      {
        id: "payments",
        label: "My Receipts",
        icon: Wallet,
        path: "/member/payments/members",
      },
      { id: "reports", label: "My Reports", icon: BarChart3, path: "/member/reports" },
    ];
    return filterNavByPermissions(rawMemberNav);
  }

  return navConfig;
}

function findNavItemByPath(pathname, items = navConfig) {
  for (const top of items) {
    if (
      top.path === pathname ||
      (top.path && pathname.startsWith(`${top.path}/`)) ||
      (top.id === "schedule" &&
        (pathname.includes("/batches") || pathname.includes("/schedule/batches")))
    ) {
      return { top, child: undefined };
    }
    const child = top.children?.find(
      (c) =>
        c.path === pathname ||
        (c.path && pathname.startsWith(`${c.path}/`)) ||
        (c.id === "batch-schedule" && pathname.includes("/batches")) ||
        (c.id === "master-class-schedule" &&
          (pathname.includes("/schedule/master-class") ||
            pathname.includes("/schedule/classes") ||
            pathname.includes("/schedule/class") ||
            pathname.includes("/schedule/class-schedule") ||
            pathname.includes("/schedule/sessions") ||
            pathname.includes("/masters/schedule"))) ||
        (c.id === "attendance-policy" &&
          (pathname.includes("/masters/holiday") || pathname.includes("/schedule/holidays"))),
    );
    if (child) return { top, child };
  }
  return undefined;
}

const itemBase =
  "group relative flex items-center gap-3 w-full py-2.5 px-3 border border-transparent rounded-xl text-muted-foreground text-sm no-underline cursor-pointer text-left hover:bg-muted hover:text-foreground transition-all duration-150";
const itemActive = "bg-primary/10 border-primary/25 text-foreground font-bold shadow-xs";

function isSubmoduleActive(child, currentPath) {
  if (currentPath === child.path || (child.path && currentPath.startsWith(`${child.path}/`))) {
    return true;
  }
  if (child.id === "batch-schedule") {
    return currentPath.includes("/batches");
  }
  if (child.id === "master-class-schedule") {
    return (
      currentPath.includes("/schedule/master-class") ||
      currentPath.includes("/schedule/classes") ||
      currentPath.includes("/schedule/class") ||
      currentPath.includes("/schedule/class-schedule") ||
      currentPath.includes("/schedule/sessions") ||
      currentPath.includes("/masters/schedule")
    );
  }
  if (child.id === "attendance-policy") {
    return (
      currentPath.includes("/masters/holiday") ||
      currentPath.includes("/schedule/holidays")
    );
  }
  return false;
}

function SidebarNavItem({
  item,
  isCollapsed,
  isGroupOpen,
  isGroupActive,
  onToggleGroup,
  currentPath,
}) {
  const Icon = item.icon;
  const paddingClass = isCollapsed ? "justify-center px-0" : "px-3";

  if (item.path) {
    const isCustomActive =
      item.id === "schedule" &&
      (currentPath.includes("/batches") || currentPath.includes("/schedule/batches"));

    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${itemBase} ${paddingClass}${isActive || isCustomActive ? ` ${itemActive}` : ""}`
        }
        title={isCollapsed ? item.label : undefined}
      >
        {({ isActive }) => {
          const active = isActive || isCustomActive;
          return (
            <>
              <span
                className={`shrink-0 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon size={18} />
              </span>
              {!isCollapsed && (
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {active && !isCollapsed && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </>
          );
        }}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={`${itemBase} ${paddingClass}${
          isGroupActive
            ? " bg-primary/10 border-primary/20 text-foreground font-bold shadow-xs"
            : ""
        }`}
        onClick={() => onToggleGroup(item)}
        title={isCollapsed ? item.label : undefined}
      >
        <span
          className={`shrink-0 transition-colors ${
            isGroupActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          <Icon size={18} />
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </span>
            <ChevronRight
              className={`shrink-0 transition-transform duration-150 ${
                isGroupOpen ? "rotate-90" : ""
              } ${isGroupActive ? "text-primary" : "text-muted-foreground"}`}
              size={16}
            />
          </>
        )}
      </button>
      {!isCollapsed && isGroupOpen && (
        <ul className="list-none my-0.5 mb-1 p-0 flex flex-col gap-0.5">
          {item.children?.map((child) => (
            <li key={child.id}>
              <NavLink
                to={child.path}
                onClick={() => {
                  if (child.id === "master-class-schedule") {
                    window.__tsw_class_schedule_nav_target = "month";
                    window.__tsw_class_schedule_nav_time = Date.now();
                    sessionStorage.setItem("tsw_sidebar_clicked_at", String(Date.now()));
                    window.dispatchEvent(
                      new CustomEvent("tsw-nav-class-schedule", { detail: { view: "month" } })
                    );
                  }
                }}
                className={({ isActive }) => {
                  const isCurrentActive = isActive || isSubmoduleActive(child, currentPath);
                  return `flex items-center justify-between px-3 py-2 pl-9 ml-2.5 border-l-2 text-[13px] no-underline rounded-r-xl transition-all duration-150 ${
                    isCurrentActive
                      ? "border-primary bg-primary/15 text-foreground font-bold shadow-xs"
                      : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`;
                }}
              >
                {({ isActive }) => {
                  const isCurrentActive = isActive || isSubmoduleActive(child, currentPath);
                  return (
                    <>
                      <span className="truncate">{child.label}</span>
                      {isCurrentActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mr-1" />
                      )}
                    </>
                  );
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignOutModal({ open, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm p-6 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground mb-2">
          Sign out confirmation
        </h3>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mb-6 leading-relaxed">
          Are you sure you want to sign out? You will need to enter your credentials again to access
          the admin panel.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-foreground text-sm font-semibold hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold transition-colors cursor-pointer shadow-md"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed,
  mobileOpen = false,
  onMobileClose,
  isMobile = false,
}) {
  const isCollapsed = isMobile ? false : collapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const currentUser = getCurrentUser();
  const roleNavItems = getNavConfigForUser(currentUser);

  const [openGroupId, setOpenGroupId] = useState(() => {
    const match = findNavItemByPath(location.pathname, roleNavItems);
    return match?.child ? match.top.id : null;
  });

  useEffect(() => {
    const match = findNavItemByPath(location.pathname, roleNavItems);
    if (match?.child) {
      setOpenGroupId(match.top.id);
    }
  }, [location.pathname, currentUser.role]);

  const activeMatch = findNavItemByPath(location.pathname, roleNavItems);

  const toggleGroup = (item) => {
    const isAlreadyOpen = openGroupId === item.id;
    setOpenGroupId(isAlreadyOpen ? null : item.id);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    sessionStorage.removeItem("strengthway_user_permissions");
    onMobileClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside
        className={[
          "flex flex-col bg-card border border-border rounded-xl overflow-hidden",
          "fixed top-18.5 bottom-3 left-3",
          "w-(--sidebar-width,256px) z-50 shadow-xl transition-transform duration-250 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]",
          "md:z-20 md:shadow-sm md:translate-x-0",
          "md:transition-[width] md:duration-200 md:ease-in-out",
          isCollapsed
            ? "md:w-(--sidebar-width-collapsed,72px)"
            : "md:w-(--sidebar-width,256px)",
        ].join(" ")}
      >
        <nav
          className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-0.5"
          onClick={(e) => {
            if (mobileOpen && e.target.closest("a")) onMobileClose?.();
          }}
        >
          {roleNavItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isGroupOpen={openGroupId === item.id}
              isGroupActive={activeMatch?.top.id === item.id && Boolean(activeMatch.child)}
              onToggleGroup={toggleGroup}
              currentPath={location.pathname}
            />
          ))}
        </nav>

        {/* User Role Badge (Expanded view) */}
        {!isCollapsed && (
          <div className="px-3.5 py-2 border-t border-border/70 bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                {currentUser.displayRole}
              </span>
            </div>
          </div>
        )}

        <div className={`border-t border-border p-2.5 ${isCollapsed ? "flex justify-center" : ""}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
              title="Sign out - End session"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 p-2 px-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 transition-colors cursor-pointer group text-left border-none bg-transparent"
              aria-label="Sign out"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors shrink-0">
                <LogOut size={16} />
              </div>
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="text-[14px] font-semibold text-foreground group-hover:text-destructive transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  Sign Out
                </span>
              </div>
            </button>
          )}
        </div>
      </aside>

      <SignOutModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
