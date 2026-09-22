import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/button";
import { loginSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { loginAdmin, AuthError, DEMO_MODE, DEMO_CREDENTIALS } from "./authService";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function LoginForm({ onSuccess }) {
  const [view, setView] = useState("login"); // 'login' | 'forgot'
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    const errorMsg = validateFieldWithYup(loginSchema, field, nextForm);
    setFieldErrors((prev) => ({ ...prev, [field]: errorMsg || undefined }));
    if (formError) setFormError("");
  };

  const handleBlur = (field) => (event) => {
    const value = event?.target?.value;
    const currentForm = { ...form, [field]: value !== undefined ? value : form[field] };
    const errorMsg = validateFieldWithYup(loginSchema, field, currentForm);
    setFieldErrors((prev) => ({ ...prev, [field]: errorMsg || undefined }));
  };

  const handleFillDemo = () => {
    setForm(DEMO_CREDENTIALS);
    setFieldErrors({});
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateWithYup(loginSchema, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError("");
    try {
      const session = await loginAdmin(form);
      onSuccess?.(session);
    } catch (error) {
      setFormError(
        error instanceof AuthError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "forgot") {
    return <ForgotPasswordForm onBack={() => setView("login")} />;
  }

  return (
    <form className="flex flex-col gap-4.5 text-left" onSubmit={handleSubmit} noValidate>
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
        autoComplete="username"
        placeholder="you@thestrengthway.com"
        value={form.email}
        onChange={handleChange("email")}
        onBlur={handleBlur("email")}
        error={fieldErrors.email}
        disabled={submitting}
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        name="password"
        autoComplete="new-password"
        placeholder="Enter your password"
        value={form.password}
        onChange={handleChange("password")}
        onBlur={handleBlur("password")}
        error={fieldErrors.password}
        disabled={submitting}
        endAdornment={
          <button
            type="button"
            className="inline-flex items-center justify-center px-3 h-full bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />

      <div className="flex items-center justify-between text-[13.5px]">
        <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
          <input type="checkbox" name="remember" disabled={submitting} />
          Remember me
        </label>
        <button
          type="button"
          className="text-accent bg-transparent border-none cursor-pointer p-0 text-[13.5px] hover:underline"
          onClick={() => setView("forgot")}
          disabled={submitting}
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" variant="primary" loading={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      {DEMO_MODE && (
        <button
          type="button"
          className="flex flex-col items-center gap-1 -mt-1 px-3 py-2.5 rounded-lg bg-accent/10 border border-dashed border-accent/30 text-foreground cursor-pointer text-center hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleFillDemo}
          disabled={submitting}
        >
          <span className="text-[12.5px] font-semibold">Use demo credentials</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
          </span>
        </button>
      )}
    </form>
  );
}
