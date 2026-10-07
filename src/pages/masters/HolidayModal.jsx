import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, TextareaField, SelectField } from "@/components/form";
import { Calendar, Check } from "lucide-react";

const HOLIDAY_CATEGORIES = [
  { value: "National Holiday", label: "National Holiday" },
  { value: "Festival Holiday", label: "Festival Holiday" },
  { value: "Public Holiday", label: "Public Holiday" },
  { value: "Facility Maintenance", label: "Facility Maintenance" },
  { value: "Special Event", label: "Special Event" },
  { value: "Others", label: "Others" },
];

export function HolidayModal({
  isOpen,
  onClose,
  editingHolidayId,
  form,
  setForm,
  handleSave,
  isSubmitting,
  batches = [],
}) {
  const batchOptions = [
    { value: "ALL", label: "All Batches & Shifts" },
    ...batches.map((b) => ({
      value: b.name || b.shortName,
      label: b.name || b.shortName,
    })),
  ];

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        title={editingHolidayId ? "Edit Holiday" : "Add New Holiday"}
        description="Schedule facility holiday or maintenance shutdown for training batches"
        icon={Calendar}
        onClose={onClose}
      />

      <form
        onSubmit={handleSave}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="flex-1 min-h-0 overflow-y-auto space-y-4 p-6 sm:p-7">
          <FormSectionHeader
            title="Holiday Schedule & Scope"
            subtitle="Specify date, affected batches, and closure notes"
          />

          <InputField
            label="Holiday Name / Occasion"
            required
            placeholder="e.g. Diwali Festivities"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <InputField
            label="Holiday Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <SelectField
            label="Holiday Category"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={HOLIDAY_CATEGORIES}
          />

          {form.type === "Others" && (
            <InputField
              label="Specify Category (Optional)"
              placeholder="e.g. State Holiday, Observance, etc."
              value={form.customType}
              onChange={(e) => setForm({ ...form, customType: e.target.value })}
            />
          )}

          <SelectField
            label="Affected Batches"
            value={form.affectedBatches}
            onChange={(e) => setForm({ ...form, affectedBatches: e.target.value })}
            options={batchOptions}
          />

          <TextareaField
            label="Closure Details / Description"
            rows={2}
            placeholder="e.g. Morning open gym only; regular class batches suspended."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSave}
          submitText={
            isSubmitting
              ? "Saving..."
              : editingHolidayId
                ? "Update Holiday"
                : "Save Holiday"
          }
          submitIcon={Check}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default HolidayModal;
