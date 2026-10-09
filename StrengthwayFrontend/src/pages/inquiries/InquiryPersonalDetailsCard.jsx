import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  Quote,
} from "lucide-react";

export default function InquiryPersonalDetailsCard({
  inquiry,
  formattedDateTime,
}) {
  if (!inquiry) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-r from-accent/15 via-card/75 to-background/60 shadow-lg backdrop-blur-xl">
      {/* Ambient Glowing Orbs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      {/* 1. Unified Card Top Header */}
      <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6 border-b border-border/60 bg-card/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-display flex items-center gap-2">
              Personal Details &amp; Inquiry Statement
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Unified Card Body: 2-Column Split with subtle divider */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
        {/* Left Column: Personal & Contact Information */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-4 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
            <User size={14} className="text-muted-foreground" />
            <span>Contact Information</span>
          </div>

          <dl className="divide-y divide-border/50 text-sm">
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
              <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0">
                {inquiry.id || "—"}
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
              <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
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
              </dd>
            </div>

            {/* Email */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
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
              </dd>
            </div>

            {/* Date and Time */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
              <dt className="font-medium text-muted-foreground">Date &amp; Time</dt>
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
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-5 bg-muted/15 backdrop-blur-sm flex flex-col justify-start">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
            <Quote size={14} className="text-primary" />
            <span>Inquiry Statement</span>
          </div>

          {/* Subject Box */}
          <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
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
            <div className="flex-1 rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap font-sans min-h-[140px] shadow-2xs">
              {inquiry.message || "No message provided."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
