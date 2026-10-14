import { useState, useEffect, useMemo } from "react";
import { ArrowRightLeft, CalendarRange } from "lucide-react";
import { SelectField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
} from "@/components/ui/FormModal";
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
    <FormModal isOpen={isOpen} onClose={onClose} size="2xl">
      <FormModalHeader
        icon={ArrowRightLeft}
        title="Batch Transfer & Flexible Assignment"
        subtitle="Manage batch relocation or temporary flex day passes"
        onClose={onClose}
      />

      {/* Member Profile Snapshot / Selection Banner */}
      <div className="bg-muted/40 px-6 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
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
            <SelectField
              label="Select Member to Transfer / Flex"
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              options={[
                { value: "", label: "-- Choose Member from Batch --" },
                ...membersList.map((m) => ({
                  value: m.id,
                  label: `${m.firstName} ${m.lastName || ""} (${m.id}) ${m.mobile ? `• ${m.mobile}` : ""}`,
                })),
              ]}
            />
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
      <div className="flex border-b border-border bg-card shrink-0">
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

      <div className="overflow-y-auto flex-1 min-h-0">
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
    </FormModal>
  );
}
