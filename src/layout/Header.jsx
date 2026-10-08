import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Globe,
  PhoneCall,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/avatar";
import { getCurrentUser } from "@/auth/currentUser";
import { useTheme } from "@/hooks/theme";
import { getInquiries } from "@/lib/inquiriesService";
import logo from "@/assets/gym_logo.png";

const iconBtnClass =
  "inline-flex items-center justify-center w-[34px] h-[34px] rounded-full border border-border bg-transparent text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors";

export default function Header({ onToggle, sidebarVisible }) {
  const { theme, toggleTheme } = useTheme();
  const [currentUser] = useState(getCurrentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const isDark = theme === "dark";

  const [reminders, setReminders] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const hasNotifiedRef = useRef(false);
  const navigate = useNavigate();

  const fetchReminders = useCallback(async () => {
    try {
      const data = await getInquiries();
      const today = new Date().toISOString().split("T")[0];
      const items = (data || [])
        .filter((inq) => {
          if (inq.isDeleted) return false;
          const details = inq.contactDetails;
          return (
            inq.status === "Contacted" &&
            details?.outcome === "Needs Follow-Up" &&
            Boolean(details?.followUpDate)
          );
        })
        .map((inq) => {
          const fDate = inq.contactDetails.followUpDate;
          let urgency = "upcoming";
          if (fDate === today) urgency = "today";
          else if (fDate < today) urgency = "overdue";
          return {
            ...inq,
            urgency,
          };
        })
        .sort((a, b) => {
          const pRank = { today: 0, overdue: 1, upcoming: 2 };
          if (pRank[a.urgency] !== pRank[b.urgency]) {
            return pRank[a.urgency] - pRank[b.urgency];
          }
          return (a.contactDetails.followUpDate || "").localeCompare(
            b.contactDetails.followUpDate || "",
          );
        });

      setReminders(items);
    } catch {
      // Quiet fail to avoid intrusive errors on background polls
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000);
    const handleUpdate = () => fetchReminders();
    window.addEventListener("inquiry-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("inquiry-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [fetchReminders]);

  const dueCount = reminders.filter(
    (r) => r.urgency === "today" || r.urgency === "overdue",
  ).length;

  useEffect(() => {
    if (!hasNotifiedRef.current && dueCount > 0) {
      hasNotifiedRef.current = true;
      toast.info(
        `🔔 ${dueCount} follow-up reminder(s) require recontact today!`,
        {
          action: {
            label: "View Reminders",
            onClick: () => setIsNotifOpen(true),
          },
        },
      );
    }
  }, [dueCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  return (
    <header className="relative flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 h-15 bg-card border border-border rounded-xl shadow-sm shrink-0">
      {/* Left section: Toggle & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Toggle button */}
        <button
          type="button"
          className={`shrink-0 xl:hidden ${iconBtnClass}`}
          onClick={onToggle}
          aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarVisible ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="TheStrengthWay" className="w-8 h-8 object-contain shrink-0" />
          <span className="hidden sm:inline text-sm font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            TheStrengthWay
          </span>
        </div>
      </div>

      {/* Spacer to push controls to the right */}
      <div className="flex-1" />

      {/* Right actions (Search Bar + Notification + Theme + User) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* View Site Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="View Landing Page"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">View Site</span>
        </Link>

        {/* Search Bar */}
        <div className="relative flex items-center group">
          <Search
            size={16}
            className="absolute left-3 text-muted-foreground pointer-events-none opacity-60 group-focus-within:text-accent group-focus-within:opacity-100 transition-colors"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-28 xs:w-36 sm:w-48 md:w-56 lg:w-64 h-8.5 pl-9 pr-3 rounded-full border border-border bg-background text-foreground text-xs sm:text-sm placeholder:text-muted-foreground placeholder:opacity-50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>

        {/* Notification Icon & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className={`relative ${iconBtnClass}`}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            title={dueCount > 0 ? `${dueCount} follow-ups due today` : "Notifications"}
          >
            <Bell size={18} />
            {dueCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                  {dueCount > 9 ? "9+" : dueCount}
                </span>
                <span className="animate-ping absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-amber-400 opacity-75 pointer-events-none" />
              </>
            )}
            {dueCount === 0 && reminders.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-amber-500" />
                  <span className="text-sm font-bold text-foreground">Follow-up Reminders</span>
                </div>
                {dueCount > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    {dueCount} Due
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                    {reminders.length} Scheduled
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/50 no-scrollbar">
                {reminders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-1.5">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-500/70" />
                    <p className="font-semibold text-foreground">No pending follow-ups</p>
                    <p>All leads and prospect interactions are completely up to date.</p>
                  </div>
                ) : (
                  reminders.map((rem) => {
                    const isDueToday = rem.urgency === "today";
                    const isOverdue = rem.urgency === "overdue";
                    return (
                      <div
                        key={rem.id}
                        className="p-3.5 hover:bg-muted/40 transition-colors flex flex-col gap-2 group cursor-pointer"
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate(`/admin/inquiries/${rem.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {rem.name || "Anonymous"}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {rem.id}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              isDueToday
                                ? "bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse"
                                : isOverdue
                                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                                  : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            <Clock size={10} />
                            {isDueToday
                              ? "Due Today"
                              : isOverdue
                                ? "Overdue"
                                : rem.contactDetails.followUpDate}
                          </span>
                        </div>

                        {rem.contactDetails?.contactNotes && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                            &ldquo;{rem.contactDetails.contactNotes}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {rem.mobile || rem.email || "No direct phone"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsNotifOpen(false);
                              navigate(`/admin/inquiries/${rem.id}`);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <PhoneCall size={11} />
                            <span>Recontact</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border/80 bg-muted/20 p-2 text-center">
                <Link
                  to="/admin/inquiries"
                  onClick={() => setIsNotifOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>View All Inquiries</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          className={iconBtnClass}
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Info & Avatar */}
        {(() => {
          const rawName = currentUser?.name;
          const displayName =
            !rawName ||
            rawName === "Gym Admin" ||
            rawName === "Admin User" ||
            rawName.toLowerCase().includes("gym admin")
              ? "StrengthWay"
              : rawName;
          return (
            <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2.5 border-l border-border">
              <div className="hidden min-[768px]:flex flex-col text-right leading-[1.3]">
                <span className="text-[13px] font-semibold text-foreground">{displayName}</span>
              </div>
              <Avatar name={displayName} />
            </div>
          );
        })()}
      </div>
    </header>
  );
}
