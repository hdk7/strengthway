import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Quote,
  Calendar,
  UserCheck,
  Dumbbell,
  Flame,
  ArrowUpRight,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { CertifiedAccreditations } from "@/components/trainers/CertifiedAccreditations";

export function TrainerDetailsModal({ isOpen, onClose, trainer, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState(null);

  if (!trainer) return null;

  const initials = (trainer.name || "T")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isInactive = trainer.status === "Inactive";

  const handleCopy = (text, fieldName, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const tabs = [
    { id: "overview", label: "Certified Accreditations", icon: Award },
    { id: "contact", label: "Direct Contact", icon: Phone },
    { id: "bio", label: "Philosophy & Bio", icon: Quote },
  ];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby="trainer-details-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-3xl max-h-[92vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-3xl border border-border/80 bg-card/95 text-card-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
        >
          {/* Top Master Trainer Header */}
          <div className="relative border-b border-border/70 bg-gradient-to-r from-accent/20 via-background/80 to-accent/10 px-6 pt-7 pb-6 sm:px-8 shrink-0 overflow-hidden">
            {/* Ambient glowing orbs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute left-10 -bottom-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              {/* Avatar + Trainer Identity */}
              <div className="flex items-center gap-4.5 min-w-0">
                {/* Avatar with Status Ring */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-lg">
                    {trainer.photo ? (
                      <img
                        src={trainer.photo}
                        alt={trainer.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-2xl font-black tracking-wider uppercase">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        isInactive
                          ? "bg-muted border border-border text-muted-foreground"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                      }`}
                    >
                      {trainer.status || "Active"} Trainer
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate font-display">
                    {trainer.name}
                  </h2>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles size={13} className="text-accent shrink-0" />
                      <span>{trainer.experience} Experience</span>
                    </span>

                    {trainer.joinedAt && (
                      <span className="hidden xs:flex items-center gap-1 text-muted-foreground">
                        <span>•</span>
                        <Calendar size={13} className="text-muted-foreground shrink-0" />
                        <span>
                          Since{" "}
                          {new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {trainer.phone && (
                  <a
                    href={`tel:${trainer.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
                    title={`Call ${trainer.phone}`}
                  >
                    <Phone size={14} className="text-accent" />
                    <span className="hidden xs:inline">Call Trainer</span>
                  </a>
                )}
                {trainer.email && (
                  <a
                    href={`mailto:${trainer.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
                    title={`Email ${trainer.email}`}
                  >
                    <Mail size={14} className="text-accent" />
                    <span className="hidden xs:inline">Email</span>
                  </a>
                )}

                <DialogPrimitive.Close
                  onClick={onClose}
                  className="rounded-full border border-border/80 bg-background/60 p-2 text-muted-foreground hover:bg-accent/15 hover:text-foreground transition-colors cursor-pointer ml-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="mt-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl bg-muted/40 p-1 border border-border/60">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-card text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isActive ? "text-accent" : "text-muted-foreground"}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div
            id="trainer-details-desc"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm no-scrollbar"
          >
            {/* TAB 1: CERTIFIED ACCREDITATIONS */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <CertifiedAccreditations trainer={trainer} canUpload={false} />

                {/* Training Focus & Methodologies */}
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={16} className="text-accent" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Core Methodologies & Training Focus
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "Progressive Overload",
                      "Biomechanics & Form",
                      "Functional Mobility",
                      "Hypertrophy Periodization",
                      "Aerobic & Anaerobic Conditioning",
                      "Injury Prevention",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground/90"
                      >
                        <Flame size={12} className="text-accent" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Official Staff Badges */}
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Verified Staff Qualifications
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                      <UserCheck size={18} className="text-accent shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Certified Trainer</p>
                        <p className="text-[10px] text-muted-foreground">Level 2+ Accredited</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                      <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">CPR / AED Certified</p>
                        <p className="text-[10px] text-muted-foreground">First Aid Responder</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                      <Award size={18} className="text-accent shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Facility Supervisor</p>
                        <p className="text-[10px] text-muted-foreground">Gym Floor Safety</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT CONTACT */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                {/* Phone Card */}
                <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-accent/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                        <Phone size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Direct Contact Number
                        </span>
                        <p className="mt-1 text-base font-bold text-foreground font-mono tracking-tight">
                          {trainer.phone || "No phone registered"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Direct line for member scheduling & Trainering queries
                        </p>
                      </div>
                    </div>

                    {trainer.phone && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(trainer.phone, "phone", "Phone number")}
                          className="rounded-xl border border-border bg-background p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedField === "phone" ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={`tel:${trainer.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-accent/10 border border-accent/30 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition-all cursor-pointer"
                        >
                          <span>Call Now</span>
                          <ArrowUpRight size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Card */}
                <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-accent/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Staff Email Address
                        </span>
                        <p className="mt-1 text-base font-bold text-foreground truncate">
                          {trainer.email || "No email registered"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Official The Strength Way staff email
                        </p>
                      </div>
                    </div>

                    {trainer.email && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(trainer.email, "email", "Email address")}
                          className="rounded-xl border border-border bg-background p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
                          title="Copy email address"
                        >
                          {copiedField === "email" ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={`mailto:${trainer.email}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-accent/10 border border-accent/30 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition-all cursor-pointer"
                        >
                          <span>Email</span>
                          <ArrowUpRight size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PHILOSOPHY & BIO */}
            {activeTab === "bio" && (
              <div className="space-y-5">
                <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-card to-background p-6 sm:p-7 shadow-sm overflow-hidden">
                  <div className="absolute right-4 top-4 text-accent/10 pointer-events-none">
                    <Quote size={80} />
                  </div>

                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2">
                      <Quote size={18} className="text-accent" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Trainering Philosophy & Athlete Background
                      </h4>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-background/50 p-5">
                      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-serif italic">
                        &ldquo;
                        {trainer.bio ||
                          "No personal biography or Trainering ethos provided for this trainer."}
                        &rdquo;
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        — {trainer.name}
                      </span>
                      <span className="font-mono text-[11px]">TSW Trainering Faculty</span>
                    </div>
                  </div>
                </div>

                {/* Training Standard Pledge */}
                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-muted-foreground flex items-center gap-3">
                  <ShieldCheck size={20} className="text-accent shrink-0" />
                  <p>
                    All Trainering programs administered under this trainer follow The Strength Way
                    evidence-based biomechanical guidelines and safety protocols.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Luxury Modal Footer */}
          <div className="border-t border-border/70 bg-muted/20 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onDelete(trainer.id, trainer.name);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Trainer</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(trainer);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default TrainerDetailsModal;
