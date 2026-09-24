/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerById,
  getTrainerPhoto,
  updateTrainer,
  deleteTrainer,
} from "@/lib/trainersService";
import { TrainerModal } from "./TrainerModal";
import { CertifiedAccreditations } from "@/pages/trainers-members/trainers/CertifiedAccreditations";

export default function TrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const data = getTrainerById(id);
    setTrainer(data);
    setIsLoading(false);
  }, [id]);

  const trainerPhoto = useMemo(() => {
    return getTrainerPhoto(trainer);
  }, [trainer]);

  const initials = useMemo(() => {
    if (!trainer?.name) return "T";
    return trainer.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [trainer?.name]);

  const isInactive = trainer?.status === "Inactive";

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = (formData) => {
    try {
      const updated = updateTrainer(trainer.id, formData);
      if (updated) {
        setTrainer(updated);
        toast.success("Trainer profile updated successfully.");
      }
    } catch {
      toast.error("Failed to update Trainer.");
    }
  };

  const handleDelete = () => {
    if (
      !window.confirm(`Are you sure you want to remove ${trainer.name} from the training roster?`)
    )
      return;
    try {
      deleteTrainer(trainer.id);
      toast.success(`${trainer.name} has been removed.`);
      navigate("/admin/trainers-members/trainers");
    } catch {
      toast.error("Failed to delete trainer.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground no-scrollbar">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading Trainer profile…</p>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="py-16 text-center space-y-4 no-scrollbar">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">Trainer Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym Trainer record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/trainers")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Trainers Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header & Breadcrumb Nav + Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link
            to="/admin/trainers-members/trainers"
            className="hover:text-foreground transition-colors"
          >
            Trainers
          </Link>
          <ChevronRight size={13} />
          <span className="text-foreground font-semibold">{trainer.name}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/trainers")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Trainers</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <Link
            to={`/trainers/${trainer.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>View Public Profile</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Trainer Profile Card (Clean design matching public portfolio) */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 sm:p-10 lg:p-12 shadow-sm backdrop-blur-xl">
        {/* Glowing Background Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Trainer Portrait with Clean Image */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative group w-full max-w-sm rounded-3xl overflow-hidden border-2 border-border/80 bg-card shadow-lg">
              {trainerPhoto ? (
                <img
                  src={trainerPhoto}
                  alt={trainer.name}
                  width={800}
                  height={1000}
                  className="h-[420px] w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="h-[420px] w-full grid place-items-center bg-card text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="h-20 w-20 rounded-full bg-muted/60 border border-border grid place-items-center mx-auto text-primary text-3xl font-display font-black">
                      {initials}
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      No Photo Uploaded
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Trainer Information */}
          <div className="lg:col-span-8 space-y-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
              {trainer.name}
            </h1>

            {/* Bio / Quote */}
            <blockquote className="rounded-2xl border-l-4 border-primary bg-muted/30 p-4 sm:p-5 text-sm sm:text-base italic text-foreground">
              "
              {trainer.quote ||
                trainer.bio ||
                "Dedicated to building relentless strength and sustainable athletic performance."}
              "
            </blockquote>
          </div>
        </div>
      </div>

      {/* Trainer Official Profile & Form Details Grid */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Official Roster Specifications
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Trainer Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Verified identification, athletic background, and certified coaching credentials
            registered in The Strength Way directory.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form Details Dossier Table (Left Column 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Personal Details & Identification</span>
              </h3>

              <dl className="mt-6 divide-y divide-border text-sm">
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Full Name</dt>
                  <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                    {trainer.name}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Trainer ID</dt>
                  <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0">
                    {trainer.id}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Experience</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
                    {trainer.experience} Professional Coaching
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Faculty Status</dt>
                  <dd className="mt-1 sm:col-span-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isInactive
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {trainer.status || "Active"}
                    </span>
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${trainer.email}`}
                        className="hover:text-primary hover:underline truncate"
                      >
                        {trainer.email}
                      </a>
                    </div>
                    {trainer.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(trainer.email, "details-email", "Email address")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === "details-email" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      <span>{trainer.phone}</span>
                    </div>
                    {trainer.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(trainer.phone, "details-phone", "Phone number")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === "details-phone" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                {trainer.joinedAt && (
                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Faculty Since</dt>
                    <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
                      {new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Certified Accreditations Document Uploads & Bio (Right Column 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <CertifiedAccreditations
                trainer={trainer}
                onUpdateTrainer={handleSaveEdit}
                canUpload={true}
              />
            </div>

            {/* Philosophy & Biography Card */}
            {trainer.bio && (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Quote size={16} className="text-primary" />
                  <span>Coaching Philosophy & Background</span>
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {trainer.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Trainer Modal with all corresponding fields */}
      <TrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        trainerToEdit={trainer}
      />
    </div>
  );
}
