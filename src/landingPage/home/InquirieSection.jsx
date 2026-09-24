import { useState } from "react";
import { Mail, MapPin, Phone, User, ShieldCheck, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/landingPage/Reveal";
import { contactFormSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { InputField, SelectField, TextareaField } from "@/components/form";
import { createInquiry } from "@/lib/inquiriesService";

export function ContactSection() {
  return (
    <section
      id="inquiries"
      className="border-t border-border/60 bg-surface/30 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14 relative"
    >
      <span id="contact" className="sr-only" />
      <div className="mx-auto grid max-w-[100rem] gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8 md:grid-cols-2 items-start">
        <Reveal className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Inquiries
          </div>
          <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Send us an <span className="text-gradient">inquiry</span>.
          </h2>
          <p className="mt-3 sm:mt-4 max-w-md text-sm sm:text-base text-muted-foreground">
            Drop by for a tour or send us an inquiry — we're happy to help you find the right plan.
          </p>
          <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
            {[
              { i: MapPin, t: "221 Iron Ave, Brooklyn NY" },
              { i: Phone, t: "+1 (555) 010-4423" },
              { i: Mail, t: "hello@strengthway.fit" },
            ].map((c) => (
              <div key={c.t} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
                  <c.i className="h-4 w-4" />
                </span>
                <span className="text-sm break-all sm:break-normal">{c.t}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100} className="min-w-0">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    gender: "",
    mobile: "",
    email: "",
    address: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    const fieldError = validateFieldWithYup(contactFormSchema, name, nextForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    if (!name) return;
    const currentForm = { ...form, [name]: value !== undefined ? value : form[name] };
    const fieldError = validateFieldWithYup(contactFormSchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }

  function validate() {
    const errs = validateWithYup(contactFormSchema, form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setSubmitting(true);
    try {
      createInquiry(form);
      toast.success("Inquiry sent — we'll get back to you shortly.");
      setForm({
        name: "",
        gender: "",
        mobile: "",
        email: "",
        address: "",
        subject: "",
        message: "",
      });
      setErrors({});
    } catch {
      toast.error("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-gradient-to-b from-card via-card/95 to-background p-6 sm:p-8 md:p-10 shadow-xl backdrop-blur-xl min-w-0"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Background ambient orbs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 -bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      {/* Profile Header Dossier Top */}
      <div className="relative mb-6 sm:mb-8 pb-5 border-b border-border/80 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card via-background to-muted p-1 shadow-md">
            <div className="grid h-full w-full place-items-center rounded-xl bg-primary/10 text-primary font-display text-2xl font-black uppercase">
              {form.name && form.name.trim() ? (
                form.name.trim().charAt(0).toUpperCase()
              ) : (
                <User size={26} className="text-primary/70" />
              )}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Athlete Inquiry Dossier</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-display text-foreground truncate">
            {form.name.trim() || "Prospective Athlete"}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {form.subject.trim() || "Register interest or request facility walkthrough"}
          </p>
        </div>
      </div>

      <div className="relative space-y-6">
        {/* Section 1: Personal Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <User size={15} className="text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Personal Information
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              id="contact-name"
              name="name"
              label="Name"
              placeholder="UserName"
              required
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              labelClassName="uppercase tracking-widest text-muted-foreground"
              inputClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
            />
            <SelectField
              id="contact-gender"
              name="gender"
              label="Gender"
              required
              value={form.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.gender}
              placeholder="Select Gender"
              options={GENDER_OPTIONS}
              labelClassName="uppercase tracking-widest text-muted-foreground"
              selectClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
            />
            <InputField
              id="contact-mobile"
              name="mobile"
              label="Mobile Number"
              type="tel"
              placeholder="+91 98765 43210"
              required
              value={form.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.mobile}
              labelClassName="uppercase tracking-widest text-muted-foreground"
              inputClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
            />
            <InputField
              id="contact-email"
              name="email"
              label="Email"
              type="email"
              placeholder="username@gmail.com"
              required
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              labelClassName="uppercase tracking-widest text-muted-foreground"
              inputClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
            />
          </div>

          <InputField
            id="contact-address"
            name="address"
            label="Address"
            placeholder="Street address, city, state"
            required
            value={form.address}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.address}
            labelClassName="uppercase tracking-widest text-muted-foreground"
            inputClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
          />
        </div>

        {/* Section 2: Inquiry Request Details */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <MessageSquare size={15} className="text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Inquiry Details
            </h4>
          </div>

          <InputField
            id="contact-subject"
            name="subject"
            label="Subject"
            placeholder="I'd like a tour"
            required
            value={form.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.subject}
            labelClassName="uppercase tracking-widest text-muted-foreground"
            inputClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
          />
          <TextareaField
            id="contact-message"
            name="message"
            label="Message"
            rows={3}
            placeholder="Tell us how we can help…"
            required
            value={form.message}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.message}
            labelClassName="uppercase tracking-widest text-muted-foreground"
            textareaClassName="bg-muted/40 hover:bg-muted/60 focus:bg-background p-3 transition-colors"
          />
        </div>

        {/* Submit Action Button with Profile Aesthetic */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full overflow-hidden rounded-2xl bg-primary py-3.5 px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{submitting ? "Submitting Inquiry…" : "Submit Official Inquiry"}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </form>
  );
}

export { ContactSection as InquiriesSection };
export default ContactSection;
