/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Layers,
  Users,
  Award,
  CalendarCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  UserCheck,
  FileSpreadsheet,
  ExternalLink,
  Eye,
  BookOpen,
  ShieldCheck,
  ArrowRightLeft,
  MessageSquare,
  Flame,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMonthlyBatchReport,
  getMonthlyMemberReport,
  getMonthlyTrainerReport,
  getMonthlyClassReport,
  exportReportToCsv,
} from "@/lib/reportsService";
import { getBatches } from "@/lib/batchesService";
import { Pagination } from "@/components/table";

export default function ReportsPage() {
  // ─── Active Tab & Month State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("batches"); // "batches" | "members" | "trainers" | "classes"
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  // ─── Loading & Error States ──────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Data States ─────────────────────────────────────────────────────────────
  const [batchesReport, setBatchesReport] = useState(null);
  const [membersReport, setMembersReport] = useState(null);
  const [trainersReport, setTrainersReport] = useState(null);
  const [classesReport, setClassesReport] = useState(null);
  const [allBatchesList, setAllBatchesList] = useState([]);

  // ─── Filters & Search States ─────────────────────────────────────────────────
  // Batch Tab Filters
  const [batchSearch, setBatchSearch] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");
  const [occupancyThreshold, setOccupancyThreshold] = useState("ALL"); // "ALL" | "HIGH" | "OPTIMAL" | "LOW"

  // Member Tab Filters
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL"); // "ALL" | "AT_RISK" | "COMPLIANT" | "FLEX"
  const [memberBatchFilter, setMemberBatchFilter] = useState("ALL");

  // Trainer Tab Filters
  const [trainerSearch, setTrainerSearch] = useState("");
  const [trainerShiftFilter, setTrainerShiftFilter] = useState("ALL");

  // Class Tab Filters
  const [classSubView, setClassSubView] = useState("curriculum"); // "curriculum" | "feedback"
  const [classBatchFilter, setClassBatchFilter] = useState("ALL");
  const [classStatusFilter, setClassStatusFilter] = useState("ALL");
  const [classSearch, setClassSearch] = useState("");

  // ─── 1. Load Batches List for Dropdowns ───────────────────────────────────────
  useEffect(() => {
    getBatches()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.batches || [];
        setAllBatchesList(list);
      })
      .catch((err) => {
        console.error("Failed to load batch list:", err);
      });
  }, []);

  // ─── 2. Fetch Active Report Data on Month or Tab Change ──────────────────────
  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "batches") {
        const data = await getMonthlyBatchReport(selectedMonth, selectedBatchFilter);
        setBatchesReport(data);
      } else if (activeTab === "members") {
        const data = await getMonthlyMemberReport(selectedMonth, "All");
        setMembersReport(data);
      } else if (activeTab === "trainers") {
        const data = await getMonthlyTrainerReport(selectedMonth);
        setTrainersReport(data);
      } else if (activeTab === "classes") {
        const data = await getMonthlyClassReport(selectedMonth);
        setClassesReport(data);
      }
    } catch (err) {
      console.error(`Failed to load ${activeTab} report:`, err);
      toast.error(`Could not fetch ${activeTab} analytics for ${selectedMonth}.`);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedMonth, selectedBatchFilter]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // ─── Month Navigation ────────────────────────────────────────────────────────
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 2, 1);
    const newYm = date.toISOString().slice(0, 7);
    setSelectedMonth(newYm);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m, 1);
    const newYm = date.toISOString().slice(0, 7);
    setSelectedMonth(newYm);
  };

  const handleCurrentMonth = () => {
    const current = new Date().toISOString().slice(0, 7);
    setSelectedMonth(current);
  };

  const formatMonthTitle = (ym) => {
    if (!ym) return "";
    const [year, month] = ym.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // ─── Filtered Data Collections ───────────────────────────────────────────────

  // 1. Filtered Batches
  const filteredBatches = useMemo(() => {
    if (!batchesReport) return [];
    let list = [];
    if (batchesReport.type === "SINGLE_BATCH" && batchesReport.data) {
      const b = batchesReport.data;
      list = [
        {
          batchId: b.batchId,
          name: b.name,
          shortName: b.shortName,
          timingLabel: b.timingLabel,
          daysLabel: b.daysLabel,
          maxPax: b.summary.maxPax,
          primaryPax: b.summary.primaryPax,
          flexInPax: b.summary.flexInPax,
          flexOutPax: (b.category2_Members?.primaryMembers || []).filter((m) => m.isFlexOutActive).length,
          capacityHeadroom: Math.max(0, b.summary.maxPax - (b.summary.primaryPax + b.summary.flexInPax)),
          occupancyPercent: b.summary.occupancyPercent,
          totalSessions: b.summary.totalSessions,
          completedSessions: b.summary.completedSessions,
          attendanceRate: b.summary.overallAttendanceRate,
          averageClassAttendance: b.summary.completedSessions > 0 ? Math.round((b.summary.classesConductedInMonth || 10) * 1.2) : 0,
        },
      ];
    } else {
      list = Array.isArray(batchesReport.batches) ? batchesReport.batches : [];
    }

    return list.filter((b) => {
      // Search filter
      const matchesSearch =
        !batchSearch.trim() ||
        b.name?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.batchId?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.timingLabel?.toLowerCase().includes(batchSearch.toLowerCase());

      // Occupancy threshold filter
      let matchesThreshold = true;
      if (occupancyThreshold === "HIGH") {
        matchesThreshold = (b.occupancyPercent || 0) >= 90;
      } else if (occupancyThreshold === "OPTIMAL") {
        matchesThreshold = (b.occupancyPercent || 0) >= 60 && (b.occupancyPercent || 0) < 90;
      } else if (occupancyThreshold === "LOW") {
        matchesThreshold = (b.occupancyPercent || 0) < 60;
      }

      return matchesSearch && matchesThreshold;
    });
  }, [batchesReport, batchSearch, occupancyThreshold]);

  // 2. Filtered Members
  const filteredMembers = useMemo(() => {
    const list = Array.isArray(membersReport?.members) ? membersReport.members : [];
    return list.filter((m) => {
      // Search
      const q = memberSearch.toLowerCase();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.batchName?.toLowerCase().includes(q);

      // Status/Risk Filter
      let matchesStatus = true;
      if (memberStatusFilter === "AT_RISK") {
        matchesStatus = m.isAtRisk;
      } else if (memberStatusFilter === "COMPLIANT") {
        matchesStatus = !m.isAtRisk && m.totalLoggedSessions > 0;
      } else if (memberStatusFilter === "FLEX") {
        matchesStatus = m.hasActiveFlex || m.flexCount > 0;
      }

      // Batch filter
      const matchesBatch =
        memberBatchFilter === "ALL" || m.batchId === memberBatchFilter;

      return matchesSearch && matchesStatus && matchesBatch;
    });
  }, [membersReport, memberSearch, memberStatusFilter, memberBatchFilter]);

  // 3. Filtered Trainers
  const filteredTrainers = useMemo(() => {
    const list = Array.isArray(trainersReport?.trainers) ? trainersReport.trainers : [];
    return list.filter((t) => {
      const q = trainerSearch.toLowerCase();
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.trainerId?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.includes(q);

      const matchesShift =
        trainerShiftFilter === "ALL" ||
        t.shift?.toLowerCase() === trainerShiftFilter.toLowerCase();

      return matchesSearch && matchesShift;
    });
  }, [trainersReport, trainerSearch, trainerShiftFilter]);

  // 4. Filtered Classes & Feedback
  const filteredClassesProgress = useMemo(() => {
    const list = Array.isArray(classesReport?.batchesProgress) ? classesReport.batchesProgress : [];
    return list.filter((bp) => {
      const matchesBatch =
        classBatchFilter === "ALL" || bp.batchId === classBatchFilter;
      const matchesSearch =
        !classSearch.trim() ||
        bp.batchName?.toLowerCase().includes(classSearch.toLowerCase()) ||
        bp.batchId?.toLowerCase().includes(classSearch.toLowerCase());
      return matchesBatch && matchesSearch;
    });
  }, [classesReport, classBatchFilter, classSearch]);

  const filteredFeedbackNotes = useMemo(() => {
    const list = Array.isArray(classesReport?.feedbackNotes) ? classesReport.feedbackNotes : [];
    return list.filter((n) => {
      const q = classSearch.toLowerCase();
      const matchesSearch =
        !q ||
        n.batchName?.toLowerCase().includes(q) ||
        n.coachName?.toLowerCase().includes(q) ||
        n.className?.toLowerCase().includes(q) ||
        n.notes?.toLowerCase().includes(q);

      const matchesBatch =
        classBatchFilter === "ALL" || n.batchId === classBatchFilter;

      return matchesSearch && matchesBatch;
    });
  }, [classesReport, classSearch, classBatchFilter]);

  const filteredSessionsList = useMemo(() => {
    const list = Array.isArray(classesReport?.sessions) ? classesReport.sessions : [];
    return list.filter((s) => {
      const q = classSearch.toLowerCase();
      const matchesSearch =
        !q ||
        s.batchName?.toLowerCase().includes(q) ||
        s.coachName?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q);

      const matchesBatch =
        classBatchFilter === "ALL" || s.batchId === classBatchFilter;

      const matchesStatus =
        classStatusFilter === "ALL" || s.status === classStatusFilter;

      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [classesReport, classSearch, classBatchFilter, classStatusFilter]);

  // ─── Pagination States per Tab ──────────────────────────────────────────────
  const [batchesPage, setBatchesPage] = useState(1);
  const batchesPageSize = 8;
  useEffect(() => {
    setBatchesPage(1);
  }, [batchSearch, selectedBatchFilter, occupancyThreshold, selectedMonth]);
  const totalBatchesPages = Math.max(1, Math.ceil(filteredBatches.length / batchesPageSize));
  const safeBatchesPage = Math.max(1, Math.min(batchesPage, totalBatchesPages));
  const paginatedBatches = useMemo(() => {
    const start = (safeBatchesPage - 1) * batchesPageSize;
    return filteredBatches.slice(start, start + batchesPageSize);
  }, [filteredBatches, safeBatchesPage, batchesPageSize]);

  const [membersPage, setMembersPage] = useState(1);
  const membersPageSize = 8;
  useEffect(() => {
    setMembersPage(1);
  }, [memberSearch, memberStatusFilter, memberBatchFilter, selectedMonth]);
  const totalMembersPages = Math.max(1, Math.ceil(filteredMembers.length / membersPageSize));
  const safeMembersPage = Math.max(1, Math.min(membersPage, totalMembersPages));
  const paginatedMembers = useMemo(() => {
    const start = (safeMembersPage - 1) * membersPageSize;
    return filteredMembers.slice(start, start + membersPageSize);
  }, [filteredMembers, safeMembersPage, membersPageSize]);

  const [trainersPage, setTrainersPage] = useState(1);
  const trainersPageSize = 8;
  useEffect(() => {
    setTrainersPage(1);
  }, [trainerSearch, trainerShiftFilter, selectedMonth]);
  const totalTrainersPages = Math.max(1, Math.ceil(filteredTrainers.length / trainersPageSize));
  const safeTrainersPage = Math.max(1, Math.min(trainersPage, totalTrainersPages));
  const paginatedTrainers = useMemo(() => {
    const start = (safeTrainersPage - 1) * trainersPageSize;
    return filteredTrainers.slice(start, start + trainersPageSize);
  }, [filteredTrainers, safeTrainersPage, trainersPageSize]);

  const [classesPage, setClassesPage] = useState(1);
  const classesPageSize = 8;
  useEffect(() => {
    setClassesPage(1);
  }, [classSearch, classBatchFilter, classStatusFilter, classSubView, selectedMonth]);
  const totalClassesPages = Math.max(
    1,
    Math.ceil(
      (classSubView === "curriculum"
        ? filteredClassesProgress.length
        : filteredSessionsList.length) / classesPageSize
    )
  );
  const safeClassesPage = Math.max(1, Math.min(classesPage, totalClassesPages));
  const paginatedClassesProgress = useMemo(() => {
    const start = (safeClassesPage - 1) * classesPageSize;
    return filteredClassesProgress.slice(start, start + classesPageSize);
  }, [filteredClassesProgress, safeClassesPage, classesPageSize]);
  const paginatedSessionsList = useMemo(() => {
    const start = (safeClassesPage - 1) * classesPageSize;
    return filteredSessionsList.slice(start, start + classesPageSize);
  }, [filteredSessionsList, safeClassesPage, classesPageSize]);

  // ─── Export Handler ──────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      if (activeTab === "batches") {
        if (filteredBatches.length === 0) {
          toast.error("No batch rows available to export.");
          return;
        }
        const exportRows = filteredBatches.map((b) => ({
          "Batch ID": b.batchId,
          "Batch Name": b.name,
          "Timing Schedule": b.timingLabel,
          "Assigned Days": b.daysLabel,
          "Primary Enrolled": b.primaryPax,
          "Active Flex In": b.flexInPax,
          "Active Flex Out": b.flexOutPax || 0,
          "Flex In:Out Ratio": b.flexRatio || `${b.flexInPax}:${b.flexOutPax || 0}`,
          "Max Capacity Pax": b.maxPax,
          "Occupancy Rate %": `${b.occupancyPercent}%`,
          "Capacity Headroom": b.capacityHeadroom,
          "Conducted Sessions": b.completedSessions,
          "Total Scheduled Sessions": b.totalSessions,
          "Attendance Rate %": `${b.attendanceRate}%`,
          "Average Class Attendance": b.averageClassAttendance || 0,
        }));
        exportReportToCsv(
          "batch_utilization",
          exportRows,
          `strengthway_batch_utilization_${selectedMonth}.csv`
        );
        toast.success(`Exported ${exportRows.length} batch records to CSV.`);
      } else if (activeTab === "members") {
        if (filteredMembers.length === 0) {
          toast.error("No member rows available to export.");
          return;
        }
        const exportRows = filteredMembers.map((m) => ({
          "Member ID": m.memberId,
          "Full Name": m.name,
          "Email Address": m.email,
          "Mobile Phone": m.mobile,
          "Membership Status": m.status,
          "Primary Batch": m.batchName,
          "Total Sessions Logged": m.totalLoggedSessions,
          "Total Present": m.presentCount,
          "Primary Sessions Present": m.primaryPresentCount ?? (m.presentCount - (m.flexCount || 0)),
          "Flex Sessions Present": m.flexCount || 0,
          "Absences Logged": m.absentCount,
          "Attendance Compliance %": `${m.attendanceRate}%`,
          "At-Risk Flag (<60%)": m.isAtRisk ? "YES - ACTION REQUIRED" : "NO",
          "Active Flex Pass": m.hasActiveFlex ? "YES" : "NO",
        }));
        exportReportToCsv(
          "member_compliance",
          exportRows,
          `strengthway_member_compliance_${selectedMonth}.csv`
        );
        toast.success(`Exported ${exportRows.length} member compliance records to CSV.`);
      } else if (activeTab === "trainers") {
        if (filteredTrainers.length === 0) {
          toast.error("No trainer rows available to export.");
          return;
        }
        const exportRows = filteredTrainers.map((t) => ({
          "Trainer ID": t.trainerId,
          "Faculty Name": t.name,
          "Email Address": t.email,
          "Contact Number": t.phone,
          "Assigned Shift": t.shift,
          "Faculty Status": t.status,
          "Classes Scheduled": t.classesScheduled,
          "Classes Conducted": t.classesConducted,
          "Coaching Floor Hours": t.coachingHours,
          "Substitute Coverages Handled": t.substituteCoverages || 0,
          "Total Athletes Coached": t.totalAttendeesCoached,
          "Avg Class Attendance": t.avgClassAttendance,
        }));
        exportReportToCsv(
          "trainer_performance",
          exportRows,
          `strengthway_trainer_performance_${selectedMonth}.csv`
        );
        toast.success(`Exported ${exportRows.length} trainer output records to CSV.`);
      } else if (activeTab === "classes") {
        if (classSubView === "curriculum") {
          if (filteredClassesProgress.length === 0) {
            toast.error("No curriculum progression rows to export.");
            return;
          }
          const exportRows = filteredClassesProgress.map((bp) => ({
            "Batch ID": bp.batchId,
            "Batch Name": bp.batchName,
            "Standard Curriculum Target": `${bp.totalCurriculumClasses} Classes`,
            "Classes Completed": bp.completedCount,
            "Classes Scheduled": bp.scheduledCount,
            "Classes Cancelled": bp.cancelledCount,
            "Curriculum Completion %": `${bp.completionPercentage}%`,
            "Classes Remaining": bp.remainingClasses,
            "Next Class Date": bp.nextClassDate || "None",
            "Avg Attendance Per Session": bp.averageAttendance || 0,
            "Coach Feedback Debriefs": bp.notesCount || 0,
          }));
          exportReportToCsv(
            "class_curriculum_progression",
            exportRows,
            `strengthway_curriculum_progression_${selectedMonth}.csv`
          );
          toast.success(`Exported ${exportRows.length} curriculum progress records.`);
        } else {
          if (filteredSessionsList.length === 0) {
            toast.error("No session feedback records to export.");
            return;
          }
          const exportRows = filteredSessionsList.map((s) => ({
            "Session ID": s.id,
            "Session Date": s.sessionDate,
            "Class Number": s.classNumber,
            "Class Name": s.className || s.title || `Class #${s.classNumber}`,
            "Batch Name": s.batchName,
            "Coach Name": s.coachName,
            "Status": s.status,
            "Athletes Attended": s.attendedCount || 0,
            "Coach Debrief Notes": s.notes || "None",
          }));
          exportReportToCsv(
            "coach_feedback_sessions",
            exportRows,
            `strengthway_coach_feedback_${selectedMonth}.csv`
          );
          toast.success(`Exported ${exportRows.length} session feedback logs.`);
        }
      }
    } catch (err) {
      console.error("Export CSV failed:", err);
      toast.error("Failed to generate CSV export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Top Header & Controls ────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent">
              <Sparkles size={11} />
              <span>Phase 8 • Executive Intelligence</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">•</span>
            <span className="text-[11px] font-bold text-muted-foreground">
              Month-Wise Analytics Module
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-display">
            Analytics & Executive Reports
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground max-w-2xl">
            Detailed month-by-month auditing of batch occupancy, capacity headroom, athlete compliance, coach floor hours, and standard 12-class curriculum progression.
          </p>
        </div>

        {/* Global Controls: Month Picker & Export Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Navigator */}
          <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={13} className="text-accent shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border-0 bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Current Month shortcut */}
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="rounded-2xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Current
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-foreground px-3.5 py-1.5 text-xs font-bold text-background hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download size={14} className="text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Dedicated Analytical Views Tab Switcher ─────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/80">
        {/* Tab 1: Batches */}
        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "batches"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Layers size={17} className={activeTab === "batches" ? "text-accent" : ""} />
          <span>Batch Reports</span>
          {batchesReport?.summary?.totalBatches ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">
              {batchesReport.summary.totalBatches}
            </span>
          ) : null}
        </button>

        {/* Tab 2: Members */}
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "members"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Users size={17} className={activeTab === "members" ? "text-accent" : ""} />
          <span>Member Reports</span>
          {membersReport?.summary?.atRiskMembersCount > 0 ? (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
              {membersReport.summary.atRiskMembersCount} At-Risk
            </span>
          ) : null}
        </button>

        {/* Tab 3: Trainers */}
        <button
          type="button"
          onClick={() => setActiveTab("trainers")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "trainers"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Award size={17} className={activeTab === "trainers" ? "text-accent" : ""} />
          <span>Trainer Reports</span>
          {trainersReport?.summary?.totalTrainers ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
              {trainersReport.summary.totalTrainers} Faculty
            </span>
          ) : null}
        </button>

        {/* Tab 4: Scheduled Classes */}
        <button
          type="button"
          onClick={() => setActiveTab("classes")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "classes"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <CalendarCheck size={17} className={activeTab === "classes" ? "text-accent" : ""} />
          <span>Class Progression</span>
          {classesReport?.summary?.completionRatePercent !== undefined ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              {classesReport.summary.completionRatePercent}% Done
            </span>
          ) : null}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: BATCH-WISE MONTHLY REPORTS                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "batches" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5">
          {/* Executive KPI Summary Cards */}
          <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Batches
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {batchesReport?.summary?.totalBatches ?? filteredBatches.length}
                </span>
                <span className="text-xs text-muted-foreground">containers</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Primary Enrolled
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {batchesReport?.summary?.totalEnrolledPrimary ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">athletes</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Flex Passes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-accent">
                  {batchesReport?.summary?.totalActiveFlexPasses ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">roster adds</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Avg Occupancy Rate
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {batchesReport?.summary?.averageCapacityUtilization ?? 0}%
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {batchesReport?.summary?.averageCapacityUtilization > 85 ? "Congested" : "Healthy"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Capacity Headroom
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {batchesReport?.summary?.totalCapacityHeadroom ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">open slots</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Avg Class Attendance
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {batchesReport?.summary?.averageAttendanceRate ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">turnout</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search batch by name, timing, or code..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Batch Container Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">Container:</span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="ALL">All Active Batches</option>
                  {allBatchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timingLabel || b.timing})
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupancy Threshold */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">Utilization:</span>
                <select
                  value={occupancyThreshold}
                  onChange={(e) => setOccupancyThreshold(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="ALL">All Levels</option>
                  <option value="HIGH">High Congestion (≥ 90%)</option>
                  <option value="OPTIMAL">Optimal (60% - 89%)</option>
                  <option value="LOW">Low Utilization (&lt; 60%)</option>
                </select>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
              Showing {filteredBatches.length} batches
            </span>
          </div>

          {/* Batches Analytics Table */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Batch Container</th>
                    <th className="py-3 px-4">Schedule & Days</th>
                    <th className="py-3 px-4 text-center">Pax (Primary + Flex / Max)</th>
                    <th className="py-3 px-4 text-center">Occupancy Rate</th>
                    <th className="py-3 px-4 text-center">Capacity Headroom</th>
                    <th className="py-3 px-4 text-center">Flex In : Out</th>
                    <th className="py-3 px-4 text-center">Sessions (Done / Sched)</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={18} className="animate-spin text-accent" />
                          <span className="font-semibold text-xs">Computing batch analytics for {formatMonthTitle(selectedMonth)}...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Layers size={32} className="mx-auto text-muted-foreground/50" />
                          <p className="font-bold text-foreground">No batch reports match the filters</p>
                          <p className="text-xs">Try selecting a different month or adjusting search queries.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((b) => {
                      const occ = b.occupancyPercent || 0;
                      const headroom = b.capacityHeadroom ?? Math.max(0, b.maxPax - (b.primaryPax + b.flexInPax));
                      return (
                        <tr key={b.batchId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div>
                              <Link
                                to={`/admin/batches/${b.batchId}`}
                                className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                              >
                                <span>{b.name}</span>
                                <ExternalLink size={12} className="text-muted-foreground" />
                              </Link>
                              <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                                {b.batchId} {b.shortName ? `• ${b.shortName}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-foreground block">{b.timingLabel}</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">{b.daysLabel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-bold">
                              <span className="text-foreground">{b.primaryPax}</span>
                              {b.flexInPax > 0 && (
                                <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.2 text-[10px]">
                                  +{b.flexInPax} flex
                                </span>
                              )}
                              <span className="text-muted-foreground">/ {b.maxPax}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="w-28 mx-auto space-y-1">
                              <div className="flex justify-between text-[11px] font-extrabold">
                                <span className={
                                  occ >= 90 ? "text-destructive" : occ >= 70 ? "text-accent" : "text-emerald-500"
                                }>
                                  {occ}%
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {occ >= 95 ? "FULL" : occ >= 80 ? "HIGH" : "OPEN"}
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    occ >= 90 ? "bg-destructive" : occ >= 75 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, occ)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                headroom <= 1
                                  ? "bg-destructive/15 text-destructive"
                                  : headroom <= 4
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {headroom} spots
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs">
                            <span className="font-bold text-accent">{b.flexInPax || 0}</span>
                            <span className="text-muted-foreground"> in / </span>
                            <span className="font-bold text-muted-foreground">{b.flexOutPax || 0}</span>
                            <span className="text-muted-foreground"> out</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className="font-bold text-foreground">{b.completedSessions || 0}</span>
                            <span className="text-muted-foreground"> / {b.totalSessions || 0}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-foreground">
                              {b.attendanceRate || 0}%
                            </span>
                          </td>
                          
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Retention & Operational Insights Box */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-3 sm:p-4 shadow-xs shrink-0">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <TrendingUp size={18} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground">
                  Executive Capacity & Retention Analysis ({formatMonthTitle(selectedMonth)})
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Batches maintaining <strong>75% - 85% occupancy</strong> deliver the highest member retention and coach interaction quality. Batches above <strong>90% occupancy</strong> should receive temporary flex cap locks to avoid platform congestion during peak peak lifting hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: INDIVIDUAL MEMBER REPORTS (COMPLIANCE & RETENTION)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Tracked Athletes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {membersReport?.summary?.totalMembers ?? filteredMembers.length}
                </span>
                <span className="text-xs text-muted-foreground">rostered</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Average Compliance
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {membersReport?.summary?.averageAttendanceRate ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">monthly turnout</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-destructive/5 p-3 shadow-xs border-destructive/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive block">
                At-Risk Athletes (&lt; 60%)
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-destructive">
                  {membersReport?.summary?.atRiskMembersCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-destructive/80">requires outreach</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Flex Pass Athletes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  {membersReport?.summary?.flexPassUsersCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">roster swaps</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search athlete by name, email, or member ID..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Status / Risk Quick Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">Compliance:</span>
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="ALL">All Athletes</option>
                  <option value="AT_RISK">🚨 At-Risk Only (&lt; 60%)</option>
                  <option value="COMPLIANT">✓ Compliant (≥ 60%)</option>
                  <option value="FLEX">Flex Pass Athletes</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">Batch:</span>
                <select
                  value={memberBatchFilter}
                  onChange={(e) => setMemberBatchFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="ALL">All Batches</option>
                  {allBatchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              Showing {filteredMembers.length} athletes
            </span>
          </div>

          {/* Members Table */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Athlete</th>
                    <th className="py-3.5 px-4">Primary Batch</th>
                    <th className="py-3.5 px-4 text-center">Sessions Logged</th>
                    <th className="py-3.5 px-4 text-center">Present (Primary vs Flex)</th>
                    <th className="py-3.5 px-4 text-center">Absences</th>
                    <th className="py-3.5 px-4 text-center">Attendance %</th>
                    <th className="py-3.5 px-4 text-center">Retention Flag</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={18} className="animate-spin text-accent" />
                          <span className="font-semibold text-xs">Computing member attendance compliance for {formatMonthTitle(selectedMonth)}...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Users size={32} className="mx-auto text-muted-foreground/50" />
                          <p className="font-bold text-foreground">No athletes found matching criteria</p>
                          <p className="text-xs">Adjust compliance filter or search keywords.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m) => {
                      const primaryPresent = m.primaryPresentCount ?? Math.max(0, m.presentCount - (m.flexCount || 0));
                      return (
                        <tr key={m.memberId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent font-bold text-xs uppercase">
                                {m.name ? m.name.charAt(0) : "M"}
                              </div>
                              <div>
                                <Link
                                  to={`/admin/members/${m.memberId}`}
                                  className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                                >
                                  <span>{m.name}</span>
                                  <ExternalLink size={12} className="text-muted-foreground" />
                                </Link>
                                <span className="text-[11px] text-muted-foreground block font-mono">
                                  {m.memberId} • {m.mobile || m.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-foreground block">{m.batchName || "Unassigned"}</span>
                            {m.batchTiming && (
                              <span className="text-xs text-muted-foreground block">{m.batchTiming}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                            {m.totalLoggedSessions}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 font-mono text-xs">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {primaryPresent} primary
                              </span>
                              {m.flexCount > 0 && (
                                <span className="rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-extrabold text-accent">
                                  +{m.flexCount} flex
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-destructive">
                            {m.absentCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="w-24 mx-auto space-y-1">
                              <span
                                className={`text-xs font-black ${
                                  m.attendanceRate >= 80
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : m.attendanceRate >= 60
                                    ? "text-accent"
                                    : "text-destructive"
                                }`}
                              >
                                {m.attendanceRate}%
                              </span>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    m.attendanceRate >= 80
                                      ? "bg-emerald-500"
                                      : m.attendanceRate >= 60
                                      ? "bg-amber-500"
                                      : "bg-destructive"
                                  }`}
                                  style={{ width: `${m.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {m.isAtRisk ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[11px] font-extrabold text-destructive animate-pulse">
                                <AlertTriangle size={12} />
                                <span>Needs Outreach</span>
                              </span>
                            ) : m.totalLoggedSessions > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check size={12} />
                                <span>On Track</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-medium">No Sessions</span>
                            )}
                          </td>
                          
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INDIVIDUAL TRAINER REPORTS (FACULTY PERFORMANCE)             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "trainers" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Coaches
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {trainersReport?.summary?.totalTrainers ?? filteredTrainers.length}
                </span>
                <span className="text-xs text-muted-foreground">faculty</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Classes Delivered
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {trainersReport?.summary?.totalClassesConducted ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">sessions</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Floor Coaching Hours
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  {trainersReport?.summary?.totalCoachingHours ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">hours</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Substitute Coverages
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {trainersReport?.summary?.totalSubstituteCoverages ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">shifts</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Athletes Coached
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {trainersReport?.summary?.totalAttendeesCoached ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">athlete visits</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Avg Class Size
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {trainersReport?.summary?.avgAttendanceAcrossTrainers ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">athletes/session</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search coach by name, phone, or email..."
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Shift Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">Shift:</span>
                <select
                  value={trainerShiftFilter}
                  onChange={(e) => setTrainerShiftFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="General">General Shift</option>
                </select>
              </div>
            </div>

            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              Showing {filteredTrainers.length} coaches
            </span>
          </div>

          {/* Trainers Table */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Faculty Coach</th>
                    <th className="py-3.5 px-4">Assigned Shift</th>
                    <th className="py-3.5 px-4 text-center">Classes Conducted</th>
                    <th className="py-3.5 px-4 text-center">Floor Coaching Hours</th>
                    <th className="py-3.5 px-4 text-center">Substitute Coverages</th>
                    <th className="py-3.5 px-4 text-center">Athletes Reached</th>
                    <th className="py-3.5 px-4 text-center">Avg Class Attendance</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={18} className="animate-spin text-accent" />
                          <span className="font-semibold text-xs">Computing faculty coaching delivery for {formatMonthTitle(selectedMonth)}...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTrainers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Award size={32} className="mx-auto text-muted-foreground/50" />
                          <p className="font-bold text-foreground">No coaches found matching criteria</p>
                          <p className="text-xs">Try selecting a different shift or search term.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTrainers.map((t) => (
                      <tr key={t.trainerId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-xs uppercase">
                              {t.name ? t.name.charAt(0) : "C"}
                            </div>
                            <div>
                              <Link
                                to={`/admin/trainers/${t.trainerId}`}
                                className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                              >
                                <span>{t.name}</span>
                                <ExternalLink size={12} className="text-muted-foreground" />
                              </Link>
                              <span className="text-[11px] text-muted-foreground block font-mono">
                                {t.trainerId} • {t.phone || t.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                            {t.shift || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                          {t.classesConducted}
                          {t.classesScheduled > 0 && (
                            <span className="text-muted-foreground text-xs font-normal"> / {t.classesScheduled} sched</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-accent">
                          {t.coachingHours} hrs
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {t.substituteCoverages > 0 ? (
                            <span className="rounded-full bg-accent/15 text-accent px-2 py-0.5 text-xs font-bold">
                              {t.substituteCoverages} covered
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                          {t.totalAttendeesCoached}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                          {t.avgClassAttendance} athletes
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: SCHEDULED CLASS PROGRESSION & CURRICULUM TRACKING            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "classes" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Month Sessions
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {classesReport?.summary?.totalSessions ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">classes</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Conducted Classes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {classesReport?.summary?.completedCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Upcoming / Scheduled
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  {classesReport?.summary?.scheduledCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">on calendar</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Curriculum Completion
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {classesReport?.summary?.completionRatePercent ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">rate</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Attendees Logged
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {classesReport?.summary?.totalAttendeesCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">check-ins</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Avg Class Size
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {classesReport?.summary?.averageAttendancePerClass ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">athletes</span>
              </div>
            </div>
          </div>

          {/* Sub-View Switcher: Curriculum Milestone Tracker vs Coach Feedback Log */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setClassSubView("curriculum")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  classSubView === "curriculum"
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen size={14} />
                <span>Standard 12-Class Curriculum Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => setClassSubView("feedback")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  classSubView === "feedback"
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare size={14} />
                <span>Coach Feedback & Session Log</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter sessions or batch..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <select
                value={classBatchFilter}
                onChange={(e) => setClassBatchFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              >
                <option value="ALL">All Batches</option>
                {allBatchesList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-View A: Curriculum Progression by Batch */}
          {classSubView === "curriculum" && (
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
              {isLoading ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-accent" />
                    <span className="font-semibold text-xs">Loading curriculum milestones...</span>
                  </div>
                </div>
              ) : filteredClassesProgress.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <BookOpen size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-bold text-foreground">No batch curriculum sessions found for {formatMonthTitle(selectedMonth)}</p>
                  <p className="text-xs">Schedule sessions using the Calendar & Master Schedule generator.</p>
                </div>
              ) : (
                paginatedClassesProgress.map((bp) => {
                  const pct = bp.completionPercentage || 0;
                  return (
                    <div
                      key={bp.batchId}
                      className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4 hover:border-foreground/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/admin/batches/${bp.batchId}`}
                            className="font-bold text-foreground hover:text-accent text-base flex items-center gap-1.5"
                          >
                            <span>{bp.batchName}</span>
                            <ExternalLink size={13} className="text-muted-foreground" />
                          </Link>
                          <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                            Standard 12-Class Curriculum Cycle
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                            pct >= 100
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-accent/15 text-accent"
                          }`}
                        >
                          {pct}% Done
                        </span>
                      </div>

                      {/* Visual 12-Class Step Progress Indicator */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground">
                          <span>
                            Class {bp.completedCount} of {bp.totalCurriculumClasses} completed
                          </span>
                          <span className="font-mono text-foreground">
                            {bp.remainingClasses} remaining
                          </span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          {Array.from({ length: bp.totalCurriculumClasses }).map((_, idx) => {
                            const isDone = idx < bp.completedCount;
                            const isNext = idx === bp.completedCount;
                            return (
                              <div
                                key={idx}
                                className={`h-2.5 rounded-sm transition-all ${
                                  isDone
                                    ? "bg-emerald-500"
                                    : isNext
                                    ? "bg-accent animate-pulse"
                                    : "bg-muted"
                                }`}
                                title={`Class #${idx + 1} • ${isDone ? "Completed" : isNext ? "Next Session" : "Scheduled"}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Batch Stats Footer */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Next Class Date
                          </span>
                          <span className="font-semibold text-foreground">
                            {bp.nextClassDate || "Cycle Finished"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Avg Class Size
                          </span>
                          <span className="font-semibold text-foreground">
                            {bp.averageAttendance || 0} athletes
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sub-View B: Coach Feedback & Session Debriefs */}
          {classSubView === "feedback" && (
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3.5 px-4">Session Date & Class</th>
                      <th className="py-3.5 px-4">Batch Container</th>
                      <th className="py-3.5 px-4">Coach</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Attended</th>
                      <th className="py-3.5 px-4">Coach Feedback & Debrief Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <RefreshCw size={18} className="animate-spin text-accent mx-auto mb-2" />
                          <span>Loading session debriefs...</span>
                        </td>
                      </tr>
                    ) : filteredSessionsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <MessageSquare size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                          <p className="font-bold text-foreground">No sessions match search parameters</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedSessionsList.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-foreground block">{s.sessionDate}</span>
                            <span className="text-xs text-muted-foreground block">
                              {s.className || s.title || `Class #${s.classNumber}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {s.batchName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-foreground block">{s.coachName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                s.status === "COMPLETED"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : s.status === "SCHEDULED"
                                  ? "bg-accent/15 text-accent"
                                  : s.status === "TODAY"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                            {s.attendedCount ?? 0}
                          </td>
                          <td className="py-3.5 px-4 max-w-md">
                            {s.notes && s.notes.trim() ? (
                              <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/50">
                                "{s.notes}"
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">No notes logged</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pinned Bottom Pagination */}
      <div className="shrink-0 mt-auto">
        {activeTab === "batches" && (
          <Pagination
            currentPage={safeBatchesPage}
            totalPages={totalBatchesPages}
            onPageChange={setBatchesPage}
            totalItems={filteredBatches.length}
            pageSize={batchesPageSize}
            itemName="batches"
            compact
          />
        )}
        {activeTab === "members" && (
          <Pagination
            currentPage={safeMembersPage}
            totalPages={totalMembersPages}
            onPageChange={setMembersPage}
            totalItems={filteredMembers.length}
            pageSize={membersPageSize}
            itemName="athletes"
            compact
          />
        )}
        {activeTab === "trainers" && (
          <Pagination
            currentPage={safeTrainersPage}
            totalPages={totalTrainersPages}
            onPageChange={setTrainersPage}
            totalItems={filteredTrainers.length}
            pageSize={trainersPageSize}
            itemName="faculty"
            compact
          />
        )}
        {activeTab === "classes" && (
          <Pagination
            currentPage={safeClassesPage}
            totalPages={totalClassesPages}
            onPageChange={setClassesPage}
            totalItems={
              classSubView === "curriculum"
                ? filteredClassesProgress.length
                : filteredSessionsList.length
            }
            pageSize={classesPageSize}
            itemName={classSubView === "curriculum" ? "curriculums" : "sessions"}
            compact
          />
        )}
      </div>
    </div>
  );
}
