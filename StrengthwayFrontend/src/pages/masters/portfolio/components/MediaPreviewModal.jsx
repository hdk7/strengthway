import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

export function MediaPreviewModal({ item, onClose }) {
  if (!item) return null;

  const resolvedMedia = resolveMediaUrl(item.mediaUrl);
  const resolvedThumbnail = item.thumbnailUrl ? resolveMediaUrl(item.thumbnailUrl) : undefined;

  const isVideo =
    item.section === "VIDEO" ||
    item.section === "SESSION_CLIP" ||
    item.section === "FEEDBACK_VIDEO" ||
    (item.mediaUrl && (item.mediaUrl.endsWith(".mp4") || item.mediaUrl.endsWith(".webm")));

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden border-border bg-card p-0 text-foreground shadow-2xl [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{item.title || "Media Preview"}</DialogTitle>

        {/* Media Player / Image Viewer */}
        <div className="relative bg-black flex items-center justify-center min-h-75 max-h-[70vh] overflow-hidden">
          {isVideo ? (
            <video
              src={resolvedMedia}
              poster={resolvedThumbnail}
              controls
              autoPlay
              className={`w-full max-h-[70vh] object-contain ${
                item.focusPosition ? item.focusPosition : "object-center"
              }`}
            />
          ) : (
            <img
              src={resolvedMedia}
              alt={item.title || item.altText}
              className="w-full max-h-[70vh] object-contain"
            />
          )}

          {/* Single Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors cursor-pointer shadow-md"
            title="Close Preview"
          >
            <X size={16} />
          </button>
        </div>

        {/* Item Details Footer - Only caption name */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-bold font-display text-foreground">
            {item.title || item.altText}
          </h3>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MediaPreviewModal;
