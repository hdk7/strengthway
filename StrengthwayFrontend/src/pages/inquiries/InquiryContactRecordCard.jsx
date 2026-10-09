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
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <PhoneCall size={18} className="text-zinc-400" />
          <span>Contact Interaction Record</span>
        </h3>
        <span className="font-mono text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1 rounded-full self-start sm:self-auto backdrop-blur-sm shadow-xs">
          {contactDetails.outcome || "Contacted"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
            Method
          </span>
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Tag size={12} className="text-zinc-400" />
            {contactDetails.contactMethod || "Phone Call"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
            Contacted By
          </span>
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <User size={12} className="text-zinc-400" />
            {contactDetails.contactedBy || "Admin"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
            Interaction Date
          </span>
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Calendar size={12} className="text-zinc-400" />
            {formattedDate}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
            Next Follow-Up
          </span>
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Clock size={12} className="text-zinc-400" />
            {contactDetails.followUpDate || "Not Scheduled"}
          </span>
        </div>
      </div>

      {/* Dedicated Text Field for Interaction Notes */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
          <FileText size={11} className="text-zinc-400" />
          <span>Interaction Notes & Discussion Details</span>
        </span>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans shadow-xs">
          {contactDetails.contactNotes || "No notes recorded."}
        </div>
      </div>
    </div>
  );
}
