import { useMemo } from "react";
import {
  Video,
  Play,
  Pencil,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Eye,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/portfolioMedia";
import { PortfolioToolbar } from "../components";

export function VideosTab({
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
  onAddVideo,
}) {
  const videos = useMemo(
    () =>
      items
        .filter(
          (i) =>
            i.section === "VIDEO" ||
            i.category === "MOVEMENT_VIDEO" ||
            i.category === "VIDEO"
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [items]
  );

  const handleMove = (index, direction) => {
    if (!onReorder) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const newVideos = [...videos];
    const temp = newVideos[index];
    newVideos[index] = newVideos[targetIndex];
    newVideos[targetIndex] = temp;

    const reorderedPayload = newVideos.map((v, idx) => ({
      id: v.id,
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
            <Video className="h-4 w-4 text-primary shrink-0" />
            Movement Showcase Videos (16:9 Landscape)
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Cinematic movement and workout videos featured in the 3-column grid on the portfolio page.
          </p>
        </div>

        <PortfolioToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          placeholder="Search videos..."
        >
          <button
            type="button"
            onClick={onAddVideo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Upload size={13} className="text-primary" />
            Upload Video
          </button>
        </PortfolioToolbar>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center bg-card/20">
          <Video size={24} className="text-muted-foreground/60 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-foreground">No showcase videos found</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add 16:9 landscape movement videos to populate the See the Movement section.
          </p>
          <button
            type="button"
            onClick={onAddVideo}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Upload size={13} />
            Upload Video
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="overflow-y-auto max-h-[495px] pr-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const videoIndex = videos.findIndex((item) => item.id === v.id);
              return (
                <div
                  key={v.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md h-[235px]"
                >
                  {/* 16:9 Landscape Video Container */}
                  <div className="relative flex-1 min-h-0 w-full bg-black/95 overflow-hidden flex items-center justify-center">
                    {v.mediaUrl ? (
                      <video
                        src={v.thumbnailUrl ? resolveMediaUrl(v.mediaUrl) : `${resolveMediaUrl(v.mediaUrl)}#t=1.2`}
                        poster={v.thumbnailUrl ? resolveMediaUrl(v.thumbnailUrl) : undefined}
                        preload="metadata"
                        className="h-full w-auto aspect-video object-cover mx-auto"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-3">
                        <Video size={22} className="mb-1 text-muted-foreground/60" />
                        <span className="text-[10px]">No video source</span>
                      </div>
                    )}

                    {/* Play preview trigger */}
                    {v.mediaUrl && (
                      <button
                        type="button"
                        onClick={() => onPreview(v)}
                        className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary transition-all scale-95 group-hover:scale-105 cursor-pointer shadow-md"
                        title="Play Preview"
                      >
                        <Play size={15} className="fill-white ml-0.5" />
                      </button>
                    )}

                    {/* Badges on top */}
                    <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white backdrop-blur-xs">
                        #{videoIndex + 1}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(v)}
                          className="p-1 rounded-md bg-black/70 text-white hover:bg-white hover:text-black transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                          title="Edit Video"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(v)}
                          className="p-1 rounded-md bg-black/70 text-red-400 hover:bg-destructive hover:text-white transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                          title="Delete Video"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Details & Position */}
                  <div className="px-3 py-2 border-t border-border bg-card shrink-0 flex flex-col justify-between gap-1.5">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-foreground truncate" title={v.title}>
                        {v.title}
                      </h3>
                      {v.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate">{v.subtitle}</p>
                      )}
                    </div>

                    {/* Reorder Left / Right in 3-column Grid */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
                      <span>Grid Position: #{videoIndex + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={videoIndex <= 0}
                          onClick={() => handleMove(videoIndex, "left")}
                          className={`p-1 rounded bg-muted/60 hover:bg-muted text-foreground transition-all ${
                            videoIndex <= 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                          }`}
                          title="Shift Left"
                        >
                          <ArrowLeft size={11} />
                        </button>
                        <button
                          type="button"
                          disabled={videoIndex >= videos.length - 1}
                          onClick={() => handleMove(videoIndex, "right")}
                          className={`p-1 rounded bg-muted/60 hover:bg-muted text-foreground transition-all ${
                            videoIndex >= videos.length - 1
                              ? "opacity-30 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          title="Shift Right"
                        >
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto overflow-y-auto max-h-[495px] rounded-xl border border-border bg-card pr-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border sticky top-0 bg-card z-10">
              <tr>
                <th className="py-2 px-3">Preview</th>
                <th className="py-2 px-3">Video Title</th>
                <th className="py-2 px-3">Grid Order</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map((v) => {
                const videoIndex = videos.findIndex((item) => item.id === v.id);
                return (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-1.5 px-3">
                      <div
                        onClick={() => v.mediaUrl && onPreview(v)}
                        className="h-8 w-14 rounded-md overflow-hidden border border-border bg-black flex items-center justify-center relative group cursor-pointer shrink-0"
                        title={v.mediaUrl ? "Click to preview video" : ""}
                      >
                        {v.thumbnailUrl ? (
                          <img
                            src={resolveMediaUrl(v.thumbnailUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : v.mediaUrl ? (
                          <video
                            src={`${resolveMediaUrl(v.mediaUrl)}#t=1.2`}
                            preload="metadata"
                            className="h-full w-full object-cover pointer-events-none"
                          />
                        ) : (
                          <Video size={12} className="text-muted-foreground" />
                        )}
                        {v.mediaUrl && (
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <div className="h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all">
                              <Play size={8} className="fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-foreground max-w-sm truncate text-[11px]">
                      {v.title}
                    </td>
                    <td className="py-1.5 px-3 text-muted-foreground font-mono text-[11px]">#{videoIndex + 1}</td>
                    <td className="py-1.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {v.mediaUrl && (
                          <button
                            type="button"
                            onClick={() => onPreview(v)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Preview"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(v)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(v)}
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

export default VideosTab;
