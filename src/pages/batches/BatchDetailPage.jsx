/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  Calendar,
  Users,
  UserCheck,
  Edit3,
  Dumbbell,
  Flame,
  MapPin,
  Sparkles,
  ArrowLeft,
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
  Mail,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Trash2,
  UserPlus,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  getBatchById,
  getBatchTrainers,
  getBatchMembers,
  getScheduledClassesByBatch,
  updateDayClass,
  updateBatch,
  enrollMemberInBatch,
} from "@/lib/batchesService";
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

  const [batch, setBatch] = useState(() => getBatchById(id || "BATCH-01"));
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trainers" | "members"
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);

  // Master Class Schedule mapped to this batch
  const [masterSchedule, setMasterSchedule] = useState(() =>
    getMasterScheduleByBatchId(id || "BATCH-01"),
  );
  const [masterClassItems, setMasterClassItems] = useState(() => {
    const mcs = getMasterScheduleByBatchId(id || "BATCH-01");
    return mcs ? getScheduleItems(mcs.id) : [];
  });
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("all");
  const [isEditMasterItemOpen, setIsEditMasterItemOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);

  // Floor Sessions submodule tracking state inside this batch
  const [sessions, setSessions] = useState(() => getSessions());
  const [sessionsTab, setSessionsTab] = useState("Upcoming"); // "Upcoming" | "Today" | "Completed" | "Cancelled" | "All"
  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState(null);
  const [sessionNoteText, setSessionNoteText] = useState("");

  // Search filter for members and trainers
  const [memberSearch, setMemberSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");

  // All trainers & members for assignment
  const [allTrainers, setAllTrainers] = useState(() => {
    try {
      return getTrainers();
    } catch {
      return [];
    }
  });
  const [allMembers, setAllMembers] = useState(() => {
    try {
      return getMembers();
    } catch {
      return [];
    }
  });

  // Add Trainer Modal state
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");

  // Add Member Modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberModalSearch, setMemberModalSearch] = useState("");

  // Modals state
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    loadBatchData();
    window.addEventListener("storage", loadBatchData);
    return () => window.removeEventListener("storage", loadBatchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBatchData = () => {
    const found = getBatchById(id || "BATCH-01");
    if (found) {
      setBatch(found);
      const cls = getScheduledClassesByBatch(found.id);
      setScheduledClasses(cls);
      const trns = getBatchTrainers(found.trainerIds);
      setTrainers(trns);
      const mems = getBatchMembers(found.id, found.currentPax || 18);
      setMembers(mems);
      try {
        setAllTrainers(getTrainers());
        setAllMembers(getMembers());
      } catch {
        // ignore
      }

      // Load mapped Master Class Schedule for this batch
      const mcs = getMasterScheduleByBatchId(found.id);
      setMasterSchedule(mcs);
      if (mcs) {
        const items = getScheduleItems(mcs.id);
        setMasterClassItems(items);
      } else {
        setMasterClassItems([]);
      }

      // Load Floor Sessions
      setSessions(getSessions());
    }
  };

  // Occupancy stats
  const capacity = batch?.maxPax || 28;
  const currentPax = batch?.currentPax || members.length;
  const occupancyPercent = Math.min(100, Math.round((currentPax / capacity) * 100));
  const remainingSlots = Math.max(0, capacity - currentPax);

  // Trainer assignment handlers
  const handleAssignTrainer = (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      if (!currentIds.includes(trainerId)) {
        const updated = [...currentIds, trainerId];
        updateBatch(batch.id, { trainerIds: updated });
        toast.success(`${trainerName || "Trainer"} assigned to ${batch.name}.`);
        loadBatchData();
      }
    } catch {
      toast.error("Failed to assign trainer to batch.");
    }
  };

  const handleUnassignTrainer = (trainerId, trainerName) => {
    if (!batch) return;
    try {
      const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
      const updated = currentIds.filter((tid) => tid !== trainerId);
      updateBatch(batch.id, { trainerIds: updated });
      toast.success(`${trainerName || "Trainer"} removed from ${batch.name}.`);
      loadBatchData();
    } catch {
      toast.error("Failed to unassign trainer.");
    }
  };

  const handleCreateAndAssignTrainer = (e) => {
    e.preventDefault();
    if (!newTrainerForm.name.trim()) {
      toast.error("Trainer name is required.");
      return;
    }
    try {
      const created = createTrainer({
        name: newTrainerForm.name.trim(),
        specialization: newTrainerForm.specialization,
        phone: newTrainerForm.phone.trim(),
        email: newTrainerForm.email.trim(),
        experience: newTrainerForm.experience,
        gender: newTrainerForm.gender,
        status: "Active",
      });
      if (batch) {
        const currentIds = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
        const updated = [...currentIds, created.id];
        updateBatch(batch.id, { trainerIds: updated });
      }
      toast.success(`${created.name} registered and assigned to ${batch.name}!`);
      setNewTrainerForm({
        name: "",
        specialization: "Functional Strength & Conditioning",
        phone: "",
        email: "",
        experience: "3+ Years",
        gender: "Male",
      });
      setIsAddTrainerOpen(false);
      loadBatchData();
    } catch {
      toast.error("Failed to create and assign trainer.");
    }
  };

  // Member assignment handlers
  const handleEnrollExistingMember = (member) => {
    if (!batch) return;
    try {
      updateMember(member.id, { batchId: batch.id });
      enrollMemberInBatch(batch.id, member.id);
      toast.success(`${member.firstName} ${member.lastName || ""} enrolled into ${batch.name}!`);
      loadBatchData();
    } catch {
      toast.error("Failed to enroll member in batch.");
    }
  };

  const handleRemoveMemberFromBatch = (memberId, memberName) => {
    if (!batch) return;
    try {
      updateMember(memberId, { batchId: null });
      const currentBatch = getBatchById(batch.id);
      if (currentBatch) {
        const updatedMembers = (currentBatch.memberIds || []).filter((mId) => mId !== memberId);
        updateBatch(batch.id, {
          memberIds: updatedMembers,
          currentPax: Math.max(0, (currentBatch.currentPax || 1) - 1),
        });
      }
      toast.success(`${memberName || "Member"} removed from ${batch.name}.`);
      loadBatchData();
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleRegisterAndEnrollMember = (e) => {
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
      const created = createMember({
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
      enrollMemberInBatch(batch.id, created.id);
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
      loadBatchData();
    } catch {
      toast.error("Failed to register member.");
    }
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.mobile?.includes(q)
    );
  });

  // Filtered trainers
  const filteredTrainers = trainers.filter((t) => {
    const q = trainerSearch.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.id?.toLowerCase().includes(q)
    );
  });

  // Current batch sessions mapped from storage (or fallback to masterClassItems)
  const currentBatchSessions = useMemo(() => {
    if (!batch) return [];
    const list = sessions.filter((s) => s.batchId === batch.id);
    if (list.length > 0) return list;

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
      sessionDate: item.sessionDate || "",
      displayDate: item.displayDate || "",
      subject: item.subject,
      message: item.message,
      status: "SCHEDULED",
      notes: "",
    }));
  }, [sessions, batch, masterClassItems, masterSchedule]);

  // Calculate batch-specific curriculum progress
  const batchProgress = useMemo(() => {
    const total = currentBatchSessions.length || 12;
    const completed = currentBatchSessions.filter((s) => s.status === "COMPLETED").length;
    const percent = Math.min(100, Math.round((completed / (total || 1)) * 100));
    return { completed, total, percent };
  }, [currentBatchSessions]);

  // Other batches sharing this program
  const sharedBatches = useMemo(() => {
    if (!masterSchedule) return [];
    const allAssigned = resolveAssignedBatches(masterSchedule.batchIds);
    return allAssigned.filter((b) => b.id !== batch?.id);
  }, [masterSchedule, batch]);

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
  const handleMarkCompleted = (sessionId, subject) => {
    try {
      updateSessionStatus(sessionId, "COMPLETED");
      toast.success(`Class "${subject}" marked as Completed.`);
      loadBatchData();
    } catch {
      toast.error("Failed to update class status.");
    }
  };

  const handleCancelSession = (sessionId, subject) => {
    try {
      updateSessionStatus(sessionId, "CANCELLED");
      toast.info(`Class "${subject}" has been marked as Cancelled.`);
      loadBatchData();
    } catch {
      toast.error("Failed to cancel class.");
    }
  };

  const handleRestoreSession = (sessionId, subject) => {
    try {
      updateSessionStatus(sessionId, "SCHEDULED");
      toast.success(`Class "${subject}" restored to Scheduled.`);
      loadBatchData();
    } catch {
      toast.error("Failed to restore class.");
    }
  };

  const handleSaveSessionNotes = (e) => {
    e.preventDefault();
    if (!selectedSessionForNotes) return;
    try {
      updateSession(selectedSessionForNotes.id, { notes: sessionNoteText });
      toast.success("Coach note saved successfully.");
      setSelectedSessionForNotes(null);
      loadBatchData();
    } catch {
      toast.error("Failed to save coach note.");
    }
  };

  const handleAssignProgram = (programId) => {
    if (!batch || !programId) return;
    try {
      // If switching from an existing schedule, remove this batch from old schedule
      if (masterSchedule && masterSchedule.id !== programId) {
        const oldBatches = (masterSchedule.batchIds || []).filter((bId) => bId !== batch.id);
        assignBatchesToProgram(masterSchedule.id, oldBatches);
      }
      const targetProg = getMasterScheduleById(programId);
      if (targetProg) {
        const existingBatches = Array.isArray(targetProg.batchIds)
          ? targetProg.batchIds
          : targetProg.batchId
            ? [targetProg.batchId]
            : [];
        if (!existingBatches.includes(batch.id)) {
          assignBatchesToProgram(targetProg.id, [...existingBatches, batch.id]);
        }
        toast.success(`"${targetProg.name}" assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        loadBatchData();
      }
    } catch {
      toast.error("Failed to assign program.");
    }
  };

  const handleUnassignProgram = (programId) => {
    if (!batch || !programId) return;
    try {
      const targetProg = getMasterScheduleById(programId);
      if (targetProg) {
        const remainingBatches = (targetProg.batchIds || []).filter((bId) => bId !== batch.id);
        assignBatchesToProgram(programId, remainingBatches);
        toast.info(`Unassigned "${targetProg.name}" from ${batch.name}.`);
        loadBatchData();
      }
    } catch {
      toast.error("Failed to unassign program.");
    }
  };

  const handleCreateMasterScheduleForBatch = () => {
    if (!batch) return;
    try {
      const created = createMasterSchedule({
        batchIds: [batch.id],
        batchId: batch.id,
        name: `${batch.shortName || batch.name} Program`,
        status: "Active",
      });
      if (created) {
        toast.success(`Master Class Program created and assigned to ${batch.name}!`);
        setIsAssignProgramOpen(false);
        loadBatchData();
      }
    } catch {
      toast.error("Failed to initialize Master Class Program.");
    }
  };

  const handleSaveMasterClassItem = (e) => {
    e.preventDefault();
    if (!editingMasterItem) return;
    try {
      const updated = updateMasterClassItem(editingMasterItem.id, {
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

  const handleSaveScheduledClass = (e) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      const updated = updateDayClass(editingClass.id, editingClass);
      if (updated) {
        setScheduledClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setIsEditClassOpen(false);
        toast.success(`Scheduled class for ${updated.day} updated!`);
      }
    } catch {
      toast.error("Failed to update scheduled class.");
    }
  };

  if (!batch) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Batch Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested batch does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/admin/batches")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/80 cursor-pointer"
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

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2 sm:pb-0">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles size={16} />
            Overview
          </button>

          <button
            onClick={() => setActiveTab("trainers")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "trainers"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck size={16} />
            Trainers ({trainers.length})
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "members"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={16} />
            Members ({members.length})
          </button>
        </div>

        {/* Action Controls on Trainers Subtab (Above the line, after members subtab) */}
        {activeTab === "trainers" && (
          <div className="flex items-center gap-2.5 sm:pr-1 sm:pb-1">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
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
              onClick={() => setIsAddTrainerOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Trainer</span>
            </button>
          </div>
        )}

        {/* Action Controls on Members Subtab (Above the line, after members subtab) */}
        {activeTab === "members" && (
          <div className="flex items-center gap-2.5 sm:pr-1 sm:pb-1">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search member..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Overview 3 Metric Cards */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Overview</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Card 1: Members */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Members</span>
                  <Users size={18} />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-foreground">{currentPax}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Currently enrolled in this batch
                </p>
              </div>

              {/* Card 2: Trainers */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Trainers</span>
                  <UserCheck size={18} />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-foreground">
                  {trainers.length || 2}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Supervising this time slot</p>
              </div>

              {/* Card 3: Capacity */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">Capacity</span>
                  <Dumbbell size={18} />
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground">{currentPax}</span>
                  <span className="text-lg font-semibold text-muted-foreground">/ {capacity}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-emerald-400">
                  {remainingSlots} spots remaining ({occupancyPercent}% full)
                </p>
              </div>
            </div>
          </div>

          {/* Master Class Schedule Mapped to Batch Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles size={16} />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">Scheduled Class Program</h3>
                  {masterSchedule && (
                    <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold">
                      {masterSchedule.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reusable master program curriculum tracked independently for {batch.name} (
                  {batch.daysLabel}).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {masterSchedule && (
                  <button
                    type="button"
                    onClick={() => setIsAssignProgramOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/20 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Layers size={13} className="text-primary" />
                    <span>Change Program</span>
                  </button>
                )}
                <Link
                  to="/admin/schedule/master-class"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/20 transition-colors shadow-2xs"
                  title="Open Master Class Schedule management"
                >
                  <ExternalLink size={13} />
                  <span>Master Class Hub</span>
                </Link>
              </div>
            </div>

            {masterSchedule ? (
              <div className="space-y-4">
                {/* Master Schedule Meta Card */}
                <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 backdrop-blur-sm shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {masterSchedule.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {masterSchedule.status}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 text-[11px] font-semibold">
                          <Layers size={11} />
                          Reusable Program
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {masterSchedule.description ||
                          "Modular scheduled class program mapped sequentially across shifts and batch days."}
                      </p>

                      {/* Batches Assigned to this Program */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Assigned Batches:
                        </span>
                        {resolveAssignedBatches(masterSchedule.batchIds).map((b) => (
                          <Link
                            key={b.id}
                            to={`/admin/batches/${b.id}`}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                              b.id === batch.id
                                ? "bg-primary text-background font-bold"
                                : "bg-accent/40 text-foreground hover:bg-accent hover:underline"
                            }`}
                          >
                            <span>{b.shortName || b.name}</span>
                            {b.id === batch.id && (
                              <span className="text-[9px] opacity-80">(This Batch)</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAssignProgramOpen(true)}
                        className="rounded-xl border border-border bg-card hover:bg-accent/20 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                      >
                        Switch Program
                      </button>
                      <Link
                        to="/admin/schedule/master-class"
                        className="rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        Edit in Master Hub
                      </Link>
                    </div>
                  </div>

                  {/* 4 Metadata Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Assigned Coach
                      </span>
                      <span className="font-bold text-foreground truncate block">
                        {masterSchedule.coachName || "Dolliee Ellens"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Curriculum
                      </span>
                      <span className="font-bold text-foreground truncate block">
                        12 Classes • 4 Weeks
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Batch Progress
                      </span>
                      <span className="font-bold text-foreground truncate block">
                        {batchProgress.completed} / {batchProgress.total} Completed (
                        {batchProgress.percent}%)
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Shift & Days
                      </span>
                      <span className="font-bold text-foreground truncate block">
                        {batch.daysPattern} • {batch.timingLabel}
                      </span>
                    </div>
                  </div>

                  {/* Batch-specific progress track line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span>{batch.name} Curriculum Tracking</span>
                      <span className="text-foreground font-bold">
                        {batchProgress.percent}% Done
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${batchProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

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
                            : "border border-border bg-card/80 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
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
                          ? "bg-accent text-foreground font-bold border border-border"
                          : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
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
                            ? "bg-accent text-foreground font-bold border border-border"
                            : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
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
                          i.classNumber === session.classNumber,
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
                                <span className="rounded-md bg-accent/40 px-2 py-0.5 text-[11px] font-semibold text-foreground">
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

                            {/* Session Floor Meta */}
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
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
                            </div>

                            {session.notes && (
                              <div className="rounded-xl bg-accent/20 p-2 text-xs text-foreground border border-border/50">
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
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors cursor-pointer"
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
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                    title="Cancel class session"
                                  >
                                    <X size={13} />
                                  </button>
                                </>
                              )}

                              {(isCompleted || isCancelled) && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreSession(session.id, session.subject)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/20 transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Create New Program for {batch.shortName || batch.name}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: TRAINERS */}
      {activeTab === "trainers" && (
        <div className="space-y-4">
          {filteredTrainers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <UserCheck size={32} className="mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground text-sm">
                {trainerSearch ? "No matching trainers found" : "No trainers assigned"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {trainerSearch
                  ? "Try searching with a different coach name or specialization."
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
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-accent">
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
                      {trn.specialization || "Fitness Coach"}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Members Table */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Member</th>
                  <th className="px-4 py-3.5 font-semibold">Contact</th>
                  <th className="px-4 py-3.5 font-semibold">Gender</th>
                  <th className="px-4 py-3.5 font-semibold">Joined</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <Users size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No members found</p>
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
                  filteredMembers.map((mem) => (
                    <tr key={mem.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground">
                            {mem.firstName?.charAt(0)}
                            {mem.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {mem.firstName} {mem.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{mem.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>{mem.mobile}</p>
                        <p className="text-[11px] opacity-75">{mem.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{mem.gender || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {mem.registeredAt
                          ? new Date(mem.registeredAt).toLocaleDateString()
                          : "Active"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-400">
                          {mem.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleRemoveMemberFromBatch(mem.id, `${mem.firstName} ${mem.lastName || ""}`)}
                            className="rounded-lg p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove from this batch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
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
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
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
                  className="p-1 rounded-lg text-muted-foreground hover:bg-accent/20 cursor-pointer"
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
                    className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer"
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
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {getMasterSchedules().map((prog) => {
                  const isCurrentlyAssigned =
                    (Array.isArray(prog.batchIds) && prog.batchIds.includes(batch.id)) ||
                    prog.batchId === batch.id;
                  const assignedBatches = resolveAssignedBatches(prog.batchIds);

                  return (
                    <div
                      key={prog.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isCurrentlyAssigned
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-foreground/20 hover:bg-accent/10"
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
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
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
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer"
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
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
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
                      placeholder="Search coaches by name or specialization..."
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
                        return (
                          t.name?.toLowerCase().includes(q) ||
                          t.specialization?.toLowerCase().includes(q)
                        );
                      })
                      .map((t) => {
                        const isAssigned = (batch.trainerIds || []).includes(t.id);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-accent flex items-center justify-center font-bold text-sm text-foreground">
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
                                  {t.specialization || "Fitness Coach"} • {t.experience || "3+ Yrs"}
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
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
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
                    {allMembers
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
                              <div className="h-9 w-9 shrink-0 rounded-full bg-accent flex items-center justify-center font-bold text-xs text-foreground">
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
    </div>
  );
}
