import { toast } from "sonner";
import { exportReportToCsv } from "@/lib/reportsService";

export function formatMonthTitle(ym) {
  if (!ym) return "";
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export function handleExportReportCsv({
  activeTab,
  filteredBatches,
  filteredMembers,
  filteredTrainers,
  filteredClassesProgress,
  selectedMonth,
  setIsExporting,
}) {
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
      }));
      exportReportToCsv(
        "class_curriculum_progression",
        exportRows,
        `strengthway_curriculum_progression_${selectedMonth}.csv`
      );
      toast.success(`Exported ${exportRows.length} curriculum progress records.`);
    }
  } catch (err) {
    console.error("Export CSV failed:", err);
    toast.error("Failed to generate CSV export.");
  } finally {
    setIsExporting(false);
  }
}
