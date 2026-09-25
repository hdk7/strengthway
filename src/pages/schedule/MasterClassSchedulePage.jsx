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
  Copy,
  Trash2,
  Power,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  X,
  UserCheck,
  Flame,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { getBatches } from "@/lib/batchesService";
import {
  getMasterSchedules,
  createMasterSchedule,
  updateMasterSchedule,
  duplicateMasterSchedule,
  toggleMasterScheduleStatus,
  deleteMasterSchedule,
  getScheduleItems,
  updateMasterClassItem,
  addMasterClassItem,
  deleteMasterClassItem,
  calculateSequentialMapping,
  DEFAULT_12_CLASS_CURRICULUM,
  ALTERNATIVE_CURRICULUM_ATHLETIC,
  BATCH_3_SEPTEMBER_CURRICULUM,
  ALL_COACHES,
} from "@/lib/masterScheduleService";
import { InputField, SelectField, TextareaField } from "@/components/form";

export default function MasterClassSchedulePage() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Modal State for Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    batchId: "",
    coachId: "TRN-101",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    description: "",
  });

  // Class Items Configuration State (in Schedule Form)
  const [classesData, setClassesData] = useState([]);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(0);

  // Modal State for View & Configure Classes
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [viewingItems, setViewingItems] = useState([]);
  const [editingClassInModalId, setEditingClassInModalId] = useState(null);
  const [editingClassForm, setEditingClassForm] = useState({ subject: "", message: "" });
  const [isAddingClassInModal, setIsAddingClassInModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ subject: "", message: "" });

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

  // Selected batch object for the active form
  const currentSelectedBatch = useMemo(() => {
    if (!formData.batchId) return batches[0] || null;
    return batches.find((b) => b.id === formData.batchId) || batches[0] || null;
  }, [batches, formData.batchId]);

  // Sequential mapping preview for the active form
  const sequentialPreview = useMemo(() => {
    if (!currentSelectedBatch) return [];
    return calculateSequentialMapping(
      currentSelectedBatch.daysList,
      classesData.length || 12,
      formData.startDate
    );
  }, [currentSelectedBatch, classesData.length, formData.startDate]);

  // Filtered schedules for page listing
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedBatchFilter !== "ALL" && s.batchId !== selectedBatchFilter) return false;
      if (selectedStatusFilter !== "ALL" && s.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchBatch = s.batchName?.toLowerCase().includes(q);
        const matchCoach = s.coachName?.toLowerCase().includes(q);
        const matchDays = s.daysLabel?.toLowerCase().includes(q);
        if (!matchName && !matchBatch && !matchCoach && !matchDays) return false;
      }
      return true;
    });
  }, [schedules, selectedBatchFilter, selectedStatusFilter, searchQuery]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === "Active").length;
    const totalClasses = total * 12;
    const coveredBatches = new Set(schedules.map((s) => s.batchId)).size;
    return { total, active, totalClasses, coveredBatches };
  }, [schedules]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const firstBatch = batches[0];
    const defaultBatchId = firstBatch?.id || "BATCH-01";
    const initialClasses = DEFAULT_12_CLASS_CURRICULUM.map((c) => ({
      classNumber: c.classNumber,
      subject: c.subject,
      message: c.message,
    }));

    setEditingScheduleId(null);
    setFormData({
      name: firstBatch ? `${firstBatch.shortName || firstBatch.name} Morning Program` : "New Master Class Schedule",
      batchId: defaultBatchId,
      coachId: ALL_COACHES[0]?.id || "TRN-101",
      startDate: new Date().toISOString().slice(0, 10),
      status: "Active",
      description: "12-Class structured curriculum mapped sequentially to the batch training cycle.",
    });
    setClassesData(initialClasses);
    setExpandedAccordionIndex(0);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (schedule) => {
    const items = getScheduleItems(schedule.id);
    let classesToLoad = [];
    if (items && items.length === 12) {
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

    setEditingScheduleId(schedule.id);
    setFormData({
      name: schedule.name,
      batchId: schedule.batchId,
      coachId: schedule.coachId || "TRN-101",
      startDate: schedule.startDate || new Date().toISOString().slice(0, 10),
      status: schedule.status || "Active",
      description: schedule.description || "",
    });
    setClassesData(classesToLoad);
    setExpandedAccordionIndex(0);
    setIsFormModalOpen(true);
  };

  // Handle Batch Selection in Form -> Auto-fill Shift, Days, Capacity
  const handleBatchChange = (e) => {
    const bId = e.target.value;
    const foundBatch = batches.find((b) => b.id === bId);
    setFormData((prev) => ({
      ...prev,
      batchId: bId,
      name: foundBatch ? `${foundBatch.shortName || foundBatch.name} Program` : prev.name,
    }));
  };

  // Quick Curriculum Template Fillers
  const handleApplyCurriculumTemplate = (type) => {
    const template = type === "athletic" ? ALTERNATIVE_CURRICULUM_ATHLETIC : DEFAULT_12_CLASS_CURRICULUM;
    setClassesData(
      template.map((c) => ({
        classNumber: c.classNumber,
        subject: c.subject,
        message: c.message,
      }))
    );
    toast.success(`Loaded ${type === "athletic" ? "Athletic Conditioning" : "Strength Foundations"} 12-class template`);
  };

  // Handle Class Subject or Message Change
  const handleClassItemChange = (index, field, value) => {
    setClassesData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle Add Class in Schedule Edit Modal (CREATE)
  const handleAddClassItem = () => {
    const nextNum = classesData.length + 1;
    const newClass = {
      classNumber: nextNum,
      subject: `Class ${nextNum}: Progressive Overload & Athletic Focus`,
      message: `Coaching focus, movement drills, and form cues for Class ${nextNum}.`,
    };
    setClassesData((prev) => [...prev, newClass]);
    setExpandedAccordionIndex(classesData.length);
    toast.success(`Class ${nextNum} added to schedule configuration.`);
  };

  // Handle Delete Class in Schedule Edit Modal (DELETE)
  const handleDeleteClassItem = (indexToDelete) => {
    if (classesData.length <= 1) {
      toast.error("A schedule configuration must contain at least 1 class.");
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

  // Save Schedule Form
  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a Schedule Name.");
      return;
    }
    if (!formData.batchId) {
      toast.error("Please select a Batch.");
      return;
    }

    try {
      const selectedCoach = ALL_COACHES.find((c) => c.id === formData.coachId);
      const coachName = selectedCoach ? selectedCoach.name : "Assigned Coach";

      if (editingScheduleId) {
        updateMasterSchedule(
          editingScheduleId,
          {
            name: formData.name,
            batchId: formData.batchId,
            coachId: formData.coachId,
            coachName,
            startDate: formData.startDate,
            status: formData.status,
            description: formData.description,
            totalClasses: classesData.length,
          },
          classesData
        );
        toast.success(`Master Class Schedule "${formData.name}" updated successfully!`);
      } else {
        createMasterSchedule(
          {
            name: formData.name,
            batchId: formData.batchId,
            coachId: formData.coachId,
            coachName,
            startDate: formData.startDate,
            status: formData.status,
            description: formData.description,
            totalClasses: classesData.length,
          },
          classesData
        );
        toast.success(`Created "${formData.name}" with ${classesData.length} mapped sessions!`);
      }

      setIsFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save schedule.");
    }
  };

  // Duplicate Schedule
  const handleDuplicate = (id, name) => {
    try {
      duplicateMasterSchedule(id);
      toast.success(`Duplicated "${name}" successfully.`);
      loadData();
    } catch {
      toast.error("Failed to duplicate schedule.");
    }
  };

  // Toggle Status
  const handleToggleStatus = (id, currentStatus) => {
    try {
      const updated = toggleMasterScheduleStatus(id);
      if (updated) {
        toast.success(`Schedule status changed to ${updated.status}.`);
        loadData();
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  // Delete Schedule
  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will remove all associated sessions.`)) {
      try {
        deleteMasterSchedule(id);
        toast.success(`Deleted schedule "${name}".`);
        loadData();
      } catch {
        toast.error("Failed to delete schedule.");
      }
    }
  };

  // View & Configure Classes Modal (READ)
  const handleOpenViewClasses = (schedule) => {
    const items = getScheduleItems(schedule.id);
    setViewingSchedule(schedule);
    setViewingItems(items);
    setEditingClassInModalId(null);
    setIsAddingClassInModal(false);
    setNewClassForm({ subject: "", message: "" });
  };

  // Start Editing a Class in Syllabus Modal (UPDATE)
  const handleStartEditClassInModal = (item) => {
    setEditingClassInModalId(item.id);
    setEditingClassForm({
      subject: item.subject,
      message: item.message || "",
    });
  };

  // Save Edited Class in Syllabus Modal (UPDATE)
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
      toast.success(`Class ${classNumber} updated successfully!`);
      setEditingClassInModalId(null);
      if (viewingSchedule) {
        setViewingItems(getScheduleItems(viewingSchedule.id));
      }
      loadData();
    }
  };

  // Delete a Class in Syllabus Modal (DELETE)
  const handleDeleteClassInModal = (itemId, classNumber) => {
    if (viewingItems.length <= 1) {
      toast.error("A schedule configuration must contain at least 1 class.");
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

  // Save New Class in Syllabus Modal (CREATE)
  const handleSaveNewClassInModal = (e) => {
    e.preventDefault();
    if (!newClassForm.subject.trim()) {
      toast.error("Please enter a class subject.");
      return;
    }
    const added = addMasterClassItem(viewingSchedule.id, newClassForm);
    if (added) {
      toast.success(`Class ${added.classNumber} added to schedule!`);
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
              Master Class Schedule
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            12-Class modular master curriculum templates mapped sequentially across shifts and batch days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/batches")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:bg-accent/20 cursor-pointer shadow-xs"
          >
            <Boxes size={16} className="text-muted-foreground" />
            <span>Batch Schedule</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-background shadow-md transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Create Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Schedules</span>
            <CalendarDays size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Program templates</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Programs</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-500">{stats.active}</div>
          <p className="mt-1 text-xs text-muted-foreground">Running on floor</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Classes</span>
            <Dumbbell size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">{stats.totalClasses}</div>
          <p className="mt-1 text-xs text-muted-foreground">12 classes per program</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Batches Mapped</span>
            <Boxes size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">{stats.coveredBatches}</div>
          <p className="mt-1 text-xs text-muted-foreground">Shift assignments</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search schedules by name, batch, coach, or day pattern..."
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
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || b.shortName} ({b.startTime})
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchQuery || selectedBatchFilter !== "ALL" || selectedStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBatchFilter("ALL");
                setSelectedStatusFilter("ALL");
              }}
              className="rounded-xl border border-border/80 px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/20 hover:text-foreground"
              title="Reset filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Schedule Cards Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <CalendarDays size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Master Class Schedules Found</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            {searchQuery || selectedBatchFilter !== "ALL"
              ? "No schedules match your search filters. Try clearing the filters."
              : "No master class schedules configured yet. Create your first 12-class schedule template!"}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-background hover:bg-primary/90"
          >
            <Plus size={16} /> Create Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredSchedules.map((schedule) => {
            const isActive = schedule.status === "Active";
            return (
              <div
                key={schedule.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
              >
                {/* Top Bar: Title & Status */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                          {schedule.totalClasses || 12}
                        </span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {schedule.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {schedule.description || "12-Class progressive periodization template."}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                      {schedule.status}
                    </span>
                  </div>

                  {/* Schedule Details Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                    {/* Batch */}
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <Boxes size={15} className="text-primary shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Batch</span>
                        <span className="font-semibold text-foreground truncate">{schedule.batchName || schedule.batchId}</span>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <Clock size={15} className="text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Timing</span>
                        <span className="font-semibold text-foreground truncate">{schedule.timing || schedule.shift}</span>
                      </div>
                    </div>

                    {/* Days */}
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <CalendarDays size={15} className="text-blue-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Days</span>
                        <span className="font-semibold text-foreground truncate">{schedule.daysLabel || "MWF"}</span>
                      </div>
                    </div>

                    {/* Coach */}
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-accent/10 px-3 py-2">
                      <UserCheck size={15} className="text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Coach</span>
                        <span className="font-semibold text-foreground truncate">{schedule.coachName || "Dolliee Ellens"}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenViewClasses(schedule)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      title="Configure and manage schedule classes (CRUD)"
                    >
                      <Eye size={14} />
                      <span>Configure Classes</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(schedule)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent/20 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                      title="Edit schedule configuration"
                    >
                      <Edit3 size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicate(schedule.id, schedule.name)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent/20 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                      title="Duplicate schedule template"
                    >
                      <Copy size={14} />
                      <span className="hidden sm:inline">Duplicate</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "text-amber-500 hover:bg-amber-500/10"
                          : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                      title={isActive ? "Deactivate schedule" : "Activate schedule"}
                    >
                      <Power size={13} />
                      <span>{isActive ? "Deactivate" : "Activate"}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(schedule.id, schedule.name)}
                      className="inline-flex items-center p-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete schedule"
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

      {/* CREATE / EDIT SCHEDULE MODAL */}
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
                    {editingScheduleId ? "Edit Master Class Schedule" : "Create Master Class Schedule"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure curriculum parameters and 12-class sequential mapping.
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
              {/* SECTION 1: SCHEDULE INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Sparkles size={16} />
                    <span>1. Schedule Information</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">Batch & Shift Association</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Schedule Name */}
                  <InputField
                    label="Schedule Name"
                    required
                    placeholder="e.g. MWF Morning Program"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  {/* Batch Selection */}
                  <div className="flex flex-col text-left">
                    <label className="mb-1 text-xs font-medium text-foreground">
                      Batch <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.batchId}
                      onChange={handleBatchChange}
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name || b.shortName} • {b.startTime} ({b.daysPattern || "MWF"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* IMPORTANT BEHAVIOR: Auto-filled values banner */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                    <Info size={15} />
                    <span>Auto-filled from Batch ({currentSelectedBatch?.shortName || currentSelectedBatch?.name || "Selected Batch"}):</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-card/80 border border-border p-2.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Shift Timing</span>
                      <span className="font-extrabold text-foreground text-sm">
                        {currentSelectedBatch?.timingLabel || currentSelectedBatch?.startTime || "06:00 AM - 07:00 AM"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-card/80 border border-border p-2.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Working Days</span>
                      <span className="font-extrabold text-foreground text-sm">
                        {currentSelectedBatch?.daysLabel || "Monday • Wednesday • Friday"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-card/80 border border-border p-2.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Max Capacity</span>
                      <span className="font-extrabold text-foreground text-sm">
                        {currentSelectedBatch?.maxPax || 28} Members
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    * Shift, days, and capacity are locked to the batch definition and auto-populated.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Coach Selection */}
                  <div className="flex flex-col text-left">
                    <label className="mb-1 text-xs font-medium text-foreground">
                      Assigned Coach <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.coachId}
                      onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                    >
                      {ALL_COACHES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <InputField
                    label="Cycle Start Date"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />

                  {/* Total Classes & Status */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 text-xs font-medium text-muted-foreground block">Classes</label>
                      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm font-bold text-foreground text-center">
                        12 Classes
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 text-xs font-medium text-foreground block">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CLASS CONFIGURATION (ACCORDION) */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/80 pb-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Dumbbell size={16} />
                      <span>2. Class Configuration ({classesData.length} Classes)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Define subject and coaching message for each sequential class (Create, Edit, Duplicate, Delete).
                    </p>
                  </div>

                  {/* Quick Fill & Add Class */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAddClassItem}
                      className="rounded-lg bg-primary text-background px-3 py-1 text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={13} />
                      <span>Add Class</span>
                    </button>
                    <span className="text-[11px] font-semibold text-muted-foreground">Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyCurriculumTemplate("strength")}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer shadow-2xs"
                    >
                      Strength (12)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCurriculumTemplate("athletic")}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent/20 cursor-pointer shadow-2xs"
                    >
                      Athletic (12)
                    </button>
                  </div>
                </div>

                {/* Accordion List */}
                <div className="space-y-2">
                  {classesData.map((cls, index) => {
                    const isExpanded = expandedAccordionIndex === index;
                    const previewItem = sequentialPreview[index] || {};
                    return (
                      <div
                        key={cls.classNumber}
                        className={`rounded-xl border transition-all duration-150 ${
                          isExpanded
                            ? "border-primary/40 bg-accent/10 shadow-xs"
                            : "border-border bg-card hover:border-border/80"
                        }`}
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedAccordionIndex(isExpanded ? -1 : index)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-extrabold">
                              {cls.classNumber}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-sm text-foreground">
                                Class {cls.classNumber}: {cls.subject || "Untitled Class"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 ml-2">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateClassItem(index);
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-accent/20 transition-colors"
                              title="Duplicate this class"
                            >
                              <Copy size={13} />
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClassItem(index);
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete this class"
                            >
                              <Trash2 size={13} />
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              <span>Week {previewItem.weekNumber || Math.floor(index / 3) + 1}</span>
                              <span>•</span>
                              <span>{previewItem.dayOfWeek || "Batch Day"}</span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-primary" />
                            ) : (
                              <ChevronDown size={16} className="text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Body */}
                        {isExpanded && (
                          <div className="border-t border-border/60 p-4 space-y-3 bg-background/40 animate-in fade-in-50 duration-100">
                            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                              <span>
                                Mapped Occurrence:{" "}
                                <strong className="text-foreground">
                                  Week {previewItem.weekNumber} • {previewItem.dayOfWeek}
                                </strong>
                              </span>
                              {previewItem.displayDate && (
                                <span className="text-primary font-medium">{previewItem.displayDate}</span>
                              )}
                            </div>

                            <InputField
                              label="Subject / Topic"
                              placeholder="e.g. Introduction to Training & Movement Assessment"
                              value={cls.subject}
                              onChange={(e) => handleClassItemChange(index, "subject", e.target.value)}
                            />

                            <TextareaField
                              label="Coaching Notes / Member Briefing Message"
                              rows={2}
                              placeholder="Enter workout instructions, equipment cues, and focus notes..."
                              value={cls.message}
                              onChange={(e) => handleClassItemChange(index, "message", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Class button at bottom of list */}
                  <button
                    type="button"
                    onClick={handleAddClassItem}
                    className="w-full py-2.5 rounded-xl border border-dashed border-border bg-card/40 hover:bg-accent/20 hover:border-primary/50 text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                  >
                    <Plus size={15} />
                    <span>Add Class #{classesData.length + 1} to Configuration</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: CLASS SCHEDULE PREVIEW TABLE (SECTION 7 IN PROMPT) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Calendar size={16} />
                    <span>3. Class Schedule Preview</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">Sequential Batch Day Mapping</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3.5 py-2.5">Class</th>
                        <th className="px-3.5 py-2.5">Week</th>
                        <th className="px-3.5 py-2.5">Day</th>
                        <th className="px-3.5 py-2.5">Scheduled Date</th>
                        <th className="px-3.5 py-2.5">Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sequentialPreview.map((item, idx) => {
                        const classData = classesData[idx] || {};
                        return (
                          <tr key={item.classNumber} className="hover:bg-accent/10 transition-colors">
                            <td className="px-3.5 py-2 font-bold text-primary">
                              #{String(item.classNumber).padStart(2, "0")}
                            </td>
                            <td className="px-3.5 py-2 font-medium text-foreground">
                              Week {item.weekNumber}
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="inline-block rounded-md bg-accent/20 px-2 py-0.5 font-semibold text-foreground text-[11px]">
                                {item.dayOfWeek}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-muted-foreground">
                              {item.displayDate || "—"}
                            </td>
                            <td className="px-3.5 py-2 font-medium text-foreground truncate max-w-[280px]">
                              {classData.subject || `Class ${item.classNumber}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                  {editingScheduleId ? "Update Schedule" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW CLASSES MODAL */}
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
              <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{viewingSchedule.name}</h2>
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                        {viewingItems.length} Classes
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewingSchedule.batchName} • {viewingSchedule.timing} • {viewingSchedule.daysLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingClassInModal(true);
                      setEditingClassInModalId(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Class</span>
                  </button>
                  <button
                    onClick={() => setViewingSchedule(null)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Meta bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-accent/10 border border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Coach</span>
                    <span className="font-bold text-foreground">{viewingSchedule.coachName || "Dolliee Ellens"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Classes</span>
                    <span className="font-bold text-foreground">
                      {viewingItems.length} Classes ({Math.max(1, Math.ceil(viewingItems.length / 3))} Weeks)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Max Capacity</span>
                    <span className="font-bold text-foreground">{viewingSchedule.capacity || 28} Members</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Status</span>
                    <span className="font-bold text-emerald-500">{viewingSchedule.status}</span>
                  </div>
                </div>

                {/* Add Class Form (CREATE in modal) */}
                {isAddingClassInModal && (
                  <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-background font-extrabold text-xs">
                          +{viewingItems.length + 1}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          Add Class #{viewingItems.length + 1} Configuration
                        </h4>
                      </div>
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
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
                          placeholder="Coaching instructions, tempo cues, warm-up targets..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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

                {/* Classes List / Syllabus (READ, UPDATE, DELETE) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Class Curriculum & Details ({viewingItems.length})
                    </h3>
                    {!isAddingClassInModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingClassInModal(true);
                          setEditingClassInModalId(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Class #{viewingItems.length + 1}</span>
                      </button>
                    )}
                  </div>

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
                            /* Inline Edit Form (UPDATE) */
                            <div className="space-y-3 animate-in fade-in duration-100">
                              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-background font-extrabold text-xs">
                                    {item.classNumber}
                                  </span>
                                  <span className="text-xs font-bold text-foreground">
                                    Editing Class {item.classNumber}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Week {item.weekNumber} • {item.dayOfWeek} • {item.displayDate}
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
                            /* Card View with Edit & Delete Triggers (READ, UPDATE, DELETE) */
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
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-md bg-accent/20 px-2 py-0.5 font-semibold text-foreground">
                                      Week {item.weekNumber} • {item.dayOfWeek}
                                    </span>
                                    {item.displayDate && (
                                      <span className="text-primary font-medium">
                                        {item.displayDate}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 border-l border-border/60 pl-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditClassInModal(item)}
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

                  {/* Add Class button at bottom of list */}
                  {!isAddingClassInModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingClassInModal(true);
                        setEditingClassInModalId(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-card/40 hover:bg-accent/15 text-xs font-bold text-primary transition-colors cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Add Class #{viewingItems.length + 1}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border p-4 bg-card shrink-0 flex items-center justify-between">
                <button
                  onClick={() => {
                    const targetBatchId = viewingSchedule.batchId;
                    setViewingSchedule(null);
                    navigate(targetBatchId ? `/admin/batches/${targetBatchId}` : "/admin/batches");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span>Open in Batch Schedule</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => setViewingSchedule(null)}
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 cursor-pointer"
                >
                  Close
                </button>
              </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
