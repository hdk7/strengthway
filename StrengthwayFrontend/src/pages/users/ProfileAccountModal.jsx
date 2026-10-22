/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  Mail,
  User,
  Shield,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import {
  createUserAccount,
  adminResetPassword,
  toggleUserStatus,
} from "@/lib/usersService";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import { InputField } from "@/components/form";
import { isValidEmail, isValidName } from "@/lib/validation";

/**
 * ProfileAccountModal
 *
 * Dedicated modal for creating or managing a linked system login account
 * directly from Trainer and Member profile pages.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {() => void} onSuccess
 * @param {'trainer'|'member'} type
 * @param {object} profile - Trainer or Member record
 * @param {object|null} existingAccount - User document if already provisioned
 */
export default function ProfileAccountModal({
  isOpen,
  onClose,
  onSuccess,
  type = "member",
  profile,
  existingAccount = null,
}) {
  const isTrainer = type === "trainer";
  const profileId = profile?.id || "";
  const defaultName = isTrainer
    ? profile?.name || ""
    : `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || profile?.name || "";
  const defaultEmail = profile?.email || "";

  // Creation State
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Existing Account Management State
  const [account, setAccount] = useState(existingAccount);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    setAccount(existingAccount);
    setName(defaultName);
    setEmail(defaultEmail);
    setPassword("");
    setError("");
    setFieldErrors({});
    setResetPassword("");
    setResetError("");
  }, [existingAccount, defaultName, defaultEmail]);

  const handleGeneratePassword = (targetSetter) => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    targetSetter(gen);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  // ── Create Account Handler ─────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) {
      errs.name = "Full name is required.";
    } else if (!isValidName(name)) {
      errs.name = "Name can only contain letters, spaces, hyphens, apostrophes, and periods.";
    }
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!password || password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: isTrainer ? "trainer" : "member",
        trainerId: isTrainer ? profileId : null,
        memberId: !isTrainer ? profileId : null,
      };

      const result = await createUserAccount(payload);
      toast.success(
        `Login account created for ${name}! Linked to ${isTrainer ? "Coach" : "Member"} #${profileId}.`
      );
      if (onSuccess) onSuccess(result?.user || null);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to create login account.");
      toast.error(err?.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle Active Handler ──────────────────────────────────────────────────
  const handleToggleStatus = async () => {
    if (!account?._id) return;
    try {
      const updated = await toggleUserStatus(account._id);
      setAccount((prev) => ({ ...prev, isActive: updated.isActive }));
      toast.success(
        `Account status updated to ${updated.isActive ? "Active" : "Deactivated"}.`
      );
      if (onSuccess) onSuccess(updated);
    } catch (err) {
      toast.error(err?.message || "Failed to toggle account status.");
    }
  };

  // ── Reset Password Handler ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.trim().length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      await adminResetPassword(account._id, resetPassword);
      toast.success(`Password updated for ${account.email}!`);
      setResetPassword("");
      if (onSuccess) onSuccess(account);
    } catch (err) {
      setResetError(err?.message || "Failed to reset password.");
      toast.error(err?.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        title={account ? "Manage Login Account" : "Create Login Account"}
        subtitle={
          account
            ? `Linked to ${isTrainer ? "Coach" : "Athlete"} #${profileId}`
            : `Provision credentials for ${isTrainer ? "Coach" : "Athlete"} #${profileId}`
        }
        onClose={onClose}
      />

      <FormModalBody>
        {account ? (
          /* ── EXISTING ACCOUNT MANAGEMENT ── */
          <div className="space-y-5 py-2">
            {/* Account Info Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      isTrainer
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {isTrainer ? <Dumbbell size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.email}</div>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    account.isActive !== false
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                      : "bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25"
                  }`}
                  title="Click to toggle status"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      account.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                    }`}
                  />
                  <span>{account.isActive !== false ? "Active" : "Deactivated"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>
                  Linked to {isTrainer ? "Coach" : "Member"} ID:{" "}
                  <strong className="text-foreground">{profileId}</strong> (No duplicate records)
                </span>
              </div>
            </div>

            {/* Reset Password Section */}
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reset Account Password
                </label>
                <button
                  type="button"
                  onClick={() => handleGeneratePassword(setResetPassword)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Generate</span>
                </button>
              </div>

              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <InputField
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    error={resetError}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting || !resetPassword}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 hover:bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 min-h-[42px]"
                >
                  {isResetting && <RefreshCw size={13} className="animate-spin" />}
                  <span>Save Password</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── CREATE NEW LOGIN ACCOUNT ── */
          <form id="create-account-form" onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1">
              <div className="text-xs font-bold text-foreground">
                Linking to: {isTrainer ? "Coach" : "Member"} #{profileId}
              </div>
              <p className="text-[11px] text-muted-foreground">
                This enables direct login to Strengthway for this user with role-specific access.
                The existing profile and attendance records remain linked without duplication.
              </p>
            </div>

            <InputField
              label="Full Name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              onBlur={() => {
                if (name && !isValidName(name)) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    name: "Name can only contain letters, spaces, hyphens, apostrophes, and periods.",
                  }));
                }
              }}
              error={fieldErrors.name}
              placeholder="Full Name"
            />

            <InputField
              label="Login Email"
              required
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              onBlur={() => {
                if (email && !isValidEmail(email)) {
                  setFieldErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
                }
              }}
              error={fieldErrors.email}
              placeholder="email@example.com"
            />

            <InputField
              label="Initial Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              onBlur={() => {
                if (password && password.length < 8) {
                  setFieldErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters." }));
                }
              }}
              error={fieldErrors.password}
              placeholder="Minimum 8 characters"
              endAdornment={
                <button
                  type="button"
                  onClick={() => handleGeneratePassword(setPassword)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer px-1 py-0.5"
                >
                  <Sparkles size={12} />
                  <span>Generate</span>
                </button>
              }
            />

            {error && <p className="text-xs text-destructive">{error}</p>}
          </form>
        )}
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText={account ? "Close" : "Cancel"}
        submitText={account ? undefined : "Create Login Account"}
        form={account ? undefined : "create-account-form"}
        submitType="submit"
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
}
