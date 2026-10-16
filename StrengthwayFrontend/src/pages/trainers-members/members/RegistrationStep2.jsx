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

      {/* 1. RESIDENCE INFORMATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Residence Information
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
      </section>      {/* 4. Member Bio */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            4. Member Bio
          </h3>
        </div>

        <TextareaField
          id="admin-member-bio"
          name="bio"
          rows={3}
          label="Athlete Bio &amp; Coaching Notes"
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
