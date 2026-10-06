/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  getBatchById,
  getBatches,
  getBatchTrainers,
  getScheduledClassesByBatch,
  getBatchMonthTracking,
} from "@/lib/batchesService";
import {
  getMasterScheduleByBatchId,
  getMasterSchedules,
  getScheduleItems,
  getSessions,
} from "@/lib/masterScheduleService";
import { getTrainers } from "@/lib/trainersService";
import { getMembers } from "@/lib/membersService";

export function useBatchDetailData(id, memberSearch, trainerSearch, sessionsTab, selectedWeekFilter) {
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);

  // Master Class Schedule mapped to this batch
  const [masterSchedule, setMasterSchedule] = useState(null);
  const [masterClassItems, setMasterClassItems] = useState([]);
  const [allMasterSchedules, setAllMasterSchedules] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  // Floor Sessions submodule tracking state inside this batch
  const [sessions, setSessions] = useState([]);

  // All trainers & members for assignment
  const [allTrainers, setAllTrainers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  // Month-wise Category Tracking state
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

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

  // Occupancy stats
  const capacity = batch?.maxPax || 28;
  const currentPax = members.length > 0 ? members.length : (batch?.currentPax || 0);
  const occupancyPercent = Math.min(100, Math.round((currentPax / capacity) * 100));
  const remainingSlots = Math.max(0, capacity - currentPax);

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

    if (!memberSearch?.trim()) return baseList;
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
    if (!memberSearch?.trim()) return list;
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
    if (!trainerSearch?.trim()) return trainersWithTracking;
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

    const batchList = sessions.filter((s) => s.batchId === batch.id);
    if (batchList.length > 0) return batchList;

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
      return true;
    });

    if (selectedWeekFilter !== "all") {
      filtered = filtered.filter((s) => s.weekNumber === Number(selectedWeekFilter));
    }

    return filtered.sort((a, b) => a.classNumber - b.classNumber);
  }, [currentBatchSessions, sessionsTab, selectedWeekFilter]);

  return {
    batch,
    setBatch,
    isLoading,
    scheduledClasses,
    trainers,
    members,
    masterSchedule,
    setMasterSchedule,
    masterClassItems,
    setMasterClassItems,
    allMasterSchedules,
    allBatches,
    sessions,
    setSessions,
    allTrainers,
    allMembers,
    selectedMonth,
    setSelectedMonth,
    monthTracking,
    isTrackingLoading,
    loadBatchData,
    loadMonthTracking,
    handlePrevMonth,
    handleNextMonth,
    handleCurrentMonth,
    formattedMonthLabel,
    capacity,
    currentPax,
    occupancyPercent,
    remainingSlots,
    filteredPrimaryMembers,
    filteredFlexInMembers,
    filteredTrainers,
    currentBatchSessions,
    sessionTabCounts,
    displayedSessions,
  };
}
