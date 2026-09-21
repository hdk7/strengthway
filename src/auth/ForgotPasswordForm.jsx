import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/button";
import { forgotPassword, AuthError } from "./authService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setEmailError("");
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof AuthError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/10">
          <MailCheck size={28} className="text-accent" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-foreground mb-1">Check your inbox</h2>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            If <strong className="text-foreground">{email}</strong> is registered, you will receive
            a password-reset link shortly.
          </p>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Didn't receive it? Check your spam folder or&nbsp;
          <button
            type="button"
            className="text-accent underline bg-transparent border-none cursor-pointer p-0 text-[12px]"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
          >
            try again
          </button>
          .
        </p>
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] text-accent bg-transparent border-none cursor-pointer p-0 hover:underline"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4.5 text-left" onSubmit={handleSubmit} noValidate>
      <div className="mb-1">
        <h2 className="text-[20px] font-semibold text-foreground mb-1">Forgot your password?</h2>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed">
          Enter your admin email and we will send you a link to reset your password.
        </p>
      </div>

      {formError && (
        <div
          className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px]"
          role="alert"
        >
          {formError}
        </div>
      )}

      <TextField
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="user@thestrengthway.com"
        value={email}
        onChange={handleChange}
        error={emailError}
        disabled={submitting}
      />

      <Button type="submit" variant="primary" loading={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </Button>

      <button
        type="button"
        className="inline-flex items-center justify-center gap-1.5 text-[13.5px] text-muted-foreground bg-transparent border-none cursor-pointer p-0 hover:text-foreground transition-colors"
        onClick={onBack}
        disabled={submitting}
      >
        <ArrowLeft size={14} />
        Back to sign in
      </button>
    </form>
  );
}
