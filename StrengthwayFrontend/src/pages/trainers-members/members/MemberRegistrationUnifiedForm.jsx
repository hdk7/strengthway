/* eslint-disable max-lines */
import {
  User,
  Calendar,
  CreditCard,
  MapPin,
  PhoneCall,
  Activity,
  FileCheck,
  FileText,
  Trash2,
  Upload,
  CheckCircle2,
  Instagram,
} from "lucide-react";
import { InputField, SelectField, TextareaField } from "@/components/form";
import { PAYMENT_METHODS, generateTransactionId } from "@/lib/membershipPlans";
import MemberPhotoUpload from "./MemberPhotoUpload";

export function MemberRegistrationUnifiedForm({
  isConfirmingLead,
  isEditingActiveMember,
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
  photoInputRef,
  handlePhotoFileChange,
  handleRemovePhoto,
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
              athlete&apos;s prospective inquiry submission. Please review details, complete address,
              emergency contact, fitness records, then choose a batch &amp; plan and record payment below.
            </p>
          </div>
        </div>
      )}

      {/* 1. PERSONAL DETAILS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <User className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            1. Personal Details
          </h3>
        </div>

        {/* Member Photo Upload Area */}
        <MemberPhotoUpload
          photo={form.photo}
          onPhotoFileChange={handlePhotoFileChange}
          onRemovePhoto={handleRemovePhoto}
          photoInputRef={photoInputRef}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-full-name"
            name="fullName"
            label="Full Name"
            required
            placeholder="e.g. Alex Henderson"
            value={form.fullName !== undefined ? form.fullName : (form.firstName ? `${form.firstName} ${form.lastName || ""}`.trim() : "")}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName || errors.firstName}
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
            restriction="phone"
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

          <InputField
            id="admin-member-instagram"
            name="instagramProfileId"
            label="Instagram Profile ID"
            placeholder="e.g. @alex_strength or alex_strength"
            value={form.instagramProfileId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.instagramProfileId}
            startIcon={<Instagram className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </section>

      {/* 2.RESIDENCE INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            2. Residence Information
          </h3>
        </div>

        <TextareaField
          id="admin-member-address"
          name="address"
          rows={2}
          label="Address"
          required
          placeholder="Street address, building, apartment, or flat number"
          value={form.address}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.address}
          textareaClassName="no-scrollbar resize-none"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-city"
            name="city"
            label="City"
            required
            placeholder="Enter city"
            value={form.city}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.city}
          />

          <InputField
            id="admin-member-state"
            name="state"
            label="State"
            required
            placeholder="Enter state"
            value={form.state}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.state}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-country"
            name="country"
            label="Country"
            required
            placeholder="Enter country"
            value={form.country}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.country}
          />

          <InputField
            id="admin-member-pincode"
            name="pincode"
            label="Pincode"
            required
            placeholder="e.g. 400001"
            value={form.pincode}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.pincode}
            restriction="pincode"
          />
        </div>
      </section>

      {/* 3. EMERGENCY CONTACT */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <PhoneCall className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            3. Emergency Contact
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="admin-member-emergency-name"
            name="emergencyName"
            label="Contact Name"
            required
            placeholder="Emergency contact person"
            value={form.emergencyName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.emergencyName}
          />

          <SelectField
            id="admin-member-emergency-relationship"
            name="emergencyRelationship"
            label="Relationship"
            required
            value={form.emergencyRelationship}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.emergencyRelationship}
            placeholder="Select Relationship"
            options={[
              { value: "Parent", label: "Parent" },
              { value: "Spouse", label: "Spouse" },
              { value: "Sibling", label: "Sibling" },
              { value: "Relative", label: "Relative" },
              { value: "Friend", label: "Friend" },
              { value: "Guardian", label: "Guardian" },
              { value: "Other", label: "Other" },
            ]}
          />
        </div>

        <InputField
          id="admin-member-emergency-number"
          name="emergencyNumber"
          type="tel"
          label="Contact Number"
          required
          placeholder="Emergency contact mobile number"
          value={form.emergencyNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.emergencyNumber}
          restriction="phone"
        />
      </section>

      {/* 4. FITNESS INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            4. Fitness Information
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            id="admin-member-height"
            name="height"
            type="text"
            inputMode="decimal"
            label="Height"
            required
            placeholder="e.g. 175"
            value={form.height}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.height}
            restriction="decimal"
            endAdornment={
              <span className="text-xs font-semibold text-muted-foreground pr-3.5">cm</span>
            }
          />

          <InputField
            id="admin-member-weight"
            name="weight"
            type="text"
            inputMode="decimal"
            label="Weight"
            required
            placeholder="e.g. 72"
            value={form.weight}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.weight}
            restriction="decimal"
            endAdornment={
              <span className="text-xs font-semibold text-muted-foreground pr-3.5">kg</span>
            }
          />

          <SelectField
            id="admin-member-blood-group"
            name="bloodGroup"
            label="Blood Group"
            required
            value={form.bloodGroup}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.bloodGroup}
            placeholder="Select Blood Group"
            options={[
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
            ]}
          />
        </div>
      </section>

      {/* 5. Member Bio */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            5. Member Bio
          </h3>
        </div>

        <TextareaField
          id="admin-member-bio"
          name="bio"
          rows={3}
          label="Member Bio"
          placeholder="Tell us about the athlete's background, training history or fitness goals..."
          value={form.bio}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.bio}
          textareaClassName="no-scrollbar resize-none"
        />
      </section>

      {/* 6. BATCH SLOT & MEMBERSHIP PLAN */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            6. Batch Slot &amp; Membership Plan
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
              label: `${b.name} • ${b.daysLabel || b.daysPattern || "Daily"} • ${b.timingLabel || b.startTime} (${b.currentPax || 0}/${b.maxPax || 28} Pax)`,
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

      {/* 7. PAYMENT DETAILS */}
      {!isEditingActiveMember && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              7. Payment Details
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
                  transactionId: methodId ? generateTransactionId(methodId) : "",
                }));
              }}
              error={errors.paymentMethod}
              placeholder="Select Payment Option / Method"
              options={PAYMENT_METHODS.map((method) => ({
                value: method.id,
                label: `${method.name} — ${method.id === "Cash" ? "Gym Reception" : "Digital Transaction"}`,
              }))}
            />

            <InputField
              label="Amount Received (₹)"
              required
              type="text"
              inputMode="decimal"
              value={paymentForm.amountPaid}
              onChange={(e) =>
                setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))
              }
              restriction="decimal"
              inputClassName="font-semibold"
              error={errors.amountPaid}
            />
          </div>
        </section>
      )}
    </form>
  );
}
