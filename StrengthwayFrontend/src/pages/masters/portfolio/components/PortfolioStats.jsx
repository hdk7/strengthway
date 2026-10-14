import { Layers, Image as ImageIcon, Video, MessageSquareQuote } from "lucide-react";

export function PortfolioStats({ stats = {} }) {
  return (
    <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {/* Total Portfolio Items */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Items</span>
          <Layers size={16} className="text-muted-foreground" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
          {stats.total ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Across all sections</p>
      </div>

      {/* Floor Photos */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Floor Photos</span>
          <ImageIcon size={16} className="text-emerald-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400 leading-tight">
          {stats.photos ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Floor moments gallery</p>
      </div>

      {/* Videos & Reels */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Videos & Reels</span>
          <Video size={16} className="text-blue-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-blue-400 leading-tight">
          {stats.videos ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Showcases & reels</p>
      </div>

      {/* Member Testimonials */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Feedback & Quotes</span>
          <MessageSquareQuote size={16} className="text-amber-400" />
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
          {stats.feedback ?? 0}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Reviews & stories</p>
      </div>
    </div>
  );
}

export default PortfolioStats;

