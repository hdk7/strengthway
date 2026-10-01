/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Shield,
  FileCheck,
  Download,
  Copy,
  Check,
  Dumbbell,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Activity,
  Heart,
  UserCheck,
  ArrowRightLeft,
  Clock,
  Layers,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMemberById,
  updateMember,
  softDeleteMember,
  restoreMember,
  getMemberMonthTracking,
} from "@/lib/membersService";
import { getBatches } from "@/lib/batchesService";
import BatchTransferModal from "@/pages/batches/components/BatchTransferModal";
import { AdminMemberRegistrationModal } from "./MembersRegistration";

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function calculateBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const heightM = h / 100;
  const bmiNum = w / (heightM * heightM);
  const bmi = bmiNum.toFixed(1);

  let category = "Normal";
  let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
  let barPercent = 50;
  let barColor = "bg-emerald-500";
  let advice =
    "Optimal athletic conditioning. Ready for high-intensity functional training and hypertrophy periodization.";

  if (bmiNum < 18.5) {
    category = "Underweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = Math.min(Math.max((bmiNum / 18.5) * 25, 8), 25);
    barColor = "bg-amber-500";
    advice =
      "Caloric surplus and progressive resistance training advised to build functional lean mass.";
  } else if (bmiNum >= 18.5 && bmiNum < 25) {
    category = "Normal";
    color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
    barPercent = 25 + ((bmiNum - 18.5) / 6.5) * 35;
    barColor = "bg-emerald-500";
    advice =
      "Optimal conditioning. Ideal for high-intensity functional training, barbell lifts, and endurance splits.";
  } else if (bmiNum >= 25 && bmiNum < 30) {
    category = "Overweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = 60 + ((bmiNum - 25) / 5) * 25;
    barColor = "bg-amber-500";
    advice =
      "Targeted metabolic conditioning, caloric control, and cardio interval splits recommended.";
  } else {
    category = "Obese";
    color = "text-rose-500 bg-rose-500/10 border-rose-500/25";
    barPercent = Math.min(85 + ((bmiNum - 30) / 10) * 15, 98);
    barColor = "bg-rose-500";
    advice =
      "Physician-guided low-impact training, joint-friendly cardio, and strict nutritional guidance advised.";
  }

  return { value: bmi, category, color, barPercent, barColor, advice };
}

function formatHeight(cm) {
  const c = parseFloat(cm);
  if (!c || isNaN(c)) return null;
  const totalInches = c / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
}

function formatWeight(kg) {
  const k = parseFloat(kg);
  if (!k || isNaN(k)) return null;
  const lbs = (k * 2.20462).toFixed(1);
  return `${lbs} lbs`;
}

