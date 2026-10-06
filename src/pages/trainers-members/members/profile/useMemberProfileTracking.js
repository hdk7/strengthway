import { useState, useEffect, useMemo, useCallback } from "react";
import { getMemberMonthTracking } from "@/lib/membersService";

export function useMemberProfileTracking({ id, member, allBatches }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

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
    return {
      totalLoggedSessions: s.totalLoggedSessions || 0,
      presentCount: s.presentCount || 0,
      absentCount: s.absentCount || 0,
      excusedCount: s.excusedCount || 0,
      primaryPresentCount: s.primaryPresentCount || 0,
      flexPresentCount: s.flexPresentCount || 0,
      attendancePercentage: Math.round(s.attendancePercentage || 0),
    };
  }, [monthTracking]);

  const calendarDays = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const totalDays = new Date(year, month, 0).getDate();
      const recordsByDate = {};
      if (monthTracking?.dailyRecords && Array.isArray(monthTracking.dailyRecords)) {
        monthTracking.dailyRecords.forEach((rec) => {
          if (rec.date) recordsByDate[rec.date] = rec;
        });
      }

      const days = [];
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const weekday = new Date(year, month - 1, day).getDay();
        const weekdayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday];
        const att = recordsByDate[dateStr];

        let code = "—";
        let statusLabel = "No Session";
        let variant = "empty";

        if (att) {
          if (att.status === "PRESENT") {
            if (att.isFlexSession) {
              code = "F";
              statusLabel = "Present (Flex Pass)";
              variant = "flex";
            } else {
              code = "P";
              statusLabel = "Present";
              variant = "present";
            }
          } else if (att.status === "ABSENT") {
            code = "A";
            statusLabel = "Absent";
            variant = "absent";
          } else if (att.status === "EXCUSED") {
            code = "E";
            statusLabel = "Excused";
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

  return {
    selectedMonth,
    setSelectedMonth,
    monthTracking,
    isTrackingLoading,
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
  };
}
