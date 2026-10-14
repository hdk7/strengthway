import { useState, useEffect, useMemo } from "react";
import {
  MessageSquareQuote,
  Video,
  Play,
  Pencil,
  Trash2,
  Plus,
  Upload,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/portfolioMedia";
import { PortfolioToolbar } from "../components";
import Pagination from "@/components/table/Pagination";

export function FeedbackTab({
  items = [],
  viewMode = "grid",
  setViewMode,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
  onPreview,
  onToggleStatus,
  onAddQuote,
  onAddVideo,
}) {
  const quotes = useMemo(
    () =>
      items.filter(
        (i) =>
          i.section === "FEEDBACK_QUOTE" ||
          (i.category === "FEEDBACK_STORY" && i.mediaType !== "VIDEO" && !i.mediaUrl?.endsWith(".mp4"))
      ),
    [items]
  );
  const videos = useMemo(
    () =>
      items.filter(
        (i) =>
          i.section === "FEEDBACK_VIDEO" ||
          (i.category === "FEEDBACK_STORY" && (i.mediaType === "VIDEO" || i.mediaUrl?.endsWith(".mp4")))
      ),
    [items]
  );

  // Pagination for Quotes (1 row of 3 cards on desktop)
  const [quotePage, setQuotePage] = useState(1);
  const QUOTE_PAGE_SIZE = 3;
  const totalQuotePages = Math.max(1, Math.ceil(quotes.length / QUOTE_PAGE_SIZE));
  const safeQuotePage = Math.max(1, Math.min(quotePage, totalQuotePages));
  const paginatedQuotes = useMemo(() => {
    const start = (safeQuotePage - 1) * QUOTE_PAGE_SIZE;
    return quotes.slice(start, start + QUOTE_PAGE_SIZE);
  }, [quotes, safeQuotePage]);

  // Pagination for Videos (1 row of 4 reels on desktop)
  const [videoPage, setVideoPage] = useState(1);
  const VIDEO_PAGE_SIZE = 4;
  const totalVideoPages = Math.max(1, Math.ceil(videos.length / VIDEO_PAGE_SIZE));
  const safeVideoPage = Math.max(1, Math.min(videoPage, totalVideoPages));
  const paginatedVideos = useMemo(() => {
    const start = (safeVideoPage - 1) * VIDEO_PAGE_SIZE;
    return videos.slice(start, start + VIDEO_PAGE_SIZE);
  }, [videos, safeVideoPage]);

  useEffect(() => {
    setQuotePage(1);
    setVideoPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      {/* ── Segment A: Member Testimonial Quotes ── */}
      <div className="space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold font-display text-foreground">
              Member Reviews & Testimonials
            </h2>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              • Feedback cards shown in portfolio
            </span>
          </div>
          <PortfolioToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            placeholder="Search reviews..."
          >
            <button
              type="button"
              onClick={onAddQuote}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={13} className="text-primary" />
              Add Review
            </button>
          </PortfolioToolbar>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center bg-card/20">
            <p className="text-xs text-muted-foreground">No written reviews added yet.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-1.5">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {paginatedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="group relative rounded-xl border border-border bg-card p-2.5 transition-all hover:border-primary/40 hover:shadow-xs flex flex-col justify-between h-[96px]"
                >
                  <div>
                    <p className="text-xs leading-snug text-foreground italic line-clamp-2">
                      &ldquo;{q.quote || q.tag || q.subtitle || "No quote text provided."}&rdquo;
                    </p>
                  </div>

                  <div className="mt-1 pt-1 border-t border-border flex items-center justify-between">
                    <div className="font-semibold text-xs text-foreground truncate max-w-[65%]">
                      {q.authorName || q.title}
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onEdit(q)}
                        className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                        title="Edit Review"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(q)}
                        className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {quotes.length > 0 && (
              <Pagination
                currentPage={safeQuotePage}
                totalPages={totalQuotePages}
                totalItems={quotes.length}
                pageSize={QUOTE_PAGE_SIZE}
                onPageChange={setQuotePage}
                itemLabel="reviews"
                compact
              />
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-1.5 px-3">Member Name</th>
                    <th className="py-1.5 px-3">Quote Snippet</th>
                    <th className="py-1.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-1.5 px-3 font-semibold text-foreground truncate max-w-[160px]">{q.title}</td>
                      <td className="py-1.5 px-3 text-muted-foreground max-w-md truncate text-[11px]">
                        {q.tag || q.subtitle || "—"}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(q)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(q)}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quotes.length > 0 && (
              <Pagination
                currentPage={safeQuotePage}
                totalPages={totalQuotePages}
                totalItems={quotes.length}
                pageSize={QUOTE_PAGE_SIZE}
                onPageChange={setQuotePage}
                itemLabel="reviews"
                compact
              />
            )}
          </div>
        )}
      </div>

      {/* ── Segment B: Transformation Video Reels (9:16) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold font-display text-foreground">
              Transformation Videos (9:16 Reels)
            </h2>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              • Member transformation reels in feedback carousel
            </span>
          </div>
          <button
            type="button"
            onClick={onAddVideo}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Upload size={13} className="text-primary" />
            Upload Video
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center bg-card/20">
            <p className="text-xs text-muted-foreground">No transformation video reels found.</p>
            <button
              type="button"
              onClick={onAddVideo}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Upload size={13} />
              Upload Video
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm h-[172px]"
                >
                  {/* 9:16 Reel Player / Poster with constrained height */}
                  <div className="relative flex-1 min-h-0 w-full bg-black/90 overflow-hidden flex items-center justify-center">
                    {vid.mediaUrl ? (
                      <video
                        src={vid.thumbnailUrl ? resolveMediaUrl(vid.mediaUrl) : `${resolveMediaUrl(vid.mediaUrl)}#t=1.2`}
                        poster={vid.thumbnailUrl ? resolveMediaUrl(vid.thumbnailUrl) : undefined}
                        preload="metadata"
                        className="h-full w-auto aspect-9/16 object-cover mx-auto"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                        <Video size={18} className="mb-0.5 text-muted-foreground/60" />
                        <span className="text-[10px]">No video file</span>
                      </div>
                    )}

                    {/* Play preview overlay */}
                    {vid.mediaUrl && (
                      <button
                        type="button"
                        onClick={() => onPreview(vid)}
                        className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary transition-all scale-95 group-hover:scale-105 cursor-pointer shadow-md"
                        title="Play Preview"
                      >
                        <Play size={14} className="fill-white ml-0.5" />
                      </button>
                    )}
                  </div>

                  {/* Footer caption & actions */}
                  <div className="px-2.5 py-1 border-t border-border bg-card shrink-0 flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{vid.title}</h4>
                      {vid.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate">{vid.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => onEdit(vid)}
                        className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                        title="Edit Transformation"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(vid)}
                        className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                        title="Delete Transformation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {videos.length > 0 && (
              <Pagination
                currentPage={safeVideoPage}
                totalPages={totalVideoPages}
                totalItems={videos.length}
                pageSize={VIDEO_PAGE_SIZE}
                onPageChange={setVideoPage}
                itemLabel="video reels"
                compact
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackTab;
