import {
  Layers,
  CheckCircle2,
  Clock,
  Camera,
  Film,
  Archive,
} from "lucide-react";

export function PortfolioStats({ stats }) {
  const videoCount = (stats?.movementVideos || 0) + (stats?.sessionClips || 0);

  return (
    <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Total Assets */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-foreground/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assets</span>
          <Layers size={16} className="text-muted-foreground" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground">
          {stats?.total ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Managed media items</p>
      </div>

      {/* 2. Active / Published */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-foreground/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Published</span>
          <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">
          {stats?.active ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Live on public website</p>
      </div>

      {/* 3. Drafts / Hidden */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-foreground/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Drafts</span>
          <Clock size={16} className="text-amber-500 dark:text-amber-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-500 dark:text-amber-400">
          {stats?.draft ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Staged & hidden items</p>
      </div>

      {/* 4. Floor Photos */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-foreground/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Floor Photos</span>
          <Camera size={16} className="text-sky-500 dark:text-sky-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-sky-500 dark:text-sky-400">
          {stats?.photos ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Carousels & galleries</p>
      </div>

      {/* 5. Videos & Reels */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs transition-all hover:border-foreground/20 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Videos & Reels</span>
          <Film size={16} className="text-purple-500 dark:text-purple-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-purple-500 dark:text-purple-400">
          {videoCount}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Movement videos & clips</p>
      </div>
    </div>
  );
}
