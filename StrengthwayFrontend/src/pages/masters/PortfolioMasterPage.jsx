import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Image as ImageIcon,
  Plus,
  RefreshCw,
  AlertCircle,
  Camera,
  Film,
  Layers,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/theme";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  togglePortfolioItemStatus,
  reorderPortfolioItems,
  softDeletePortfolioItem,
  restorePortfolioItem,
  permanentDeletePortfolioItem,
  PORTFOLIO_CATEGORIES,
} from "@/lib/portfolioService";
import { Pagination } from "@/components/table";
import { PortfolioStats } from "./components/PortfolioStats";
import { PortfolioToolbar } from "./components/PortfolioToolbar";
import { PortfolioCard } from "./components/PortfolioCard";
import { PortfolioTableRow } from "./components/PortfolioTableRow";
import { PortfolioModal } from "./components/PortfolioModal";
import { PortfolioConfirmDialog } from "./components/PortfolioConfirmDialog";

export default function PortfolioMasterPage() {
  useDocumentTitle("Portfolio Master");

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
    photos: 0,
    movementVideos: 0,
    sessionClips: 0,
    sessionDisciplines: 0,
    feedbackStories: 0,
    videosAndReels: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal & Confirm States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null,
  });

  // Load Portfolio items from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPortfolioItems({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
        includeDeleted: selectedStatus === "Archived",
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
  }, [
    selectedCategory,
    selectedStatus,
    searchQuery,
    pagination.page,
    pagination.pageSize,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when category, status, or search changes
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (q) => {
    setSearchQuery(q);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Inline status toggle
  const handleToggleStatus = async (id) => {
    const prevItems = [...items];
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    const newStatus = targetItem.status === "Active" ? "Draft" : "Active";

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
    setStats((prev) => ({
      ...prev,
      active: newStatus === "Active" ? prev.active + 1 : Math.max(0, prev.active - 1),
      draft: newStatus === "Draft" ? prev.draft + 1 : Math.max(0, prev.draft - 1),
    }));

    try {
      const updated = await togglePortfolioItemStatus(id);
      if (updated) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: updated.status } : i))
        );
        toast.success(`"${targetItem.title}" is now ${updated.status}.`);
      }
    } catch (err) {
      // Revert optimistic update
      setItems(prevItems);
      toast.error(err.message || "Failed to toggle status.");
    }
  };

  // Reordering handler
  const handleMoveOrder = async (item, direction) => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    const prevItems = [...items];

    // Compute display orders to swap
    const currentOrder = item.displayOrder;
    const targetOrder = targetItem.displayOrder;

    // Optimistic local state update
    const updatedItems = [...items];
    updatedItems[currentIndex] = { ...item, displayOrder: targetOrder };
    updatedItems[targetIndex] = { ...targetItem, displayOrder: currentOrder };

    // Keep locally sorted
    updatedItems.sort((a, b) => a.displayOrder - b.displayOrder);
    setItems(updatedItems);

    try {
      await reorderPortfolioItems([
        { id: item.id, displayOrder: targetOrder },
        { id: targetItem.id, displayOrder: currentOrder },
      ]);
      toast.success(`Reordered "${item.title}".`);
    } catch (err) {
      // Revert on failure
      setItems(prevItems);
      toast.error(err.message || "Failed to save new order.");
    }
  };

  // Archive (soft delete) with custom confirmation dialog
  const handleDelete = (id, title) => {
    setConfirmState({
      isOpen: true,
      title: `Archive "${title}"?`,
      description: `This media asset will be hidden from the public website. You can restore it anytime from the Archived filter.`,
      confirmText: "Archive Asset",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await softDeletePortfolioItem(id);
          toast.success(`"${title}" archived.`);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          toast.error(err.message || "Failed to archive item.");
        }
      },
    });
  };

  // Restore archived item
  const handleRestore = async (id, title) => {
    try {
      await restorePortfolioItem(id);
      toast.success(`"${title}" restored.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to restore item.");
    }
  };

  // Permanent Delete with custom confirmation dialog
  const handlePermanentDelete = (id, title) => {
    setConfirmState({
      isOpen: true,
      title: `Permanently Delete "${title}"?`,
      description: `CAUTION: This will permanently erase this media record and all metadata from the database. This action cannot be undone.`,
      confirmText: "Delete Forever",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await permanentDeletePortfolioItem(id);
          setItems((prev) => prev.filter((i) => i.id !== id));
          toast.success(`"${title}" permanently deleted.`);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          toast.error(err.message || "Failed to delete item.");
        }
      },
    });
  };

  // Open Add Media Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open Edit Media Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Media Item
  const handleSaveMedia = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const updated = await updatePortfolioItem(editingItem.id, payload);
        if (updated) {
          setItems((prev) =>
            prev.map((i) => (i.id === editingItem.id ? updated : i))
          );
          toast.success(`"${updated.title}" updated successfully!`);
        }
      } else {
        const created = await createPortfolioItem(payload);
        if (created) {
          setItems((prev) => [created, ...prev]);
          toast.success(`"${created.title}" added to portfolio!`);
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Save media error:", err);
      toast.error(err.message || "Failed to save portfolio media item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORY_TABS = useMemo(
    () => [
      { id: "ALL", label: "All Assets", icon: Layers, count: stats.total },
      {
        id: PORTFOLIO_CATEGORIES.PHOTO,
        label: "Floor Photos",
        icon: Camera,
        count: stats.photos,
      },
      {
        id: PORTFOLIO_CATEGORIES.MOVEMENT_VIDEO,
        label: "Movement Videos",
        icon: Film,
        count: stats.movementVideos,
      },
      {
        id: PORTFOLIO_CATEGORIES.SESSION_CLIP,
        label: "Session Clips",
        icon: Film,
        count: stats.sessionClips,
      },
      {
        id: PORTFOLIO_CATEGORIES.SESSION_DISCIPLINE,
        label: "Disciplines",
        icon: Layers,
        count: stats.sessionDisciplines || 0,
      },
      {
        id: PORTFOLIO_CATEGORIES.FEEDBACK_STORY,
        label: "Member Feedback",
        icon: MessageSquare,
        count: stats.feedbackStories,
      },
    ],
    [stats]
  );

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5 pb-2">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <ImageIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
                Portfolio Master
              </h1>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                {stats.total} Assets
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage floor photos, movement videos, session clips, and member feedback across the public portfolio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh portfolio items"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Media</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1 font-semibold text-destructive-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Stats Bar ───────────────────────────────────────────────────── */}
      <PortfolioStats stats={stats} />

      {/* ── Category Filter Tabs ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-border/60">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} className={isActive ? "text-primary" : ""} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: Status Filter, Search, View Mode ────────────────────────── */}
      <PortfolioToolbar
        statusFilter={selectedStatus}
        setStatusFilter={handleStatusChange}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalResults={pagination.total}
      />

      {/* ── Main Media Content Area (Independent Scroll Container) ──────────── */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 p-3 sm:p-4 no-scrollbar">
          {isLoading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-4 shadow-xs animate-pulse space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-12 bg-muted rounded-md" />
                    <div className="h-4 w-20 bg-muted rounded-full" />
                  </div>
                  <div className="aspect-[16/10] w-full bg-muted rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-5/6 bg-muted rounded" />
                  </div>
                  <div className="border-t border-border/60 pt-3 flex justify-between">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="text-base font-semibold text-foreground">
                No portfolio items found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
                {searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL"
                  ? "Try resetting filters or search query to view items."
                  : "Add your first photo, video, or testimonial clip to showcase on the portfolio page."}
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Media Item</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ── GRID CARDS VIEW ─────────────────────────────────────────────── */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onToggleStatus={handleToggleStatus}
                  onMoveOrder={handleMoveOrder}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  isFirst={index === 0 && pagination.page === 1}
                  isLast={
                    index === items.length - 1 &&
                    pagination.page === pagination.totalPages
                  }
                />
              ))}
            </div>
          ) : (
            /* ── TABLE ROW VIEW ──────────────────────────────────────────────── */
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
                <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                  <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                    <tr>
                      <th className="py-2.5 px-3 sm:px-4">Order</th>
                      <th className="py-2.5 px-3 sm:px-4">Media</th>
                      <th className="py-2.5 px-3 sm:px-4">Title & Details</th>
                      <th className="py-2.5 px-3 sm:px-4">Category</th>
                      <th className="py-2.5 px-3 sm:px-4">Format</th>
                      <th className="py-2.5 px-3 sm:px-4 text-center">Status</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium">
                    {items.map((item, index) => (
                      <PortfolioTableRow
                        key={item.id}
                        item={item}
                        onToggleStatus={handleToggleStatus}
                        onMoveOrder={handleMoveOrder}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        onPermanentDelete={handlePermanentDelete}
                        isFirst={index === 0 && pagination.page === 1}
                        isLast={
                          index === items.length - 1 &&
                          pagination.page === pagination.totalPages
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pinned Bottom Pagination ────────────────────────────────────────── */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        totalItems={pagination.total}
        pageSize={pagination.pageSize}
        itemName="media assets"
        compact
        className="shrink-0 mt-auto"
      />

      {/* ── Add / Edit Media Modal (Phase 4) ─────────────────────────────────── */}
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSaveMedia}
        isSubmitting={isSubmitting}
        currentMaxOrder={items.reduce(
          (max, i) => Math.max(max, i.displayOrder || 0),
          0
        )}
      />

      {/* ── Archive & Permanent Delete Confirmation Dialog ───────────────────── */}
      <PortfolioConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        onConfirm={confirmState.onConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

