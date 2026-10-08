/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  getMemberById,
  updateMember,
  softDeleteMember,
  restoreMember,
  recordMemberContact,
  archiveMemberInquiry,
} from "@/lib/membersService";
import { getBatches } from "@/lib/batchesService";
import { createInquiry } from "@/lib/inquiriesService";
import BatchTransferModal from "@/pages/batches/components/BatchTransferModal";
import ContactLeadModal from "@/pages/inquiries/ContactLeadModal";
import InquiryContactRecordCard from "@/pages/inquiries/InquiryContactRecordCard";
import { AdminMemberRegistrationModal } from "./MembersRegistration";
import {
  calculateAge,
  calculateBmi,
  formatHeight,
  formatWeight,
} from "./profile/memberProfileUtils";
import { MemberProfileHeader } from "./profile/MemberProfileHeader";
import { MemberVitalsCard, MemberMedicalClearanceCard } from "./profile/MemberVitalsCard";
import { MemberContactCard } from "./profile/MemberContactCard";
import { MemberPlanDossierCard } from "./profile/MemberPlanDossierCard";
import { MemberBatchManagementCard } from "./profile/MemberBatchManagementCard";
import { useMemberProfileTracking } from "./profile/useMemberProfileTracking";

export default function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [, setSaving] = useState(false);
  const [allBatches, setAllBatches] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalTab, setTransferModalTab] = useState("transfer");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getMemberById(id)
      .then((data) => { if (!cancelled) setMember(data); })
      .catch(() => { if (!cancelled) setMember(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    getBatches()
      .then((list) => setAllBatches(Array.isArray(list) ? list : []))
      .catch(() => setAllBatches([]));
  }, []);

  const {
    selectedMonth,
    setSelectedMonth,
    loadMonthTracking,
    handlePrevMonth,
    handleNextMonth,
    handleCurrentMonth,
    formattedSelectedMonth,
    primaryBatchDetails,
    activeFlexPasses,
    assignmentHistory,
    attendanceSummary,
    calendarDays,
  } = useMemberProfileTracking({ id, member, allBatches });

  const handleTransferSuccess = async () => {
    try {
      const refreshedMember = await getMemberById(id);
      if (refreshedMember) setMember(refreshedMember);
    } catch {
      // ignore
    }
    loadMonthTracking();
  };

  const fullName = useMemo(() => {
    if (!member) return "";
    return `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member Profile";
  }, [member]);

  const age = useMemo(() => calculateAge(member?.dob), [member?.dob]);
  const bmiInfo = useMemo(
    () => calculateBmi(member?.height, member?.weight),
    [member?.height, member?.weight],
  );
  const imperialHeight = useMemo(() => formatHeight(member?.height), [member?.height]);
  const imperialWeight = useMemo(() => formatWeight(member?.weight), [member?.weight]);
  const isDeleted = Boolean(member?.isDeleted);

  const hasMedicalDoc = Boolean(
    member?.medicalDocName ||
    (typeof member?.medicalDoc === "string" && member.medicalDoc) ||
    (typeof member?.medicalDoc === "object" && member?.medicalDoc !== null)
  );

  const medicalDocName = useMemo(() => {
    if (!member) return null;
    if (member.medicalDocName) return member.medicalDocName;
    if (typeof member.medicalDoc === "string" && member.medicalDoc) return member.medicalDoc;
    if (member.medicalDoc && typeof member.medicalDoc === "object") {
      return member.medicalDoc.notes || "Medical_Fitness_Certificate.pdf";
    }
    return null;
  }, [member]);

  const medicalDocSubtext = useMemo(() => {
    if (!member) return "";
    if (member.medicalDocSize) return `${member.medicalDocSize} • Signed Physician Clearance`;
    if (member.medicalDoc && typeof member.medicalDoc === "object" && member.medicalDoc.clearanceDate) {
      return `Cleared: ${member.medicalDoc.clearanceDate} • Signed Physician Clearance`;
    }
    return "1.4 MB • Signed Physician Clearance";
  }, [member]);

  const emergencyName = member?.emergencyName || member?.emergencyContact?.name || "";
  const emergencyRel =
    member?.emergencyRelationship ||
    member?.emergencyRelation ||
    member?.emergencyContact?.relation ||
    "";
  const emergencyPhone =
    member?.emergencyNumber ||
    member?.emergencyPhone ||
    member?.emergencyContact?.phone ||
    "";

  const planDetails = useMemo(() => {
    if (!member?.membershipPlan) return null;
    if (typeof member.membershipPlan === "object" && member.membershipPlan.name) {
      return member.membershipPlan;
    }
    const planName = typeof member.membershipPlan === "string" ? member.membershipPlan : "Quarterly Pro";
    let durationMonths = 3;
    let formattedPrice = "₹18,000";
    const startStr = member.registeredAt
      ? new Date(member.registeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
      : "Active";
    const lower = planName.toLowerCase();
    if (lower.includes("monthly") || lower.includes("starter") || lower.includes("1")) {
      durationMonths = 1;
      formattedPrice = "₹7,000";
    } else {
      durationMonths = 3;
      formattedPrice = "₹18,000";
    }

    const startDate = member.registeredAt ? new Date(member.registeredAt) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    const endStr = endDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      name: planName,
      durationMonths,
      formattedStart: startStr,
      formattedEnd: endStr,
      formattedPrice,
    };
  }, [member]);


  const handleSaveEdit = async (updatedData) => {
    setSaving(true);
    try {
      const targetId = member?.id || id;
      const updated = await updateMember(targetId, updatedData);
      if (updated) {
        setMember(updated);
        toast.success("Member profile updated successfully.");
      }
    } catch (e) {
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!window.confirm(`Are you sure you want to archive ${fullName}?`)) return;
    setSaving(true);
    try {
      const archived = await softDeleteMember(member.id);
      if (archived) {
        setMember(archived);
        toast.success(`${fullName} has been archived.`);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to archive member.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setSaving(true);
    try {
      const restored = await restoreMember(member.id);
      if (restored) {
        setMember(restored);
        toast.success(`${fullName} restored to active members.`);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to restore member.");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertLead = () => {
    setIsEditModalOpen(true);
  };

  const handleRecordContact = async (contactData) => {
    try {
      const updated = await recordMemberContact(member.id, contactData);
      if (updated) {
        setMember(updated);
        toast.success("Contact interaction details recorded. Status updated to Contacted.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to record contact interaction.");
      throw err;
    }
  };

  const handleArchiveInquiry = async () => {
    if (!window.confirm(`Move inquiry for ${fullName} to Archived?`)) return;
    setSaving(true);
    try {
      const updated = await archiveMemberInquiry(member.id, "Moved to archived after contact follow-up");
      if (updated) {
        setMember(updated);
        toast.success(`${fullName} moved to Archived.`);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to archive inquiry.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToInquiry = async () => {
    try {
      const created = await createInquiry({
        name: fullName || "Archived Member",
        gender: member.gender || "Male",
        mobile: member.mobile || member.phone || "",
        email: member.email || "",
        address: member.address || "",
        subject: "Restored from Archived Member",
        message: member.bio || "Restored from archive to restart workflow from the beginning.",
        status: "Inquiry",
      });
      window.dispatchEvent(new CustomEvent("inquiry-updated", { detail: created }));
      toast.success(
        `${fullName} moved to Customer Inquiries to start workflow from the beginning.`,
      );
      navigate("/admin/inquiries");
    } catch (err) {
      toast.error(err?.message || "Failed to move member to inquiries.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading member profile…</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">Member Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym member record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/members")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Members Directory</span>
        </button>
      </div>
    );
  }

  const contactDetailsToDisplay =
    member?.contactDetails ||
    ((isDeleted || member?.status === "Archived") && member?.statusHistory?.length > 0
      ? {
          contactedAt: member.statusHistory[member.statusHistory.length - 1].changedAt,
          contactMethod: "Archived Record",
          contactedBy: member.statusHistory[member.statusHistory.length - 1].changedBy || "Admin",
          outcome: "Archived",
          contactNotes: member.statusHistory[member.statusHistory.length - 1].notes || "Archived record",
        }
      : null);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <MemberProfileHeader
        member={member}
        fullName={fullName}
        isDeleted={isDeleted}
        navigate={navigate}
        handleOpenContact={() => setIsContactModalOpen(true)}
        handleConvertLead={handleConvertLead}
        handleArchiveInquiry={handleArchiveInquiry}
        handleRestore={handleRestore}
        handleSoftDelete={handleSoftDelete}
        setIsEditModalOpen={setIsEditModalOpen}
        handleMoveToInquiry={handleMoveToInquiry}
      />

      {/* Inbound Inquiry Contact Interaction Record */}
      {contactDetailsToDisplay && (
        <InquiryContactRecordCard contactDetails={contactDetailsToDisplay} />
      )}

      {/* Physical Stats & Biometrics KPI Metric Strip (Full Width) */}
      <MemberVitalsCard
        member={member}
        imperialHeight={imperialHeight}
        imperialWeight={imperialWeight}
        age={age}
        bmiInfo={bmiInfo}
      />

      {/* Main 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Membership Plan & Dossier + Medical Clearance (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <MemberPlanDossierCard
            member={member}
            planDetails={planDetails}
            isDeleted={isDeleted}
          />

          <MemberMedicalClearanceCard
            hasMedicalDoc={hasMedicalDoc}
            medicalDocName={medicalDocName}
            medicalDocSubtext={medicalDocSubtext}
            setIsEditModalOpen={setIsEditModalOpen}
          />
        </div>

        {/* Right Column: Contact Channels, Residential Address & Emergency Contact (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <MemberContactCard
            member={member}
            age={age}
            emergencyName={emergencyName}
            emergencyRel={emergencyRel}
            emergencyPhone={emergencyPhone}
          />
        </div>
      </div>

      {/* Batch Assignments & History (Phase 6 Dedicated Card) */}
      <MemberBatchManagementCard
        primaryBatchDetails={primaryBatchDetails}
        activeFlexPasses={activeFlexPasses}
        setTransferModalTab={setTransferModalTab}
        setIsTransferModalOpen={setIsTransferModalOpen}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        formattedSelectedMonth={formattedSelectedMonth}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handleCurrentMonth={handleCurrentMonth}
        attendanceSummary={attendanceSummary}
        calendarDays={calendarDays}
        assignmentHistory={assignmentHistory}
      />

      {/* Batch Transfer / Flexible Pass Modal */}
      <BatchTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        member={member}
        currentBatch={
          allBatches.find((b) => b.id === member?.batchId) || {
            id: member?.batchId,
            name: member?.batchName,
            timingLabel: member?.batchTiming,
          }
        }
        allBatches={allBatches}
        initialTab={transferModalTab}
        onSuccess={handleTransferSuccess}
      />

      {/* Member Edit / Confirm Registration Modal */}
      <AdminMemberRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        memberToEdit={member}
      />

      {/* Contact Lead / Inquiry Interaction Modal */}
      <ContactLeadModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleRecordContact}
        leadName={fullName}
        leadPhone={member?.mobile}
        leadEmail={member?.email}
      />
    </div>
  );
}
