/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  Dumbbell,
  Move,
  PawPrint,
  PersonStanding,
  Flame,
  Zap,
  HeartPulse,
  Activity,
  Play,
  Pencil,
  Trash2,
  Plus,
  Upload,
  Video,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/portfolioMedia";
import { PortfolioToolbar } from "../components";
import Pagination from "@/components/table/Pagination";

const ICON_MAP = {
  Dumbbell,
  Move,
  PawPrint,
  PersonStanding,
  Flame,
  Zap,
  HeartPulse,
  Activity,
};

export function TrainingSessionsTab({
  items = [],
  viewMode = "grid",
  setViewMode,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
  onPreview,
  onToggleStatus,
  onAddProgram,
  onAddClip,
}) {
  const programs = useMemo(
    () =>
      items.filter(
        (i) => i.section === "TRAINING_SESSION" || i.category === "SESSION_DISCIPLINE"
      ),
    [items]
  );
  const clips = useMemo(
    () =>
      items.filter(
        (i) => i.section === "SESSION_CLIP" || i.category === "SESSION_CLIP"
      ),
    [items]
  );

  // Pagination for Programs (1 row of 4 cards on desktop)
  const [programPage, setProgramPage] = useState(1);
  const PROGRAM_PAGE_SIZE = 4;
  useEffect(() => {
    setProgramPage(1);
    setClipPage(1);
  }, [searchQuery]);
  const totalProgramPages = Math.max(1, Math.ceil(programs.length / PROGRAM_PAGE_SIZE));
  const safeProgramPage = Math.max(1, Math.min(programPage, totalProgramPages));
  const paginatedPrograms = useMemo(() => {
    const start = (safeProgramPage - 1) * PROGRAM_PAGE_SIZE;
    return programs.slice(start, start + PROGRAM_PAGE_SIZE);
  }, [programs, safeProgramPage]);

  // Pagination for Clips (1 row of 4 reels on desktop)
  const [clipPage, setClipPage] = useState(1);
  const CLIP_PAGE_SIZE = 4;
  const totalClipPages = Math.max(1, Math.ceil(clips.length / CLIP_PAGE_SIZE));
  const safeClipPage = Math.max(1, Math.min(clipPage, totalClipPages));
  const paginatedClips = useMemo(() => {
    const start = (safeClipPage - 1) * CLIP_PAGE_SIZE;
    return clips.slice(start, start + CLIP_PAGE_SIZE);
  }, [clips, safeClipPage]);

  return (
    <div className="space-y-3">
      {/* ── Segment A: Training Programs (Cards) ── */}
      <div className="space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold font-display text-foreground">
              Workout Programs & Sessions
            </h2>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              • Portfolio overview cards
            </span>
          </div>

          <PortfolioToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            placeholder="Search programs..."
          >
            <button
              type="button"
              onClick={onAddProgram}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={13} className="text-primary" />
              Add Program
            </button>
          </PortfolioToolbar>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center bg-card/20">
            <p className="text-xs text-muted-foreground">No program cards found.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-1.5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedPrograms.map((s) => {
                const IconComp = ICON_MAP[s.icon] || Dumbbell;
                return (
                  <div
                    key={s.id}
                    className="group relative rounded-xl border border-border bg-card p-2.5 transition-all hover:border-primary/40 hover:shadow-xs flex flex-col justify-between h-[96px]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <IconComp size={13} />
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onEdit(s)}
                            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            title="Edit Program"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(s)}
                            className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h3 className="mt-1 font-display text-xs font-bold text-foreground truncate">
                        {s.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 leading-tight">
                        {s.subtitle || "No description provided."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {programs.length > 0 && (
              <Pagination
                currentPage={safeProgramPage}
                totalPages={totalProgramPages}
                totalItems={programs.length}
                pageSize={PROGRAM_PAGE_SIZE}
                onPageChange={setProgramPage}
                itemLabel="programs"
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
                    <th className="py-1.5 px-3">Icon & Title</th>
                    <th className="py-1.5 px-3">Overview</th>
                    <th className="py-1.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedPrograms.map((s) => {
                    const IconComp = ICON_MAP[s.icon] || Dumbbell;
                    return (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-1.5 px-3 font-semibold text-foreground flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <IconComp size={13} />
                          </div>
                          <span className="truncate">{s.title}</span>
                        </td>
                        <td className="py-1.5 px-3 text-muted-foreground max-w-sm truncate text-[11px]">
                          {s.subtitle || "—"}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(s)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(s)}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
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
            {programs.length > 0 && (
              <Pagination
                currentPage={safeProgramPage}
                totalPages={totalProgramPages}
                totalItems={programs.length}
                pageSize={PROGRAM_PAGE_SIZE}
                onPageChange={setProgramPage}
                itemLabel="programs"
                compact
              />
            )}
          </div>
        )}
      </div>

      {/* ── Segment B: Vertical Video Clips (9:16 Reels) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold font-display text-foreground">
              Session Video Reels (9:16)
            </h2>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              • Vertical reels featured in training carousel
            </span>
          </div>
          <button
            type="button"
            onClick={onAddClip}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Upload size={13} className="text-primary" />
            Upload Video
          </button>
        </div>

        {clips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center bg-card/20">
            <p className="text-xs text-muted-foreground">No vertical video clips found.</p>
            <button
              type="button"
              onClick={onAddClip}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Upload size={13} />
              Upload Video
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm h-[172px]"
                >
                  {/* 9:16 Reel Player / Poster with constrained height */}
                  <div className="relative flex-1 min-h-0 w-full bg-black/90 overflow-hidden flex items-center justify-center">
                    {clip.mediaUrl ? (
                      <video
                        src={clip.thumbnailUrl ? resolveMediaUrl(clip.mediaUrl) : `${resolveMediaUrl(clip.mediaUrl)}#t=1.2`}
                        poster={clip.thumbnailUrl ? resolveMediaUrl(clip.thumbnailUrl) : undefined}
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
                    {clip.mediaUrl && (
                      <button
                        type="button"
                        onClick={() => onPreview(clip)}
                        className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary transition-all scale-95 group-hover:scale-105 cursor-pointer shadow-md"
                        title="Play Preview"
                      >
                        <Play size={14} className="fill-white ml-0.5" />
                      </button>
                    )}

                    {/* Action icons overlay on top right */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(clip)}
                        className="p-1 rounded-md bg-black/70 text-white hover:bg-white hover:text-black transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                        title="Edit Clip"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(clip)}
                        className="p-1 rounded-md bg-black/70 text-red-400 hover:bg-destructive hover:text-white transition-colors cursor-pointer backdrop-blur-xs shadow-xs"
                        title="Delete Clip"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Footer caption */}
                  <div className="px-2.5 py-1 border-t border-border bg-card shrink-0 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground truncate">{clip.title}</h4>
                    {clip.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate ml-2 max-w-[45%] text-right">{clip.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {clips.length > 0 && (
              <Pagination
                currentPage={safeClipPage}
                totalPages={totalClipPages}
                totalItems={clips.length}
                pageSize={CLIP_PAGE_SIZE}
                onPageChange={setClipPage}
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

export default TrainingSessionsTab;
