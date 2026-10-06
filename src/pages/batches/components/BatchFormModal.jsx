import { X, Loader2 } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            {editingBatch ? `Edit ${editingBatch.name}` : "Create New Batch"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveBatch} className="space-y-4 text-sm">
          <InputField
            label="Batch Name"
            placeholder="e.g. BATCH 7"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            size="sm"
            labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TimePickerField
              label="Start Time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              size="sm"
              labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
              required
            />
            <TimePickerField
              label="End Time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              size="sm"
              labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
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
              labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
              options={[
                { value: "MWF", label: "MWF (Mon • Wed • Fri)" },
                { value: "TTS", label: "TTS (Tue • Thu • Sat)" },
                { value: "CUSTOM", label: "Custom Days" },
              ]}
            />

            <InputField
              type="number"
              min="1"
              max="100"
              label="Max Pax"
              value={form.maxPax}
              onChange={(e) => setForm({ ...form, maxPax: e.target.value })}
              size="sm"
              labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
              required
            />
          </div>

          {form.daysPattern === "CUSTOM" && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Training Days
                </span>
                <span className="text-xs font-medium text-foreground">
                  {(form.customDays || []).length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {ALL_DAYS.map((day) => {
                  const active = (form.customDays || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const cur = form.customDays || [];
                        const next = cur.includes(day)
                          ? cur.filter((d) => d !== day)
                          : [...cur, day];
                        const ordered = ALL_DAYS.filter((d) => next.includes(d));
                        const fullList = ordered.map((d) => FULL_DAYS_MAP[d]);
                        setForm({
                          ...form,
                          customDays: ordered,
                          daysList: fullList,
                          daysLabel: fullList.join(" • "),
                        });
                      }}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                        active
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            size="sm"
            labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />

          <TextareaField
            rows={2}
            label="Description"
            placeholder="Workout style or target group..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            size="sm"
            labelClassName="uppercase tracking-wider text-muted-foreground font-semibold"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting
                ? "Saving..."
                : editingBatch
                  ? "Save Changes"
                  : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
