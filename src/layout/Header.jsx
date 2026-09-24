import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, PanelLeftClose, PanelLeftOpen, Search, Bell, Globe } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { getCurrentUser } from "@/auth/currentUser";
import { useTheme } from "@/hooks/theme";
import logo from "@/assets/gym_logo.png";

const iconBtnClass =
  "inline-flex items-center justify-center w-[34px] h-[34px] rounded-full border border-border bg-transparent text-muted-foreground cursor-pointer hover:bg-accent/10 hover:text-accent transition-colors";

export default function Header({ onToggle, sidebarVisible }) {
  const { theme, toggleTheme } = useTheme();
  const [currentUser] = useState(getCurrentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const isDark = theme === "dark";

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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
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

        {/* Notification Icon */}
        <button
          type="button"
          className={iconBtnClass}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

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
        <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2.5 border-l border-border">
          <div className="hidden min-[768px]:flex flex-col text-right leading-[1.3]">
            <span className="text-[13px] font-semibold text-foreground">{currentUser.name}</span>
            <span className="text-[11.5px] text-muted-foreground">{currentUser.role}</span>
          </div>
          <Avatar name={currentUser.name} />
        </div>
      </div>
    </header>
  );
}
