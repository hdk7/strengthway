import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Film,
  Camera,
  Layers,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/theme";
import {
  getPortfolioItems,
  PORTFOLIO_CATEGORIES,
  CATEGORY_LABELS,
  PORTFOLIO_STATUSES,
} from "@/lib/portfolioService";

export default function PortfolioMasterPage() {
  useDocumentTitle("Portfolio Master");

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    photos: 0,
    movementVideos: 0,
    sessionClips: 0,
    feedbackStories: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPortfolioItems({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
        includeDeleted: false,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      setItems(res.items || []);
      if (res.stats) setStats(res.stats);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load portfolio items:", err);
      setError(err.message || "Failed to load portfolio items from server.");
      toast.error("Failed to load portfolio items from server.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const CATEGORY_TABS = [
    { id: "ALL", label: "All Assets", icon: Layers, count: stats.total },
    { id: PORTFOLIO_CATEGORIES.PHOTO, label: "Floor Photos", icon: Camera, count: stats.photos },
    { id: PORTFOLIO_CATEGORIES.MOVEMENT_VIDEO, label: "Movement Videos", icon: Film, count: stats.movementVideos },
    { id: PORTFOLIO_CATEGORIES.SESSION_CLIP, label: "Session Clips", icon: Layers, count: stats.sessionClips },
    { id: PORTFOLIO_CATEGORIES.FEEDBACK_STORY, label: "Member Feedback", icon: MessageSquare, count: stats.feedbackStories },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <ImageIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Portfolio Master</h1>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                {stats.total} Assets
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage floor photos, movement videos, session clips, and member stories across the public portfolio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh portfolio items"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info("Add Media modal will be implemented in Phase 4.")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Media</span>
          </button>
        </div>
      </div>

      {/* ── Category Filter Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-border">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} className={isActive ? "text-primary" : ""} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="underline font-semibold hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content Shell / Preview ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground space-y-2">
        <ImageIcon size={32} className="mx-auto text-primary/60" />
        <h3 className="font-bold text-sm text-foreground">
          Portfolio Master Foundation Ready
        </h3>
        <p className="max-w-md mx-auto text-muted-foreground">
          Loaded {items.length} assets from the backend. Complete grid views, card displays, reorder handles, and media modals will be rendered in Phase 3 & 4.
        </p>
      </div>
    </div>
  );
}
