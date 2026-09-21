/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  LogOut,
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  Users,
  Boxes,
  ClipboardCheck,
  Wallet,
  Inbox,
  BarChart3,
  Database,
  Settings,
} from "lucide-react";

const navConfig = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  {
    id: "trainers-members",
    label: "Trainers & Members",
    icon: Users,
    children: [
      { id: "trainer-list", label: "Trainer", path: "/admin/trainers-members/trainers" },
      { id: "member-list", label: "Member", path: "/admin/trainers-members/members" },
    ],
  },
  {
    id: "batches",
    label: "Batches",
    icon: Boxes,
    children: [{ id: "list", label: "Batch List", path: "/admin/batches/list" }],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    children: [
      { id: "members-attendance", label: "Members Attendance", path: "/admin/attendance/members" },
      {
        id: "trainers-attendance",
        label: "Trainers Attendance",
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
      { id: "trainers", label: "Trainers Payments", path: "/admin/payments/trainers" },
    ],
  },
  { id: "inquiries", label: "Inquiries", icon: Inbox, path: "/admin/inquiries" },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3, path: "/admin/reports" },
  {
    id: "masters",
    label: "Masters",
    icon: Database,
    children: [
      { id: "shift", label: "Shift Master", path: "/admin/masters/shift" },
      { id: "batch", label: "Batch Master", path: "/admin/masters/batch" },
      {
        id: "membership-plan",
        label: "Membership Plan Master",
        path: "/admin/masters/membership-plan",
      },
      { id: "schedule", label: "Schedule Master", path: "/admin/masters/schedule" },
      {
        id: "attendance-policy",
        label: "Attendance Policy Master",
        path: "/admin/masters/attendance-policy",
      },
      { id: "holiday", label: "Holiday Master", path: "/admin/masters/holiday" },
      { id: "payment-fee", label: "Payment Fee Master", path: "/admin/masters/payment-fee" },
    ],
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
];

function findNavItemByPath(pathname) {
  for (const top of navConfig) {
    if (top.path === pathname) return { top, child: undefined };
    const child = top.children?.find((c) => c.path === pathname);
    if (child) return { top, child };
  }
  return undefined;
}

const itemBase =
  "flex items-center gap-3 w-full py-2.5 px-3 border-none bg-transparent rounded-xl text-muted-foreground text-sm no-underline cursor-pointer text-left hover:bg-accent/10 hover:text-foreground transition-colors";
const itemActive = "bg-accent/15 text-foreground font-semibold";

function SidebarNavItem({ item, isCollapsed, isGroupOpen, isGroupActive, onToggleGroup }) {
  const Icon = item.icon;
  const paddingClass = isCollapsed ? "justify-center px-0" : "px-3";

  if (item.path) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${itemBase} ${paddingClass}${isActive ? ` ${itemActive}` : ""}`
        }
        title={isCollapsed ? item.label : undefined}
      >
        <span className="shrink-0">
          <Icon size={18} />
        </span>
        {!isCollapsed && (
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {item.label}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={`${itemBase} ${paddingClass}${isGroupActive ? ` ${itemActive}` : ""}`}
        onClick={() => onToggleGroup(item.id)}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="shrink-0">
          <Icon size={18} />
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </span>
            <ChevronRight
              className={`shrink-0 transition-transform duration-150 ${isGroupOpen ? "rotate-90" : ""}`}
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
                className={({ isActive }) =>
                  `block px-3 py-2 pl-10.5 ml-2 border-l-2 text-[13.5px] no-underline rounded-r-xl transition-colors ${
                    isActive
                      ? "border-primary bg-accent/15 text-foreground font-semibold"
                      : "border-border text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                  }`
                }
              >
                {child.label}
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
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm p-6 bg-card border border-border rounded-2xl shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
          Sign out confirmation
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Are you sure you want to sign out? You will need to enter your credentials again to access
          the admin panel.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-foreground text-sm font-medium hover:bg-accent/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold transition-colors cursor-pointer shadow-md"
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

  const [openGroupId, setOpenGroupId] = useState(() => {
    const match = findNavItemByPath(location.pathname);
    return match?.child ? match.top.id : null;
  });

  useEffect(() => {
    const match = findNavItemByPath(location.pathname);
    if (match?.child) {
      setOpenGroupId(match.top.id);
    }
  }, [location.pathname]);

  const toggleGroup = (id) => setOpenGroupId((cur) => (cur === id ? null : id));
  const activeMatch = findNavItemByPath(location.pathname);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("tsw-token");
    localStorage.removeItem("tsw-user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    onMobileClose?.();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      <aside
        className={[
          "flex flex-col bg-card border border-border rounded-xl overflow-hidden",
          "fixed top-21 bottom-3 left-3",
          "w-[var(--sidebar-width,256px)] z-50 shadow-xl transition-transform duration-250 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]",
          "md:z-20 md:shadow-sm md:translate-x-0",
          "md:transition-[width] md:duration-200 md:ease-in-out",
          isCollapsed
            ? "md:w-[var(--sidebar-width-collapsed,72px)]"
            : "md:w-[var(--sidebar-width,256px)]",
        ].join(" ")}
      >
        <nav
          className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-0.5 scrollbar-thin [scrollbar-color:var(--color-border)_transparent]"
          onClick={(e) => {
            if (mobileOpen && e.target.closest("a")) onMobileClose?.();
          }}
        >
          {navConfig.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isGroupOpen={openGroupId === item.id}
              isGroupActive={activeMatch?.top.id === item.id && Boolean(activeMatch.child)}
              onToggleGroup={toggleGroup}
            />
          ))}
        </nav>

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
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors shrink-0">
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
