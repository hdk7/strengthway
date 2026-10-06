import { Phone, Mail, FileCheck, UserCheck, Loader2 } from "lucide-react";

export default function MemberTableRow({
  member,
  onNavigate,
  onOpenConfirmModal,
  onToggleStatus,
  togglingId,
}) {
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
  const initials = `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
  const isDeleted = Boolean(member.isDeleted);

  return (
    <tr
      className={`group transition-all duration-150 hover:-translate-y-px ${
        isDeleted ? "opacity-75" : ""
      }`}
    >
      {/* Member ID Badge */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/70 text-foreground/85 font-mono text-xs font-semibold tracking-tight shadow-2xs">
          #{member.id}
        </span>
      </td>

      {/* Member Info */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5">
          {member.photo ? (
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/members/${member.id}`)}
              title="View full member profile"
              className="shrink-0 cursor-pointer focus:outline-none"
            >
              <img
                src={member.photo}
                alt={fullName}
                className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full object-cover border border-border hover:scale-105 transition-all"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/members/${member.id}`)}
              title="View full member profile"
              className="grid h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-bold text-xs border border-accent/20 hover:scale-105 transition-all cursor-pointer focus:outline-none"
            >
              {initials || "M"}
            </button>
          )}
          <div>
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/members/${member.id}`)}
              className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
            >
              {fullName}
            </button>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {member.planName || "Member"}
            </p>
          </div>
        </div>
      </td>

      {/* Contact Info */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Phone size={12} className="text-muted-foreground shrink-0" />
            <span>{member.mobile || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail size={12} className="text-muted-foreground shrink-0" />
            <span className="truncate max-w-42.5">{member.email || "—"}</span>
          </div>
        </div>
      </td>

      {/* Physical Stats */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="text-xs text-foreground">
          {member.height || member.weight ? (
            <span className="font-medium">
              {member.height ? `${member.height} cm` : ""}
              {member.height && member.weight ? " • " : ""}
              {member.weight ? `${member.weight} kg` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </td>

      {/* Emergency Contact */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        {member.emergencyName ? (
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-foreground">
              {member.emergencyName}
              {member.emergencyRelationship && (
                <span className="text-[11px] text-muted-foreground ml-1">
                  ({member.emergencyRelationship})
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {member.emergencyNumber || "—"}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Medical Doc */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        {member.medicalDoc || member.medicalDocName ? (
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <FileCheck size={13} />
            <span>Attached</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </td>

      {/* Status */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center">
        {isDeleted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            <span>Archived</span>
          </span>
        ) : member.status === "Lead" || member.status === "Inquiry" ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Inquiry</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/members/${member.id}`)}
              title="View profile and record contact details"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Workflow</span>
            </button>
          </div>
        ) : member.status === "Contacted" ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Contacted</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenConfirmModal(member)}
              title="Confirm contacted inquiry, complete details & convert to active gym member"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserCheck size={12} />
              <span>Confirm</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggleStatus(member.id)}
            disabled={togglingId === member.id}
            title="Click to toggle status"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-wait border ${
              member.status === "Inactive"
                ? "bg-muted text-muted-foreground border-border"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                member.status === "Inactive" ? "bg-muted-foreground" : "bg-emerald-500"
              }`}
            />
            {togglingId === member.id && <Loader2 size={10} className="animate-spin" />}
            <span>{member.status || "Active"}</span>
          </button>
        )}
      </td>
    </tr>
  );
}
