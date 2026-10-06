import { Phone, Mail } from "lucide-react";

export default function InquiryTableRow({
  inq,
  onNavigate,
}) {
  const dateLabel = inq.createdAt
    ? new Date(inq.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const displayStatus =
    inq.status === "Lead" || inq.status === "New" || !inq.status
      ? "Inquiry"
      : inq.status;

  const rawId = inq.id ? String(inq.id) : "";
  const displayId = rawId.length > 7 ? rawId.slice(-6).toUpperCase() : rawId;

  return (
    <tr
      onClick={() => onNavigate(`/admin/inquiries/${inq.id}`)}
      className="group transition-all duration-150 hover:-translate-y-px cursor-pointer"
    >
      {/* Inquiry ID badge */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40">
          #{displayId}
        </span>
      </td>

      {/* Client / Sender */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5 group/item">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent group-hover/item:scale-105 text-xs font-extrabold transition-transform">
            {inq.name ? inq.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 group-hover:text-accent group-hover:underline transition-colors">
              <span>{inq.name || "Anonymous Inquiry"}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Gender */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        {inq.gender ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/70 text-foreground/80 border border-border/40 capitalize">
            {inq.gender}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>

      {/* Contact */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        <div className="space-y-0.5">
          {inq.mobile ? (
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Phone size={12} className="text-amber-600/80 dark:text-amber-400 shrink-0" />
              <span>{inq.mobile}</span>
            </div>
          ) : null}
          {inq.email ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={12} className="text-muted-foreground/70 shrink-0" />
              <span className="truncate max-w-40">{inq.email}</span>
            </div>
          ) : null}
          {!inq.mobile && !inq.email && (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </td>

      {/* Subject & Message */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors max-w-xs">
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-foreground truncate">
            {inq.subject || "General Inquiry"}
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {inq.message || inq.address || "No message body."}
          </p>
        </div>
      </td>

      {/* Received */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
        {dateLabel}
      </td>

      {/* Workflow Status Badge (Last column) */}
      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            displayStatus === "Converted"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
              : displayStatus === "Contacted"
              ? "bg-blue-50 text-blue-600 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
              : displayStatus === "Inquiry"
              ? "bg-amber-50 text-amber-600 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
              : "bg-muted/60 text-muted-foreground border-border/60"
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
          {displayStatus === "Converted" ? "Converted to Member" : displayStatus}
        </span>
      </td>
    </tr>
  );
}
