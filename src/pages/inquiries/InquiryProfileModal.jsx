import { useState, useMemo, useEffect } from "react";
import {
  X,
  User,
  Clock,
  PhoneCall,
  UserCheck,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import InquiryContactRecordCard from "./InquiryContactRecordCard";
import InquiryPersonalDetailsCard from "./InquiryPersonalDetailsCard";

export function InquiryProfileModal({
  isOpen,
  onClose,
  inquiry,
  onContact,
  onConvert,
  onArchive,
}) {
  const [copiedField, setCopiedField] = useState(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const displayStatus =
    inquiry?.status === "Lead" || inquiry?.status === "New" || !inquiry?.status
      ? "Inquiry"
      : inquiry.status;

  const formattedDateTime = useMemo(() => {
    if (!inquiry?.createdAt) return "—";
    try {
      const d = new Date(inquiry.createdAt);
      if (isNaN(d.getTime())) return String(inquiry.createdAt);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(inquiry.createdAt || "—");
    }
  }, [inquiry?.createdAt]);

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen || !inquiry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/55 p-3 sm:p-5 backdrop-blur-[1.5px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="no-scrollbar relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border/60 bg-white dark:bg-card px-6 py-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-muted-foreground font-mono">
              Inquiry Profile
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-md">
              {inquiry.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {displayStatus === "Inquiry" && (
              <button
                type="button"
                onClick={() => onContact?.(inquiry)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <PhoneCall size={13} />
                <span>Contact Lead</span>
              </button>
            )}

            {displayStatus === "Contacted" && (
              <>
                <button
                  type="button"
                  onClick={() => onConvert?.(inquiry)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <UserCheck size={13} />
                  <span>Convert to Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => onArchive?.(inquiry)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Archive size={13} />
                  <span>Archive</span>
                </button>
              </>
            )}

            {displayStatus === "Converted" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Converted to Member</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Profile Body */}
        <div className="no-scrollbar overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Hero Profile Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-r from-accent/20 via-card to-background p-6 sm:p-8 shadow-sm">
            {/* Ambient Background Glowing Orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute left-1/3 -bottom-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground truncate">
                  {inquiry.name || "Anonymous Prospect"}
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      displayStatus === "Converted"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : displayStatus === "Contacted"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : displayStatus === "Inquiry"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-muted/60 text-muted-foreground border-border"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        displayStatus === "Converted"
                          ? "bg-emerald-500"
                          : displayStatus === "Contacted"
                            ? "bg-blue-500"
                            : displayStatus === "Inquiry"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-muted-foreground"
                      }`}
                    />
                    {displayStatus === "Converted"
                      ? "Converted to Member"
                      : displayStatus}
                  </span>

                  {/* Inquiry ID */}
                  <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/60 border border-border px-2.5 py-0.5 rounded-full">
                    {inquiry.id}
                  </span>

                  {/* Gender */}
                  {inquiry.gender && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      <User size={12} className="text-muted-foreground" />
                      <span>{inquiry.gender}</span>
                    </span>
                  )}

                  {/* Date and Time */}
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    <Clock size={12} className="text-primary" />
                    <span>{formattedDateTime}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Single Unified Inquiry Profile Card */}
          <div className="space-y-6">
            <InquiryPersonalDetailsCard
              inquiry={inquiry}
              formattedDateTime={formattedDateTime}
              handleCopy={handleCopy}
              copiedField={copiedField}
            />

            {/* Contact Interaction History & Details (Shown if contacted) */}
            {inquiry.contactDetails && (
              <InquiryContactRecordCard
                contactDetails={inquiry.contactDetails}
              />
            )}
          </div>
        </div>

        {/* Modal Footer with Clean Close Button */}
        <div className="border-t border-border/70 bg-card px-6 py-4 sm:px-8 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-foreground text-background px-5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InquiryProfileModal;
