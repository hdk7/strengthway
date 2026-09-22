import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/site/Reveal";
import { contactFormSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { createInquiry } from "@/lib/inquiriesService";

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-border/60 bg-surface/30 py-24">
      <div className="mx-auto grid max-w-[100rem] gap-12 px-6 md:grid-cols-2">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Contact
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Come <span className="text-gradient">visit us</span>.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Drop by for a tour or ask us anything — we're happy to help you find the right plan.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { i: MapPin, t: "221 Iron Ave, Brooklyn NY" },
              { i: Phone, t: "+1 (555) 010-4423" },
              { i: Mail, t: "hello@strengthway.fit" },
            ].map((c) => (
              <div key={c.t} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <c.i className="h-4 w-4" />
                </span>
                <span className="text-sm">{c.t}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
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
      createInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success("Message sent — we'll get back to you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setErrors({});
    } catch {
      toast.error("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-3xl border border-border bg-background p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="contact-name"
          name="name"
          label="Name"
          placeholder="UserName"
          required
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
        />
        <Field
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
        />
      </div>
      <Field
        id="contact-subject"
        name="subject"
        label="Subject"
        placeholder="I'd like a tour"
        required
        className="mt-4"
        value={form.subject}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.subject}
      />
      <div className="mt-4">
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          placeholder="Tell us how we can help…"
          required
          value={form.message}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`w-full rounded-xl border bg-input/40 p-3 text-sm text-foreground outline-none transition-all focus:ring-2 ${
            errors.message
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-primary focus:ring-primary/20"
          }`}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-destructive" role="alert">
            {errors.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({ id, label, error, className = "", required = false, ...props }) {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-input/40 p-3 text-sm text-foreground outline-none transition-all focus:ring-2 ${
          error
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "border-border focus:border-primary focus:ring-primary/20"
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
