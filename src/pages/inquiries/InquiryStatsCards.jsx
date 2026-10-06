import { Inbox, Clock, MessageSquare, CheckCircle2 } from "lucide-react";

export default function InquiryStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 shrink-0">
      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
          <Inbox size={15} />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-foreground">{stats.total}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Lifetime inquiries</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Inquiries</span>
          <Clock size={15} className="text-amber-400" />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-amber-400">
          {stats.pendingInquiries}
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Pending inquiries</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Contacted</span>
          <MessageSquare size={15} className="text-blue-400" />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-blue-400">{stats.contacted}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">In communication</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Converted</span>
          <CheckCircle2 size={15} className="text-emerald-400" />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-emerald-400">{stats.converted}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Active members</p>
      </div>
    </div>
  );
}
