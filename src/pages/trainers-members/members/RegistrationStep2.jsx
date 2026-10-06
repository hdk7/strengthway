/* eslint-disable max-lines */
import {
  MapPin,
  PhoneCall,
  Activity,
  FileCheck,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { InputField, SelectField, TextareaField } from "@/components/form";

export function RegistrationStep2({
  form,
  handleChange,
  handleBlur,
  errors,
  selectedBatch,
  chosenPlan,
  paymentForm,
  isConfirmingLead,
  handleRemoveDoc,
  handleDocUpload,
  docInputRef,
}) {
  return (
    <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
      {/* Member & Plan Summary Header */}
      <div className="rounded-2xl border border-border bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm uppercase border border-border shrink-0">
            {form.firstName?.[0]}
            {form.lastName?.[0]}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground font-display">
              {form.firstName} {form.lastName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {form.email} • {form.mobile}
            </p>
            {selectedBatch && (
              <p className="text-[11px] text-accent mt-0.5">
                Batch: {selectedBatch.name} (
                {selectedBatch.timingLabel || selectedBatch.startTime})
              </p>
            )}
          </div>
        </div>
        <div className="sm:text-right">
          <span className="text-xs font-semibold text-muted-foreground block">
            Plan &amp; Paid
          </span>
          <div className="flex items-center sm:justify-end gap-2 mt-0.5">
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
              {chosenPlan?.name || "Quarterly Pro"}
            </span>
            <span className="text-lg font-black text-emerald-400 font-display">
              ₹{Number(paymentForm.amountPaid).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 1. CONTACT & RESIDENCE INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contact &amp; Residence Information
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

      {/* 2. EMERGENCY CONTACT */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <PhoneCall className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Emergency Contact
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

      {/* 3. FITNESS INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Fitness Information
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      {/* 4. MEDICAL FITNESS DOCUMENT & BIO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <FileCheck className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Medical Fitness Document &amp; Bio
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
    </div>
  );
}
