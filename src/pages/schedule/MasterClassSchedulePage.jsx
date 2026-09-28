/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Users,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Power,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Sparkles,
  X,
  Boxes,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches } from "@/lib/batchesService";
import {
  getMasterSchedules,
  createMasterSchedule,
  updateMasterSchedule,
  toggleMasterScheduleStatus,
  deleteMasterSchedule,
  getScheduleItems,
  updateMasterClassItem,
  addMasterClassItem,
  deleteMasterClassItem,
  calculateSequentialMapping,
  assignBatchesToProgram,
  getBatchTrackingSummary,
  updateSessionStatus,
  DEFAULT_12_CLASS_CURRICULUM,
  ALL_COACHES,
} from "@/lib/masterScheduleService";
import { InputField } from "@/components/form";

export default function MasterClassSchedulePage() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Modal State for Create / Edit Program
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    batchIds: [],
    daysPattern: "MWF",
    coachId: "TRN-101",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    description: "",
  });

  // Class Items Configuration State (in Program Form)
  const [classesData, setClassesData] = useState([]);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(0);

  // Modal State for View & Configure Classes & Batch Tracking
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [viewModalTab, setViewModalTab] = useState("curriculum"); // "curriculum" | "tracking"
  const [viewingItems, setViewingItems] = useState([]);
  const [editingClassInModalId, setEditingClassInModalId] = useState(null);
  const [editingClassForm, setEditingClassForm] = useState({ subject: "", message: "" });
  const [isAddingClassInModal, setIsAddingClassInModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ subject: "", message: "" });

  // Quick Batch Assignment Modal State
  const [assigningSchedule, setAssigningSchedule] = useState(null);
  const [assigningBatchIds, setAssigningBatchIds] = useState([]);

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const loadData = () => {
    const allSchedules = getMasterSchedules();
    const allBatches = getBatches();
    setSchedules(allSchedules);
    setBatches(allBatches);
  };

  // Derive days list from pattern
  const currentDaysList = useMemo(() => {
    if (formData.daysPattern === "TTS") {
      return ["Tuesday", "Thursday", "Saturday"];
    }
    if (formData.daysPattern === "Daily") {
      return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }
    return ["Monday", "Wednesday", "Friday"];
  }, [formData.daysPattern]);

  // Sequential mapping preview for the active form
  const sequentialPreview = useMemo(() => {
    return calculateSequentialMapping(
      currentDaysList,
      classesData.length || 12,
      formData.startDate,
    );
  }, [currentDaysList, classesData.length, formData.startDate]);

  // Filtered schedules for page listing
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const assignedIds = Array.isArray(s.batchIds) ? s.batchIds : s.batchId ? [s.batchId] : [];

      if (selectedStatusFilter !== "ALL" && s.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchCoach = s.coachName?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchDays = s.daysLabel?.toLowerCase().includes(q);
        const matchBatch = assignedIds.some((bId) => {
          const b = batches.find((item) => item.id === bId);
          return b?.name?.toLowerCase().includes(q) || b?.shortName?.toLowerCase().includes(q);
        });
        if (!matchName && !matchCoach && !matchDesc && !matchDays && !matchBatch) return false;
      }
      return true;
    });
  }, [schedules, selectedStatusFilter, searchQuery, batches]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === "Active").length;
    const totalClasses = schedules.reduce((acc, s) => acc + (s.totalClasses || 12), 0);
    const assignedBatchesSet = new Set();
    schedules.forEach((s) => {
      const list = Array.isArray(s.batchIds) ? s.batchIds : s.batchId ? [s.batchId] : [];
      list.forEach((bId) => assignedBatchesSet.add(bId));
    });
    return {
      total,
      active,
      totalClasses,
      coveredBatches: assignedBatchesSet.size,
    };
  }, [schedules]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const initialClasses = DEFAULT_12_CLASS_CURRICULUM.map((c) => ({
      classNumber: c.classNumber,
      subject: c.subject,
      message: c.message,
    }));

    setEditingScheduleId(null);
    setFormData({
      name: "12-Class Functional Strength & Conditioning",
      batchIds: [],
      daysPattern: "MWF",
      coachId: ALL_COACHES[0]?.id || "TRN-101",
      startDate: new Date().toISOString().slice(0, 10),
      status: "Active",
      description:
        "Reusable 12-class modular program assignable across multiple shifts and batches.",
    });
    setClassesData(initialClasses);
    setExpandedAccordionIndex(0);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (schedule) => {
    const items = getScheduleItems(schedule.id);
    let classesToLoad = [];
    if (items && items.length > 0) {
      classesToLoad = items.map((i) => ({
        id: i.id,
        classNumber: i.classNumber,
        subject: i.subject,
        message: i.message,
      }));
    } else {
      classesToLoad = DEFAULT_12_CLASS_CURRICULUM.map((c) => ({
        classNumber: c.classNumber,
        subject: c.subject,
        message: c.message,
      }));
    }

    const assignedIds = Array.isArray(schedule.batchIds)
      ? schedule.batchIds
      : schedule.batchId
        ? [schedule.batchId]
        : [];

    setEditingScheduleId(schedule.id);
    setFormData({
      name: schedule.name,
      batchIds: assignedIds,
      daysPattern: schedule.daysPattern || "MWF",
      coachId: schedule.coachId || "TRN-101",
      startDate: schedule.startDate || new Date().toISOString().slice(0, 10),
      status: schedule.status || "Active",
      description: schedule.description || "",
    });
    setClassesData(classesToLoad);
    setExpandedAccordionIndex(0);
    setIsFormModalOpen(true);
  };

  // Toggle batch selection in form
  const handleToggleFormBatch = (batchId) => {
    setFormData((prev) => {
      const exists = prev.batchIds.includes(batchId);
      const nextBatchIds = exists
        ? prev.batchIds.filter((id) => id !== batchId)
        : [...prev.batchIds, batchId];
      return { ...prev, batchIds: nextBatchIds };
    });
  };

  // Handle Class Subject or Message Change
  const handleClassItemChange = (index, field, value) => {
    setClassesData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle Add Class in Schedule Edit Modal
  const handleAddClassItem = () => {
    const nextNum = classesData.length + 1;
    const newClass = {
      classNumber: nextNum,
      subject: `Class ${nextNum}: Progressive Overload & Athletic Focus`,
      message: `Coaching focus, movement drills, and form cues for Class ${nextNum}.`,
    };
    setClassesData((prev) => [...prev, newClass]);
    setExpandedAccordionIndex(classesData.length);
    toast.success(`Class ${nextNum} added to program configuration.`);
  };

  // Handle Delete Class in Schedule Edit Modal
  const handleDeleteClassItem = (indexToDelete) => {
    if (classesData.length <= 1) {
      toast.error("A program configuration must contain at least 1 class.");
      return;
    }
    const filtered = classesData.filter((_, idx) => idx !== indexToDelete);
    const renumbered = filtered.map((c, idx) => ({
      ...c,
      classNumber: idx + 1,
    }));
    setClassesData(renumbered);
    setExpandedAccordionIndex(-1);
    toast.info(`Deleted Class ${indexToDelete + 1}. Remaining: ${renumbered.length} classes.`);
  };

  // Handle Duplicate Class in Schedule Edit Modal
  const handleDuplicateClassItem = (index) => {
    const target = classesData[index];
    const copy = {
      ...target,
      subject: `${target.subject} (Progression II)`,
    };
    const newClasses = [
      ...classesData.slice(0, index + 1),
      copy,
      ...classesData.slice(index + 1),
    ].map((c, idx) => ({ ...c, classNumber: idx + 1 }));
    setClassesData(newClasses);
    setExpandedAccordionIndex(index + 1);
    toast.success(`Duplicated Class ${index + 1}.`);
  };

  // Save Program Form
  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a Program Name.");
      return;
    }

    try {
      const selectedCoach = ALL_COACHES.find((c) => c.id === formData.coachId);
      const coachName = selectedCoach ? selectedCoach.name : "Assigned Coach";

      const programPayload = {
        name: formData.name.trim(),
        batchIds: formData.batchIds,
        daysPattern: formData.daysPattern,
        daysList: currentDaysList,
        coachId: formData.coachId,
        coachName,
        startDate: formData.startDate,
        status: formData.status,
        description: formData.description,
        totalClasses: classesData.length,
      };

      if (editingScheduleId) {
        updateMasterSchedule(editingScheduleId, programPayload, classesData);
        toast.success(
          `Program "${formData.name}" updated with ${formData.batchIds.length} assigned batches!`,
        );
      } else {
        createMasterSchedule(programPayload, classesData);
        toast.success(
          `Created reusable program "${formData.name}" with ${formData.batchIds.length} assigned batches!`,
        );
      }

      setIsFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save program.");
    }
  };


  // Toggle Status
  const handleToggleStatus = (id) => {
    try {
      const updated = toggleMasterScheduleStatus(id);
      if (updated) {
        toast.success(`Program status changed to ${updated.status}.`);
        loadData();
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  // Delete Schedule
  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"? This will remove all batch tracking sessions for this program.`,
      )
    ) {
      try {
        deleteMasterSchedule(id);
        toast.success(`Deleted program "${name}".`);
        loadData();
      } catch {
        toast.error("Failed to delete program.");
      }
    }
  };

  // Open View Modal (Curriculum or Tracking)
  const handleOpenViewClasses = (schedule, tab = "curriculum") => {
    const items = getScheduleItems(schedule.id);
    setViewingSchedule(schedule);
    setViewModalTab(tab);
    setViewingItems(items);
    setEditingClassInModalId(null);
    setIsAddingClassInModal(false);
    setNewClassForm({ subject: "", message: "" });
  };

  // Quick Batch Assignment Modal
  const handleOpenAssignModal = (schedule) => {
    const assignedIds = Array.isArray(schedule.batchIds)
      ? schedule.batchIds
      : schedule.batchId
        ? [schedule.batchId]
        : [];
    setAssigningSchedule(schedule);
    setAssigningBatchIds(assignedIds);
  };

  const handleToggleAssignBatch = (batchId) => {
    setAssigningBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId],
    );
  };

  const handleSaveBatchAssignments = () => {
    if (!assigningSchedule) return;
    try {
      assignBatchesToProgram(assigningSchedule.id, assigningBatchIds);
      toast.success(
        `Updated batches for "${assigningSchedule.name}" (${assigningBatchIds.length} assigned).`,
      );
      setAssigningSchedule(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update batch assignments.");
    }
  };

  // Save Edited Class in Syllabus Modal
  const handleSaveClassInModal = (itemId, classNumber) => {
    if (!editingClassForm.subject.trim()) {
      toast.error("Please enter a class subject.");
      return;
    }
    const updated = updateMasterClassItem(itemId, {
      subject: editingClassForm.subject,
      message: editingClassForm.message,
    });
    if (updated) {
      toast.success(
        `Class ${classNumber} updated! Updated across all assigned batches while preserving batch session tracking.`,
      );
      setEditingClassInModalId(null);
      if (viewingSchedule) {
        setViewingItems(getScheduleItems(viewingSchedule.id));
      }
      loadData();
    }
  };

  // Delete a Class in Syllabus Modal
  const handleDeleteClassInModal = (itemId, classNumber) => {
    if (viewingItems.length <= 1) {
      toast.error("A program must contain at least 1 class.");
      return;
    }
    deleteMasterClassItem(itemId);
    toast.info(`Class ${classNumber} removed. Remaining classes renumbered.`);
    if (viewingSchedule) {
      setViewingItems(getScheduleItems(viewingSchedule.id));
      const updatedSch = getMasterSchedules().find((s) => s.id === viewingSchedule.id);
      if (updatedSch) setViewingSchedule(updatedSch);
    }
    loadData();
  };

  // Save New Class in Syllabus Modal
  const handleSaveNewClassInModal = (e) => {
    e.preventDefault();
    if (!newClassForm.subject.trim()) {
      toast.error("Please enter a class subject.");
      return;
    }
    const added = addMasterClassItem(viewingSchedule.id, newClassForm);
    if (added) {
      toast.success(`Class ${added.classNumber} added to program and mapped to assigned batches!`);
      setNewClassForm({ subject: "", message: "" });
      setIsAddingClassInModal(false);
      if (viewingSchedule) {
        setViewingItems(getScheduleItems(viewingSchedule.id));
        const updatedSch = getMasterSchedules().find((s) => s.id === viewingSchedule.id);
        if (updatedSch) setViewingSchedule(updatedSch);
      }
      loadData();
    }
  };

  // Update session status for specific batch
  const handleUpdateBatchSessionStatus = (sessionId, newStatus) => {
    try {
      updateSessionStatus(sessionId, newStatus);
      toast.success(`Session status updated to ${newStatus}.`);
      loadData();
    } catch {
      toast.error("Failed to update session status.");
    }
  };

  // Tracking summary for viewing modal
  const viewingBatchTracking = useMemo(() => {
    if (!viewingSchedule) return [];
    return getBatchTrackingSummary(viewingSchedule.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingSchedule, schedules]);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Class Schedule
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Create reusable Scheduled Class Programs and assign a single program to multiple batches
            with separate batch-wise tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-background shadow-md transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Create Reusable Program</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Reusable Programs
            </span>
            <CalendarDays size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Curriculum programs</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Programs</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-500">
            {stats.active}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Running on floor</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Classes</span>
            <Dumbbell size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.totalClasses}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Syllabus units</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Batches Running</span>
            <Boxes size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.coveredBatches}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Assigned batches</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search programs by name or assigned batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9.5 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchQuery || selectedStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatusFilter("ALL");
              }}
              className="rounded-xl border border-border/80 px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
              title="Reset filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Program Cards Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <CalendarDays size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Scheduled Class Programs Found</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            {searchQuery || selectedStatusFilter !== "ALL"
              ? "No programs match your search filters. Try clearing the filters."
              : "No class programs created yet. Create a reusable program and assign it to batches!"}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-background hover:bg-primary/90"
          >
            <Plus size={16} /> Create Reusable Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredSchedules.map((schedule) => {
            const isActive = schedule.status === "Active";
            const assignedBatchIds = Array.isArray(schedule.batchIds)
              ? schedule.batchIds
              : schedule.batchId
                ? [schedule.batchId]
                : [];
            const assignedBatchObjs = assignedBatchIds
              .map((id) => batches.find((b) => b.id === id))
              .filter(Boolean);

            return (
              <div
                key={schedule.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Title, Batch Count, & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                          {schedule.totalClasses || 12}
                        </span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {schedule.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {schedule.description ||
                          "Reusable 12-class progressive periodization program."}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`}
                      />
                      {schedule.status}
                    </span>
                  </div>

                  {/* Multi-Batch Assignment Highlight Section */}
                  <div className="mt-4 rounded-xl border border-border/80 bg-accent/5 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                        <Boxes size={13} className="text-primary" />
                        <span>Assigned Batches ({assignedBatchObjs.length}):</span>
                      </span>
                      <button
                        onClick={() => handleOpenAssignModal(schedule)}
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Users size={12} />
                        <span>Manage Batches</span>
                      </button>
                    </div>

                    {assignedBatchObjs.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic flex items-center justify-between">
                        <span>Reusable Template (Not assigned to any batch yet)</span>
                        <button
                          onClick={() => handleOpenAssignModal(schedule)}
                          className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 cursor-pointer"
                        >
                          + Assign to Batches
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedBatchObjs.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{b.name || b.shortName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ({b.startTime})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenViewClasses(schedule, "curriculum")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      title="Configure and manage schedule curriculum classes"
                    >
                      <Eye size={14} />
                      <span>Configure Syllabus</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(schedule)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent/20 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                      title="Edit program configuration"
                    >
                      <Edit3 size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(schedule.id)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "text-amber-500 hover:bg-amber-500/10"
                          : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                      title={isActive ? "Deactivate program" : "Activate program"}
                    >
                      <Power size={13} />
                      <span>{isActive ? "Deactivate" : "Activate"}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(schedule.id, schedule.name)}
                      className="inline-flex items-center p-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete program"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROGRAM MODAL */}
      {isFormModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {editingScheduleId
                        ? "Edit Scheduled Class Program"
                        : "Create Scheduled Class Program"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Define a reusable curriculum program and assign it to multiple batches.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* SECTION 1: PROGRAM INFORMATION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Sparkles size={16} />
                      <span>1. Program Information</span>
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Reusable Curriculum Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputField
                      label="Program Name"
                      required
                      placeholder="e.g. 12-Class Functional Strength Foundations"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <InputField
                      label="Cycle Start Date"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 text-xs font-medium text-foreground block">
                      Program Curriculum Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Outline the primary objectives, athlete level, and periodization progression..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* SECTION 2: MULTI-BATCH ASSIGNMENT */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-2 gap-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <Boxes size={16} />
                        <span>2. Batch Assignment</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Assign this single program across multiple batches. Each batch maintains its
                        own separate floor session tracking.
                      </p>
                    </div>
                  </div>

                  {/* Batch Selection Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {batches.map((b) => {
                      const isSelected = formData.batchIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleFormBatch(b.id)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all select-none ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border bg-card hover:border-border/80 hover:bg-accent/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                                  isSelected
                                    ? "bg-primary border-primary text-background"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="font-bold text-sm text-foreground">
                                {b.name || b.shortName}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold rounded-md bg-accent/20 px-2 py-0.5 text-foreground">
                              {b.daysPattern || "MWF"}
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-amber-500 shrink-0" />
                              <span>{b.timingLabel || `${b.startTime} - ${b.endTime}`}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users size={12} className="text-blue-500 shrink-0" />
                              <span>
                                {b.currentPax || 0} / {b.maxPax || 28} Members
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    * Leaving all batches unchecked saves this as an unassigned reusable program
                    template.
                  </p>
                </div>

                {/* SECTION 3: CURRICULUM SYLLABUS */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-2 gap-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <Dumbbell size={16} />
                        <span>3. Program Curriculum</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The modular syllabus applies to all assigned batches.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddClassItem}
                        className="rounded-lg bg-primary/15 hover:bg-primary/25 text-primary px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                      >
                        + Add Class
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {classesData.map((cls, idx) => {
                      const isExpanded = expandedAccordionIndex === idx;
                      return (
                        <div
                          key={cls.classNumber || idx}
                          className="rounded-xl border border-border bg-background p-3 transition-colors"
                        >
                          <div
                            onClick={() => setExpandedAccordionIndex(isExpanded ? -1 : idx)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-primary text-background font-extrabold text-[11px]">
                                {cls.classNumber}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {cls.subject}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? "Collapse" : "Edit"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 space-y-2.5 pt-2 border-t border-border/60 animate-in fade-in duration-100">
                              <div>
                                <label className="block text-[11px] font-semibold text-foreground mb-1">
                                  Subject / Focus
                                </label>
                                <input
                                  type="text"
                                  value={cls.subject}
                                  onChange={(e) =>
                                    handleClassItemChange(idx, "subject", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-foreground mb-1">
                                  Coaching Message & Prescriptions
                                </label>
                                <textarea
                                  rows={2}
                                  value={cls.message}
                                  onChange={(e) =>
                                    handleClassItemChange(idx, "message", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateClassItem(idx)}
                                  className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  Duplicate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClassItem(idx)}
                                  className="rounded-md border border-destructive/30 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer inside form */}
                <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="rounded-xl border border-border bg-transparent px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-accent/15 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-background hover:bg-primary/90 shadow-md cursor-pointer active:scale-95"
                  >
                    {editingScheduleId ? "Update Program" : "Save Program"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* QUICK BATCH ASSIGNMENT MODAL */}
      {assigningSchedule &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-card shrink-0">
                <div className="flex items-center gap-2">
                  <Boxes size={18} className="text-primary" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Assign Batches to Program
                    </h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {assigningSchedule.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssigningSchedule(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-muted-foreground">
                  Select the batches that will run this scheduled class program. Each batch
                  maintains its own separate floor session schedule and completion status.
                </p>

                <div className="space-y-2">
                  {batches.map((b) => {
                    const isSelected = assigningBatchIds.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleToggleAssignBatch(b.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-2xs"
                            : "border-border bg-card hover:bg-accent/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-background"
                                : "border-muted-foreground/40 bg-background"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-foreground block">
                              {b.name || b.shortName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {b.timingLabel || `${b.startTime} - ${b.endTime}`} • {b.daysPattern}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-muted-foreground">
                          {b.currentPax || 0} Members
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border p-4 bg-card shrink-0 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {assigningBatchIds.length} batch(es) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAssigningSchedule(null)}
                    className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBatchAssignments}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 shadow-xs cursor-pointer"
                  >
                    Save Batch Assignments
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* VIEW MODAL (CURRICULUM SYLLABUS & BATCH TRACKING) */}
      {viewingSchedule &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-border px-6 py-4 bg-card shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                          {viewingSchedule.name}
                        </h2>
                        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                          {viewingItems.length} Classes
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {viewingSchedule.description || "Reusable class program curriculum"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingSchedule(null)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mt-4 border-b border-border/60 -mb-4">
                  <button
                    onClick={() => setViewModalTab("curriculum")}
                    className={`pb-3 px-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                      viewModalTab === "curriculum"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Dumbbell size={14} />
                    <span>Curriculum Syllabus ({viewingItems.length})</span>
                  </button>

                  <button
                    onClick={() => setViewModalTab("tracking")}
                    className={`pb-3 px-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                      viewModalTab === "tracking"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers size={14} />
                    <span>Batch-Wise Tracking ({viewingBatchTracking.length} Batches)</span>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {viewModalTab === "curriculum" ? (
                  /* TAB 1: CURRICULUM SYLLABUS */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                          Curriculum Classes ({viewingItems.length})
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Changes to syllabus update the workout guidance across all assigned
                          batches.
                        </p>
                      </div>

                      {!isAddingClassInModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingClassInModal(true);
                            setEditingClassInModalId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add Class #{viewingItems.length + 1}</span>
                        </button>
                      )}
                    </div>

                    {/* Add Class Form in Modal */}
                    {isAddingClassInModal && (
                      <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                          <h4 className="text-sm font-bold text-foreground">
                            Add Class #{viewingItems.length + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingClassInModal(false)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleSaveNewClassInModal} className="mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              Class Subject / Focus *
                            </label>
                            <input
                              type="text"
                              required
                              value={newClassForm.subject}
                              onChange={(e) =>
                                setNewClassForm((prev) => ({ ...prev, subject: e.target.value }))
                              }
                              placeholder="e.g. Posterior Chain Dominance & Core Hypertrophy"
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              Coaching Notes & Prescriptions
                            </label>
                            <textarea
                              rows={2}
                              value={newClassForm.message}
                              onChange={(e) =>
                                setNewClassForm((prev) => ({ ...prev, message: e.target.value }))
                              }
                              placeholder="Coaching cues, movement drills, and progression notes..."
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingClassInModal(false)}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/20 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-background hover:bg-primary/90 shadow-xs cursor-pointer"
                            >
                              Save Class #{viewingItems.length + 1}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Classes List */}
                    <div className="grid grid-cols-1 gap-3">
                      {viewingItems.map((item) => {
                        const isEditing = editingClassInModalId === item.id;
                        return (
                          <div
                            key={item.id || item.classNumber}
                            className={`rounded-xl border p-4 transition-all ${
                              isEditing
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-background/50 hover:border-primary/30"
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-3 animate-in fade-in duration-100">
                                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                  <span className="text-xs font-bold text-foreground">
                                    Editing Class {item.classNumber}
                                  </span>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                                    Subject / Focus
                                  </label>
                                  <input
                                    type="text"
                                    value={editingClassForm.subject}
                                    onChange={(e) =>
                                      setEditingClassForm((prev) => ({
                                        ...prev,
                                        subject: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                                    Coaching Cue / Prescriptions
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editingClassForm.message}
                                    onChange={(e) =>
                                      setEditingClassForm((prev) => ({
                                        ...prev,
                                        message: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingClassInModalId(null)}
                                    className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveClassInModal(item.id, item.classNumber)
                                    }
                                    className="rounded-lg bg-primary px-3.5 py-1 text-xs font-bold text-background hover:bg-primary/90 shadow-xs cursor-pointer"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-border/50">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-background font-extrabold text-xs">
                                      {item.classNumber}
                                    </span>
                                    <span className="font-bold text-sm text-foreground">
                                      {item.subject}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingClassInModalId(item.id);
                                        setEditingClassForm({
                                          subject: item.subject,
                                          message: item.message || "",
                                        });
                                      }}
                                      className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                      title={`Edit Class ${item.classNumber}`}
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteClassInModal(item.id, item.classNumber)
                                      }
                                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                      title={`Delete Class ${item.classNumber}`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                  {item.message ||
                                    "No specific coaching notes provided for this session."}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* TAB 2: SEPARATE BATCH-WISE TRACKING */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                          Separate Batch-Wise Tracking ({viewingBatchTracking.length} Batches)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Each batch tracks this reusable program independently. Updating session
                          status for one batch does not affect others.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const sch = viewingSchedule;
                          setViewingSchedule(null);
                          handleOpenAssignModal(sch);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent/20 cursor-pointer"
                      >
                        <Users size={14} />
                        <span>Assign More Batches</span>
                      </button>
                    </div>

                    {viewingBatchTracking.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                        <Boxes size={32} className="mx-auto text-muted-foreground mb-2" />
                        <h4 className="font-bold text-foreground text-sm">
                          No Batches Assigned Yet
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          This program is currently an unassigned reusable template. Assign it to
                          one or more batches to start tracking batch classes.
                        </p>
                        <button
                          onClick={() => {
                            const sch = viewingSchedule;
                            setViewingSchedule(null);
                            handleOpenAssignModal(sch);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background cursor-pointer hover:bg-primary/90"
                        >
                          <Plus size={14} />
                          <span>Assign Batches Now</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {viewingBatchTracking.map((batchTrack) => (
                          <div
                            key={batchTrack.batchId}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4"
                          >
                            {/* Batch Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                                  <Boxes size={16} />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-foreground">
                                      {batchTrack.batchName}
                                    </h4>
                                    <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-semibold text-foreground">
                                      {batchTrack.timing}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {batchTrack.daysLabel} • {batchTrack.currentPax} /{" "}
                                    {batchTrack.maxPax} Members
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setViewingSchedule(null);
                                    navigate(`/admin/batches/${batchTrack.batchId}`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-accent/30 hover:bg-accent/50 text-foreground px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <span>View Batch Page</span>
                                  <ArrowUpRight size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Batch Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-bold text-foreground">
                                  Batch Cycle Progress: {batchTrack.completed} of{" "}
                                  {batchTrack.totalSessions} Classes Completed
                                </span>
                                <span className="font-extrabold text-primary">
                                  {batchTrack.percentComplete}%
                                </span>
                              </div>
                              <div className="w-full bg-accent/20 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${batchTrack.percentComplete}%` }}
                                />
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <span>{batchTrack.completed} Completed</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  <span>{batchTrack.today} Today</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                                  <span>{batchTrack.scheduled} Scheduled</span>
                                </span>
                              </div>
                            </div>

                            {/* Batch Sessions List */}
                            <div className="space-y-2 pt-1">
                              <span className="text-[11px] uppercase font-bold text-muted-foreground block">
                                Floor Sessions for {batchTrack.batchName} (
                                {batchTrack.sessions.length}):
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                {batchTrack.sessions.map((session) => {
                                  const isComp = session.status === "COMPLETED";
                                  const isTod = session.status === "TODAY";
                                  const isCanc = session.status === "CANCELLED";

                                  return (
                                    <div
                                      key={session.id}
                                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background text-xs"
                                    >
                                      <div className="truncate mr-2">
                                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                                          <span className="text-primary font-extrabold">
                                            #{String(session.classNumber).padStart(2, "0")}
                                          </span>
                                          <span className="truncate">{session.subject}</span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground block truncate">
                                          {session.displayDate ||
                                            session.sessionDate ||
                                            "Scheduled Date"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                            isComp
                                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                              : isTod
                                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                                                : isCanc
                                                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                                                  : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                          }`}
                                        >
                                          {session.status}
                                        </span>

                                        <select
                                          value={session.status}
                                          onChange={(e) =>
                                            handleUpdateBatchSessionStatus(
                                              session.id,
                                              e.target.value,
                                            )
                                          }
                                          className="text-[10px] rounded-lg border border-border bg-card px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none"
                                          title="Update session status specifically for this batch"
                                        >
                                          <option value="SCHEDULED">Scheduled</option>
                                          <option value="TODAY">Today</option>
                                          <option value="COMPLETED">Completed</option>
                                          <option value="CANCELLED">Cancelled</option>
                                        </select>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border p-4 bg-card shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Reusable program assigned to {viewingBatchTracking.length} batch(es)
                </span>
                <button
                  onClick={() => setViewingSchedule(null)}
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
