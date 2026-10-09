/* eslint-disable max-lines */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import BatchDetailHeader from "./detail/BatchDetailHeader";
import BatchDetailTabsNav from "./detail/BatchDetailTabsNav";
import BatchOverviewTab from "./detail/BatchOverviewTab";
import BatchTrainersTab from "./detail/BatchTrainersTab";
import BatchMembersTab from "./detail/BatchMembersTab";
import BatchClassesTab from "./detail/BatchClassesTab";
import BatchDetailModals from "./detail/BatchDetailModals";
import { useBatchDetailData } from "./detail/useBatchDetailData";
import { useBatchDetailActions } from "./detail/useBatchDetailActions";

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trainers" | "members" | "classes"
  const [memberSearch, setMemberSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");
  const [sessionsTab, setSessionsTab] = useState("Upcoming");
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("all");

  // Modal states
  const [isEditMasterItemOpen, setIsEditMasterItemOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState(null);
  const [sessionNoteText, setSessionNoteText] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetMember, setTransferTargetMember] = useState(null);
  const [transferModalTab, setTransferModalTab] = useState("transfer");
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberModalSearch, setMemberModalSearch] = useState("");

  const {
    batch,
    isLoading,
    trainers,
    members,
    masterSchedule,
    masterClassItems,
    setMasterClassItems,
    allMasterSchedules,
    allBatches,
    allTrainers,
    allMembers,
    selectedMonth,
    monthTracking,
    loadBatchData,
    loadMonthTracking,
    handlePrevMonth,
    handleNextMonth,
    handleCurrentMonth,
    formattedMonthLabel,
    capacity,
    currentPax,
    occupancyPercent,
    remainingSlots,
    filteredPrimaryMembers,
    filteredFlexInMembers,
    filteredTrainers,
    currentBatchSessions,
    sessionTabCounts,
    displayedSessions,
  } = useBatchDetailData(id, memberSearch, trainerSearch, sessionsTab, selectedWeekFilter);

  const {
    handleRevokeFlexPass,
    handleAssignTrainer,
    handleUnassignTrainer,
    handleEnrollExistingMember,
    handleRemoveMemberFromBatch,
    handleMarkCompleted,
    handleCancelSession,
    handleRestoreSession,
    handleSaveSessionNotes,
    handleAssignProgram,
    handleUnassignProgram,
    handleCreateMasterScheduleForBatch,
    handleSaveMasterClassItem,
  } = useBatchDetailActions({
    batch,
    allTrainers,
    masterSchedule,
    loadBatchData,
    loadMonthTracking,
    selectedMonth,
    setMasterClassItems,
    setIsEditMasterItemOpen,
    editingMasterItem,
    setIsAssignProgramOpen,
    selectedSessionForNotes,
    setSelectedSessionForNotes,
    sessionNoteText,
    currentBatchSessions,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <div className="h-8 w-60 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted/60" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card p-5" />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Batch Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested batch does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/admin/batches")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} /> Back to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <BatchDetailHeader
        batch={batch}
        formattedMonthLabel={formattedMonthLabel}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
      />

      <BatchDetailTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        trainers={trainers}
        members={members}
        filteredFlexInMembers={filteredFlexInMembers}
        currentBatchSessions={currentBatchSessions}
        trainerSearch={trainerSearch}
        setTrainerSearch={setTrainerSearch}
        onOpenAddTrainer={() => setIsAddTrainerOpen(true)}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        onOpenTransferModal={() => {
          setTransferTargetMember(null);
          setTransferModalTab("transfer");
          setIsTransferModalOpen(true);
        }}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenAssignProgram={() => setIsAssignProgramOpen(true)}
      />

      {activeTab === "overview" && (
        <BatchOverviewTab
          monthTracking={monthTracking}
          currentPax={currentPax}
          capacity={capacity}
          occupancyPercent={occupancyPercent}
          remainingSlots={remainingSlots}
          filteredFlexInMembers={filteredFlexInMembers}
          formattedMonthLabel={formattedMonthLabel}
          trainers={trainers}
          members={members}
          masterSchedule={masterSchedule}
          currentBatchSessions={currentBatchSessions}
          sessionTabCounts={sessionTabCounts}
          onSelectTab={setActiveTab}
        />
      )}

      {activeTab === "trainers" && (
        <BatchTrainersTab
          batch={batch}
          formattedMonthLabel={formattedMonthLabel}
          filteredTrainers={filteredTrainers}
          trainerSearch={trainerSearch}
          currentBatchSessions={currentBatchSessions}
          onOpenAddTrainer={() => setIsAddTrainerOpen(true)}
          onUnassignTrainer={handleUnassignTrainer}
        />
      )}

      {activeTab === "members" && (
        <BatchMembersTab
          batch={batch}
          formattedMonthLabel={formattedMonthLabel}
          filteredPrimaryMembers={filteredPrimaryMembers}
          filteredFlexInMembers={filteredFlexInMembers}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onOpenTransfer={(mem, tab) => {
            setTransferTargetMember(mem);
            setTransferModalTab(tab);
            setIsTransferModalOpen(true);
          }}
          onRemoveMember={handleRemoveMemberFromBatch}
          onRevokeFlexPass={handleRevokeFlexPass}
        />
      )}

      {activeTab === "classes" && (
        <BatchClassesTab
          batch={batch}
          masterSchedule={masterSchedule}
          currentBatchSessions={currentBatchSessions}
          displayedSessions={displayedSessions}
          sessionsTab={sessionsTab}
          setSessionsTab={setSessionsTab}
          sessionTabCounts={sessionTabCounts}
          selectedWeekFilter={selectedWeekFilter}
          setSelectedWeekFilter={setSelectedWeekFilter}
          masterClassItems={masterClassItems}
          onOpenNotes={(session) => {
            setSelectedSessionForNotes(session);
            setSessionNoteText(session.notes || "");
          }}
          onEditMasterItem={(matchingItem) => {
            setEditingMasterItem(matchingItem);
            setIsEditMasterItemOpen(true);
          }}
          onMarkCompleted={handleMarkCompleted}
          onCancelSession={handleCancelSession}
          onRestoreSession={handleRestoreSession}
          onOpenAssignProgram={() => setIsAssignProgramOpen(true)}
          onCreateMasterSchedule={handleCreateMasterScheduleForBatch}
        />
      )}

      <BatchDetailModals
        batch={batch}
        currentPax={currentPax}
        capacity={capacity}
        remainingSlots={remainingSlots}
        trainers={trainers}
        members={members}
        allTrainers={allTrainers}
        allMembers={allMembers}
        allMasterSchedules={allMasterSchedules}
        allBatches={allBatches}
        isEditMasterItemOpen={isEditMasterItemOpen}
        setIsEditMasterItemOpen={setIsEditMasterItemOpen}
        editingMasterItem={editingMasterItem}
        setEditingMasterItem={setEditingMasterItem}
        onSaveMasterClassItem={handleSaveMasterClassItem}
        selectedSessionForNotes={selectedSessionForNotes}
        setSelectedSessionForNotes={setSelectedSessionForNotes}
        sessionNoteText={sessionNoteText}
        setSessionNoteText={setSessionNoteText}
        onSaveSessionNotes={handleSaveSessionNotes}
        isAssignProgramOpen={isAssignProgramOpen}
        setIsAssignProgramOpen={setIsAssignProgramOpen}
        onAssignProgram={handleAssignProgram}
        onUnassignProgram={handleUnassignProgram}
        onCreateMasterSchedule={handleCreateMasterScheduleForBatch}
        isAddTrainerOpen={isAddTrainerOpen}
        setIsAddTrainerOpen={setIsAddTrainerOpen}
        trainerSearchQuery={trainerSearchQuery}
        setTrainerSearchQuery={setTrainerSearchQuery}
        onAssignTrainer={handleAssignTrainer}
        isAddMemberOpen={isAddMemberOpen}
        setIsAddMemberOpen={setIsAddMemberOpen}
        memberModalSearch={memberModalSearch}
        setMemberModalSearch={setMemberModalSearch}
        onEnrollMember={handleEnrollExistingMember}
        isTransferModalOpen={isTransferModalOpen}
        setIsTransferModalOpen={setIsTransferModalOpen}
        transferTargetMember={transferTargetMember}
        setTransferTargetMember={setTransferTargetMember}
        transferModalTab={transferModalTab}
        onTransferSuccess={async () => {
          await loadBatchData();
          if (batch?.id) {
            await loadMonthTracking(batch.id, selectedMonth);
          }
        }}
      />
    </div>
  );
}
