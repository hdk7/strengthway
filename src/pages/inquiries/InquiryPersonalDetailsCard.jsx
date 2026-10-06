import { ShieldCheck, Phone, Mail, Calendar, Copy, Check } from "lucide-react";

export default function InquiryPersonalDetailsCard({
  inquiry,
  formattedDateTime,
  handleCopy,
  copiedField,
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
      <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
        <ShieldCheck size={18} className="text-emerald-500" />
        <span>Personal Details & Contact</span>
      </h3>

      <dl className="mt-4 divide-y divide-border text-sm">
        {/* Full Name */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Full Name</dt>
          <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
            {inquiry.name || "—"}
          </dd>
        </div>

        {/* Inquiry ID */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
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
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </dd>
        </div>

        {/* Gender */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Gender</dt>
          <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
            {inquiry.gender || "—"}
          </dd>
        </div>

        {/* Mobile Number */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
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
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </dd>
        </div>

        {/* Email */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
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
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </dd>
        </div>

        {/* Date and Time */}
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Date & Time</dt>
          <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground shrink-0" />
            <span>{formattedDateTime}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
