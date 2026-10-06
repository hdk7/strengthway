/* eslint-disable max-lines */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CreditCard,
  Plus,
  Check,
  X,
  Sparkles,
  Tag,
  Layers,
  IndianRupee,
  Loader2,
} from "lucide-react";

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
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby="plan-modal-description"
          className="fixed left-[50%] top-[50%] z-100 w-[95vw] max-w-2xl max-h-[88vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-3xl border border-border/80 bg-card text-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
        >
          {/* Fixed Modal Header */}
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-6 py-4 sm:px-7 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  form.popular
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-foreground/10 text-foreground border border-border"
                }`}
              >
                {form.popular ? <Sparkles size={20} /> : <CreditCard size={20} />}
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-bold text-foreground font-display">
                  {editingPlan ? `Edit ${editingPlan.name}` : "Create Membership Plan"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description id="plan-modal-description" className="text-xs text-muted-foreground">
                  Configure tier pricing, privileges, and status dynamically mapped across the gym.
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Form Body */}
          <form
            id="plan-form"
            onSubmit={handleSave}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-7 space-y-5 text-xs"
          >
            {/* SECTION 1: Plan Identity & Status */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Tag size={15} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Plan Identity & Status
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quarterly Pro, Annual Champion"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Promotional Tag / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BEST VALUE, VIP ACCESS"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Pricing & Billing Structure */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <IndianRupee size={15} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Pricing & Billing Structure
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Price (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="18000"
                      value={form.price}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setForm({
                          ...form,
                          price: p,
                          billing: `Billed ₹${p.toLocaleString("en-IN")}`,
                        });
                      }}
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-8 pr-3.5 text-sm font-bold text-foreground focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Period Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /mo, /3mo, /yr"
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold uppercase tracking-wider text-muted-foreground">
                    Billing Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Billed every 3 months"
                    value={form.billing}
                    onChange={(e) => setForm({ ...form, billing: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Featured / Most Popular Tier Showcase */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                form.popular
                  ? "border-amber-500/80 bg-linear-to-r from-amber-500/12 via-amber-500/5 to-transparent ring-2 ring-amber-500/30 shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]"
                  : "border-border/80 bg-muted/20 hover:border-amber-500/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                      form.popular
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Sparkles size={20} className={form.popular ? "fill-black" : ""} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        Highlight as Featured / Most Popular Tier
                      </span>
                      {form.popular && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Prominently highlights this plan with a glowing border and prime visibility
                      in the member registration form and landing page.
                    </p>
                  </div>
                </div>

                {/* iOS Style Glowing Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, popular: !form.popular })}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.popular
                      ? "bg-amber-500 shadow-md shadow-amber-500/40"
                      : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      form.popular ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 4: Plan Benefits & Features */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Included Privileges & Benefits
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {form.features.length} Features
                </span>
              </div>

              {/* Add Feature Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type custom benefit (e.g. Dedicated coach session)..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 font-bold text-background hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Configured Plan Features:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {form.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 text-xs text-foreground group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Check size={14} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Remove benefit"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {form.features.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic py-3 text-center border border-dashed border-border rounded-xl">
                      No benefits added yet. Type a benefit above and click Add.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Fixed Sticky Footer */}
          <div className="flex items-center justify-end border-t border-border/80 bg-muted/20 px-6 py-4 sm:px-7 shrink-0">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="rounded-xl border border-border bg-card px-4 py-2.5 font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                form="plan-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{editingPlan ? "Save Changes" : "Create Plan"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
