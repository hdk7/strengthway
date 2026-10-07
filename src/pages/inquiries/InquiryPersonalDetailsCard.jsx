import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  Calendar,
  Copy,
  Check,
  Tag,
  Quote,
} from "lucide-react";

export default function InquiryPersonalDetailsCard({
  inquiry,
  formattedDateTime,
  handleCopy,
  copiedField,
}) {
  if (!inquiry) return null;

  return (
    <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Unified Card Top Header */}
      <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-display flex items-center gap-2">
              Personal Details & Inquiry Statement
            </h3>
            <p className="text-xs text-muted-foreground">
              Verified contact dossier and communication statement
            </p>
          </div>
        </div>

        {/* Quick Inquiry ID Pill */}
        {inquiry.id && (
          <div className="inline-flex items-center gap-2 self-start sm:self-auto">
            <span className="font-mono text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>{inquiry.id}</span>
              <button
                type="button"
                onClick={() =>
                  handleCopy?.(inquiry.id, "id_pill", "Inquiry ID")
                }
                className="hover:text-emerald-400 transition-colors cursor-pointer"
                title="Copy ID"
              >
                {copiedField === "id_pill" ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </span>
          </div>
        )}
      </div>

      {/* 2. Unified Card Body: 2-Column Split with subtle divider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column: Personal & Contact Information */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
            <User size={14} className="text-muted-foreground" />
            <span>Contact Information</span>
          </div>

          <dl className="divide-y divide-border text-sm">
            {/* Full Name */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Full Name</dt>
              <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                {inquiry.name || "—"}
              </dd>
            </div>

            {/* Inquiry ID */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Inquiry ID</dt>
              <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                <span>{inquiry.id || "—"}</span>
                {inquiry.id && (
                  <button
                    type="button"
                    onClick={() => handleCopy?.(inquiry.id, "id", "Inquiry ID")}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    {copiedField === "id" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </dd>
            </div>

            {/* Gender */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Gender</dt>
              <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                {inquiry.gender || "—"}
              </dd>
            </div>

            {/* Mobile Number */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
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
                    onClick={() =>
                      handleCopy?.(inquiry.mobile, "mobile", "Mobile number")
                    }
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy mobile number"
                  >
                    {copiedField === "mobile" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </dd>
            </div>

            {/* Email */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
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
                    onClick={() =>
                      handleCopy?.(inquiry.email, "email", "Email address")
                    }
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy email address"
                  >
                    {copiedField === "email" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </dd>
            </div>

            {/* Date and Time */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Date & Time</dt>
              <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
                <Calendar
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span>{formattedDateTime || "—"}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Right Column: Inquiry Statement & Message */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-5 bg-muted/10 flex flex-col justify-start">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
            <Quote size={14} className="text-primary" />
            <span>Inquiry Statement</span>
          </div>

          {/* Subject Box */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              <Tag size={13} className="text-primary" />
              <span>Subject</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-foreground font-display">
              {inquiry.subject || "General Inquiry"}
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2 flex-1 flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Message
            </span>
            <div className="flex-1 rounded-2xl border border-border bg-card p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap font-sans min-h-[140px] shadow-2xs">
              {inquiry.message || "No message provided."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
