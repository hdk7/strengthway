/* eslint-disable max-lines */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dumbbell,
  MessageSquareQuote,
  Image as ImageIcon,
  Video,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  togglePortfolioItemStatus,
  deletePortfolioItem,
  reorderPortfolioItems,
} from "@/lib/portfolioService";
import {
  PortfolioStats,
  PortfolioItemModal,
  DeleteConfirmationModal,
  MediaPreviewModal,
} from "./portfolio/components";
import {
  TrainingSessionsTab,
  FeedbackTab,
  PhotosTab,
  VideosTab,
} from "./portfolio/tabs";

const TABS = [
  { id: "sessions", label: "Training Sessions", icon: Dumbbell, defaultSection: "TRAINING_SESSION" },
  { id: "feedback", label: "Feedback", icon: MessageSquareQuote, defaultSection: "FEEDBACK_QUOTE" },
  { id: "photos", label: "Photos", icon: ImageIcon, defaultSection: "PHOTO" },
  { id: "videos", label: "Videos", icon: Video, defaultSection: "VIDEO" },
];

function normalizeItem(item) {
  if (!item) return item;
  const category = (item.category || "").trim();
  let section = (item.section || "").trim();

  if (!section) {
    if (category === "SESSION_DISCIPLINE" || category === "TRAINING_SESSION") section = "TRAINING_SESSION";
    else if (category === "SESSION_CLIP") section = "SESSION_CLIP";
    else if (category === "FEEDBACK_STORY" || category === "MEMBER_FEEDBACK") {
      const isVideo =
        item.mediaType === "VIDEO" ||
        (item.mediaUrl && (item.mediaUrl.endsWith(".mp4") || item.mediaUrl.includes("video")));
      section = isVideo ? "FEEDBACK_VIDEO" : "FEEDBACK_QUOTE";
    } else if (category === "FEEDBACK_VIDEO") section = "FEEDBACK_VIDEO";
    else if (category === "PHOTO" || category === "FLOOR_PHOTO") section = "PHOTO";
    else if (category === "MOVEMENT_VIDEO" || category === "VIDEO") section = "VIDEO";
    else section = "TRAINING_SESSION";
  }

  const title = item.title || item.authorName || item.altText || "";
  const subtitle = item.subtitle || item.authorRole || item.description || "";
  const quote = item.quote || item.tag || "";
  const tag = item.tag || quote || "";
  const duration = item.duration || item.durationText || "50 min";
  const icon = item.icon || item.iconKey || "Dumbbell";
  const order = item.order ?? item.displayOrder ?? 0;

  return {
    ...item,
    section,
    category: category || section,
    title,
    subtitle,
    quote,
    tag,
    duration,
    icon,
    order,
    authorName: item.authorName || title,
    authorRole: item.authorRole || subtitle,
  };
}

