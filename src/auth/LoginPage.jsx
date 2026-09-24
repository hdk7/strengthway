/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import gymLogo from "@/assets/gym_logo.png";
import loginHero from "@/assets/login-admin.jpg";
import { InputField, PasswordField, CheckboxField } from "@/components/form";
import Button from "@/components/ui/button";
import { loginSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { loginAdmin, AuthError, DEMO_MODE, DEMO_CREDENTIALS } from "@/auth/authService";
import ForgotPasswordForm from "@/auth/ForgotPasswordForm";
import { ThemeToggle } from "@/hooks/theme";

export function LoginForm({ onSuccess }) {
  const [view, setView] = useState("login"); // 'login' | 'forgot'
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
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

      <InputField
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

      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Enter your password"
        value={form.password}
        onChange={handleChange("password")}
        onBlur={handleBlur("password")}
        error={fieldErrors.password}
        disabled={submitting}
      />

      <div className="flex items-center justify-between text-[13.5px]">
        <CheckboxField label="Remember me" name="remember" disabled={submitting} />
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

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");
    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  const handleSuccess = (session) => {
    if (session?.token) {
      localStorage.setItem("tsw-token", session.token);
      localStorage.setItem("tsw-user", JSON.stringify(session.user));
    }
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground overflow-x-hidden lg:overflow-hidden no-scrollbar">
      {/* Visual Showcase Panel (Left on Desktop, Banner on Mobile) */}
      <div className="relative w-full lg:w-[48%] xl:w-[50%] shrink-0 overflow-hidden bg-zinc-950 flex flex-col justify-between lg:h-full no-scrollbar">
        {/* Background Image with dramatic overlays */}
        <img
          src={loginHero}
          alt="The Strength Way Athletic Facility"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Multilayer gradient overlays for contrast & brand vibe */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 lg:to-transparent" />
        <div className="absolute inset-0 radial-brand opacity-60 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-8 lg:p-10 xl:p-12 min-h-[260px] lg:min-h-0">
          {/* Top Branding */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl"
              title="Return to home page"
            >
              <img
                src={gymLogo}
                alt="The Strength Way"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-white/30 shadow-lg group-hover:ring-white/80 transition-all duration-300"
              />
              <div className="text-left">
                <span className="font-display font-bold text-base sm:text-lg tracking-tight block text-white drop-shadow-sm">
                  THE STRENGTH<span className="text-zinc-300"> WAY</span>
                </span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-white/70 font-semibold block">
                  Management Console
                </span>
              </div>
            </Link>

            {/* Mobile-only Theme Toggle & Back Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-black/40 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Home</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>

          {/* Bottom Headline, Tagline & Metrics */}
          <div className="mt-auto pt-6 pb-1 sm:pb-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md mb-3 sm:mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Elite Strength Training Suite</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] max-w-xl">
              Train harder.
              <br />
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Achieve smarter.
              </span>
            </h1>

            <p className="mt-3 text-xs sm:text-sm lg:text-base text-white/75 max-w-lg leading-relaxed hidden sm:block">
              Welcome to the centralized management hub. Control athlete memberships, trainer
              schedules, real-time check-ins, and performance analytics with precision.
            </p>

            {/* Metric Highlights */}
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
              <div className="rounded-2xl border border-white/15 bg-black/45 p-3 sm:p-4 backdrop-blur-md shadow-lg transition-all hover:border-white/30">
                <div className="font-display text-lg sm:text-2xl font-bold text-white">12.5k+</div>
                <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider mt-0.5">
                  Athletes
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/45 p-3 sm:p-4 backdrop-blur-md shadow-lg transition-all hover:border-white/30">
                <div className="font-display text-lg sm:text-2xl font-bold text-white">48+</div>
                <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider mt-0.5">
                  Trainers
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/45 p-3 sm:p-4 backdrop-blur-md shadow-lg transition-all hover:border-white/30">
                <div className="font-display text-lg sm:text-2xl font-bold text-white">99.9%</div>
                <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider mt-0.5">
                  Uptime
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Panel (Right side on Desktop, Below on Mobile) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-12 relative lg:h-full overflow-y-auto no-scrollbar">
        {/* Desktop Top Nav */}
        <div className="hidden lg:flex items-center justify-between w-full shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to website</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto py-2 sm:py-4">
          <div className="text-left mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              Admin sign in
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Enter your authorized administrator credentials to manage gym operations, members, and
              trainers.
            </p>
          </div>

          {/* The LoginForm card wrapper */}
          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 sm:p-6 lg:p-7 shadow-xl dark:shadow-2xl dark:shadow-black/60">
            <LoginForm onSuccess={handleSuccess} />
          </div>

          {/* Security & Access footer */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
            <Shield size={13} className="text-muted-foreground/80 shrink-0" />
            <span>Authorized personnel only • All access attempts logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
