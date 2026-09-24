/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Quote,
  Clock,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { getInquiryById, deleteInquiry } from "@/lib/inquiriesService";

export default function InquiryProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const data = getInquiryById(id);
    setInquiry(data);
    setIsLoading(false);
  }, [id]);

  const initials = useMemo(() => {
    const raw = String(inquiry?.name || "").trim();
    if (!raw) return "U";
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0] || "")
        .join("")
        .toUpperCase() || "U"
    );
  }, [inquiry?.name]);

  const formattedDateTime = useMemo(() => {
    if (!inquiry?.createdAt) return "—";
    try {
      const d = new Date(inquiry.createdAt);
      if (isNaN(d.getTime())) return String(inquiry.createdAt);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(inquiry.createdAt || "—");
    }
  }, [inquiry?.createdAt]);

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to remove inquiry from ${inquiry.name || "this user"}?`)) {
      return;
    }
    try {
      deleteInquiry(inquiry.id);
      toast.success("Inquiry has been deleted.");
      navigate("/admin/inquiries");
    } catch {
      toast.error("Failed to delete inquiry.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground no-scrollbar">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading Inquiry profile…</p>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="py-16 text-center space-y-4 no-scrollbar">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground font-display">Inquiry Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym inquiry record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/inquiries")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Inquiries List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header & Breadcrumb Nav + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link to="/admin/inquiries" className="hover:text-foreground transition-colors">
            Inquiries
          </Link>
          <ChevronRight size={13} />
          <span className="text-foreground font-semibold">{inquiry.name || inquiry.id}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/inquiries")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Inquiries</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Athletic Pass Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-accent/20 via-card to-background p-6 sm:p-10 shadow-sm backdrop-blur-xl">
        {/* Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 min-w-0">
            {/* Monogram Avatar with Live Status Ring */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-xl">
                <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-3xl sm:text-4xl font-black tracking-wider uppercase">
                  {initials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>

            {/* Name, Badges & Subject Preview */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Inquiry ID */}
                <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  {inquiry.id}
                </span>

                {/* Gender */}
                {inquiry.gender && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <User size={13} className="text-muted-foreground" />
                    <span>{inquiry.gender}</span>
                  </span>
                )}

                {/* Date and Time */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Clock size={13} className="text-primary" />
                  <span>{formattedDateTime}</span>
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground truncate">
                {inquiry.name || "Anonymous Prospect"}
              </h1>

              <p className="text-sm text-muted-foreground italic truncate">
                &ldquo;{inquiry.subject || "General Inquiry"}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Official Inquiries Dossier Specifications Grid */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Verified Specifications
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Inquiry Profile
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verified contact dossier and communication statement registered in The Strength Way inquiries module.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Personal Information & Contact Dossier Table */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Personal Details & Contact</span>
              </h3>

              <dl className="mt-4 divide-y divide-border text-sm">
                {/* 1. Name */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Full Name</dt>
                  <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                    {inquiry.name || "—"}
                  </dd>
                </div>

                {/* 2. ID */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Inquiry ID</dt>
                  <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <span>{inquiry.id || "—"}</span>
                    {inquiry.id && (
                      <button
                        type="button"
                        onClick={() => handleCopy(inquiry.id, "id", "Inquiry ID")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy ID"
                      >
                        {copiedField === "id" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                {/* 3. Gender */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Gender</dt>
                  <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                    {inquiry.gender || "—"}
                  </dd>
                </div>

                {/* 4. Mobile Number */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Mobile</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      {inquiry.mobile ? (
                        <a
                          href={`tel:${inquiry.mobile}`}
                          className="hover:text-primary hover:underline font-semibold truncate"
                        >
                          {inquiry.mobile}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    {inquiry.mobile && (
                      <button
                        type="button"
                        onClick={() => handleCopy(inquiry.mobile, "mobile", "Mobile number")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy mobile number"
                      >
                        {copiedField === "mobile" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                {/* 5. Email */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail size={14} className="text-muted-foreground shrink-0" />
                      {inquiry.email ? (
                        <a
                          href={`mailto:${inquiry.email}`}
                          className="hover:text-primary hover:underline font-semibold truncate"
                        >
                          {inquiry.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    {inquiry.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(inquiry.email, "email", "Email address")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy email address"
                      >
                        {copiedField === "email" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                {/* 6. Date and Time */}
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Date & Time</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <span>{formattedDateTime}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right Column: Inquiry Statement & Message */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                <Quote size={18} className="text-primary" />
                <span>Inquiry Statement</span>
              </h3>

              {/* 7. Subject Box */}
              <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  <Tag size={13} className="text-primary" />
                  <span>Subject</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground font-display">
                  {inquiry.subject || "General Inquiry"}
                </div>
              </div>

              {/* 8. Message Body */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Message
                </span>
                <blockquote className="rounded-2xl border-l-4 border-primary bg-muted/20 p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {inquiry.message || "No message provided."}
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
