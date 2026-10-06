import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { InputField, TextareaField } from "@/components/form";

export function HolidayModal({
  isOpen,
  onClose,
  editingHolidayId,
  form,
  setForm,
  handleSave,
  isSubmitting,
  batches,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-bold text-foreground text-base">
            {editingHolidayId ? "Edit Holiday" : "Add New Holiday"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <InputField
            label="Holiday Name / Occasion"
            required
            placeholder="e.g. Diwali Festivities"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <InputField
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <div className="flex flex-col text-left">
            <label className="mb-1 text-xs font-medium text-foreground">Holiday Category</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
            >
              <option value="National Holiday">National Holiday</option>
              <option value="Festival Holiday">Festival Holiday</option>
              <option value="Public Holiday">Public Holiday</option>
              <option value="Facility Maintenance">Facility Maintenance</option>
              <option value="Special Event">Special Event</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {form.type === "Others" && (
            <InputField
              label="Specify Category (Optional)"
              placeholder="e.g. State Holiday, Observance, etc."
              value={form.customType}
              onChange={(e) => setForm({ ...form, customType: e.target.value })}
            />
          )}

          <div className="flex flex-col text-left">
            <label className="mb-1 text-xs font-medium text-foreground">Affected Batches</label>
            <select
              value={form.affectedBatches}
              onChange={(e) => setForm({ ...form, affectedBatches: e.target.value })}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Batches & Shifts</option>
              {batches.map((b) => (
                <option key={b.id} value={b.name || b.shortName}>
                  {b.name || b.shortName}
                </option>
              ))}
            </select>
          </div>

          <TextareaField
            label="Closure Details / Description"
            rows={2}
            placeholder="e.g. Morning open gym only; regular class batches suspended."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4.5 py-2 text-xs font-bold text-background hover:bg-primary/90 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingHolidayId
                  ? "Update Holiday"
                  : "Save Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
