import { InputField, TextareaField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export default function EditMasterClassItemModal({
  isOpen,
  onClose,
  editingMasterItem,
  setEditingMasterItem,
  onSave,
}) {
  if (!editingMasterItem) {
    return null;
  }

  const programName =
    editingMasterItem.name !== undefined
      ? editingMasterItem.name
      : editingMasterItem.subject || "";

  const beginnerWorkouts =
    editingMasterItem.beginnerWorkouts !== undefined
      ? editingMasterItem.beginnerWorkouts === "Not specified"
        ? ""
        : editingMasterItem.beginnerWorkouts
      : "";

  const intermediateWorkouts =
    editingMasterItem.intermediateWorkouts !== undefined
      ? editingMasterItem.intermediateWorkouts === "Not specified"
        ? ""
        : editingMasterItem.intermediateWorkouts
      : "";

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        title={
          <div className="flex items-center gap-2">
            <span>Edit Scheduled Class</span>
            {editingMasterItem.classId && (
              <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                {editingMasterItem.classId}
              </span>
            )}
          </div>
        }
        subtitle={`Class #${String(editingMasterItem.classNumber || 1).padStart(2, "0")} ${editingMasterItem.weekNumber ? `• Week ${editingMasterItem.weekNumber}` : ""} ${editingMasterItem.dayOfWeek ? `• ${editingMasterItem.dayOfWeek}` : ""} ${editingMasterItem.displayDate ? `• ${editingMasterItem.displayDate}` : ""}`}
        onClose={onClose}
      />

      <form id="edit-master-class-form" onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          {/* Class Program Name */}
          <InputField
            label="Class Program Name"
            placeholder="e.g. Push, Legs, Pull or Circuit Training"
            value={programName}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                name: e.target.value,
                subject: e.target.value,
              })
            }
            required
          />

          {/* Beginner Workout Content */}
          <TextareaField
            rows={3}
            resize="vertical"
            label="Beginner Workout Content"
            placeholder="e.g. 5 Push ups; 5 GB Squats; 5 Pulls; 5 Deadlift; × 5 sets"
            value={beginnerWorkouts}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                beginnerWorkouts: e.target.value,
              })
            }
          />

          {/* Intermediate Workout Content */}
          <TextareaField
            rows={4}
            resize="vertical"
            label="Intermediate Workout Content"
            placeholder="e.g. Push: Push ups 5–10 × 3; Dips 4–10 × 3; OH Press 6–10 × 3..."
            value={intermediateWorkouts}
            onChange={(e) =>
              setEditingMasterItem({
                ...editingMasterItem,
                intermediateWorkouts: e.target.value,
              })
            }
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Save Changes"
        />
      </form>
    </FormModal>
  );
}
