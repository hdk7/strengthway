import { useState, useMemo, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  Quote,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export function InquiryProfileModal({
  isOpen,
  onClose,
  inquiry,
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

  const initials = useMemo(() => {
    const raw = String(inquiry?.name || "").trim();
    if (!raw) return "U";
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0] || "")
        .join("")
        .toUpperCase() || "U"
    );
  }, [inquiry?.name]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="no-scrollbar relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card px-6 py-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Inquiry Profile
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
              {inquiry.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/80 bg-background/80 p-2 text-muted-foreground hover:bg-accent/15 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Profile Body */}
        <div className="no-scrollbar overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Hero Profile Banner (Adopted from MemberProfilePage / TrainerProfilePage) */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-accent/20 via-card to-background p-6 sm:p-8 shadow-sm">
            {/* Ambient Background Glowing Orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute left-1/3 -bottom-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5 min-w-0">
                {/* Monogram Avatar with Live Ring */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-xl">
                    <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-2xl sm:text-3xl font-black tracking-wider uppercase">
                      {initials}
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-border">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                </div>

                {/* Name, Badges & Subject Preview */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Inquiry ID */}
                    <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
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

                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground truncate">
                    {inquiry.name || "Anonymous Prospect"}
                  </h2>

                  <p className="text-xs sm:text-sm text-muted-foreground italic truncate">
                    &ldquo;{inquiry.subject || "General Inquiry"}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Dossier Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Personal Information & Contact Dossier Table */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3.5">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <span>Personal Details & Contact</span>
                </h3>

                <dl className="mt-4 divide-y divide-border text-sm">
                  {/* Name */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Full Name</dt>
                    <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                      {inquiry.name || "—"}
                    </dd>
                  </div>

                  {/* ID */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Inquiry ID</dt>
                    <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                      <span>{inquiry.id || "—"}</span>
                      {inquiry.id && (
                        <button
                          type="button"
                          onClick={() => handleCopy(inquiry.id, "id", "Inquiry ID")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedField === "id" ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>

                  {/* Gender */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Gender</dt>
                    <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                      {inquiry.gender || "—"}
                    </dd>
                  </div>

                  {/* Mobile Number */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Mobile</dt>
                    <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={14} className="text-muted-foreground shrink-0" />
                        {inquiry.mobile ? (
                          <a
                            href={`tel:${inquiry.mobile}`}
                            className="hover:text-primary hover:underline font-semibold truncate"
                          >
                            {inquiry.mobile}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      {inquiry.mobile && (
                        <button
                          type="button"
                          onClick={() => handleCopy(inquiry.mobile, "mobile", "Mobile number")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy mobile number"
                        >
                          {copiedField === "mobile" ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>

                  {/* Email */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Email</dt>
                    <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={14} className="text-muted-foreground shrink-0" />
                        {inquiry.email ? (
                          <a
                            href={`mailto:${inquiry.email}`}
                            className="hover:text-primary hover:underline font-semibold truncate"
                          >
                            {inquiry.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      {inquiry.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(inquiry.email, "email", "Email address")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy email address"
                        >
                          {copiedField === "email" ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>

                  {/* Date and Time */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Date & Time</dt>
                    <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground shrink-0" />
                      <span>{formattedDateTime}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right Column: Inquiry Statement & Message */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3.5">
                  <Quote size={18} className="text-primary" />
                  <span>Inquiry Statement</span>
                </h3>

                {/* Subject Header */}
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <Tag size={13} className="text-primary" />
                    <span>Subject</span>
                  </div>
                  <div className="text-base font-bold text-foreground font-display">
                    {inquiry.subject || "General Inquiry"}
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Message
                  </span>
                  <blockquote className="rounded-2xl border-l-4 border-primary bg-muted/20 p-5 text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {inquiry.message || "No message provided."}
                  </blockquote>
                </div>
              </div>
            </div>
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
