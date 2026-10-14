import { CalendarCheck } from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, SelectField, TextareaField } from "@/components/form";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "PRESENT (Checked in)" },
  { value: "CONDUCTED", label: "CONDUCTED (Conducted normally)" },
  { value: "ABSENT", label: "ABSENT (Missed class)" },
  { value: "LEAVE", label: "LEAVE (Approved faculty leave)" },
];

export function TrainerAttendanceModal({
  isOpen,
  onClose,
  modalFormData,
  setModalFormData,
  handleSaveModal,
  isSubmitting,
  trainers = [],
  batches = [],
}) {
  const trainerOptions = [
    { value: "", label: "Select Trainer" },
    ...trainers.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.shift || "General Shift"})`,
    })),
  ];

  const batchOptions = [
    { value: "", label: "Select Batch" },
    ...batches.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.timingLabel || b.timing || b.id})`,
    })),
  ];

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        title="Log Class Conduction"
        description="Record session execution and floor hours for the scheduled batch session."
        icon={CalendarCheck}
        onClose={onClose}
      />

      <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          <FormSectionHeader
            title="Session Details"
            subtitle="Configure session date, coach, and batch container"
          />

          <InputField
            type="date"
            label="Session Date"
            required
            value={modalFormData.date}
            onChange={(e) =>
              setModalFormData((prev) => ({ ...prev, date: e.target.value }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <SelectField
              label="Scheduled Primary Coach"
              required
              value={modalFormData.trainerId}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, trainerId: e.target.value }))
              }
              options={trainerOptions}
            />

            <SelectField
              label="Batch Container"
              required
              value={modalFormData.batchId}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, batchId: e.target.value }))
              }
              options={batchOptions}
            />
          </div>

          <FormSectionHeader
            title="Execution Status & Floor Hours"
            subtitle="Record conduction status and attendance timestamps"
            hasDivider
          />

          <SelectField
            label="Conduction Status"
            value={modalFormData.status}
            onChange={(e) =>
              setModalFormData((prev) => ({ ...prev, status: e.target.value }))
            }
            options={STATUS_OPTIONS}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <InputField
              label="Check-in Time"
              placeholder="e.g. 06:05 AM"
              value={modalFormData.checkInTime}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, checkInTime: e.target.value }))
              }
            />

            <InputField
              label="Check-out Time"
              placeholder="e.g. 02:00 PM"
              value={modalFormData.checkOutTime || ""}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, checkOutTime: e.target.value }))
              }
            />
          </div>

          <TextareaField
            label="Session Notes / Reason"
            rows={2}
            value={modalFormData.notes}
            onChange={(e) =>
              setModalFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="e.g. High intensity conditioning split, Coach stepped in due to illness..."
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Save Conduction Record"
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default TrainerAttendanceModal;
