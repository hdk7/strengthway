/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  AlertCircle,
  PhoneCall,
  UserCheck,
  Archive,
  CheckCircle2,
  Clock,
  RotateCcw,
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
import { Button } from "@/components/ui/Button";
import ContactLeadModal from "./ContactLeadModal";
import InquiryContactRecordCard from "./InquiryContactRecordCard";
import InquiryPersonalDetailsCard from "./InquiryPersonalDetailsCard";

export default function InquiryProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const isInterestedConverting =
    displayStatus === "Contacted" &&
    inquiry?.contactDetails?.outcome === "Interested - Converting Soon";

  const isNotInterested =
    displayStatus === "Contacted" &&
    inquiry?.contactDetails?.outcome === "Not Interested";

  const isNeedsFollowUp =
    displayStatus === "Contacted" &&
    inquiry?.contactDetails?.outcome === "Needs Follow-Up";

  const contactDetailsToDisplay =
    inquiry?.contactDetails ||
    (displayStatus === "Archived" && inquiry?.statusHistory?.length > 0
      ? {
          contactedAt: inquiry.statusHistory[inquiry.statusHistory.length - 1].changedAt,
          contactMethod: "Archived Record",
          contactedBy: inquiry.statusHistory[inquiry.statusHistory.length - 1].changedBy || "Admin",
          outcome: "Archived",
          contactNotes: inquiry.statusHistory[inquiry.statusHistory.length - 1].notes || "Archived from workflow",
        }
      : null);

  const handleContactSubmit = async (contactData) => {
    try {
      const updated = await recordInquiryContact(inquiry.id, contactData);
      setInquiry((prev) => ({
        ...prev,
        status: "Contacted",
        contactDetails: updated?.contactDetails || contactData,
      }));

      // Dispatch event so Header notification center updates immediately
      window.dispatchEvent(new CustomEvent("inquiry-updated", { detail: updated }));

      if (contactData.outcome === "Needs Follow-Up" && contactData.followUpDate) {
        toast.success(
          `Follow-up scheduled for ${contactData.followUpDate}. You will be notified on that date to recontact ${inquiry.name || "prospect"}.`,
        );
      } else {
        toast.success("Contact details recorded. Status updated to Contacted.");
      }
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
      const updated = await archiveInquiry(inquiry.id, "Archived by staff from profile page");
      setInquiry((prev) => ({
        ...prev,
        ...(updated || {}),
        status: "Archived",
      }));
      toast.success("Inquiry moved to Archived.");
    } catch (err) {
      toast.error(err?.message || "Failed to archive inquiry.");
    }
  };

  const handleMoveToInquiry = async () => {
    try {
      const updated = await updateInquiryStatus(inquiry.id, "Inquiry", {
        notes: "Moved from Archived back to active inquiries to restart workflow from start",
      });
      window.dispatchEvent(new CustomEvent("inquiry-updated", { detail: updated }));
      toast.success(
        `${inquiry.name || "Lead"} moved to Customer Inquiries to start workflow from the beginning.`,
      );
      navigate("/admin/inquiries");
    } catch (err) {
      toast.error(err?.message || "Failed to move inquiry to workflow.");
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
        <Button
          type="button"
          variant="default"
          onClick={() => navigate("/admin/inquiries")}
        >
          <ArrowLeft size={16} />
          <span>Back to Inquiries List</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/inquiries")}
        >
          <ArrowLeft size={16} />
          <span>Back to Inquiries</span>
        </Button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Workflow Action Options placed directly after Back to Inquiries */}
          {displayStatus === "Inquiry" && (
            <Button
              type="button"
              variant="default"
              onClick={() => setIsContactModalOpen(true)}
            >
              <PhoneCall size={16} />
              <span>Contact Lead</span>
            </Button>
          )}

          {displayStatus === "Contacted" && (
            <>
              {!isNotInterested && !isNeedsFollowUp && (
                <Button
                  type="button"
                  variant="success"
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  <UserCheck size={16} />
                  <span>Convert to Member</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleArchive}
              >
                <Archive size={16} />
                <span>Archive</span>
              </Button>
            </>
          )}

          {displayStatus === "Converted" && (
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-emerald-400 shadow-xs">
              <CheckCircle2 size={16} />
              <span>Converted to Member</span>
            </span>
          )}

          {displayStatus === "Archived" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleMoveToInquiry}
            >
              <RotateCcw size={16} />
              <span>Move to Inquiry</span>
            </Button>
          )}

          {!isInterestedConverting && (
            <Button
              type="button"
              variant="destructiveOutline"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Follow-up Reminder Banner (if Needs Follow-up) */}
      {isNeedsFollowUp && inquiry.contactDetails?.followUpDate && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-500 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                Follow-up Scheduled: {inquiry.contactDetails.followUpDate}
              </p>
              <p className="text-muted-foreground text-xs">
                A system notification will alert staff on this date to recontact {inquiry.name || "the lead"}.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsContactModalOpen(true)}
            className="self-start sm:self-auto shrink-0"
          >
            <PhoneCall size={14} />
            <span>Recontact Lead</span>
          </Button>
        </div>
      )}

      {/* Inquiry Dossier Cards */}
      <div className="space-y-6">
        {/* Single Unified Inquiry Profile Card */}
        <InquiryPersonalDetailsCard
          inquiry={inquiry}
          formattedDateTime={formattedDateTime}
        />

        {/* Contact Interaction History & Details (Shown if contacted or archived) */}
        {contactDetailsToDisplay && (
          <InquiryContactRecordCard contactDetails={contactDetailsToDisplay} />
        )}
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
