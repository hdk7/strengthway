import { Layers } from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, SelectField, TextareaField, TimePickerField } from "@/components/form";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS_MAP = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function BatchFormModal({
  isOpen,
  onClose,
  editingBatch,
  form,
  setForm,
  handleSaveBatch,
  isSubmitting,
}) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        title={editingBatch ? `Edit ${editingBatch.name}` : "Create New Batch"}
        description="Configure training session timings, schedule patterns, and capacity limits"
        icon={Layers}
        onClose={onClose}
      />

      <form
        onSubmit={handleSaveBatch}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="flex-1 min-h-0 overflow-y-auto space-y-4 text-xs p-6 sm:p-7">
          <FormSectionHeader
            title="Batch Schedule & Identity"
            subtitle="Define session name and daily workout timings"
          />

          <InputField
            label="Batch Name"
            placeholder="e.g. BATCH 7"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            size="sm"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TimePickerField
              label="Start Time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              size="sm"
              required
            />
            <TimePickerField
              label="End Time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              size="sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Days Pattern"
              value={form.daysPattern}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "CUSTOM") {
                  setForm({
                    ...form,
                    daysPattern: "CUSTOM",
                    customDays: [],
                    daysList: [],
                    daysLabel: "",
                  });
                } else if (val === "TTS") {
                  setForm({
                    ...form,
                    daysPattern: "TTS",
                    daysLabel: "Tuesday • Thursday • Saturday",
                    daysList: ["Tuesday", "Thursday", "Saturday"],
                    customDays: [],
                  });
                } else {
                  setForm({
                    ...form,
                    daysPattern: "MWF",
                    daysLabel: "Monday • Wednesday • Friday",
                    daysList: ["Monday", "Wednesday", "Friday"],
                    customDays: [],
                  });
                }
              }}
              size="sm"
              options={[
                { value: "MWF", label: "MWF (Mon, Wed, Fri)" },
                { value: "TTS", label: "TTS (Tue, Thu, Sat)" },
                { value: "CUSTOM", label: "Custom Days..." },
              ]}
            />

            <InputField
              type="number"
              label="Capacity Limit (Pax)"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              size="sm"
              min={1}
              required
            />
          </div>

          {form.daysPattern === "CUSTOM" && (
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/20">
              <label className="text-xs font-semibold text-slate-800 dark:text-foreground block">
                Select Active Training Days <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ALL_DAYS.map((d) => {
                  const isChecked = form.customDays?.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const cur = form.customDays || [];
                        const next = cur.includes(d)
                          ? cur.filter((x) => x !== d)
                          : [...cur, d];
                        const fullNames = next.map((dayKey) => FULL_DAYS_MAP[dayKey]);
                        setForm({
                          ...form,
                          customDays: next,
                          daysList: fullNames,
                          daysLabel: next.join(" • "),
                        });
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <SelectField
            label="Floor Operational Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            size="sm"
            options={[
              { value: "Active", label: "Active" },
              { value: "Full", label: "Full" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />

          <TextareaField
            rows={2}
            label="Description & Notes"
            placeholder="Workout style, target fitness level, or coach instructions..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            size="sm"
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSaveBatch}
          submitText={
            isSubmitting
              ? "Saving..."
              : editingBatch
                ? "Save Changes"
                : "Create Batch"
          }
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default BatchFormModal;
