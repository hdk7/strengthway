import { useMemo } from "react";
import {
  Image as ImageIcon,
  Eye,
  Pencil,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/portfolioMedia";
import { PortfolioToolbar } from "../components";

export function PhotosTab({
  items = [],
  viewMode = "grid",
  setViewMode,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
  onPreview,
  onToggleStatus,
  onReorder,
  onAddPhoto,
}) {
  const photos = useMemo(
    () =>
      items
        .filter(
          (i) =>
            i.section === "PHOTO" ||
            i.category === "PHOTO" ||
            i.category === "FLOOR_PHOTO"
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [items]
  );

  const handleMove = (index, direction) => {
    if (!onReorder) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    const reorderedPayload = newPhotos.map((p, idx) => ({
      id: p.id,
      order: idx + 1,
    }));
    onReorder(reorderedPayload);
  };

  return (
    <div className="space-y-3">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-border/70 shrink-0">
        <div>
          <h2 className="text-xs sm:text-sm font-bold font-display text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary shrink-0" />
            Floor Photos Gallery
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Moments from the floor featured in the auto-scrolling gallery (4:5 portrait aspect ratio).
          </p>
        </div>

        <PortfolioToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          placeholder="Search photos..."
        >
          <button
            type="button"
            onClick={onAddPhoto}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Upload size={13} className="text-primary" />
            Upload Photo
          </button>
        </PortfolioToolbar>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center bg-card/20">
          <ImageIcon size={24} className="text-muted-foreground/60 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-foreground">No photos found</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add 4:5 photos to populate the Moments from the Floor section.
          </p>
          <button
            type="button"
            onClick={onAddPhoto}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Upload size={13} />
            Upload Photo
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="overflow-y-auto max-h-[445px] pr-1">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => {
              const photoIndex = photos.findIndex((item) => item.id === p.id);
              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md h-[210px]"
                >
                  {/* 4:5 Portrait Photo Container */}
                  <div className="relative flex-1 min-h-0 w-full bg-black/95 overflow-hidden flex items-center justify-center">
                    {p.mediaUrl ? (
                      <img
                        src={resolveMediaUrl(p.mediaUrl)}
                        alt={p.title || p.altText || "Floor photo"}
                        loading="lazy"
                        className="h-full w-auto aspect-4/5 object-cover mx-auto transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-3 text-center">
                        <ImageIcon size={22} className="mb-1 text-muted-foreground/60" />
                        <span className="text-[10px]">No image asset</span>
                      </div>
                    )}

                    {/* Hover overlay with zoom & actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white backdrop-blur-xs">
                          #{photoIndex + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="p-1 rounded-md bg-black/70 text-white hover:bg-white hover:text-black transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                            title="Edit Caption"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
                            className="p-1 rounded-md bg-black/70 text-red-400 hover:bg-destructive hover:text-white transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                            title="Delete Photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {p.mediaUrl && (
                          <button
                            type="button"
                            onClick={() => onPreview(p)}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black transition-all cursor-pointer shadow-md"
                            title="Zoom / Preview"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                      </div>

                      {/* Move Left / Right Reorder Buttons */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          disabled={photoIndex <= 0}
                          onClick={() => handleMove(photoIndex, "left")}
                          className={`p-1 rounded-md bg-black/60 text-white transition-all ${
                            photoIndex <= 0
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-primary cursor-pointer"
                          }`}
                          title="Move Left in Carousel"
                        >
                          <ArrowLeft size={11} />
                        </button>
                        <button
                          type="button"
                          disabled={photoIndex >= photos.length - 1}
                          onClick={() => handleMove(photoIndex, "right")}
                          className={`p-1 rounded-md bg-black/60 text-white transition-all ${
                            photoIndex >= photos.length - 1
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-primary cursor-pointer"
                          }`}
                          title="Move Right in Carousel"
                        >
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Card Footer */}
                  <div className="px-2.5 py-1.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground truncate" title={p.title}>
                      {p.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono ml-1.5 shrink-0">
                      #{photoIndex + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto overflow-y-auto max-h-[445px] rounded-xl border border-border bg-card pr-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border sticky top-0 bg-card z-10">
              <tr>
                <th className="py-2 px-3">Thumbnail</th>
                <th className="py-2 px-3">Caption / Alt Text</th>
                <th className="py-2 px-3">Carousel Order</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {photos.map((p) => {
                const photoIndex = photos.findIndex((item) => item.id === p.id);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-1.5 px-3">
                      <div
                        onClick={() => p.mediaUrl && onPreview(p)}
                        className="h-10 w-8 rounded-md overflow-hidden border border-border bg-black/40 flex items-center justify-center relative cursor-pointer group shrink-0"
                        title={p.mediaUrl ? "Click to view photo" : ""}
                      >
                        {p.mediaUrl ? (
                          <img
                            src={resolveMediaUrl(p.mediaUrl)}
                            alt={p.title || ""}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.classList.add("hidden");
                              const fallback = e.currentTarget.parentElement?.querySelector(".fallback-icon");
                              if (fallback) {
                                fallback.classList.remove("hidden");
                                fallback.classList.add("flex");
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`fallback-icon items-center justify-center text-muted-foreground ${p.mediaUrl ? "hidden" : "flex"}`}
                        >
                          <ImageIcon size={12} />
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-foreground max-w-sm truncate text-[11px]">
                      {p.title}
                    </td>
                    <td className="py-1.5 px-3 text-muted-foreground font-mono text-[11px]">#{photoIndex + 1}</td>
                    <td className="py-1.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {p.mediaUrl && (
                          <button
                            type="button"
                            onClick={() => onPreview(p)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Zoom"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PhotosTab;
