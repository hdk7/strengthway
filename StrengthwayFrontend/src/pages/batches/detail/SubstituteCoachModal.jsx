import { UserCheck } from "lucide-react";
import { SelectField, InputField, TextareaField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export default function SubstituteCoachModal({
  isOpen,
  onClose,
  batch,
  batches = [],
  trainers = [],
  allTrainers = [],
  substituteForm,
  setSubstituteForm,
  onAssignSubstitute,
  isSubmitting = false,
}) {
  const selectedBatchObj = batch || batches?.find((b) => b.id === substituteForm?.batchId);
  const currentBatchName = selectedBatchObj?.name;

  const primaryCoachesList = trainers && trainers.length > 0 ? trainers : allTrainers;
  const availableSubstitutes = allTrainers.filter(
    (t) => t.id !== substituteForm.primaryTrainerId
  );

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        icon={UserCheck}
        title="Designate Substitute Coach"
        subtitle={
          currentBatchName
            ? `Assign a substitute trainer for ${currentBatchName}`
            : "Assign a substitute faculty trainer for the scheduled batch session"
        }
        onClose={onClose}
      />

      <form id="substitute-coach-form" onSubmit={onAssignSubstitute} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          {/* Batch Container Selector (when batches list provided) */}
          {batches && batches.length > 0 ? (
            <SelectField
              label="Batch Container"
              required
              value={substituteForm.batchId || batch?.id || ""}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, batchId: e.target.value })
              }
              options={[
                { value: "", label: "-- Select Batch Container --" },
                ...batches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.timingLabel || b.timing || b.startTime || "Scheduled"})`,
                })),
              ]}
            />
          ) : batch ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
                Batch Container
              </label>
              <div className="w-full rounded-lg border border-slate-200 dark:border-border/80 bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-foreground flex items-center justify-between">
                <span>{batch.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {batch.timingLabel || batch.timing || batch.id}
                </span>
              </div>
            </div>
          ) : null}

          {/* Primary Coach Being Substituted */}
          <SelectField
            label="Primary Coach Being Substituted"
            value={substituteForm.primaryTrainerId || ""}
            onChange={(e) =>
              setSubstituteForm({ ...substituteForm, primaryTrainerId: e.target.value })
            }
            options={[
              { value: "", label: "-- General Batch Substitution --" },
              ...primaryCoachesList.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.role || t.shift || "Faculty"})`,
              })),
            ]}
          />

          {/* Substitute Coach */}
          <SelectField
            label="Substitute Coach"
            required
            value={substituteForm.substituteTrainerId || ""}
            onChange={(e) =>
              setSubstituteForm({ ...substituteForm, substituteTrainerId: e.target.value })
            }
            options={[
              { value: "", label: "-- Select Substitute Coach --" },
              ...availableSubstitutes.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.specialization || t.experience || t.shift || "Trainer"})`,
              })),
            ]}
          />

          {/* Date */}
          <InputField
            label="Substitution Date"
            type="date"
            required
            value={substituteForm.date || ""}
            onChange={(e) =>
              setSubstituteForm({ ...substituteForm, date: e.target.value })
            }
          />

          {/* Reason / Notes */}
          <TextareaField
            label="Reason & Handover Notes"
            rows={2}
            value={substituteForm.reason || ""}
            onChange={(e) =>
              setSubstituteForm({ ...substituteForm, reason: e.target.value })
            }
            placeholder="e.g., Coach on scheduled leave; taking over strength circuit..."
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Assign Substitute"
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}
