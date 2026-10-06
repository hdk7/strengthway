import EditMasterClassItemModal from "./EditMasterClassItemModal";
import SessionNotesModal from "./SessionNotesModal";
import AssignProgramModal from "./AssignProgramModal";
import AddTrainerModal from "./AddTrainerModal";
import AddMemberModal from "./AddMemberModal";
import SubstituteCoachModal from "./SubstituteCoachModal";
import BatchTransferModal from "../components/BatchTransferModal";

export default function BatchDetailModals({
  batch,
  currentPax,
  capacity,
  remainingSlots,
  trainers,
  members,
  allTrainers,
  allMembers,
  allMasterSchedules,
  allBatches,
  // Edit Master Item Modal
  isEditMasterItemOpen,
  setIsEditMasterItemOpen,
  editingMasterItem,
  setEditingMasterItem,
  onSaveMasterClassItem,
  // Session Notes Modal
  selectedSessionForNotes,
  setSelectedSessionForNotes,
  sessionNoteText,
  setSessionNoteText,
  onSaveSessionNotes,
  // Assign Program Modal
  isAssignProgramOpen,
  setIsAssignProgramOpen,
  onAssignProgram,
  onUnassignProgram,
  onCreateMasterSchedule,
  // Add Trainer Modal
  isAddTrainerOpen,
  setIsAddTrainerOpen,
  trainerSearchQuery,
  setTrainerSearchQuery,
  onAssignTrainer,
  // Add Member Modal
  isAddMemberOpen,
  setIsAddMemberOpen,
  memberModalSearch,
  setMemberModalSearch,
  onEnrollMember,
  // Substitute Coach Modal
  isSubstituteModalOpen,
  setIsSubstituteModalOpen,
  substituteForm,
  setSubstituteForm,
  onAssignSubstitute,
  // Transfer Modal
  isTransferModalOpen,
  setIsTransferModalOpen,
  transferTargetMember,
  setTransferTargetMember,
  transferModalTab,
  onTransferSuccess,
}) {
  return (
    <>
      <EditMasterClassItemModal
        isOpen={isEditMasterItemOpen}
        onClose={() => setIsEditMasterItemOpen(false)}
        editingMasterItem={editingMasterItem}
        setEditingMasterItem={setEditingMasterItem}
        onSave={onSaveMasterClassItem}
      />

      <SessionNotesModal
        selectedSessionForNotes={selectedSessionForNotes}
        onClose={() => setSelectedSessionForNotes(null)}
        sessionNoteText={sessionNoteText}
        setSessionNoteText={setSessionNoteText}
        onSave={onSaveSessionNotes}
        batch={batch}
      />

      <AssignProgramModal
        isOpen={isAssignProgramOpen}
        onClose={() => setIsAssignProgramOpen(false)}
        batch={batch}
        allMasterSchedules={allMasterSchedules}
        allBatches={allBatches}
        onAssignProgram={onAssignProgram}
        onUnassignProgram={onUnassignProgram}
        onCreateMasterSchedule={onCreateMasterSchedule}
      />

      <AddTrainerModal
        isOpen={isAddTrainerOpen}
        onClose={() => setIsAddTrainerOpen(false)}
        batch={batch}
        allTrainers={allTrainers}
        trainerSearchQuery={trainerSearchQuery}
        setTrainerSearchQuery={setTrainerSearchQuery}
        onAssignTrainer={onAssignTrainer}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        batch={batch}
        currentPax={currentPax}
        capacity={capacity}
        remainingSlots={remainingSlots}
        allMembers={allMembers}
        memberModalSearch={memberModalSearch}
        setMemberModalSearch={setMemberModalSearch}
        onEnrollMember={onEnrollMember}
      />

      <SubstituteCoachModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
        batch={batch}
        trainers={trainers}
        allTrainers={allTrainers}
        substituteForm={substituteForm}
        setSubstituteForm={setSubstituteForm}
        onAssignSubstitute={onAssignSubstitute}
      />

      <BatchTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTargetMember(null);
        }}
        member={transferTargetMember}
        membersList={members}
        currentBatch={batch}
        allBatches={allBatches}
        initialTab={transferModalTab}
        onSuccess={onTransferSuccess}
      />
    </>
  );
}
