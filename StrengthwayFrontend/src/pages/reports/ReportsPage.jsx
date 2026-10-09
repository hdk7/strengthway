/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  getMonthlyBatchReport,
  getMonthlyMemberReport,
  getMonthlyTrainerReport,
  getMonthlyClassReport,
} from "@/lib/reportsService";
import { getBatches } from "@/lib/batchesService";
import { Pagination } from "@/components/table";
import { ReportsHeaderNav } from "./tabs/ReportsHeaderNav";
import { BatchesReportTab } from "./tabs/BatchesReportTab";
import { MembersReportTab } from "./tabs/MembersReportTab";
import { TrainersReportTab } from "./tabs/TrainersReportTab";
import { ClassesReportTab } from "./tabs/ClassesReportTab";
import { formatMonthTitle, handleExportReportCsv } from "./tabs/reportsExportUtils";

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
  const [classBatchFilter, setClassBatchFilter] = useState("ALL");
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
      const matchesSearch =
        !batchSearch.trim() ||
        b.name?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.batchId?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.timingLabel?.toLowerCase().includes(batchSearch.toLowerCase());

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
      const q = memberSearch.toLowerCase();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.batchName?.toLowerCase().includes(q);

      let matchesStatus = true;
      if (memberStatusFilter === "AT_RISK") {
        matchesStatus = m.isAtRisk;
      } else if (memberStatusFilter === "COMPLIANT") {
        matchesStatus = !m.isAtRisk && m.totalLoggedSessions > 0;
      } else if (memberStatusFilter === "FLEX") {
        matchesStatus = m.hasActiveFlex || m.flexCount > 0;
      }

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

  // 4. Filtered Classes
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
  }, [classSearch, classBatchFilter, selectedMonth]);
  const totalClassesPages = Math.max(
    1,
    Math.ceil(filteredClassesProgress.length / classesPageSize)
  );
  const safeClassesPage = Math.max(1, Math.min(classesPage, totalClassesPages));
  const paginatedClassesProgress = useMemo(() => {
    const start = (safeClassesPage - 1) * classesPageSize;
    return filteredClassesProgress.slice(start, start + classesPageSize);
  }, [filteredClassesProgress, safeClassesPage, classesPageSize]);

  // ─── Export Handler ──────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    handleExportReportCsv({
      activeTab,
      filteredBatches,
      filteredMembers,
      filteredTrainers,
      filteredClassesProgress,
      selectedMonth,
      setIsExporting,
    });
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Top Header & Controls ────────────────────────────────────────── */}
      <ReportsHeaderNav
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handleCurrentMonth={handleCurrentMonth}
        handleExportCsv={handleExportCsv}
        isExporting={isExporting}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        batchesReport={batchesReport}
        membersReport={membersReport}
        trainersReport={trainersReport}
        classesReport={classesReport}
      />

      {/* ─── TAB 1: BATCH-WISE MONTHLY REPORTS ──────────────────────────────── */}
      {activeTab === "batches" && (
        <BatchesReportTab
          batchesReport={batchesReport}
          filteredBatches={filteredBatches}
          batchSearch={batchSearch}
          setBatchSearch={setBatchSearch}
          selectedBatchFilter={selectedBatchFilter}
          setSelectedBatchFilter={setSelectedBatchFilter}
          allBatchesList={allBatchesList}
          occupancyThreshold={occupancyThreshold}
          setOccupancyThreshold={setOccupancyThreshold}
          isLoading={isLoading}
          formatMonthTitle={formatMonthTitle}
          selectedMonth={selectedMonth}
          paginatedBatches={paginatedBatches}
        />
      )}

      {/* ─── TAB 2: INDIVIDUAL MEMBER REPORTS (COMPLIANCE & RETENTION) ──────── */}
      {activeTab === "members" && (
        <MembersReportTab
          membersReport={membersReport}
          filteredMembers={filteredMembers}
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          memberStatusFilter={memberStatusFilter}
          setMemberStatusFilter={setMemberStatusFilter}
          memberBatchFilter={memberBatchFilter}
          setMemberBatchFilter={setMemberBatchFilter}
          allBatchesList={allBatchesList}
          isLoading={isLoading}
          formatMonthTitle={formatMonthTitle}
          selectedMonth={selectedMonth}
          paginatedMembers={paginatedMembers}
        />
      )}

      {/* ─── TAB 3: INDIVIDUAL TRAINER REPORTS (FACULTY PERFORMANCE) ────────── */}
      {activeTab === "trainers" && (
        <TrainersReportTab
          trainersReport={trainersReport}
          filteredTrainers={filteredTrainers}
          trainerSearch={trainerSearch}
          setTrainerSearch={setTrainerSearch}
          trainerShiftFilter={trainerShiftFilter}
          setTrainerShiftFilter={setTrainerShiftFilter}
          isLoading={isLoading}
          formatMonthTitle={formatMonthTitle}
          selectedMonth={selectedMonth}
          paginatedTrainers={paginatedTrainers}
        />
      )}

      {/* ─── TAB 4: SCHEDULED CLASS PROGRESSION & CURRICULUM TRACKING ───────── */}
      {activeTab === "classes" && (
        <ClassesReportTab
          classesReport={classesReport}
          classSearch={classSearch}
          setClassSearch={setClassSearch}
          classBatchFilter={classBatchFilter}
          setClassBatchFilter={setClassBatchFilter}
          allBatchesList={allBatchesList}
          isLoading={isLoading}
          formatMonthTitle={formatMonthTitle}
          selectedMonth={selectedMonth}
          filteredClassesProgress={filteredClassesProgress}
          paginatedClassesProgress={paginatedClassesProgress}
        />
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
            totalItems={filteredClassesProgress.length}
            pageSize={classesPageSize}
            itemName="curriculums"
            compact
          />
        )}
      </div>
    </div>
  );
}
