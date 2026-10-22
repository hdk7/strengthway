import { useMemo } from "react";
import { PhoneCall, Tag, User, Calendar, Clock, FileText } from "lucide-react";

export default function InquiryContactRecordCard({ contactDetails, contactHistory }) {
  const conversations = useMemo(() => {
    let list = [];
    if (Array.isArray(contactHistory) && contactHistory.length > 0) {
      list = [...contactHistory];
    } else if (contactDetails) {
      list = [contactDetails];
    }

    if (
      contactDetails &&
      !list.some(
        (c) =>
          c.contactedAt === contactDetails.contactedAt &&
          c.contactNotes === contactDetails.contactNotes
      )
    ) {
      list = [contactDetails, ...list];
    }

    // Sort descending by contactedAt so the latest conversation displays on top
    return list.sort((a, b) => {
      const timeA = a?.contactedAt ? new Date(a.contactedAt).getTime() : 0;
      const timeB = b?.contactedAt ? new Date(b.contactedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [contactHistory, contactDetails]);

  if (conversations.length === 0) return null;

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <PhoneCall size={18} className="text-zinc-400" />
          <h3 className="text-base font-bold text-zinc-100">
            Contact Interaction Record
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80">
            {conversations.length} {conversations.length === 1 ? "Conversation" : "Conversations"}
          </span>
        </div>
        {conversations[0]?.outcome && (
          <span className="font-mono text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1 rounded-full self-start sm:self-auto backdrop-blur-sm shadow-xs">
            Latest: {conversations[0].outcome}
          </span>
        )}
      </div>

      {/* List out all conversations in history format, latest at top */}
      <div className="space-y-6 divide-y divide-zinc-800/80">
        {conversations.map((item, idx) => {
          const isLatest = idx === 0;
          const formattedDate = item.contactedAt
            ? new Date(item.contactedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";

          return (
            <div key={idx} className={idx > 0 ? "pt-6 space-y-4" : "space-y-4"}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isLatest
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                    }`}
                  >
                    {isLatest ? "Latest Conversation" : `Conversation #${conversations.length - idx}`}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formattedDate}
                  </span>
                </div>
                {item.outcome && !isLatest && (
                  <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900/70 border border-zinc-800 px-2 py-0.5 rounded-full">
                    {item.outcome}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
                    Method
                  </span>
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Tag size={12} className="text-zinc-400" />
                    {item.contactMethod || "Phone Call"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">
                    Contacted By
                  </span>
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <User size={12} className="text-zinc-400" />
                    {item.contactedBy || "Admin"}
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
                    {item.followUpDate || "Not Scheduled"}
                  </span>
                </div>
              </div>

              {/* Dedicated Text Field for Interaction Notes */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <FileText size={11} className="text-zinc-400" />
                  <span>Interaction Notes & Discussion Details</span>
                </span>
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans shadow-xs">
                  {item.contactNotes || "No notes recorded."}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
