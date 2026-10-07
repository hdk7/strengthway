/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  User,
  PhoneCall,
  UserCheck,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInquiryById,
  deleteInquiry,
  recordInquiryContact,
  archiveInquiry,
  updateInquiryStatus,
} from "@/lib/inquiriesService";
import { AdminMemberRegistrationModal } from "@/pages/trainers-members/members/MembersRegistration";
import ContactLeadModal from "./ContactLeadModal";
import InquiryContactRecordCard from "./InquiryContactRecordCard";
import InquiryPersonalDetailsCard from "./InquiryPersonalDetailsCard";

export default function InquiryProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getInquiryById(id)
      .then((data) => {
        if (isMounted) setInquiry(data);
      })
      .catch((err) => {
        console.error("Failed to load inquiry:", err);
        if (isMounted) setInquiry(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const displayStatus =
    inquiry?.status === "Lead" || inquiry?.status === "New" || !inquiry?.status
      ? "Inquiry"
      : inquiry.status;

  const handleContactSubmit = async (contactData) => {
    try {
      const updated = await recordInquiryContact(inquiry.id, contactData);
      setInquiry((prev) => ({
        ...prev,
        status: "Contacted",
        contactDetails: updated?.contactDetails || contactData,
      }));
      toast.success("Contact details recorded. Status updated to Contacted.");
    } catch (err) {
      toast.error(err?.message || "Failed to record contact interaction.");
      throw err;
    }
  };

  const handleArchive = async () => {
    if (
      !window.confirm(
        `Are you sure you want to move inquiry for ${inquiry.name || "this prospect"} to Archived?`,
      )
    ) {
      return;
    }
    try {
      await archiveInquiry(inquiry.id, "Archived by staff from profile page");
      setInquiry((prev) => ({ ...prev, status: "Archived" }));
      toast.success("Inquiry moved to Archived.");
    } catch (err) {
      toast.error(err?.message || "Failed to archive inquiry.");
    }
  };

  const handleRegistrationSuccess = async (registeredMember) => {
    try {
      await updateInquiryStatus(inquiry.id, "Converted", {
        convertedMemberId: registeredMember?.id,
      });
      setInquiry((prev) => ({
        ...prev,
        status: "Converted",
        convertedMemberId: registeredMember?.id,
        convertedAt: new Date().toISOString(),
      }));
      setIsRegisterModalOpen(false);
      toast.success(
        `${registeredMember?.firstName || inquiry?.name || "Prospect"} successfully converted to Member!`,
        { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
      );
    } catch (err) {
      console.error("Failed to update status on conversion:", err);
    }
  };

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to remove inquiry from ${inquiry.name || "this user"}?`,
      )
    ) {
      return;
    }
    try {
      await deleteInquiry(inquiry.id);
      toast.success("Inquiry has been deleted.");
      navigate("/admin/inquiries");
    } catch (err) {
      toast.error(err.message || "Failed to delete inquiry.");
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
        <h2 className="text-xl font-bold text-foreground font-display">
          Inquiry Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          No gym inquiry record exists with ID{" "}
          <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/inquiries")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Inquiries List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <button
          type="button"
          onClick={() => navigate("/admin/inquiries")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Inquiries</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Workflow Action Options placed directly after Back to Inquiries */}
          {displayStatus === "Inquiry" && (
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <PhoneCall size={13} />
              <span>Contact Lead</span>
            </button>
          )}

          {displayStatus === "Contacted" && (
            <>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <UserCheck size={13} />
                <span>Convert to Member</span>
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <Archive size={13} />
                <span>Archive</span>
              </button>
            </>
          )}

          {displayStatus === "Converted" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Converted to Member</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Athletic Pass Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-r from-accent/20 via-card to-background p-6 sm:p-10 shadow-sm backdrop-blur-xl">
        {/* Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground truncate">
              {inquiry.name || "Anonymous Prospect"}
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                  displayStatus === "Converted"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : displayStatus === "Contacted"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : displayStatus === "Inquiry"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-muted/60 text-muted-foreground border-border"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    displayStatus === "Converted"
                      ? "bg-emerald-500"
                      : displayStatus === "Contacted"
                        ? "bg-blue-500"
                        : displayStatus === "Inquiry"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-muted-foreground"
                  }`}
                />
                {displayStatus === "Converted"
                  ? "Converted to Member"
                  : displayStatus}
              </span>

              {/* Inquiry ID */}
              <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/60 border border-border px-3 py-1 rounded-full">
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
            Verified contact dossier and communication statement registered in
            The Strength Way inquiries module.
          </p>
        </div>

        <div className="space-y-6">
          {/* Single Unified Inquiry Profile Card */}
          <InquiryPersonalDetailsCard
            inquiry={inquiry}
            formattedDateTime={formattedDateTime}
            handleCopy={handleCopy}
            copiedField={copiedField}
          />

          {/* Contact Interaction History & Details (Shown if contacted) */}
          {inquiry.contactDetails && (
            <InquiryContactRecordCard contactDetails={inquiry.contactDetails} />
          )}
        </div>
      </div>

      {/* --- CONTACT LEAD MODAL --- */}
      <ContactLeadModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleContactSubmit}
        leadName={inquiry?.name}
        leadPhone={inquiry?.mobile}
        leadEmail={inquiry?.email}
      />

      {/* --- MEMBER REGISTRATION MODAL --- */}
      {isRegisterModalOpen && (
        <AdminMemberRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleRegistrationSuccess}
          leadToConfirm={{
            id: inquiry.id,
            name: inquiry.name,
            gender: inquiry.gender,
            mobile: inquiry.mobile,
            email: inquiry.email,
            address: inquiry.address,
            bio: inquiry.message
              ? `Inquiry (${inquiry.subject || "General"}): ${inquiry.message}`
              : "Prospective athlete via website inquiry.",
            status: inquiry.status || "Contacted",
          }}
        />
      )}
    </div>
  );
}
