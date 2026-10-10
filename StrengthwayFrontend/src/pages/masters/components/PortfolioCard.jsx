import {
  Camera,
  Film,
  Layers,
  MessageSquare,
  Sparkles,
  Archive,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  RotateCcw,
  Play,
  Star,
  ExternalLink,
} from "lucide-react";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioService";

export function PortfolioCard({
  item,
  onToggleStatus,
  onMoveOrder,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  isFirst,
  isLast,
}) {
  const isVideo =
    item.mediaType === "VIDEO" ||
    (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov)$/i));

  const isArchived = Boolean(item.isDeleted);
  const isActive = item.status === "Active" && !isArchived;

  // Category badge metadata
  const getCategoryMeta = () => {
    switch (item.category) {
      case PORTFOLIO_CATEGORIES.PHOTO:
        return {
          label: "Floor Photo",
          icon: Camera,
          badgeColor: "bg-sky-500/10 text-sky-500 dark:text-sky-400 border-sky-500/20",
        };
      case PORTFOLIO_CATEGORIES.MOVEMENT_VIDEO:
        return {
          label: "Movement Video",
          icon: Film,
          badgeColor: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
        };
      case PORTFOLIO_CATEGORIES.SESSION_CLIP:
        return {
          label: "Session Clip",
          icon: Film,
          badgeColor: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
        };
      case PORTFOLIO_CATEGORIES.SESSION_DISCIPLINE:
        return {
          label: "Discipline",
          icon: Layers,
          badgeColor: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
        };
      case PORTFOLIO_CATEGORIES.FEEDBACK_STORY:
        return {
          label: "Member Story",
          icon: MessageSquare,
          badgeColor: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
        };
      default:
        return {
          label: item.category || "Media",
          icon: Layers,
          badgeColor: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const catMeta = getCategoryMeta();
  const CatIcon = catMeta.icon;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border bg-card p-4 sm:p-5 shadow-xs transition-all duration-300 hover:shadow-lg ${
        isArchived
          ? "border-destructive/30 border-dashed bg-card/60 opacity-80"
          : item.featuredOnHome
            ? "border-amber-500/60 ring-1 ring-amber-500/30 bg-linear-to-b from-amber-500/5 via-card to-card hover:border-amber-400"
            : "border-border hover:border-foreground/30"
      } ${!isArchived && item.status === "Draft" ? "opacity-75" : ""}`}
    >
      <div>
        {/* Top Header: Order Number, Category & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Display Order Pill */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted text-foreground/80 font-mono text-[10px] font-bold tracking-tight border border-border/60"
              title={`Display Order: #${item.displayOrder}`}
            >
              #{item.displayOrder}
            </span>

            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catMeta.badgeColor}`}
            >
              <CatIcon size={10} />
              <span>{catMeta.label}</span>
            </span>

            {/* Featured on Home Badge */}
            {item.featuredOnHome && !isArchived && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-xs"
                title="Featured in Homepage Portfolio Preview"
              >
                <Sparkles size={9} className="fill-black" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Status Badge */}
          {isArchived ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
              <Archive size={10} />
              <span>Archived</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
              }`}
              title={`Click to switch to ${isActive ? "Draft" : "Active"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{item.status}</span>
            </button>
          )}
        </div>

        {/* Media Preview Box */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-900 border border-border/50 group/media">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center bg-neutral-950">
              <video
                src={item.mediaUrl}
                poster={item.thumbnailUrl || undefined}
                preload="metadata"
                muted
                className="w-full h-full object-cover opacity-85 group-hover/media:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/30 group-hover/media:bg-black/15 transition-colors flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/30 shadow-md group-hover/media:scale-110 transition-transform">
                  <Play size={16} className="fill-white translate-x-0.5" />
                </div>
              </div>
              {item.durationText && (
                <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs border border-white/10">
                  {item.durationText}
                </span>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full">
              <img
                src={item.mediaUrl}
                alt={item.altText || item.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-105"
              />
              {/* Fallback image placeholder */}
              <div className="hidden absolute inset-0 flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
                <Camera size={24} className="mb-1 opacity-50" />
                <span className="text-[10px]">Media unavailable</span>
              </div>
            </div>
          )}

          {/* Aspect Ratio Badge Overlay */}
          <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white/90 backdrop-blur-xs border border-white/10">
            {item.aspectRatio || (isVideo ? "16:9" : "4:5")}
          </span>
        </div>

        {/* Media Details */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-sm font-bold text-foreground line-clamp-1 font-display"
              title={item.title}
            >
              {item.title}
            </h3>
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
              #{item.id}
            </span>
          </div>

          {/* Testimonial Author & Rating */}
          {item.authorName && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="font-semibold text-foreground truncate">
                {item.authorName}
                {item.authorRole && (
                  <span className="text-muted-foreground font-normal ml-1 text-[11px]">
                    • {item.authorRole}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0 text-amber-400">
                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                  <Star key={i} size={11} className="fill-amber-400" />
                ))}
              </div>
            </div>
          )}

          {/* Testimonial Quote or Description */}
          {item.quote ? (
            <p className="text-xs italic text-muted-foreground line-clamp-2 leading-relaxed">
              &ldquo;{item.quote}&rdquo;
            </p>
          ) : item.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          ) : null}

          {/* Discipline Badges */}
          {(item.durationText || item.level) && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              {item.durationText && <span>Duration: {item.durationText}</span>}
              {item.level && <span>• Level: {item.level}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls & Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        {/* Reordering Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMoveOrder(item, "up")}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Move order up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMoveOrder(item, "down")}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Move order down"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        {isArchived ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRestore(item.id, item.title)}
              className="rounded-lg p-1.5 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
              title="Restore Item"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={() => onPermanentDelete(item.id, item.title)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
              title="Delete Permanently"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Edit Media Item"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id, item.title)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              title="Archive Item (Soft Delete)"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
