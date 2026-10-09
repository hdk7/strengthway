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
  handleRemoveDoc,
  handleDocUpload,
  docInputRef,
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

      {/* 1. PERSONAL DETAILS & PORTRAIT */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <User className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            1. Personal Details &amp; Portrait
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

      {/* 2. CONTACT & RESIDENCE INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            2. Contact &amp; Residence Information
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
            type="number"
            step="0.1"
            label="Height"
            required
            placeholder="e.g. 175"
            value={form.height}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.height}
            endAdornment={
              <span className="text-xs font-semibold text-muted-foreground pr-3.5">cm</span>
            }
          />

          <InputField
            id="admin-member-weight"
            name="weight"
            type="number"
            step="0.1"
            label="Weight"
            required
            placeholder="e.g. 72"
            value={form.weight}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.weight}
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

      {/* 5. MEDICAL FITNESS DOCUMENT & BIO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <FileCheck className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            5. Medical Fitness Document &amp; Bio
          </h3>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Medical Fitness Document{" "}
            {isConfirmingLead && <span className="text-destructive">*</span>}
          </label>
          <div
            className={`rounded-xl border border-dashed p-4 bg-background/50 ${
              errors.medicalDoc
                ? "border-destructive ring-1 ring-destructive/30"
                : "border-border"
            }`}
          >
            {form.medicalDocName ? (
              <div className="flex items-center justify-between gap-3 p-2 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {form.medicalDocName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {form.medicalDocSize}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDoc}
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent mb-2">
                  <FileCheck className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-border transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Medical Clearance Document</span>
                </button>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
            )}

            <input
              ref={docInputRef}
              id="admin-member-doc-upload"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/jpg"
              onChange={handleDocUpload}
              className="hidden"
            />
          </div>
          {errors.medicalDoc && (
            <p className="mt-1.5 text-xs text-destructive font-medium">
              {errors.medicalDoc}
            </p>
          )}
        </div>

        {/* Bio */}
        <TextareaField
          id="admin-member-bio"
          name="bio"
          rows={3}
          label="Athlete Bio &amp; Coaching Notes"
          required
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
              type="number"
              value={paymentForm.amountPaid}
              onChange={(e) =>
                setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))
              }
              inputClassName="font-semibold"
              error={errors.amountPaid}
            />
          </div>
        </section>
      )}
    </form>
  );
}
