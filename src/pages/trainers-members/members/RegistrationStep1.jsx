import {
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { InputField, SelectField } from "@/components/form";
import { PAYMENT_METHODS, generateTransactionId } from "@/lib/membershipPlans";

export function RegistrationStep1({
  isConfirmingLead,
  activeLead,
  form,
  setForm,
  handleChange,
  handleBlur,
  errors,
  batches,
  selectedBatch,
  availablePlans,
  chosenPlan,
  paymentForm,
  setPaymentForm,
  handleSubmit,
}) {
  return (
    <form
      id="admin-member-registration-form"
      onSubmit={handleSubmit}
      noValidate
      className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 space-y-8"
    >
      {/* Pre-populated Inquiry Banner */}
      {isConfirmingLead && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500 font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-foreground text-sm">
              Inquiry Information Pre-Populated
            </p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Personal and Contact Information have been automatically loaded from this
              athlete&apos;s prospective inquiry submission. Please complete the remaining
              required sections: <strong>Emergency Contact</strong>,{" "}
              <strong>Fitness Information</strong>, and{" "}
              <strong>Medical Fitness Document</strong> below before proceeding to plan
              &amp; payment.
            </p>
          </div>
        </div>
      )}

      {/* 1. PERSONAL INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <User className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Personal Information
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-first-name"
            name="firstName"
            label="First Name"
            required
            placeholder="Enter first name"
            value={form.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.firstName}
          />

          <InputField
            id="admin-member-last-name"
            name="lastName"
            label="Last Name"
            required
            placeholder="Enter last name"
            value={form.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.lastName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-dob"
            name="dob"
            type="date"
            label="Date of Birth"
            required
            max={new Date().toISOString().split("T")[0]}
            value={form.dob}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.dob}
            startIcon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            inputClassName="[color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
          />

          <SelectField
            id="admin-member-gender"
            name="gender"
            label="Gender"
            required
            value={form.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.gender}
            placeholder="Select Gender"
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-mobile"
            name="mobile"
            type="tel"
            label="Mobile Number"
            required
            placeholder="e.g. +91 98765 43210"
            value={form.mobile}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.mobile}
          />

          <InputField
            id="admin-member-email"
            name="email"
            type="email"
            label="Email"
            required
            placeholder="e.g. alex@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
          />
        </div>
      </section>

      {/* 2. BATCH SLOT & MEMBERSHIP PLAN */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Batch Slot &amp; Membership Plan
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="admin-member-batch"
            name="batchId"
            label="Batch Slot"
            hint={selectedBatch?.daysPattern}
            value={form.batchId}
            onChange={(e) => setForm({ ...form, batchId: e.target.value })}
            placeholder="Select Training Batch Slot"
            options={batches.map((b) => ({
              value: b.id,
              label: `${b.name} • ${b.timingLabel || b.startTime} (${b.currentPax || 0}/${b.maxPax || 28} Pax)`,
            }))}
          />

          <SelectField
            id="admin-member-plan"
            name="selectedPlanId"
            label="Membership Plan"
            required
            hint={chosenPlan ? `${chosenPlan.durationMonths} Mo` : undefined}
            value={paymentForm.selectedPlanId}
            onChange={(e) => {
              const planId = e.target.value;
              const found = availablePlans.find((p) => p.id === planId);
              setPaymentForm((prev) => ({
                ...prev,
                selectedPlanId: planId,
                amountPaid: found ? found.price : prev.amountPaid,
              }));
            }}
            error={errors.selectedPlanId}
            placeholder="Select Membership Plan Tier"
            options={availablePlans.map((plan) => ({
              value: plan.id,
              label: `${plan.name} — ${plan.formattedPrice} (${plan.durationMonths} Mo)${plan.badge ? ` • [${plan.badge}]` : ""}`,
            }))}
          />
        </div>
      </section>

      {/* 3. PAYMENT FORM DETAILS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payment Form Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="admin-member-payment-method"
            name="paymentMethod"
            label="Payment Option / Method"
            required
            value={paymentForm.paymentMethod}
            onChange={(e) => {
              const methodId = e.target.value;
              setPaymentForm((prev) => ({
                ...prev,
                paymentMethod: methodId,
                transactionId: generateTransactionId(methodId),
              }));
            }}
            placeholder="Select Payment Option / Method"
            options={PAYMENT_METHODS.map((method) => ({
              value: method.id,
              label: `${method.name} — ${method.id === "Cash" ? "Gym Reception" : "Digital Transaction"}`,
            }))}
          />

          <InputField
            label="Amount Received (₹)"
            required
            type="number"
            value={paymentForm.amountPaid}
            onChange={(e) =>
              setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))
            }
            inputClassName="font-semibold"
            error={errors.amountPaid}
          />
        </div>

        <InputField
          label="Billing Notes / Reference (Optional)"
          type="text"
          value={paymentForm.paymentNotes}
          onChange={(e) =>
            setPaymentForm((prev) => ({ ...prev, paymentNotes: e.target.value }))
          }
          placeholder="e.g. Paid at reception counter / GPay reference"
        />
      </section>
    </form>
  );
}
