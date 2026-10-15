/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import BatchDetailHeader from "./detail/BatchDetailHeader";
import BatchDetailTabsNav from "./detail/BatchDetailTabsNav";
import BatchOverviewTab from "./detail/BatchOverviewTab";
import BatchTrainersTab from "./detail/BatchTrainersTab";
import BatchMembersTab from "./detail/BatchMembersTab";
import BatchClassesTab from "./detail/BatchClassesTab";
import BatchAuditLogsTab from "./detail/BatchAuditLogsTab";
import BatchDetailModals from "./detail/BatchDetailModals";
import SubstituteCoachModal from "./detail/SubstituteCoachModal";
import { BatchClassAssignmentModal } from "../schedule/components/BatchClassAssignmentModal";
import { useBatchDetailData } from "./detail/useBatchDetailData";
import { useBatchDetailActions } from "./detail/useBatchDetailActions";
import { isMember, isTrainer, getCurrentUser } from "@/auth/currentUser";
import { hasClassStarted } from "@/lib/batchUtils";
import { saveSessionNote } from "@/lib/sessionNotesService";
import { toast } from "sonner";

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "overview"); // "overview" | "trainers" | "members" | "classes"

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "trainers", "members", "classes", "audit"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [memberSearch, setMemberSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");
  const [sessionsTab, setSessionsTab] = useState(() => searchParams.get("sessionTab") || "All");
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("all");
  const [isAssignClassesOpen, setIsAssignClassesOpen] = useState(false);

  // Modal states
  const [isEditMasterItemOpen, setIsEditMasterItemOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState(null);
  const [selectedTrainerIdForNotes, setSelectedTrainerIdForNotes] = useState("");
  const [sessionNoteText, setSessionNoteText] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetMember, setTransferTargetMember] = useState(null);
  const [transferModalTab, setTransferModalTab] = useState("transfer");
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberModalSearch, setMemberModalSearch] = useState("");
  const [substituteModalSession, setSubstituteModalSession] = useState(null);

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
    sessionNotes,
    setSessionNotes,
  } = useBatchDetailData(id, memberSearch, trainerSearch, sessionsTab, selectedWeekFilter);

  const handleSaveTrainerNote = async (notePayload) => {
    try {
      const saved = await saveSessionNote(notePayload);
      const updatedNote = saved?.data || saved;
      setSessionNotes((prev) => {
        const filtered = (prev || []).filter(
          (n) => !(n.sessionId === updatedNote.sessionId && n.trainerId === updatedNote.trainerId)
        );
        return [...filtered, updatedNote];
      });
      toast.success("Coach session notes saved successfully.");
      setSelectedSessionForNotes(null);
      await loadBatchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save coach notes."
      );
    }
  };

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
          onClick={() => navigate(isMember() ? "/member/dashboard" : isTrainer() ? "/trainer/schedule/batches" : "/admin/batches")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} /> {isMember() ? "Back to Dashboard" : "Back to Batches"}
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
        onOpenAddClasses={() => setIsAssignClassesOpen(true)}
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

      {activeTab === "members" && !isMember() && (
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

      {activeTab === "classes" && !isMember() && (
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
          sessionNotes={sessionNotes}
          trainers={allTrainers.length > 0 ? allTrainers : trainers}
          onOpenNotes={(session, trainerId) => {
            const canComplete = hasClassStarted(session);
            const isCompleted = session?.status === "COMPLETED";
            const isEligible = (isCompleted || canComplete) && session?.status !== "CANCELLED";
            const hasExistingNotes = (sessionNotes || []).some(
              (n) => n.sessionId === session?.id && n.sessionSummary && n.sessionSummary.trim().length > 0
            );
            if (!isEligible && !hasExistingNotes) {
              return;
            }
            setSelectedSessionForNotes(session);
            if (isTrainer()) {
              const currentUser = getCurrentUser() || {};
              setSelectedTrainerIdForNotes(currentUser.trainerId || currentUser.id || "");
            } else {
              setSelectedTrainerIdForNotes(trainerId || "");
            }
          }}
          onEditMasterItem={async (sessionOrItem, matchingItem) => {
            const isSession =
              sessionOrItem?.sessionDate !== undefined ||
              sessionOrItem?.id?.startsWith?.("SES-");
            const session = isSession ? sessionOrItem : null;
            const item = matchingItem || (!isSession ? sessionOrItem : null);

            let classId = session?.classId || item?.classId || "";
            let name = session?.subject || session?.className || item?.subject || "";
            let beg = session?.beginnerWorkouts || item?.beginnerWorkouts || "";
            let inter = session?.intermediateWorkouts || item?.intermediateWorkouts || "";

            // If workouts or classId aren't yet populated on this session, look up from class library
            if ((!beg || !inter || !classId) && name) {
              try {
                const { getClasses } = await import("@/lib/classProgramService");
                const res = await getClasses({ search: name, limit: 10 });
                const list = Array.isArray(res) ? res : res?.classes || [];
                const found = list.find((c) => c.name.toLowerCase() === name.toLowerCase()) || list[0];
                if (found) {
                  if (!classId) classId = found.id;
                  if (!beg || beg === "Not specified") beg = found.beginnerWorkouts;
                  if (!inter || inter === "Not specified") inter = found.intermediateWorkouts;
                }
              } catch (_) {}
            }

            setEditingMasterItem({
              sessionId: session?.id || "",
              masterClassItemId: item?.id || session?.masterClassItemId || "",
              classId,
              name,
              originalName: name,
              subject: name,
              beginnerWorkouts: beg === "Not specified" ? "" : beg,
              intermediateWorkouts: inter === "Not specified" ? "" : inter,
              classNumber: session?.classNumber || item?.classNumber || 1,
              weekNumber: session?.weekNumber || item?.weekNumber || 1,
              dayOfWeek: session?.dayOfWeek || item?.dayOfWeek || "Monday",
              displayDate: session?.displayDate || item?.displayDate || session?.sessionDate || "",
            });
            setIsEditMasterItemOpen(true);
          }}
          onMarkCompleted={handleMarkCompleted}
          onCancelSession={handleCancelSession}
          onRestoreSession={handleRestoreSession}
          onCreateMasterSchedule={handleCreateMasterScheduleForBatch}
          onOpenAddClasses={() => setIsAssignClassesOpen(true)}
          onOpenSubstituteModal={(sess) => setSubstituteModalSession(sess)}
          onRefresh={loadBatchData}
        />
      )}

      {activeTab === "audit" && !isMember() && (
        <BatchAuditLogsTab batch={batch} />
      )}

      <BatchDetailModals
        batch={batch}
        currentPax={currentPax}
        capacity={capacity}
        remainingSlots={remainingSlots}
        trainers={allTrainers.length > 0 ? allTrainers : trainers}
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
        sessionNotes={sessionNotes}
        onSaveTrainerNote={handleSaveTrainerNote}
        selectedTrainerIdForNotes={selectedTrainerIdForNotes}
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

      {/* Substitute Trainer Assignment & Management Modal */}
      {!isMember() && (
        <SubstituteCoachModal
          isOpen={Boolean(substituteModalSession)}
          onClose={() => setSubstituteModalSession(null)}
          batch={batch}
          session={substituteModalSession}
          onSuccess={async () => {
            const targetId = batch?.id || id || "BATCH-01";
            await Promise.all([
              loadBatchData(),
              loadMonthTracking(targetId, selectedMonth),
            ]);
          }}
        />
      )}

      {/* Multi-Class Reusable Assignment Modal */}
      {!isMember() && (
        <BatchClassAssignmentModal
          isOpen={isAssignClassesOpen}
        onClose={() => setIsAssignClassesOpen(false)}
        batches={allBatches.length > 0 ? allBatches : (batch ? [batch] : [])}
        preselectedBatchId={batch?.id}
        onSuccess={async () => {
          await loadBatchData();
          if (batch?.id) {
            await loadMonthTracking(batch.id, selectedMonth);
          }
        }}
        />
      )}
    </div>
  );
}
