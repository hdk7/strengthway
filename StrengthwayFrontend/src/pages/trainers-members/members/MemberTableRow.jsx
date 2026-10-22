import { Phone, Mail, UserCheck, Loader2, RotateCcw } from "lucide-react";
import { isAdmin, getRoleBasePath } from "@/auth/currentUser";
import Avatar from "@/components/ui/avatar";
import { IdBadge } from "@/components/ui/Badge";

export default function MemberTableRow({
  member,
  onNavigate,
  onOpenConfirmModal,
  onToggleStatus,
  togglingId,
  onMoveToInquiry,
}) {
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
  const isDeleted = Boolean(member.isDeleted);

  return (
    <tr
      className={`group transition-all duration-150 hover:-translate-y-px ${
        isDeleted ? "opacity-75" : ""
      }`}
    >
      {/* Member ID Badge */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <IdBadge id={member.id} />
      </td>

      {/* Member Info */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate(`${getRoleBasePath()}/trainers-members/members/${member.id}`)}
            title="View full member profile"
            className="shrink-0 cursor-pointer focus:outline-none hover:scale-105 transition-transform"
          >
            <Avatar
              src={member.photo}
              name={fullName}
              className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full border border-border"
            />
          </button>
          <div>
            <button
              type="button"
              onClick={() => onNavigate(`${getRoleBasePath()}/trainers-members/members/${member.id}`)}
              className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
            >
              {fullName}
            </button>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isDeleted && member.contactDetails?.outcome
                ? `Interaction: ${member.contactDetails.outcome}`
                : member.planName || "Member"}
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


      {/* Status */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
        {isDeleted ? (
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              <span>Archived</span>
            </span>
            {isAdmin() && onMoveToInquiry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToInquiry(member);
                }}
                title="Move to customer inquiries to start workflow from the beginning"
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              >
                <RotateCcw size={11} />
                <span>To Inquiry</span>
              </button>
            )}
          </div>
        ) : member.status === "Lead" || member.status === "Inquiry" ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Inquiry</span>
            </span>
            {isAdmin() && (
              <button
                type="button"
                onClick={() => onNavigate(`${getRoleBasePath()}/trainers-members/members/${member.id}`)}
                title="View profile and record contact details"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Workflow</span>
              </button>
            )}
          </div>
        ) : member.status === "Contacted" ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Contacted</span>
            </span>
            {isAdmin() && (
              <button
                type="button"
                onClick={() => onOpenConfirmModal(member)}
                title="Confirm contacted inquiry, complete details & convert to active gym member"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <UserCheck size={12} />
                <span>Confirm</span>
              </button>
            )}
          </div>
        ) : isAdmin() ? (
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
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
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
            <span>{member.status || "Active"}</span>
          </span>
        )}
      </td>
    </tr>
  );
}
