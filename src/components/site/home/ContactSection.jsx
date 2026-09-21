import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/site/Reveal";

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
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name")?.toString().trim();
    const email = data.get("email")?.toString().trim();
    const message = data.get("message")?.toString().trim();

    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    toast.success("Message sent — we'll get back to you shortly.");
    setSubmitting(false);
    form.reset();
  }

  return (
    <form className="rounded-3xl border border-border bg-background p-8" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Name" placeholder="UserName" required />
        <Field name="email" label="Email" type="email" placeholder="username@gmail.com" required />
      </div>
      <Field name="subject" label="Subject" placeholder="I'd like a tour" className="mt-4" />
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Message
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="Tell us how we can help…"
          required
          className="w-full rounded-xl border border-border bg-input/40 p-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-input/40 p-3 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
