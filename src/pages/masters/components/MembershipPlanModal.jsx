/* eslint-disable max-lines */
import {
  CreditCard,
  Plus,
  Check,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, SelectField, TextareaField } from "@/components/form";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export function MembershipPlanModal({
  isOpen,
  onClose,
  editingPlan,
  form,
  setForm,
  featureInput,
  setFeatureInput,
  handleAddFeature,
  handleRemoveFeature,
  handleSave,
  isSubmitting,
}) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="xl">
      <FormModalHeader
        title={editingPlan ? `Edit ${editingPlan.name || "Plan"}` : "Create Membership Plan"}
        description="Configure tier pricing, privileges, and enrollment terms across the gym."
        icon={form.popular ? Sparkles : CreditCard}
        onClose={onClose}
      />

      <form
        id="plan-form"
        onSubmit={handleSave}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="space-y-6 text-xs p-6 sm:p-7 flex-1 min-h-0 overflow-y-auto">
          {/* SECTION 1: Plan Identity & Status */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Plan Identity & Status"
              subtitle="Define plan tier name, promotional badge, and visibility state"
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <InputField
                id="plan-name"
                name="name"
                label="Plan Name"
                required
                placeholder="e.g. Quarterly Pro, Annual Athlete"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                size="sm"
                className="sm:col-span-2"
              />

              <SelectField
                id="plan-status"
                name="status"
                label="Plan Status"
                required
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                size="sm"
                options={STATUS_OPTIONS}
              />

              <InputField
                id="plan-badge"
                name="badge"
                label="Promo Badge (Optional)"
                placeholder="e.g. BEST VALUE"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                size="sm"
              />
            </div>
          </div>

          {/* SECTION 2: Pricing & Validity Duration */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Pricing & Validity Duration"
              subtitle="Specify tier cost in INR, duration months, and billing terms"
              hasDivider
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <InputField
                id="plan-price"
                name="price"
                type="number"
                min="0"
                label="Price (₹ INR)"
                required
                placeholder="e.g. 7000"
                value={form.price}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    price: val === "" ? "" : Number(val),
                  });
                }}
                size="sm"
              />

              <InputField
                id="plan-duration"
                name="durationMonths"
                type="number"
                min="1"
                label="Duration (Months)"
                required
                placeholder="e.g. 1, 3, 6, 12"
                value={form.durationMonths}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    durationMonths: val === "" ? "" : Number(val),
                  });
                }}
                size="sm"
              />

              <InputField
                id="plan-period"
                name="period"
                label="Period Label"
                placeholder="e.g. /mo, /3mo, /yr"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                size="sm"
              />

              <InputField
                id="plan-billing"
                name="billing"
                label="Billing Note"
                placeholder="e.g. Billed every 3 months"
                value={form.billing}
                onChange={(e) => setForm({ ...form, billing: e.target.value })}
                size="sm"
              />
            </div>
          </div>

          {/* SECTION 3: Featured / Most Popular Highlight */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Showcase & Visibility"
              subtitle="Highlight this plan with featured visibility during member onboarding"
              hasDivider
            />

            <div
              className={`rounded-xl border p-4 transition-all ${
                form.popular
                  ? "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/20"
                  : "border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                      form.popular
                        ? "bg-amber-500 text-black shadow-xs"
                        : "bg-slate-200 dark:bg-muted text-slate-500 dark:text-muted-foreground"
                    }`}
                  >
                    <Sparkles size={18} className={form.popular ? "fill-black" : ""} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        Featured / Most Popular Tier
                      </span>
                      {form.popular && (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Active Showcase
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Prominently showcases this plan with a highlight border and prime placement
                      in member registration and public inquiry pages.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, popular: !form.popular })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.popular ? "bg-amber-500" : "bg-slate-300 dark:bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      form.popular ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: Plan Benefits & Features */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Included Privileges & Benefits"
              subtitle="Gym floor access, training privileges, and facility perks"
              hasDivider
            />

            {/* Add Feature Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom benefit (e.g. Dedicated floor coach session)..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200/90 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 focus:border-[#1e40af] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.99] cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Add Benefit</span>
              </button>
            </div>

            {/* Features List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Configured Plan Benefits:
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {form.features.length} {form.features.length === 1 ? "benefit" : "benefits"}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {form.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 dark:border-border/60 bg-white dark:bg-card px-3 py-2 text-xs text-foreground group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove benefit"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {form.features.length === 0 && (
                  <div className="flex items-center justify-center p-4 border border-dashed border-slate-200 dark:border-border rounded-lg text-slate-400 dark:text-muted-foreground text-center">
                    <p className="text-xs">
                      No privileges added yet. Enter a benefit above and click &quot;Add Benefit&quot;.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: Additional Notes / Description */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Description & Guidelines"
              subtitle="Optional notes on targeted member segment or enrollment prerequisites"
              hasDivider
            />

            <TextareaField
              id="plan-description"
              name="description"
              label="Plan Description"
              rows={2}
              placeholder="e.g. Recommended for members looking for consistent strength conditioning and coach guidance..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSave}
          submitText={
            isSubmitting
              ? "Saving..."
              : editingPlan
                ? "Update Plan"
                : "Create Plan"
          }
          submitIcon={Check}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default MembershipPlanModal;
