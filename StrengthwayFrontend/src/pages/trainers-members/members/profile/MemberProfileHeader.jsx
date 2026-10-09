import {
  ArrowLeft,
  UserCheck,
  RotateCcw,
  Trash2,
  Edit3,
  PhoneCall,
  Archive,
} from "lucide-react";

export function MemberProfileHeader({
  member,
  fullName,
  isDeleted,
  navigate,
  handleOpenContact,
  handleConvertLead,
  handleArchiveInquiry,
  handleRestore,
  handleSoftDelete,
  setIsEditModalOpen,
  handleMoveToInquiry,
}) {
  const isLeadOrInquiry =
    !isDeleted && (member.status === "Lead" || member.status === "Inquiry");
  const isContacted = !isDeleted && member.status === "Contacted";
  const isInterestedConverting =
    isContacted &&
    member?.contactDetails?.outcome === "Interested - Converting Soon";
  const isNotInterested =
    isContacted &&
    member?.contactDetails?.outcome === "Not Interested";
  const isNeedsFollowUp =
    isContacted &&
    member?.contactDetails?.outcome === "Needs Follow-Up";
  const isConverted =
    !isDeleted && (member.status === "Converted" || member.status === "Active");

  return (
    <>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            {member?.photo && (
              <img
                src={member.photo}
                alt={fullName}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover border-2 border-border/80 shadow-md shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display">
                  {fullName}
                </h1>
                {isDeleted || member.status === "Archived" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-destructive">
                    Archived
                  </span>
                ) : isLeadOrInquiry ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Inquiry
                  </span>
                ) : isContacted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Contacted
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Back & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/members")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <ArrowLeft size={16} />
            <span>Back to Members List</span>
          </button>

          {/* Inquiry Workflow: Step 1 Contact button */}
          {isLeadOrInquiry && (
            <button
              type="button"
              onClick={handleOpenContact}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              <PhoneCall size={16} />
              <span>Contact Prospect</span>
            </button>
          )}

          {/* Inquiry Workflow: Step 2 Convert & Archive buttons */}
          {isContacted && (
            <>
              {isNeedsFollowUp && (
                <button
                  type="button"
                  onClick={handleOpenContact}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                >
                  <PhoneCall size={16} />
                  <span>Recontact Prospect</span>
                </button>
              )}
              {!isNotInterested && (
                <button
                  type="button"
                  onClick={handleConvertLead}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                >
                  <UserCheck size={16} />
                  <span>Confirm & Convert to Member</span>
                </button>
              )}
              {!isInterestedConverting && (
                <button
                  type="button"
                  onClick={handleArchiveInquiry}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <Archive size={16} />
                  <span>Archive Inquiry</span>
                </button>
              )}
            </>
          )}

          {isDeleted || member.status === "Archived" ? (
            <>
              {handleMoveToInquiry && (
                <button
                  type="button"
                  onClick={handleMoveToInquiry}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <RotateCcw size={16} />
                  <span>Move to Inquiry</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRestore}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <RotateCcw size={16} />
                <span>Restore Member</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSoftDelete}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <Trash2 size={16} />
              <span>Archive (Soft Delete)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Inquiry Notice Banner: Step 1 (Inquiry -> Contacted) */}
      {isLeadOrInquiry && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
              <PhoneCall size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Inquiry Status Workflow — Step 1</h3>
              <p className="text-xs text-muted-foreground">
                This prospect entered as an inquiry. Record contact details in the dedicated interaction form to advance status to Contacted.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenContact}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PhoneCall size={14} />
            <span>Record Contact Details</span>
          </button>
        </div>
      )}

      {/* Inquiry Notice Banner: Step 2 (Contacted -> Converted / Archived) */}
      {isContacted && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-400">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Inquiry Status Workflow — Step 2</h3>
              <p className="text-xs text-muted-foreground">
                Contact interaction recorded. Collect and complete member details to officially convert to an active Member, or move to Archived if unconfirmed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleConvertLead}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserCheck size={14} />
              <span>Confirm & Convert Member</span>
            </button>
            <button
              type="button"
              onClick={handleArchiveInquiry}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
            >
              <Archive size={14} />
              <span>Archive</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
