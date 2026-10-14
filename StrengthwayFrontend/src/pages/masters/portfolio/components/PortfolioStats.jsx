import { Layers, Image as ImageIcon, Video, MessageSquareQuote } from "lucide-react";

export function PortfolioStats({ stats = {} }) {
  return (
    <div className="shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {/* Total Portfolio Items */}
      <div className="rounded-xl border border-border bg-card p-2 sm:px-3 sm:py-2 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Total Items</span>
          <Layers size={14} className="text-muted-foreground" />
        </div>
        <div className="mt-0.5 text-lg sm:text-xl font-extrabold text-foreground leading-tight">
          {stats.total ?? 0}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">Across all sections</p>
      </div>

      {/* Floor Photos */}
      <div className="rounded-xl border border-border bg-card p-2 sm:px-3 sm:py-2 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Floor Photos</span>
          <ImageIcon size={14} className="text-emerald-400" />
        </div>
        <div className="mt-0.5 text-lg sm:text-xl font-extrabold text-emerald-400 leading-tight">
          {stats.photos ?? 0}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">Floor moments gallery</p>
      </div>

      {/* Videos & Reels */}
      <div className="rounded-xl border border-border bg-card p-2 sm:px-3 sm:py-2 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Videos & Reels</span>
          <Video size={14} className="text-blue-400" />
        </div>
        <div className="mt-0.5 text-lg sm:text-xl font-extrabold text-blue-400 leading-tight">
          {stats.videos ?? 0}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">Showcases & reels</p>
      </div>

      {/* Member Testimonials */}
      <div className="rounded-xl border border-border bg-card p-2 sm:px-3 sm:py-2 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Feedback & Quotes</span>
          <MessageSquareQuote size={14} className="text-amber-400" />
        </div>
        <div className="mt-0.5 text-lg sm:text-xl font-extrabold text-foreground leading-tight">
          {stats.feedback ?? 0}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">Reviews & stories</p>
      </div>
    </div>
  );
}

export default PortfolioStats;
