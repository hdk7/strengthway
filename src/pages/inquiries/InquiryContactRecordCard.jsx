import { PhoneCall, Tag, User, Calendar, Clock, FileText } from "lucide-react";

export default function InquiryContactRecordCard({ contactDetails }) {
  if (!contactDetails) return null;

  const formattedDate = contactDetails.contactedAt
    ? new Date(contactDetails.contactedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 sm:p-7 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <PhoneCall size={18} className="text-blue-400" />
          <span>Contact Interaction Record</span>
        </h3>
        <span className="font-mono text-xs text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
          {contactDetails.outcome || "Contacted"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
            Method
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Tag size={12} className="text-blue-400" />
            {contactDetails.contactMethod || "Phone Call"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
            Contacted By
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <User size={12} className="text-muted-foreground" />
            {contactDetails.contactedBy || "Admin"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
            Interaction Date
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground" />
            {formattedDate}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
            Next Follow-Up
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Clock size={12} className="text-amber-400" />
            {contactDetails.followUpDate || "Not Scheduled"}
          </span>
        </div>
      </div>

      {/* Dedicated Text Field for Interaction Notes */}
      <div className="space-y-1.5 pt-1 border-t border-blue-500/15">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <FileText size={11} className="text-blue-400" />
          <span>Interaction Notes & Discussion Details</span>
        </span>
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
          {contactDetails.contactNotes || "No notes recorded."}
        </div>
      </div>
    </div>
  );
}
