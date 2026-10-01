/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar,
  CalendarRange,
  Users,
  UserCheck,
  Edit3,
  Dumbbell,
  Sparkles,
  ArrowLeft,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  FileText,
  Check,
  Layers,
  X,
  Plus,
  Phone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  getBatchById,
  getBatches,
  getBatchTrainers,
  getBatchMembers,
  getScheduledClassesByBatch,
  updateDayClass,
  updateBatch,
  enrollMemberInBatch,
  unenrollMemberFromBatch,
  getBatchMonthTracking,
  revokeFlexibleAssignment,
} from "@/lib/batchesService";
import { recordTrainerLog } from "@/lib/attendanceService";
import BatchTransferModal from "./components/BatchTransferModal";
import {
  getMasterScheduleByBatchId,
  getMasterSchedules,
  getMasterScheduleById,
  getScheduleItems,
  updateMasterClassItem,
  createMasterSchedule,
  assignBatchesToProgram,
  resolveAssignedBatches,
  getSessions,
  updateSessionStatus,
  updateSession,
} from "@/lib/masterScheduleService";
import { getTrainers, createTrainer, getTrainerPhoto } from "@/lib/trainersService";
import { getMembers, createMember, updateMember } from "@/lib/membersService";
import { InputField, TextareaField } from "@/components/form";

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trainers" | "members"
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);

  // Master Class Schedule mapped to this batch
  const [masterSchedule, setMasterSchedule] = useState(null);
  const [masterClassItems, setMasterClassItems] = useState([]);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("all");
  const [isEditMasterItemOpen, setIsEditMasterItemOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  const [allMasterSchedules, setAllMasterSchedules] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  // Floor Sessions submodule tracking state inside this batch
  const [sessions, setSessions] = useState([]);
  const [sessionsTab, setSessionsTab] = useState("Upcoming"); // "Upcoming" | "Today" | "Completed" | "Cancelled" | "All"
  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState(null);
  const [sessionNoteText, setSessionNoteText] = useState("");

  // Search filter for members and trainers
  const [memberSearch, setMemberSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");

  // All trainers & members for assignment
  const [allTrainers, setAllTrainers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  // Month-wise Category Tracking state
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Batch Transfer Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetMember, setTransferTargetMember] = useState(null);
  const [transferModalTab, setTransferModalTab] = useState("transfer");

  // Add Trainer Modal state
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [newTrainerForm, setNewTrainerForm] = useState({
    name: "",
    phone: "",
    email: "",
    experience: "3+ Years",
    gender: "Male",
  });

  // Substitute Coach Modal state
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [substituteForm, setSubstituteForm] = useState({
    primaryTrainerId: "",
    substituteTrainerId: "",
    date: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  // Add Member Modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberModalSearch, setMemberModalSearch] = useState("");
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    gender: "Male",
    planName: "Quarterly Strength (12 Weeks)",
  });

  // Modals state
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const loadBatchData = useCallback(async () => {
    const targetId = id || "BATCH-01";
    try {
      const [foundBatch, cls, trnsList, memsList, allB, allScheds, floorSessions] = await Promise.all([
        getBatchById(targetId),
        getScheduledClassesByBatch(targetId),
        getTrainers(),
        getMembers(true),
        getBatches(),
        getMasterSchedules(),
        getSessions(),
      ]);

      setAllBatches(Array.isArray(allB) ? allB : []);
      setAllMasterSchedules(Array.isArray(allScheds) ? allScheds : []);
      setSessions(Array.isArray(floorSessions) ? floorSessions : []);

      if (foundBatch) {
        setBatch(foundBatch);
        setScheduledClasses(Array.isArray(cls) ? cls : []);

        const allT = Array.isArray(trnsList) ? trnsList : [];
        setAllTrainers(allT);
        const resolvedTrns = getBatchTrainers(foundBatch.trainerIds, allT, foundBatch.id);
        setTrainers(resolvedTrns);

        const allM = Array.isArray(memsList) ? memsList : [];
        setAllMembers(allM);
        const assignedM = allM.filter(
          (m) =>
            !m.isDeleted &&
            (m.batchId === foundBatch.id || m.schedule?.batchId === foundBatch.id)
        );
        setMembers(assignedM);
      } else {
        setBatch(null);
      }

      // Load mapped Master Class Schedule for this batch
      const mcs = await getMasterScheduleByBatchId(targetId);
      setMasterSchedule(mcs);
      if (mcs) {
        const items = await getScheduleItems(mcs.id);
        setMasterClassItems(Array.isArray(items) ? items : []);
      } else {
        setMasterClassItems([]);
      }
    } catch (err) {
      console.error("Failed to load batch data:", err);
      toast.error("Failed to load batch details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadMonthTracking = useCallback(async (batchId, ym) => {
    if (!batchId) return;
    setIsTrackingLoading(true);
    try {
      const data = await getBatchMonthTracking(batchId, ym);
      setMonthTracking(data);
    } catch (err) {
      console.error("Failed to load month tracking:", err);
    } finally {
      setIsTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatchData();
  }, [loadBatchData]);

  useEffect(() => {
    const targetId = id || "BATCH-01";
    loadMonthTracking(targetId, selectedMonth);
  }, [id, selectedMonth, loadMonthTracking]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(ym);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const ym = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(ym);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const handleRevokeFlexPass = async (assignmentId, memberName) => {
    if (!window.confirm(`Are you sure you want to revoke the flexible batch pass for ${memberName}?`)) {
      return;
    }
    try {
      await revokeFlexibleAssignment(assignmentId, {
        reason: "Revoked from Batch detail page",
        revokedBy: "Admin",
      });
      toast.success(`Flexible pass for ${memberName} has been revoked.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      console.error("Failed to revoke flex pass:", err);
      toast.error(err.message || "Failed to revoke flexible pass.");
    }
  };

  // Occupancy stats
  const capacity = batch?.maxPax || 28;
  const currentPax = members.length > 0 ? members.length : (batch?.currentPax || 0);
  const occupancyPercent = Math.min(100, Math.round((currentPax / capacity) * 100));
  const remainingSlots = Math.max(0, capacity - currentPax);

  // Trainer assignment handlers
  const handleAssignTrainer = async (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      if (!currentIds.includes(trainerId)) {
        const updated = [...currentIds, trainerId];
        await updateBatch(batch.id, { trainerIds: updated });
        toast.success(`${trainerName || "Trainer"} assigned to ${batch.name}.`);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to assign trainer to batch.");
    }
  };

  const handleUnassignTrainer = async (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      const updated = currentIds.filter((tid) => tid !== trainerId);
      await updateBatch(batch.id, { trainerIds: updated });

      const targetTrainer = allTrainers.find((t) => t.id === trainerId);
      if (targetTrainer && Array.isArray(targetTrainer.batchIds) && targetTrainer.batchIds.includes(batch.id)) {
        await updateTrainer(trainerId, {
          batchIds: targetTrainer.batchIds.filter((bId) => bId !== batch.id),
        }).catch(() => null);
      }

      toast.success(`${trainerName || "Trainer"} removed from ${batch.name}.`);
      await loadBatchData();
    } catch {
      toast.error("Failed to unassign trainer.");
    }
  };

  const handleCreateAndAssignTrainer = async (e) => {
    e.preventDefault();
    if (!newTrainerForm.name.trim()) {
      toast.error("Trainer name is required.");
      return;
    }
    try {
      const created = await createTrainer({
        name: newTrainerForm.name.trim(),
        phone: newTrainerForm.phone.trim(),
        email: newTrainerForm.email.trim(),
        experience: newTrainerForm.experience,
        gender: newTrainerForm.gender,
        status: "Active",
      });
      if (batch && created?.id) {
        const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
        const updated = [...currentIds, created.id];
        await updateBatch(batch.id, { trainerIds: updated });
      }
      toast.success(`${created.name} registered and assigned to ${batch.name}!`);
      setNewTrainerForm({
        name: "",
        phone: "",
        email: "",
        experience: "3+ Years",
        gender: "Male",
      });
      setIsAddTrainerOpen(false);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to create and assign trainer.");
    }
  };

  const handleAssignSubstitute = async (e) => {
    e.preventDefault();
    if (!substituteForm.substituteTrainerId) {
      toast.error("Please select a substitute trainer.");
      return;
    }
    if (substituteForm.substituteTrainerId === substituteForm.primaryTrainerId) {
      toast.error("Substitute coach cannot be the same as the primary coach.");
      return;
    }
    try {
      const subTrainer = allTrainers.find((t) => t.id === substituteForm.substituteTrainerId);
      const priTrainer = allTrainers.find((t) => t.id === substituteForm.primaryTrainerId);

      await recordTrainerLog({
        date: substituteForm.date || new Date().toISOString().slice(0, 10),
        trainerId: substituteForm.substituteTrainerId,
        trainerName: subTrainer?.name || "Substitute Coach",
        batchId: batch.id,
        status: "SUBSTITUTE",
        substituteTrainerId: substituteForm.primaryTrainerId || null,
        durationMinutes: 60,
        notes: substituteForm.reason || `Substitute coach for ${priTrainer?.name || "Primary Coach"}`,
      });

      if (batch && !batch.trainerIds?.includes(substituteForm.substituteTrainerId)) {
        await updateBatch(batch.id, {
          trainerIds: [...(batch.trainerIds || []), substituteForm.substituteTrainerId],
        });
      }

      toast.success(
        `${subTrainer?.name || "Coach"} assigned as substitute coach for ${batch.name}!`
      );
      setIsSubstituteModalOpen(false);
      setSubstituteForm({
        primaryTrainerId: "",
        substituteTrainerId: "",
        date: new Date().toISOString().slice(0, 10),
        reason: "",
      });
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch (err) {
      console.error("Failed to assign substitute coach:", err);
      toast.error(err.message || "Failed to assign substitute coach.");
    }
  };

  // Member assignment handlers
  const handleEnrollExistingMember = async (member) => {
    if (!batch) return;
    try {
      await updateMember(member.id, { batchId: batch.id });
      await enrollMemberInBatch(batch.id, member.id);
      toast.success(`${member.firstName} ${member.lastName || ""} enrolled into ${batch.name}!`);
      await loadBatchData();
    } catch {
      toast.error("Failed to enroll member in batch.");
    }
  };

  const handleRemoveMemberFromBatch = async (memberId, memberName) => {
    if (!batch) return;
    try {
      await unenrollMemberFromBatch(batch.id, memberId);
      await updateMember(memberId, { batchId: "" }).catch(() => null);
      toast.success(`${memberName || "Member"} removed from ${batch.name}.`);
      await loadBatchData();
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleRegisterAndEnrollMember = async (e) => {
    e.preventDefault();
    if (!newMemberForm.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!newMemberForm.mobile.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    try {
      const created = await createMember({
        firstName: newMemberForm.firstName.trim(),
        lastName: newMemberForm.lastName.trim(),
        mobile: newMemberForm.mobile.trim(),
        email: newMemberForm.email.trim(),
        gender: newMemberForm.gender,
        batchId: batch.id,
        planName: newMemberForm.planName,
        status: "Active",
        registeredAt: new Date().toISOString(),
      });
      if (created?.id) {
        await enrollMemberInBatch(batch.id, created.id);
      }
      toast.success(`${created.firstName} enrolled into ${batch.name}!`);
      setNewMemberForm({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        gender: "Male",
        planName: "Quarterly Strength (12 Weeks)",
      });
      setIsAddMemberOpen(false);
      await loadBatchData();
    } catch {
      toast.error("Failed to register member.");
    }
  };

  // Filtered primary enrolled members with monthly tracking metrics
  const filteredPrimaryMembers = useMemo(() => {
    const trackedMap = new Map(
      (monthTracking?.category2_Members?.primaryMembers || []).map((m) => [m.memberId || m.id, m])
    );

    const baseList = members.map((m) => {
      const tracked = trackedMap.get(m.id);
      return {
        ...m,
        attendanceRate: tracked?.attendanceRate ?? 0,
        presentSessions: tracked?.presentSessions ?? 0,
        totalLoggedSessions: tracked?.totalLoggedSessions ?? 0,
        isFlexOutActive: Boolean(tracked?.isFlexOutActive),
        flexOutDetails: tracked?.flexOutDetails || [],
      };
    });

    if (!memberSearch.trim()) return baseList;
    const q = memberSearch.toLowerCase();
    return baseList.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, monthTracking, memberSearch]);

  // Filtered inbound flexible attendees for this batch in selected month
  const filteredFlexInMembers = useMemo(() => {
    const list = monthTracking?.category2_Members?.flexInMembers || [];
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.primaryBatchName?.toLowerCase().includes(q)
    );
  }, [monthTracking, memberSearch]);

  // Tracked trainers with monthly coaching hours & classes conducted
  const trainersWithTracking = useMemo(() => {
    const trackedList = monthTracking?.category1_Trainers || [];
    return trainers.map((trn) => {
      const match = trackedList.find((t) => t.trainerId === trn.id);
      return {
        ...trn,
        classesConducted: match?.classesConducted ?? 0,
        coachingHours: match?.coachingHours ?? 0,
      };
    });
  }, [trainers, monthTracking]);

  // Filtered trainers
  const filteredTrainers = useMemo(() => {
    if (!trainerSearch.trim()) return trainersWithTracking;
    const q = trainerSearch.toLowerCase();
    return trainersWithTracking.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.phone?.includes(q) ||
        t.id?.toLowerCase().includes(q)
    );
  }, [trainersWithTracking, trainerSearch]);

  // Current batch sessions mapped from month-tracking (or sessions state / masterClassItems)
  const currentBatchSessions = useMemo(() => {
    if (!batch) return [];
    // Prioritize month-wise tracking sessions if available for selectedMonth
    const monthSessions = monthTracking?.category3_ScheduledClasses?.sessions;
    if (Array.isArray(monthSessions) && monthSessions.length > 0) {
      return monthSessions;
    }
    const list = sessions.filter((s) => {
      if (s.batchId !== batch.id) return false;
      if (s.sessionDate && selectedMonth) {
        return s.sessionDate.startsWith(selectedMonth);
      }
      return true;
    });
    if (list.length > 0) return list;

    // Fallback to all sessions for this batch
    const batchList = sessions.filter((s) => s.batchId === batch.id);
    if (batchList.length > 0) return batchList;

    // Fallback if masterClassItems are present but sessions not yet generated
    return masterClassItems.map((item) => ({
      id: `SES-${masterSchedule?.id || "mcs"}-${batch.id}-${String(item.classNumber).padStart(2, "0")}`,
      masterClassItemId: item.id,
      classNumber: item.classNumber,
      weekNumber: item.weekNumber,
      dayOfWeek: item.dayOfWeek,
      batchId: batch.id,
      batchName: batch.name || batch.shortName,
      coachName: masterSchedule?.coachName || "Assigned Coach",
      timing: batch.timingLabel || `${batch.startTime} - ${batch.endTime}`,
      room: batch.room || "Studio 1",
      attendeesCount: batch.currentPax || members.length,
      sessionDate: item.sessionDate || "",
      displayDate: item.displayDate || "",
      subject: item.subject,
      message: item.message,
      status: "SCHEDULED",
      notes: "",
    }));
  }, [sessions, batch, monthTracking, selectedMonth, masterClassItems, masterSchedule, members.length]);



  const getTodayStrings = () => {
    const now = new Date();
    const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const utc = now.toISOString().slice(0, 10);
    return [local, utc];
  };

  // Tab counts for sessions within this batch
  const sessionTabCounts = useMemo(() => {
    const [todayLocal, todayUtc] = getTodayStrings();
    let upcoming = 0;
    let todayCount = 0;
    let completed = 0;
    let cancelled = 0;

    currentBatchSessions.forEach((s) => {
      if (s.status === "CANCELLED") {
        cancelled++;
      } else if (s.status === "COMPLETED") {
        completed++;
      } else if (
        s.status === "TODAY" ||
        s.sessionDate === todayLocal ||
        s.sessionDate === todayUtc
      ) {
        todayCount++;
      } else {
        upcoming++;
      }
    });

    return {
      all: currentBatchSessions.length,
      upcoming,
      today: todayCount,
      completed,
      cancelled,
    };
  }, [currentBatchSessions]);

  // Filtered sessions based on active session submodule tab and week filter
  const displayedSessions = useMemo(() => {
    const [todayLocal, todayUtc] = getTodayStrings();

    let filtered = currentBatchSessions.filter((s) => {
      if (sessionsTab === "Cancelled") return s.status === "CANCELLED";
      if (sessionsTab === "Completed") return s.status === "COMPLETED";
      if (sessionsTab === "Today") {
        if (s.status === "CANCELLED") return false;
        return s.status === "TODAY" || s.sessionDate === todayLocal || s.sessionDate === todayUtc;
      }
      if (sessionsTab === "Upcoming") {
        if (s.status === "CANCELLED" || s.status === "COMPLETED") return false;
        return s.sessionDate !== todayLocal && s.sessionDate !== todayUtc && s.status !== "TODAY";
      }
      // "All" / Curriculum view
      return true;
    });

    if (selectedWeekFilter !== "all") {
      filtered = filtered.filter((s) => s.weekNumber === Number(selectedWeekFilter));
    }

    return filtered.sort((a, b) => a.classNumber - b.classNumber);
  }, [currentBatchSessions, sessionsTab, selectedWeekFilter]);

  // Floor session tracking operations
  const handleMarkCompleted = async (sessionId, subject) => {
    try {
      await updateSessionStatus(sessionId, "COMPLETED");
      toast.success(`Class "${subject}" marked as Completed.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to update class status.");
    }
  };

  const handleCancelSession = async (sessionId, subject) => {
    try {
      await updateSessionStatus(sessionId, "CANCELLED");
      toast.info(`Class "${subject}" has been marked as Cancelled.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to cancel class.");
    }
  };

  const handleRestoreSession = async (sessionId, subject) => {
    try {
      await updateSessionStatus(sessionId, "SCHEDULED");
      toast.success(`Class "${subject}" restored to Scheduled.`);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to restore class.");
    }
  };

  const handleSaveSessionNotes = async (e) => {
    e.preventDefault();
    if (!selectedSessionForNotes) return;
    try {
      await updateSession(selectedSessionForNotes.id, { notes: sessionNoteText });
      toast.success("Coach note saved successfully.");
      setSelectedSessionForNotes(null);
      await loadBatchData();
      if (batch?.id) {
        await loadMonthTracking(batch.id, selectedMonth);
      }
    } catch {
      toast.error("Failed to save coach note.");
    }
  };

  const handleAssignProgram = async (programId) => {
    if (!batch || !programId) return;
    try {
      // If switching from an existing schedule, remove this batch from old schedule
      if (masterSchedule && masterSchedule.id !== programId) {
        const oldBatches = (masterSchedule.batchIds || []).filter((bId) => bId !== batch.id);
        await assignBatchesToProgram(masterSchedule.id, oldBatches);
      }
      const targetProg = await getMasterScheduleById(programId);
      if (targetProg) {
        const existingBatches = Array.isArray(targetProg.batchIds)
          ? targetProg.batchIds
          : targetProg.batchId
            ? [targetProg.batchId]
            : [];
        if (!existingBatches.includes(batch.id)) {
          await assignBatchesToProgram(targetProg.id, [...existingBatches, batch.id]);
        }
        toast.success(`"${targetProg.name}" assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to assign program.");
    }
  };

  const handleUnassignProgram = async (programId) => {
    if (!batch || !programId) return;
    try {
      const targetProg = await getMasterScheduleById(programId);
      if (targetProg) {
        const remainingBatches = (targetProg.batchIds || []).filter((bId) => bId !== batch.id);
        await assignBatchesToProgram(programId, remainingBatches);
        toast.info(`Unassigned "${targetProg.name}" from ${batch.name}.`);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to unassign program.");
    }
  };

  const handleCreateMasterScheduleForBatch = async () => {
    if (!batch) return;
    try {
      const created = await createMasterSchedule({
        batchIds: [batch.id],
        batchId: batch.id,
        name: `${batch.shortName || batch.name} Program`,
        status: "Active",
      });
      if (created) {
        toast.success(`Master Class Program created and assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        await loadBatchData();
      }
    } catch {
      toast.error("Failed to initialize Master Class Program.");
    }
  };

  const handleSaveMasterClassItem = async (e) => {
    e.preventDefault();
    if (!editingMasterItem) return;
    try {
      const updated = await updateMasterClassItem(editingMasterItem.id, {
        subject: editingMasterItem.subject,
        message: editingMasterItem.message,
      });
      if (updated) {
        setMasterClassItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setIsEditMasterItemOpen(false);
        toast.success(`Class ${updated.classNumber} curriculum updated!`);
      }
    } catch {
      toast.error("Failed to update class details.");
    }
  };

  const handleSaveScheduledClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      const updated = await updateDayClass(editingClass.id, editingClass, batch?.id);
      if (updated) {
        setScheduledClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setIsEditClassOpen(false);
        toast.success(`Scheduled class for ${updated.day} updated!`);
      }
    } catch {
      toast.error("Failed to update scheduled class.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 rounded bg-muted" />

        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <div className="h-8 w-60 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted/60" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-muted" />
        </div>

        {/* KPIs skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card p-5" />
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Batch Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested batch does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/admin/batches")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} /> Back to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/batches" className="hover:text-foreground transition-colors">
          Batches
        </Link>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="font-semibold text-foreground">{batch.shortName || batch.name}</span>
      </nav>

      {/* 2. Hero Card matching requirement wireframe */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all">
        {/* Glow Accent Effect */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            {/* Title & Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {batch.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Timings & Days */}
            <div className="space-y-1.5 text-sm sm:text-base">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Clock size={16} className="text-muted-foreground shrink-0" />
                <span>{batch.timingLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={16} className="text-muted-foreground shrink-0" />
                <span>{batch.daysLabel}</span>
              </div>
            </div>
          </div>

          {/* Month Selector Component in Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 z-10">
            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1 text-xs sm:text-sm font-bold text-foreground min-w-[140px] justify-center">
                <Calendar size={15} className="text-primary shrink-0" />
                <span>{formattedMonthLabel}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="ml-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Category Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2 sm:pb-0">
        <div className="flex overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles size={16} className={activeTab === "overview" ? "text-primary" : ""} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("trainers")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "trainers"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck size={16} className={activeTab === "trainers" ? "text-primary" : ""} />
            <span>Trainers</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {trainers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "members"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={16} className={activeTab === "members" ? "text-primary" : ""} />
            <span>Members</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {members.length}
              {filteredFlexInMembers.length > 0 ? ` + ${filteredFlexInMembers.length} Flex` : ""}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "classes"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar size={16} className={activeTab === "classes" ? "text-primary" : ""} />
            <span>Scheduled Classes</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {currentBatchSessions.length}
            </span>
          </button>
        </div>

        {/* Action Controls on Active Subtab */}
        {activeTab === "trainers" && (
          <div className="flex items-center gap-2.5 sm:pr-1 sm:pb-1">
            <div className="relative w-full sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search trainer..."
                value={trainerSearch}
                onChange={(e) => setTrainerSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setSubstituteForm({
                  primaryTrainerId: trainers[0]?.id || "",
                  substituteTrainerId: "",
                  date: new Date().toISOString().slice(0, 10),
                  reason: "",
                });
                setIsSubstituteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-border bg-card hover:bg-muted/80 px-3 py-2 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
              title="Designate a substitute coach for this batch"
            >
              <UserCheck size={14} className="text-amber-400" />
              <span>Substitute Coach</span>
            </button>

            <button
              onClick={() => setIsAddTrainerOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Trainer</span>
            </button>
          </div>
        )}

        {activeTab === "members" && (
          <div className="flex items-center gap-2 sm:pr-1 sm:pb-1 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-48">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setTransferTargetMember(null);
                setTransferModalTab("transfer");
                setIsTransferModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-border bg-card hover:bg-muted/80 px-3 py-2 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
              title="Transfer a member to another batch or assign a flexible pass"
            >
              <ArrowRightLeft size={14} className="text-primary" />
              <span>Batch Transfer</span>
            </button>

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Member</span>
            </button>
          </div>
        )}

        {activeTab === "classes" && (
          <div className="flex items-center gap-2 sm:pr-1 sm:pb-1">
            <button
              onClick={() => setIsAssignProgramOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Layers size={14} />
              <span>Assign Program</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Enrolled Members */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Members</span>
                <Users size={18} className="text-blue-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">
                {monthTracking?.summary?.totalPrimaryMembers ?? currentPax}
              </div>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {filteredFlexInMembers.length > 0
                  ? `+${filteredFlexInMembers.length} Flexible attendees in ${formattedMonthLabel}`
                  : "Permanently enrolled in batch"}
              </p>
            </div>

            {/* Card 2: Faculty Trainers */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty Trainers</span>
                <UserCheck size={18} className="text-emerald-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">{trainers.length}</div>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {(monthTracking?.category1_Trainers || []).reduce(
                  (acc, t) => acc + (t.classesConducted || 0),
                  0
                )}{" "}
                classes conducted in {formattedMonthLabel}
              </p>
            </div>

            {/* Card 3: Capacity & Utilization */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Capacity & Pax</span>
                <Dumbbell size={18} className="text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-foreground">
                  {monthTracking?.summary?.effectiveCapacityPax ?? currentPax}
                </span>
                <span className="text-lg font-semibold text-muted-foreground">/ {capacity}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-emerald-400 truncate">
                {monthTracking?.summary?.capacityUtilizationRate ?? occupancyPercent}% utilized •{" "}
                {remainingSlots} spots free
              </p>
            </div>

            {/* Card 4: Scheduled Classes Progress */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Classes Progress</span>
                <Calendar size={18} className="text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-foreground">
                  {monthTracking?.summary?.classesConductedInMonth ?? sessionTabCounts.completed}
                </span>
                <span className="text-lg font-semibold text-muted-foreground">
                  / {monthTracking?.summary?.classesScheduledInMonth ?? currentBatchSessions.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {monthTracking?.summary?.overallAttendanceRate ?? 0}% overall member attendance
              </p>
            </div>
          </div>

          {/* 3 Category Summary Preview Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category A Preview: Trainers */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <UserCheck size={16} />
                    </span>
                    <h3 className="font-bold text-foreground text-sm">Category A: Trainers</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    {trainers.length} Faculty
                  </span>
                </div>

                {trainers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No coaches assigned to this batch slot.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {trainers.slice(0, 3).map((trn) => (
                      <div
                        key={trn.id}
                        className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5 border border-border/50 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {trn.name?.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-foreground truncate">{trn.name}</p>
                            <p className="text-[11px] text-muted-foreground">{trn.experience || "Faculty"}</p>
                          </div>
                        </div>
                        <span className="rounded-md bg-background px-2 py-1 text-[11px] font-semibold text-emerald-400 shrink-0 border border-border">
                          {trn.classesConducted || 0} classes
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("trainers")}
                className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span>Manage Faculty Coaches</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Category B Preview: Members & Flex Flow */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Users size={16} />
                    </span>
                    <h3 className="font-bold text-foreground text-sm">Category B: Members</h3>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400">
                    {members.length} Enrolled
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-muted/40 p-2.5 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-medium">Primary Members</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{members.length}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2.5 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-medium">Flex-In Attendees</p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">{filteredFlexInMembers.length}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-background/50 border border-border p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Month Compliance Rate</span>
                    <span className="font-bold text-emerald-400">
                      {monthTracking?.summary?.overallAttendanceRate ?? 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          monthTracking?.summary?.overallAttendanceRate ?? 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("members")}
                className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span>Manage Members & Batch Transfers</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Category C Preview: Scheduled Classes */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <Calendar size={16} />
                    </span>
                    <h3 className="font-bold text-foreground text-sm">Category C: Scheduled Classes</h3>
                  </div>
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-400">
                    {currentBatchSessions.length} Sessions
                  </span>
                </div>

                {masterSchedule ? (
                  <div className="space-y-2.5">
                    <div className="rounded-xl bg-muted/40 p-3 border border-border/70 space-y-1">
                      <p className="font-bold text-foreground text-xs">{masterSchedule.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Coach: {masterSchedule.coachName || "Faculty Coach"} • {masterSchedule.daysPattern || batch.daysLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Completed: <strong className="text-emerald-400">{sessionTabCounts.completed}</strong></span>
                      <span>Today: <strong className="text-amber-400">{sessionTabCounts.today}</strong></span>
                      <span>Upcoming: <strong className="text-foreground">{sessionTabCounts.upcoming}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No curriculum program currently assigned to this batch.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("classes")}
                className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span>View Full Schedule & Sessions</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: TRAINERS (Category A) */}
      {activeTab === "trainers" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>
              Faculty trainers assigned to <strong>{batch.name}</strong> for <strong>{formattedMonthLabel}</strong>
            </span>
            <span>{filteredTrainers.length} active coaches</span>
          </div>

          {filteredTrainers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <UserCheck size={32} className="mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground text-sm">
                {trainerSearch ? "No matching trainers found" : "No trainers assigned"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {trainerSearch
                  ? "Try searching with a different coach name or phone number."
                  : `No coaches are currently assigned to ${batch.name}. Assign an existing trainer to this batch.`}
              </p>
              {!trainerSearch && (
                <button
                  onClick={() => setIsAddTrainerOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Trainer to Batch</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredTrainers.map((trn) => (
                <div
                  key={trn.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                      {getTrainerPhoto(trn) ? (
                        <img
                          src={getTrainerPhoto(trn)}
                          alt={trn.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-foreground">
                          {trn.name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground text-base truncate">{trn.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            {trn.status || "Active"}
                          </span>
                          <button
                            onClick={() => handleUnassignTrainer(trn.id, trn.name)}
                            className="rounded-lg p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove coach from this batch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        Faculty Coach • {batch.timingLabel}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {trn.phone || "+91 98000 00000"}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-400" />{" "}
                          {trn.experience || "5+ Yrs"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Conduction Stats Pill: Assigned, Conducted, Shift Slot */}
                  <div className="rounded-xl bg-muted/40 border border-border/60 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Assigned
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {currentBatchSessions.length || 12} Classes
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Conducted
                      </span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {trn.classesConducted || 0} Classes
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Shift Slot</span>
                      <span className="font-bold text-blue-400 text-xs truncate block" title={batch.timingLabel}>
                        {batch.daysPattern || "MWF"} ({batch.timingLabel?.slice(0, 8) || "Morning"})
                      </span>
                    </div>
                  </div>

                  {/* Quick trigger footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      Coaching Slot: <strong className="text-foreground">{batch.daysLabel}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubstituteForm({
                          primaryTrainerId: trn.id,
                          substituteTrainerId: "",
                          date: new Date().toISOString().slice(0, 10),
                          reason: "",
                        });
                        setIsSubstituteModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <UserCheck size={12} />
                      <span>Substitute Coach</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: MEMBERS (Category B) */}
      {activeTab === "members" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Segment 1: Primary Enrolled Members */}
          <div className="space-y-3">
           

            <div className="overflow-x-auto overflow-y-auto max-h-[440px] no-scrollbar pr-1">
              <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-2.5 px-4 sm:px-5">Member</th>
                    <th className="py-2.5 px-4 sm:px-5">Contact</th>
                    <th className="py-2.5 px-4 sm:px-5">Gender</th>
                    <th className="py-2.5 px-4 sm:px-5">Flex Status</th>
                    <th className="py-2.5 px-4 sm:px-5">Status</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium">
                  {filteredPrimaryMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="bg-card py-8 px-4 text-center text-muted-foreground border-y border-border/50 rounded-2xl border-x">
                        <Users size={28} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No primary members found</p>
                        <button
                          onClick={() => setIsAddMemberOpen(true)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Enroll Member in Batch</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPrimaryMembers.map((mem) => {
                      const complianceRate = mem.attendanceRate ?? 0;
                      const complianceColor =
                        complianceRate >= 75
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : complianceRate >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20";

                      return (
                        <tr key={mem.id} className="group transition-all duration-150 hover:translate-y-[-1px]">
                          <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                {mem.firstName?.charAt(0)}
                                {mem.lastName?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {mem.firstName} {mem.lastName}
                                </p>
                                <span className="font-mono text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                                  #{mem.id?.length > 7 ? mem.id.slice(-6).toUpperCase() : mem.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
                            <p className="text-foreground font-medium">{mem.mobile}</p>
                            <p className="text-[11px] opacity-75">{mem.email}</p>
                          </td>
                          <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
                            {mem.gender || "—"}
                          </td>

                          <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                            {mem.isFlexOutActive ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20"
                                title={mem.flexOutDetails?.map((f) => f.targetBatchName).join(", ")}
                              >
                                <CalendarRange size={11} />
                                Flex-Out (
                                {mem.flexOutDetails?.[0]?.targetBatchName || "Active"}
                                )
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Primary Only</span>
                            )}
                          </td>
                          <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 px-2.5 py-1 text-xs font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {mem.status || "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Permanent Transfer button */}
                              <button
                                onClick={() => {
                                  setTransferTargetMember(mem);
                                  setTransferModalTab("transfer");
                                  setIsTransferModalOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Transfer to another batch permanently"
                              >
                                <ArrowRightLeft size={14} className="text-primary" />
                              </button>

                              {/* Temporary Flex Pass button */}
                              <button
                                onClick={() => {
                                  setTransferTargetMember(mem);
                                  setTransferModalTab("flex");
                                  setIsTransferModalOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Assign temporary flexible pass to another batch"
                              >
                                <CalendarRange size={14} className="text-amber-400" />
                              </button>

                              {/* Remove from batch button */}
                              <button
                                onClick={() =>
                                  handleRemoveMemberFromBatch(
                                    mem.id,
                                    `${mem.firstName} ${mem.lastName || ""}`
                                  )
                                }
                                className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove from this batch"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment 2: Inbound Flexible Attendees */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
                    <CalendarRange size={13} />
                  </span>
                  <span>Inbound Flexible Attendees</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
                    {filteredFlexInMembers.length}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Members permanently assigned to other batches who are authorized to attend{" "}
                  {batch.name} on specific days in {formattedMonthLabel}.
                </p>
              </div>
            </div>

            {filteredFlexInMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
                <CalendarRange size={24} className="mx-auto text-muted-foreground/50 mb-1.5" />
                <p className="text-xs font-semibold text-foreground">
                  No Inbound Flexible Attendees in {formattedMonthLabel}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
                  When members from other batches are granted flexible day passes to attend this
                  batch slot, they will be tracked here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[440px] no-scrollbar pr-1">
                <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                  <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                    <tr>
                      <th className="py-2.5 px-4 sm:px-5">Member</th>
                      <th className="py-2.5 px-4 sm:px-5">Home Batch</th>
                      <th className="py-2.5 px-4 sm:px-5">Permitted Days</th>
                      <th className="py-2.5 px-4 sm:px-5">Validity Window</th>
                      <th className="py-2.5 px-4 sm:px-5">Reason</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm font-medium">
                    {filteredFlexInMembers.map((item) => (
                      <tr key={item.assignmentId || item.memberId} className="group transition-all duration-150 hover:translate-y-[-1px]">
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-bold text-amber-500">
                              {item.name?.charAt(0) || "M"}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-mono text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                                  #{item.memberId?.length > 7 ? item.memberId.slice(-6).toUpperCase() : item.memberId}
                                </span>
                                {item.mobile && <span>• {item.mobile}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs whitespace-nowrap">
                          <span className="rounded-full bg-card border border-border px-2.5 py-0.5 font-semibold text-foreground">
                            {item.primaryBatchName || "Home Batch"}
                          </span>
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs">
                          <div className="flex flex-wrap gap-1">
                            {(item.selectedDays || []).map((day) => (
                              <span
                                key={day}
                                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500"
                              >
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {item.startDate} → {item.endDate || "Ongoing"}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground max-w-xs truncate">
                          {item.reason || "Temporary flexible pass"}
                        </td>
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRevokeFlexPass(item.assignmentId, item.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                            title="Revoke flexible pass"
                          >
                            <RotateCcw size={12} />
                            <span>Revoke Pass</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 4: SCHEDULED CLASSES (Category C) */}
      {activeTab === "classes" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>
              Curriculum progression and floor sessions for <strong>{batch.name}</strong>
            </span>
            <span>{currentBatchSessions.length} total classes</span>
          </div>

          {masterSchedule || currentBatchSessions.length > 0 ? (
            <div className="space-y-4">
              {/* Sessions Submodule Workflow Tabs inside Batch */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3 pt-1">
                {[
                  {
                    id: "Upcoming",
                    label: "Upcoming",
                    count: sessionTabCounts.upcoming,
                    icon: Clock,
                    color: "text-blue-400",
                  },
                  {
                    id: "Today",
                    label: "Today Sessions",
                    count: sessionTabCounts.today,
                    icon: AlertCircle,
                    color: "text-amber-400",
                  },
                  {
                    id: "Completed",
                    label: "Completed",
                    count: sessionTabCounts.completed,
                    icon: CheckCircle2,
                    color: "text-emerald-400",
                  },
                  {
                    id: "Cancelled",
                    label: "Cancelled",
                    count: sessionTabCounts.cancelled,
                    icon: XCircle,
                    color: "text-destructive",
                  },
                  {
                    id: "All",
                    label: "All Classes",
                    count: sessionTabCounts.all,
                    icon: Layers,
                    color: "text-primary",
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = sessionsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSessionsTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-background shadow-sm scale-[1.01]"
                          : "border border-border bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-background" : tab.color} />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          isActive
                            ? "bg-background/20 text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Week Filter Pills & Status Info */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSelectedWeekFilter("all")}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      selectedWeekFilter === "all"
                        ? "bg-primary text-background font-bold shadow-xs border border-transparent"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    All Weeks
                  </button>
                  {[1, 2, 3, 4].map((wk) => (
                    <button
                      key={wk}
                      type="button"
                      onClick={() => setSelectedWeekFilter(wk)}
                      className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                        selectedWeekFilter === wk
                          ? "bg-primary text-background font-bold shadow-xs border border-transparent"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      Week {wk}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-muted-foreground">
                  Showing {displayedSessions.length}{" "}
                  {sessionsTab === "All" ? "" : sessionsTab.toLowerCase()} classes for{" "}
                  {batch.name || batch.shortName}
                </span>
              </div>

              {/* Floor Sessions & Curriculum Cards Grid */}
              {displayedSessions.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center bg-card/30">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <h4 className="text-sm font-bold text-foreground">
                    No {sessionsTab} Classes in {batch.name || batch.shortName}
                  </h4>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    There are currently no sessions in the &quot;{sessionsTab}&quot; status for
                    this batch. Check other sub-tabs or view All Classes.
                  </p>
                  {sessionsTab !== "All" && (
                    <button
                      type="button"
                      onClick={() => setSessionsTab("All")}
                      className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      View All Curriculum Classes →
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {displayedSessions.map((session) => {
                    const isCompleted = session.status === "COMPLETED";
                    const isCancelled = session.status === "CANCELLED";
                    const isToday =
                      session.status === "TODAY" ||
                      session.sessionDate === new Date().toISOString().slice(0, 10);

                    // Matching curriculum item
                    const matchingItem = masterClassItems.find(
                      (i) =>
                        i.id === session.masterClassItemId ||
                        i.classNumber === session.classNumber
                    );

                    return (
                      <div
                        key={session.id || session.classNumber}
                        className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 backdrop-blur-sm transition-all hover:shadow-md ${
                          isCancelled
                            ? "opacity-75 border-destructive/30 bg-destructive/5"
                            : isCompleted
                              ? "border-emerald-500/25 bg-emerald-500/5"
                              : isToday
                                ? "border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20"
                                : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Bar: Class Number & Date */}
                          <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-black">
                                {session.classNumber}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                Class #{String(session.classNumber).padStart(2, "0")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-muted border border-border/70 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                                Week {session.weekNumber} • {session.dayOfWeek}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  isCancelled
                                    ? "bg-destructive/15 text-destructive"
                                    : isCompleted
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : isToday
                                        ? "bg-amber-500/15 text-amber-400"
                                        : "bg-blue-500/15 text-blue-400"
                                }`}
                              >
                                {session.status || "SCHEDULED"}
                              </span>
                            </div>
                          </div>

                          {/* Title & Subject */}
                          <div>
                            <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                              {session.subject}
                            </h4>
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                              {session.message ||
                                "Standard functional training session curriculum."}
                            </p>
                          </div>

                          {/* Session Floor Meta: Time, Coach, Room, Attendee Count */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                            <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                              <Clock size={12} className="text-amber-400 shrink-0" />
                              <span className="truncate text-[11px] font-medium text-foreground">
                                {session.timing || batch.timingLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                              <UserCheck size={12} className="text-emerald-400 shrink-0" />
                              <span className="truncate text-[11px] font-medium text-foreground">
                                {session.coachName || masterSchedule?.coachName || "Coach"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                              <Layers size={12} className="text-blue-400 shrink-0" />
                              <span className="truncate text-[11px] font-medium text-foreground">
                                {session.room || batch.room || "Studio 1"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                              <Users size={12} className="text-purple-400 shrink-0" />
                              <span className="truncate text-[11px] font-medium text-foreground">
                                {session.attendeesCount ?? (session.attendees?.length || batch.currentPax || members.length)} Pax
                              </span>
                            </div>
                          </div>

                          {session.notes && (
                            <div className="rounded-xl bg-muted/60 p-2 text-xs text-foreground border border-border/70">
                              <strong className="text-primary font-bold">Coach Note:</strong>{" "}
                              {session.notes}
                            </div>
                          )}
                        </div>

                        {/* Action Footer: Complete, Cancel, Restore, Coach Note, Edit Syllabus */}
                        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-1.5 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSessionForNotes(session);
                                setSessionNoteText(session.notes || "");
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                              title="Add or edit coach note"
                            >
                              <FileText size={12} />
                              <span>{session.notes ? "Note" : "+ Note"}</span>
                            </button>

                            {matchingItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMasterItem(matchingItem);
                                  setIsEditMasterItemOpen(true);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Edit curriculum syllabus"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-primary font-semibold text-[11px] mr-1">
                              {session.displayDate || `Class ${session.classNumber}`}
                            </span>

                            {!isCompleted && !isCancelled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompleted(session.id, session.subject)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Mark class session completed"
                                >
                                  <Check size={12} />
                                  <span>Done</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCancelSession(session.id, session.subject)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/25 bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Cancel class session"
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}

                            {(isCompleted || isCancelled) && (
                              <button
                                type="button"
                                onClick={() => handleRestoreSession(session.id, session.subject)}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                title="Restore class to scheduled"
                              >
                                <RotateCcw size={11} />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Empty state if no master schedule mapped yet */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center bg-card/40">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-base font-bold text-foreground">
                No Scheduled Class Program Assigned Yet
              </h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                This batch currently has no curriculum assigned. You can assign an existing
                reusable program or create a new program.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignProgramOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                >
                  <Layers size={15} />
                  <span>Assign Existing Reusable Program</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateMasterScheduleForBatch}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create New Program for {batch.shortName || batch.name}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- EDIT MASTER CLASS ITEM MODAL (PORTAL-WRAPPED) --- */}
      {isEditMasterItemOpen &&
        editingMasterItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-extrabold">
                    {editingMasterItem.classNumber}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Edit Class {editingMasterItem.classNumber} Curriculum
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Week {editingMasterItem.weekNumber} • {editingMasterItem.dayOfWeek}{" "}
                      {editingMasterItem.displayDate ? `• ${editingMasterItem.displayDate}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMasterItemOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMasterClassItem} className="space-y-4 text-sm">
                <InputField
                  label="Class Subject / Title"
                  value={editingMasterItem.subject}
                  onChange={(e) =>
                    setEditingMasterItem({ ...editingMasterItem, subject: e.target.value })
                  }
                  required
                />

                <TextareaField
                  rows={4}
                  label="Workout Focus & Coaching Guidance"
                  value={editingMasterItem.message}
                  onChange={(e) =>
                    setEditingMasterItem({ ...editingMasterItem, message: e.target.value })
                  }
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsEditMasterItemOpen(false)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* --- SESSION COACH NOTE MODAL --- */}
      {selectedSessionForNotes &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-foreground text-sm">Session Coach Notes</h3>
                <button
                  type="button"
                  onClick={() => setSelectedSessionForNotes(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSessionNotes} className="mt-4 space-y-4">
                <div className="text-xs text-muted-foreground">
                  <strong>Class #{selectedSessionForNotes.classNumber}:</strong>{" "}
                  {selectedSessionForNotes.subject}
                  <div className="text-primary font-medium mt-0.5">
                    {selectedSessionForNotes.displayDate} •{" "}
                    {selectedSessionForNotes.timing || batch.timingLabel} • {batch.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Floor Cues, Member Absences, or Equipment Notes
                  </label>
                  <textarea
                    rows={4}
                    value={sessionNoteText}
                    onChange={(e) => setSessionNoteText(e.target.value)}
                    placeholder="Record PRs, floor observations, or substitution notes here..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionForNotes(null)}
                    className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* --- ASSIGN / SWITCH PROGRAM MODAL --- */}
      {isAssignProgramOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Assign Scheduled Program to {batch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Select a reusable Scheduled Class Program to run in this batch.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignProgramOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {allMasterSchedules.map((prog) => {
                  const isCurrentlyAssigned =
                    (Array.isArray(prog.batchIds) && prog.batchIds.includes(batch.id)) ||
                    prog.batchId === batch.id;
                  const assignedBatches = resolveAssignedBatches(prog.batchIds, allBatches);

                  return (
                    <div
                      key={prog.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isCurrentlyAssigned
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-foreground/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{prog.name}</span>
                            {isCurrentlyAssigned && (
                              <span className="rounded-full bg-primary text-background px-2 py-0.5 text-[10px] font-extrabold uppercase">
                                Currently Assigned
                              </span>
                            )}
                            <span className="rounded-full bg-muted border border-border/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {prog.totalClasses || 12} Classes
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {prog.description || "Structured reusable curriculum."}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                            <span>
                              Coach:{" "}
                              <strong className="text-foreground">
                                {prog.coachName || "Coach"}
                              </strong>
                            </span>
                            <span>
                              Shift:{" "}
                              <strong className="text-foreground">
                                {prog.timing || prog.shift}
                              </strong>
                            </span>
                            <span>
                              Days:{" "}
                              <strong className="text-foreground">
                                {prog.daysPattern || "MWF"}
                              </strong>
                            </span>
                          </div>

                          <div className="pt-2 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              Running in:{" "}
                            </span>
                            {assignedBatches.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                None (Reusable template)
                              </span>
                            ) : (
                              assignedBatches.map((b) => (
                                <span
                                  key={b.id}
                                  className={`inline-block mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                    b.id === batch.id
                                      ? "bg-primary/20 text-primary font-bold"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {b.shortName || b.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pt-1">
                          {isCurrentlyAssigned ? (
                            <button
                              type="button"
                              onClick={() => handleUnassignProgram(prog.id)}
                              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer"
                            >
                              Unassign
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAssignProgram(prog.id)}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer shadow-xs"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCreateMasterScheduleForBatch}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Brand New Reusable Program</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAssignProgramOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- ADD TRAINER MODAL --- */}
      {isAddTrainerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border p-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Add Trainer to {batch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign coaches to {batch.timingLabel} ({batch.daysPattern})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddTrainerOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Search coaches by name..."
                      value={trainerSearchQuery}
                      onChange={(e) => setTrainerSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  {/* Coaches list */}
                  <div className="space-y-2">
                    {allTrainers
                      .filter((t) => {
                        const q = trainerSearchQuery.toLowerCase();
                        return t.name?.toLowerCase().includes(q);
                      })
                      .map((t) => {
                        const isAssigned = (batch.trainerIds || []).includes(t.id);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                                {getTrainerPhoto(t) ? (
                                  <img
                                    src={getTrainerPhoto(t)}
                                    alt={t.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  t.name?.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-foreground text-xs truncate">
                                  {t.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  Faculty Coach • {t.experience || "3+ Yrs"}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isAssigned ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                  <Check size={12} />
                                  Assigned
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAssignTrainer(t.id, t.name)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
                                >
                                  <Plus size={13} />
                                  Assign
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- ADD MEMBER MODAL --- */}
      {isAddMemberOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border p-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Add Member to {batch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Batch Capacity: {currentPax} / {capacity} Pax ({remainingSlots} slots remaining)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Search member by name, ID, or phone..."
                      value={memberModalSearch}
                      onChange={(e) => setMemberModalSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  {/* Member list */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(Array.isArray(allMembers) ? allMembers : [])
                      .filter((m) => !m.isDeleted)
                      .filter((m) => {
                        const q = memberModalSearch.toLowerCase();
                        return (
                          m.firstName?.toLowerCase().includes(q) ||
                          m.lastName?.toLowerCase().includes(q) ||
                          m.id?.toLowerCase().includes(q) ||
                          m.mobile?.includes(q)
                        );
                      })
                      .slice(0, 30)
                      .map((mem) => {
                        const isInThisBatch = mem.batchId === batch.id;
                        return (
                          <div
                            key={mem.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                {mem.firstName?.charAt(0)}
                                {mem.lastName?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-foreground text-xs truncate">
                                  {mem.firstName} {mem.lastName}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {mem.id} • {mem.mobile} {mem.batchId && mem.batchId !== batch.id ? `• Current: ${mem.batchId}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isInThisBatch ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                  <Check size={12} />
                                  Enrolled
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleEnrollExistingMember(mem)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
                                >
                                  <Plus size={13} />
                                  Enroll
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- SUBSTITUTE COACH MODAL (PORTAL-WRAPPED) --- */}
      {isSubstituteModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <UserCheck size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Designate Substitute Coach
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign a substitute trainer for {batch.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubstituteModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubstitute} className="space-y-4 text-xs">
                {/* Primary Coach Being Substituted */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Primary Coach Being Substituted
                  </label>
                  <select
                    value={substituteForm.primaryTrainerId}
                    onChange={(e) =>
                      setSubstituteForm({ ...substituteForm, primaryTrainerId: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">-- General Batch Substitution --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Faculty)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Substitute Coach */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Substitute Coach <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={substituteForm.substituteTrainerId}
                    onChange={(e) =>
                      setSubstituteForm({ ...substituteForm, substituteTrainerId: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">-- Select Substitute Coach --</option>
                    {allTrainers
                      .filter((t) => t.id !== substituteForm.primaryTrainerId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.experience || "Trainer"})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Substitution Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={substituteForm.date}
                    onChange={(e) =>
                      setSubstituteForm({ ...substituteForm, date: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Reason / Notes */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Reason & Handover Notes
                  </label>
                  <textarea
                    rows={2}
                    value={substituteForm.reason}
                    onChange={(e) =>
                      setSubstituteForm({ ...substituteForm, reason: e.target.value })
                    }
                    placeholder="e.g., Coach on scheduled leave; taking over strength circuit..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsSubstituteModalOpen(false)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary/90 cursor-pointer shadow-md"
                  >
                    <Check size={14} />
                    <span>Assign Substitute</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* --- BATCH TRANSFER & FLEXIBLE ASSIGNMENT MODAL --- */}
      <BatchTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTargetMember(null);
        }}
        member={transferTargetMember}
        membersList={members}
        currentBatch={batch}
        allBatches={allBatches}
        initialTab={transferModalTab}
        onSuccess={async () => {
          await loadBatchData();
          if (batch?.id) {
            await loadMonthTracking(batch.id, selectedMonth);
          }
        }}
      />
    </div>
  );
}
