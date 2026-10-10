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
} from "lucide-react";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioService";

export function PortfolioTableRow({
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
    <tr
      className={`group transition-all duration-150 hover:-translate-y-px ${
        isArchived ? "opacity-75" : ""
      }`}
    >
      {/* 1. Order & Reorder Controls */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveOrder(item, "up")}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Move Up"
            >
              <ArrowUp size={11} />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveOrder(item, "down")}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Move Down"
            >
              <ArrowDown size={11} />
            </button>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground/80 font-mono text-xs font-bold tracking-tight">
            #{item.displayOrder}
          </span>
        </div>
      </td>

      {/* 2. Thumbnail Preview */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-border/60">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={item.mediaUrl}
                poster={item.thumbnailUrl || undefined}
                preload="metadata"
                muted
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Play size={12} className="fill-white text-white translate-x-0.5" />
              </div>
            </div>
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.altText || item.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </td>

      {/* 3. Title & Description */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex flex-col max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-foreground text-sm font-display truncate">
              {item.title}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              #{item.id}
            </span>
            {item.featuredOnHome && !isArchived && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-500 dark:text-amber-400 border border-amber-500/30">
                <Sparkles size={9} />
                <span>Home</span>
              </span>
            )}
          </div>
          {item.quote ? (
            <p className="text-xs italic text-muted-foreground truncate mt-0.5">
              &ldquo;{item.quote}&rdquo; {item.authorName ? `— ${item.authorName}` : ""}
            </p>
          ) : item.description ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.description}
            </p>
          ) : null}
        </div>
      </td>

      {/* 4. Category */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catMeta.badgeColor}`}
        >
          <CatIcon size={10} />
          <span>{catMeta.label}</span>
        </span>
      </td>

      {/* 5. Format & Aspect Ratio */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-foreground">
            {item.aspectRatio || (isVideo ? "16:9" : "4:5")}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium uppercase">
            {isVideo ? "Video" : "Image"}
          </span>
        </div>
      </td>

      {/* 6. Status Toggle */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
        {isArchived ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
            Archived
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggleStatus(item.id)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold border cursor-pointer transition-all inline-flex items-center gap-1.5 ${
              isActive
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
            }`}
            title={`Click to switch to ${isActive ? "Draft" : "Active"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{item.status}</span>
          </button>
        )}
      </td>

      {/* 7. Action Controls */}
      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right">
        <div className="flex items-center justify-end gap-1">
          {isArchived ? (
            <>
              <button
                type="button"
                onClick={() => onRestore(item.id, item.title)}
                className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/15 transition-colors cursor-pointer"
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Edit Item"
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
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