export default function PortfolioMasterPage() {
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "feedback" | "photos" | "videos"
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subtabViewModes, setSubtabViewModes] = useState({
    sessions: "grid",
    feedback: "grid",
    photos: "grid",
    videos: "grid",
  });

  const handleSetViewMode = (tabKey, mode) => {
    setSubtabViewModes((prev) => ({ ...prev, [tabKey]: mode }));
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState("TRAINING_SESSION");
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  // Load all items
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPortfolioItems({
        status: statusFilter,
        search: searchQuery,
        pageSize: 100,
      });
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data.map(normalizeItem) : []);
    } catch (err) {
      console.error("Failed to load portfolio items:", err);
      toast.error(err.message || "Failed to load portfolio items.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute summary stats
  const stats = useMemo(() => {
    const nonDeleted = items.filter((i) => !i.isDeleted);
    return {
      total: nonDeleted.length,
      photos: nonDeleted.filter((i) => i.section === "PHOTO" && i.status === "Active").length,
      videos: nonDeleted.filter(
        (i) =>
          (i.section === "VIDEO" ||
            i.section === "SESSION_CLIP" ||
            i.section === "FEEDBACK_VIDEO") &&
          i.status === "Active"
      ).length,
      feedback: nonDeleted.filter((i) => i.section === "FEEDBACK_QUOTE").length,
    };
  }, [items]);

  // Filter items for current active tab
  const tabItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === "sessions") {
        return item.section === "TRAINING_SESSION" || item.section === "SESSION_CLIP";
      }
      if (activeTab === "feedback") {
        return item.section === "FEEDBACK_QUOTE" || item.section === "FEEDBACK_VIDEO";
      }
      if (activeTab === "photos") {
        return item.section === "PHOTO";
      }
      if (activeTab === "videos") {
        return item.section === "VIDEO";
      }
      return true;
    });
  }, [items, activeTab]);

  // Open Add modal with specific section
  const handleOpenAdd = (targetSection) => {
    setEditingItem(null);
    setModalSection(
      targetSection ||
        TABS.find((t) => t.id === activeTab)?.defaultSection ||
        "TRAINING_SESSION"
    );
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalSection(item.section);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updatePortfolioItem(editingItem.id, formData);
        toast.success(`Portfolio item "${formData.title}" updated successfully.`);
      } else {
        await createPortfolioItem(formData);
        toast.success(`Portfolio item "${formData.title}" created successfully.`);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save portfolio item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (item) => {
    try {
      await togglePortfolioItemStatus(item.id);
      toast.success(`Item status updated.`);
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  // Bulk reorder handler
  const handleReorder = async (reorderedPayload) => {
    try {
      await reorderPortfolioItems(reorderedPayload);
      toast.success("Order updated successfully.");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update order.");
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      await deletePortfolioItem(itemToDelete.id, true);
      toast.success(`Item "${itemToDelete.title}" deleted successfully.`);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* KPI Stats */}
      <PortfolioStats stats={stats} />

      {/* Subtabs Navigation */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-border/60 pb-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
            <RefreshCw size={28} className="animate-spin text-primary mb-2" />
            <p className="text-sm">Loading portfolio items...</p>
          </div>
        ) : (
          <>
            {activeTab === "sessions" && (
              <TrainingSessionsTab
                items={tabItems}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={subtabViewModes.sessions}
                setViewMode={(m) => handleSetViewMode("sessions", m)}
                onEdit={handleOpenEdit}
                onDelete={setItemToDelete}
                onPreview={setPreviewItem}
                onToggleStatus={handleToggleStatus}
                onAddProgram={() => handleOpenAdd("TRAINING_SESSION")}
                onAddClip={() => handleOpenAdd("SESSION_CLIP")}
              />
            )}

            {activeTab === "feedback" && (
              <FeedbackTab
                items={tabItems}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={subtabViewModes.feedback}
                setViewMode={(m) => handleSetViewMode("feedback", m)}
                onEdit={handleOpenEdit}
                onDelete={setItemToDelete}
                onPreview={setPreviewItem}
                onToggleStatus={handleToggleStatus}
                onAddQuote={() => handleOpenAdd("FEEDBACK_QUOTE")}
                onAddVideo={() => handleOpenAdd("FEEDBACK_VIDEO")}
              />
            )}

            {activeTab === "photos" && (
              <PhotosTab
                items={tabItems}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={subtabViewModes.photos}
                setViewMode={(m) => handleSetViewMode("photos", m)}
                onEdit={handleOpenEdit}
                onDelete={setItemToDelete}
                onPreview={setPreviewItem}
                onToggleStatus={handleToggleStatus}
                onReorder={handleReorder}
                onAddPhoto={() => handleOpenAdd("PHOTO")}
              />
            )}

            {activeTab === "videos" && (
              <VideosTab
                items={tabItems}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={subtabViewModes.videos}
                setViewMode={(m) => handleSetViewMode("videos", m)}
                onEdit={handleOpenEdit}
                onDelete={setItemToDelete}
                onPreview={setPreviewItem}
                onToggleStatus={handleToggleStatus}
                onReorder={handleReorder}
                onAddVideo={() => handleOpenAdd("VIDEO")}
              />
            )}
          </>
        )}
      </div>

      {/* Universal Add / Edit Modal */}
      <PortfolioItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        defaultSection={modalSection}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        itemToDelete={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        isSubmitting={isSubmitting}
      />

      {/* Media Lightbox & Video Player Preview Modal */}
      <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