export default function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [saving, setSaving] = useState(false);

  // Phase 6: Batch Assignments, Tracking & Transfer State
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
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

  const loadMonthTracking = useCallback(() => {
    if (!id) return;
    setIsTrackingLoading(true);
    getMemberMonthTracking(id, selectedMonth)
      .then((data) => setMonthTracking(data))
      .catch((err) => {
        console.error("Failed to load member month tracking:", err);
        setMonthTracking(null);
      })
      .finally(() => setIsTrackingLoading(false));
  }, [id, selectedMonth]);

  useEffect(() => {
    loadMonthTracking();
  }, [loadMonthTracking]);

  useEffect(() => {
    getBatches()
      .then((list) => setAllBatches(Array.isArray(list) ? list : []))
      .catch(() => setAllBatches([]));
  }, []);

  const handleTransferSuccess = async () => {
    try {
      const refreshedMember = await getMemberById(id);
      if (refreshedMember) setMember(refreshedMember);
    } catch {
      // ignore
    }
    loadMonthTracking();
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const formattedSelectedMonth = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  const primaryBatchDetails = useMemo(() => {
    const batchId = member?.batchId || monthTracking?.primaryBatch?.batchId;
    if (!batchId) return null;
    const match = allBatches.find((b) => b.id === batchId);
    return {
      id: batchId,
      name: match?.name || monthTracking?.primaryBatch?.batchName || member?.batchName || "Assigned Batch",
      timingLabel: match?.timingLabel || monthTracking?.primaryBatch?.batchTiming || member?.batchTiming || "Standard Time",
      daysLabel: match?.daysLabel || match?.daysPattern || monthTracking?.primaryBatch?.daysLabel || "Standard Days",
      room: match?.room || "",
      currentPax: match?.currentPax || 0,
      maxPax: match?.maxPax || 25,
    };
  }, [member, monthTracking, allBatches]);

  const activeFlexPasses = useMemo(() => {
    const passes = monthTracking?.activeFlexAssignments || member?.activeFlexAssignments || [];
    return Array.isArray(passes) ? passes : [];
  }, [monthTracking, member]);

  const assignmentHistory = useMemo(() => {
    if (monthTracking?.assignmentsHistory && Array.isArray(monthTracking.assignmentsHistory) && monthTracking.assignmentsHistory.length > 0) {
      return monthTracking.assignmentsHistory;
    }
    if (member?.batchHistory && Array.isArray(member.batchHistory)) {
      return member.batchHistory;
    }
    return [];
  }, [monthTracking, member]);

  const attendanceSummary = useMemo(() => {
    const s = monthTracking?.summary;
    if (!s) {
      return {
        totalLoggedSessions: 0,
        presentCount: 0,
        absentCount: 0,
        excusedCount: 0,
        primaryPresentCount: 0,
        flexPresentCount: 0,
        attendancePercentage: 0,
      };
    }
    return s;
  }, [monthTracking]);

  const calendarDays = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      const daysCount = new Date(y, m, 0).getDate();
      const attendanceMap = new Map();
      (monthTracking?.attendanceLedger || []).forEach((att) => {
        if (att.date) attendanceMap.set(att.date, att);
      });

      const days = [];
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let day = 1; day <= daysCount; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
        const dayDate = new Date(y, m - 1, day);
        const weekdayName = weekdays[dayDate.getDay()];
        const att = attendanceMap.get(dateStr);

        let code = "—";
        let statusLabel = "No Log / Rest Day";
        let variant = "neutral";

        if (att) {
          if (att.isFlexAttendance) {
            code = "F";
            statusLabel = `Flex Present (${att.batchName || "Flex Batch"}${att.checkInTime ? " • " + att.checkInTime : ""})`;
            variant = "flex";
          } else if (att.status === "PRESENT" || att.status === "LATE") {
            code = "P";
            statusLabel = `Present (${att.batchName || "Primary Batch"}${att.checkInTime ? " • " + att.checkInTime : ""})`;
            variant = "present";
          } else if (att.status === "ABSENT") {
            code = "A";
            statusLabel = `Absent (${att.batchName || "Scheduled Session"})`;
            variant = "absent";
          } else if (att.status === "EXCUSED") {
            code = "E";
            statusLabel = "Excused Absence";
            variant = "excused";
          }
        }

        days.push({
          day,
          dateStr,
          weekdayName,
          code,
          statusLabel,
          variant,
          record: att,
        });
      }
      return days;
    } catch {
      return [];
    }
  }, [selectedMonth, monthTracking]);

  const fullName = useMemo(() => {
    if (!member) return "";
    return `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member Profile";
  }, [member]);

  const initials = useMemo(() => {
    if (!member) return "M";
    return `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase() || "M";
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

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <Link
              to="/admin/trainers-members/members"
              className="hover:text-foreground transition-colors"
            >
              Members
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-semibold">{fullName}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display">
              {fullName}
            </h1>
            {isDeleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-destructive">
                Archived
              </span>
            ) : member.status === "Lead" || member.status === "Inquiry" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                Inquiry
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                {member.status || "Active"} Member
              </span>
            )}
          </div>
        </div>

        {/* Back & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/members")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Members List</span>
          </button>

          {!isDeleted && (member.status === "Lead" || member.status === "Inquiry") && (
            <button
              type="button"
              onClick={handleConvertLead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserCheck size={14} />
              <span>Confirm & Convert to Member</span>
            </button>
          )}

          {isDeleted ? (
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Restore Member</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSoftDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Archive (Soft Delete)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-background shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Inquiry Notice Banner if applicable */}
      {!isDeleted && (member.status === "Lead" || member.status === "Inquiry") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Prospective Inquiry Registration</h3>
              <p className="text-xs text-muted-foreground">
                This athlete is a registered inquiry. Confirm this inquiry to officially activate their
                gym membership.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConvertLead}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCheck size={14} />
            <span>Confirm Member Now</span>
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vitals, BMI Spectrum, Bio, Documents (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Physical Stats Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Height Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Height
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Activity size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-foreground">
                  {member.height ? `${member.height} cm` : "—"}
                </span>
                {imperialHeight && (
                  <p className="text-xs text-muted-foreground mt-0.5">Approx. {imperialHeight}</p>
                )}
              </div>
            </div>

            {/* Weight Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Weight
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Dumbbell size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-foreground">
                  {member.weight ? `${member.weight} kg` : "—"}
                </span>
                {imperialWeight && (
                  <p className="text-xs text-muted-foreground mt-0.5">Approx. {imperialWeight}</p>
                )}
              </div>
            </div>

            {/* Demographics Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Age / Gender
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-foreground">
                  {age !== null ? `${age} yrs` : "—"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.gender || "Not specified"}
                </p>
              </div>
            </div>

            {/* BMI Score Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  BMI Score
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Heart size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-foreground">
                  {bmiInfo ? bmiInfo.value : "—"}
                </span>
                {bmiInfo ? (
                  <span
                    className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${bmiInfo.color}`}
                  >
                    {bmiInfo.category}
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Awaiting height/weight</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Fitness Clearance Document */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Medical Clearance & Physical Certificate
                </h3>
              </div>
              {hasMedicalDoc ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                  <Check size={12} />
                  <span>Verified On File</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Not uploaded</span>
              )}
            </div>

            {hasMedicalDoc && medicalDocName ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background p-4.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <FileCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {medicalDocName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {medicalDocSubtext}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toast.success("Opening document preview…")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Downloading medical certificate…")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/25 px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center text-xs text-muted-foreground">
                <p>No physician clearance file currently uploaded for this member.</p>
                <p className="mt-1">
                  Admins can attach PDF medical certificates via the{" "}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-accent underline font-medium hover:text-accent/80 cursor-pointer"
                  >
                    Edit Profile
                  </button>{" "}
                  window.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact Channels, Residential Address, Emergency Contact, Enrolled Membership Plan, Membership Account Dossier (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 1: Contact Channels, Residential Address & Emergency Contact */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Phone size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Contact Channels & Residence
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Communication channels, home address, and emergency contact
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Contact Channels */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Contact Channels
              </span>

              <div className="space-y-2">
                {/* Mobile Phone */}
                <div className="group rounded-2xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-accent/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                      <Phone size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Mobile Phone
                      </span>
                      <span className="text-xs font-bold text-foreground font-mono truncate block">
                        {member.mobile || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {member.mobile && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(member.mobile, "mobile", "Mobile number")}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedField === "mobile" ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <a
                          href={`tel:${member.mobile}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span>Call</span>
                          <ExternalLink size={10} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div className="group rounded-2xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-accent/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Email Address
                      </span>
                      <span className="text-xs font-bold text-foreground truncate block">
                        {member.email || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {member.email && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(member.email, "email", "Email address")}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Copy email"
                        >
                          {copiedField === "email" ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span>Mail</span>
                          <ExternalLink size={10} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Date of Birth & Age */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                      <Calendar size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Date of Birth
                      </span>
                      <span className="text-xs font-bold text-foreground font-mono block">
                        {member.dob
                          ? new Date(member.dob).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  {age !== null && (
                    <span className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                      {age} Yrs old
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Residential Address */}
            <div className="space-y-2.5 pt-3.5 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Residential Address
                </span>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                {member.address ? (
                  <>
                    <p className="font-semibold text-xs leading-relaxed text-foreground">
                      {member.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {member.city && (
                        <span className="rounded-md bg-card px-2 py-0.5 text-[11px] font-semibold border border-border text-foreground">
                          {member.city}
                        </span>
                      )}
                      {member.state && (
                        <span className="rounded-md bg-card px-2 py-0.5 text-[11px] font-semibold border border-border text-foreground">
                          {member.state}
                        </span>
                      )}
                      {member.pincode && (
                        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-mono font-bold border border-accent/25 text-accent">
                          PIN: {member.pincode}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {member.country || "India"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No residential address recorded on file.</p>
                )}
              </div>
            </div>

            {/* 3. Emergency Contact */}
            <div className="space-y-2.5 pt-3.5 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield size={13} className="text-rose-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Emergency Contact
                  </span>
                </div>
                {emergencyRel && (
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 border border-rose-500/25">
                    {emergencyRel}
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
                {emergencyName ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-xs text-foreground">{emergencyName}</p>
                      <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                        {emergencyPhone || "No phone listed"}
                      </p>
                    </div>

                    {emergencyPhone && (
                      <a
                        href={`tel:${emergencyPhone}`}
                        className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-rose-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-rose-600 transition-colors"
                      >
                        <Phone size={12} />
                        <span>Emergency Call</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No emergency contact recorded on profile.</p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Enrolled Membership Plan & Membership Account Dossier */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Award size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Membership Plan & Dossier
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Subscription agreement, batch allocation, and facility access
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Enrolled Membership Plan */}
            {planDetails && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Enrolled Membership Plan
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    {planDetails.name}
                  </span>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-border/40 text-center">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Duration
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {planDetails.durationMonths} Month{planDetails.durationMonths > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Fee
                      </span>
                      <span className="text-xs font-bold text-accent font-mono">
                        {planDetails.formattedPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Expires
                      </span>
                      <span className="text-xs font-bold text-emerald-400 truncate block">
                        {planDetails.formattedEnd}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Term Window:</span>
                      <span className="font-medium text-foreground">
                        {planDetails.formattedStart} — {planDetails.formattedEnd}
                      </span>
                    </div>

                    {member.paymentDetails && (
                      <>
                        <div className="flex items-center justify-between text-muted-foreground pt-1.5 border-t border-border/40">
                          <span>Payment Method:</span>
                          <span className="font-semibold text-foreground">
                            {member.paymentDetails.method}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Txn Reference:</span>
                          <span className="font-mono text-[11px] text-foreground font-semibold">
                            {member.paymentDetails.transactionId}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Receipt Number:</span>
                          <span className="font-mono text-[11px] text-emerald-400 font-bold">
                            {member.paymentDetails.receiptNo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Payment Status:</span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {member.paymentDetails.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Membership Account Dossier */}
            <div className="space-y-2.5 pt-3.5 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <FileCheck size={13} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Membership Account Dossier
                </span>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs divide-y divide-border/40">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-muted-foreground">System Record ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground">{member.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(member.id, "memberId", "Member ID")}
                      className="rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Copy ID"
                    >
                      {copiedField === "memberId" ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>

                {member.batchId && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Assigned Batch:</span>
                    <Link
                      to={`/admin/batches/${member.batchId}`}
                      className="font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      <span>{member.batchId}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        ({member.batchTiming || "Morning"})
                      </span>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Enrolled Date:</span>
                  <span className="font-medium text-foreground">
                    {member.registeredAt
                      ? new Date(member.registeredAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Facility Access:</span>
                  <span className="font-semibold text-emerald-400">
                    Full Gym Floor & Equipment
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Record Status:</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {isDeleted ? "Archived" : member.status || "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CARD 3: Batch Assignments & History (Phase 6 Dedicated Card)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-8">
        {/* Card Header & Main Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Batch Assignments & History
                </h3>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
                  Container Management
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current batch container allocation, active flexible passes, month-wise attendance compliance, and transition audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTransferModalTab("transfer");
                setIsTransferModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRightLeft size={14} />
              <span>Transfer Batch / Flex Pass</span>
            </button>
          </div>
        </div>

        {/* 1. Current Assignments Badges (Primary Allocation & Active Flex Passes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Batch Container Tile */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Primary Batch Allocation
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Primary Active
              </span>
            </div>

            {primaryBatchDetails ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/admin/batches/${primaryBatchDetails.id}`}
                      className="text-base font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
                    >
                      <span>{primaryBatchDetails.name}</span>
                      <ExternalLink size={13} className="text-muted-foreground" />
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Batch ID: {primaryBatchDetails.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 p-2.5">
                    <Clock size={14} className="text-accent shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Timing
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {primaryBatchDetails.timingLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 p-2.5">
                    <Calendar size={14} className="text-accent shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Days
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {primaryBatchDetails.daysLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">No primary batch currently allocated.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTransferModalTab("transfer");
                    setIsTransferModalOpen(true);
                  }}
                  className="mt-2 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft size={12} />
                  <span>Assign Primary Batch</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Flex Passes Tile */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Temporary Flex Passes
                </span>
              </div>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                {activeFlexPasses.length} Active {activeFlexPasses.length === 1 ? "Pass" : "Passes"}
              </span>
            </div>

            {activeFlexPasses.length > 0 ? (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {activeFlexPasses.map((pass, idx) => (
                  <div
                    key={pass.id || idx}
                    className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/batches/${pass.targetBatchId}`}
                        className="text-xs font-bold text-foreground hover:text-amber-500 transition-colors flex items-center gap-1"
                      >
                        <span>{pass.targetBatchName || pass.targetBatchId}</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </Link>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {pass.startDate} → {pass.endDate || "Ongoing"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                        Permitted Days:
                      </span>
                      {Array.isArray(pass.selectedDays) && pass.selectedDays.length > 0 ? (
                        pass.selectedDays.map((day) => (
                          <span
                            key={day}
                            className="rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">All batch days</span>
                      )}
                    </div>

                    {pass.reason && (
                      <p className="text-[11px] text-muted-foreground italic border-t border-amber-500/15 pt-1.5">
                        "{pass.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No active temporary flex passes. Member is authorized solely for primary batch sessions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTransferModalTab("flex");
                    setIsTransferModalOpen(true);
                  }}
                  className="mt-2 text-xs font-semibold text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Grant Flex Pass</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Month-Wise Attendance History & Visual Day-by-Day Calendar Pills */}
        <div className="rounded-2xl border border-border/80 bg-background/50 p-5 sm:p-6 space-y-6">
          {/* Section Header with Month Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                <span>Month-Wise Attendance History & Compliance</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily attendance check-ins, flex pass attendances, and overall monthly session compliance rate.
              </p>
            </div>

            {/* Month Navigator Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="relative px-2">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    title="Select Month"
                  />
                  <span className="text-xs font-bold text-foreground font-mono cursor-pointer select-none">
                    {formattedSelectedMonth}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Current
              </button>
            </div>
          </div>

          {/* Compliance Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Main Attendance Percentage */}
            <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Monthly Compliance Rate
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                    attendanceSummary.attendancePercentage >= 80
                      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
                      : attendanceSummary.attendancePercentage >= 60
                      ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                      : "text-rose-500 bg-rose-500/10 border-rose-500/30"
                  }`}
                >
                  {attendanceSummary.attendancePercentage}% Attendance
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">
                    {attendanceSummary.attendancePercentage}%
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    ({attendanceSummary.presentCount}/{attendanceSummary.totalLoggedSessions} Sessions)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      attendanceSummary.attendancePercentage >= 80
                        ? "bg-emerald-500"
                        : attendanceSummary.attendancePercentage >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(attendanceSummary.attendancePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Present in Primary */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">Primary Present</span>
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-500">
                {attendanceSummary.primaryPresentCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sessions in primary container</p>
            </div>

            {/* Flex Attendance */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">Flex Present</span>
                <Sparkles size={15} className="text-amber-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-amber-500">
                {attendanceSummary.flexPresentCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Authorized flex pass visits</p>
            </div>

            {/* Absent Sessions */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">Absent / Excused</span>
                <XCircle size={15} className="text-rose-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-rose-500">
                {attendanceSummary.absentCount}
                {attendanceSummary.excusedCount > 0 && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    (+{attendanceSummary.excusedCount} exc)
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Missed scheduled sessions</p>
            </div>
          </div>

          {/* Visual Day-by-Day Calendar Pills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Day-by-Day Session Pills ({formattedSelectedMonth})
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {calendarDays.length} Days in Month
              </span>
            </div>

            {/* Pills Container */}
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-16 gap-2">
              {calendarDays.map((d) => {
                let badgeClass =
                  "border-border/50 bg-muted/20 text-muted-foreground/60 hover:border-border";
                let textClass = "text-muted-foreground/80";

                if (d.variant === "present") {
                  badgeClass =
                    "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25";
                  textClass = "text-emerald-400 font-black";
                } else if (d.variant === "flex") {
                  badgeClass =
                    "border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 shadow-xs";
                  textClass = "text-amber-400 font-black";
                } else if (d.variant === "absent") {
                  badgeClass =
                    "border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25";
                  textClass = "text-rose-400 font-bold";
                } else if (d.variant === "excused") {
                  badgeClass =
                    "border-sky-500/40 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25";
                  textClass = "text-sky-400 font-bold";
                }

                return (
                  <div
                    key={d.dateStr}
                    title={`${d.dateStr} (${d.weekdayName}): ${d.statusLabel}`}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-default select-none ${badgeClass}`}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {d.day}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/80">
                      {d.weekdayName}
                    </span>
                    <span className={`mt-1 text-xs font-mono ${textClass}`}>
                      {d.code}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                Legend:
              </span>
              <div className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  P
                </span>
                <span>Present (Primary Batch)</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                  F
                </span>
                <span>Flex Pass Session</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                  A
                </span>
                <span>Absent</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-sky-500/20 text-sky-400 text-[10px] font-black border border-sky-500/30">
                  E
                </span>
                <span>Excused</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-muted/40 text-muted-foreground text-[10px] font-bold border border-border/60">
                  —
                </span>
                <span>No Session / Rest</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Batch Assignment History Ledger (Audit Trail) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-accent" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Batch Assignment History Ledger (Audit Trail)
              </h4>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {assignmentHistory.length} {assignmentHistory.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          {assignmentHistory.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto max-h-[380px] no-scrollbar pr-1">
              <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-2.5 px-4 sm:px-5">Assignment Type</th>
                    <th className="py-2.5 px-4 sm:px-5">Batch Transition</th>
                    <th className="py-2.5 px-4 sm:px-5">Effective Window / Days</th>
                    <th className="py-2.5 px-4 sm:px-5">Authorized By & Reason</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Status / Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium">
                  {assignmentHistory.map((item, idx) => {
                    const type = item.assignmentType || item.type || "ASSIGNMENT";
                    const isTransfer = type.includes("TRANSFER");
                    const isFlex = type.includes("FLEX");

                    return (
                      <tr key={item.id || idx} className="group transition-all duration-150 hover:translate-y-[-1px]">
                        {/* Assignment Type */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              isTransfer
                                ? "bg-accent/10 text-accent border-accent/30"
                                : isFlex
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            }`}
                          >
                            {type}
                          </span>
                        </td>

                        {/* Batch Transition */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">
                              {item.fromBatchName || item.fromBatchId || "Initial"}
                            </span>
                            <ChevronRight size={13} className="text-muted-foreground/60 shrink-0" />
                            <span className="font-bold text-foreground">
                              {item.toBatchName || item.toBatchId || item.batchName || item.batchId || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Effective Window / Flex Days */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="font-mono text-foreground font-medium text-xs">
                              {item.startDate || item.effectiveDate || "Immediate"}
                              {" → "}
                              {item.endDate || "Ongoing"}
                            </div>
                            {Array.isArray(item.flexDays) && item.flexDays.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.flexDays.map((d) => (
                                  <span
                                    key={d}
                                    className="rounded-full bg-muted/60 border border-border/50 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground"
                                  >
                                    {d.slice(0, 3)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Transferred By & Reason */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors max-w-xs">
                          <div>
                            <span className="font-semibold text-foreground block text-xs">
                              {item.transferredBy || item.changedBy || "System Admin"}
                            </span>
                            <p className="text-[11px] text-muted-foreground truncate" title={item.reason}>
                              {item.reason || "Administrative assignment"}
                            </p>
                          </div>
                        </td>

                        {/* Status / Logged Date */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : item.status === "REVOKED"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {item.status || "ACTIVE"}
                            </span>
                            <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No historical batch transfers or flexible pass transitions recorded for this member.
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
