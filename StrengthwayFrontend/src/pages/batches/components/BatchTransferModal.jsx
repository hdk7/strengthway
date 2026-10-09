import { useState, useEffect, useMemo } from "react";
import { X, ArrowRightLeft, CalendarRange } from "lucide-react";
import BatchPermanentTransferTab from "./BatchPermanentTransferTab";
import BatchFlexiblePassTab from "./BatchFlexiblePassTab";

export default function BatchTransferModal({
  isOpen,
  onClose,
  member,
  membersList = [],
  currentBatch,
  allBatches = [],
  initialTab = "transfer",
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "transfer");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Reset form when modal opens or member changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "transfer");
      setSelectedMemberId(member?.id || "");
    }
  }, [isOpen, member, initialTab]);

  const effectiveMember = useMemo(() => {
    if (member) return member;
    if (selectedMemberId) {
      return membersList.find((m) => m.id === selectedMemberId) || null;
    }
    return null;
  }, [member, selectedMemberId, membersList]);

  if (!isOpen) return null;

  const memberDisplayName =
    effectiveMember?.firstName || effectiveMember?.lastName
      ? `${effectiveMember.firstName || ""} ${effectiveMember.lastName || ""}`.trim()
      : effectiveMember?.name || "Member";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border/60 p-5 sm:p-6 bg-white dark:bg-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <ArrowRightLeft size={20} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-foreground font-display">
                Batch Transfer & Flexible Assignment
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
                Manage batch relocation or temporary flex day passes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member Profile Snapshot / Selection Banner */}
        <div className="bg-muted/40 px-6 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          {member ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                {memberDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">{memberDisplayName}</div>
                <div className="text-muted-foreground">
                  {effectiveMember?.id || member.id} • {effectiveMember?.mobile || member.mobile || effectiveMember?.email || member.email || "Enrolled"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-60">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Select Member to Transfer / Flex <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">-- Choose Member from Batch --</option>
                {membersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName || ""} ({m.id}) {m.mobile ? `• ${m.mobile}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {effectiveMember && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Primary:</span>
              <span className="font-semibold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
                {currentBatch?.name || effectiveMember.batchName || "Assigned Batch"}
              </span>
            </div>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setActiveTab("transfer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "transfer"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft size={15} />
            <span>Permanent Batch Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flex")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "flex"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarRange size={15} />
            <span>Temporary / Flex Pass</span>
          </button>
        </div>

        {/* Tab 1: Permanent Transfer Content */}
        {activeTab === "transfer" && (
          <BatchPermanentTransferTab
            effectiveMember={effectiveMember}
            currentBatch={currentBatch}
            allBatches={allBatches}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}

        {/* Tab 2: Flexible Assignment Content */}
        {activeTab === "flex" && (
          <BatchFlexiblePassTab
            effectiveMember={effectiveMember}
            currentBatch={currentBatch}
            allBatches={allBatches}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
