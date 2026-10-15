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
import { isMember } from "@/auth/currentUser";
import {
  stepMonth,
  getCurrentYearMonth,
  formatYearMonth,
} from "@/components/ui/MonthPicker";
import { getSessionNotes } from "@/lib/sessionNotesService";

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

  // Session Notes for classes in this batch
  const [sessionNotes, setSessionNotes] = useState([]);

  // Month-wise Category Tracking state
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth());
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const loadBatchData = useCallback(async () => {
    const targetId = id || "BATCH-01";
    try {
      const [foundBatch, cls, trnsList, memsList, allB, allScheds, floorSessions, notesRes] = await Promise.all([
        getBatchById(targetId).catch(() => null),
        getScheduledClassesByBatch(targetId).catch(() => []),
        getTrainers().catch(() => []),
        getMembers(true).catch(() => []),
        getBatches().catch(() => []),
        getMasterSchedules().catch(() => []),
        getSessions().catch(() => []),
        getSessionNotes({ batchId: targetId }).catch(() => []),
      ]);

      const loadedNotes = Array.isArray(notesRes?.data) ? notesRes.data : Array.isArray(notesRes) ? notesRes : [];
      setSessionNotes(loadedNotes);

      const batchesList = Array.isArray(allB) ? allB : [];
      setAllBatches(batchesList);
      setAllMasterSchedules(Array.isArray(allScheds) ? allScheds : []);
      setSessions(Array.isArray(floorSessions) ? floorSessions : []);

      let currentBatch = foundBatch;
      if (!currentBatch && batchesList.length > 0) {
        const clean = targetId.toLowerCase().replace(/[^a-z0-9]/g, "");
        currentBatch = batchesList.find((b) => {
          const bClean = (b.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const nameClean = (b.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return b.id === targetId || bClean === clean || nameClean === clean;
        }) || null;

        if (!currentBatch && isMember()) {
          currentBatch = batchesList[0];
        }
      } else if (!currentBatch && isMember() && batchesList.length > 0) {
        currentBatch = batchesList[0];
      }

      const effectiveId = currentBatch?.id || targetId;

      if (currentBatch) {
        setBatch(currentBatch);
        setScheduledClasses(Array.isArray(cls) ? cls : []);

        const allT = Array.isArray(trnsList) ? trnsList : [];
        setAllTrainers(allT);
        const resolvedTrns = getBatchTrainers(currentBatch.trainerIds, allT, currentBatch.id);
        setTrainers(resolvedTrns);

        const allM = Array.isArray(memsList) ? memsList : [];
        setAllMembers(allM);
        const assignedM = allM.filter(
          (m) =>
            !m.isDeleted &&
            (m.batchId === currentBatch.id || m.schedule?.batchId === currentBatch.id)
        );
        setMembers(assignedM);
      } else {
        setBatch(null);
      }

      // Load mapped Master Class Schedule for this batch
      const mcs = await getMasterScheduleByBatchId(effectiveId).catch(() => null);
      setMasterSchedule(mcs);
      if (mcs) {
        const items = await getScheduleItems(mcs.id).catch(() => []);
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
      const data = await getBatchMonthTracking(batchId, ym).catch(() => null);
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
    const targetId = batch?.id || id || "BATCH-01";
    loadMonthTracking(targetId, selectedMonth);
  }, [batch?.id, id, selectedMonth, loadMonthTracking]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => stepMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => stepMonth(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(getCurrentYearMonth());
  };

  const formattedMonthLabel = useMemo(() => {
    return formatYearMonth(selectedMonth);
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

  // Filtered inbound flexible attendees for this batch: strictly active and valid passes only
  const filteredFlexInMembers = useMemo(() => {
    const rawList = monthTracking?.category2_Members?.flexInMembers || [];
    const todayStr = new Date().toISOString().slice(0, 10);

    // Remove any expired, completed, cancelled, or revoked flex passes from active inbound attendees list
    const activeList = rawList.filter((m) => {
      const st = (m.status || "").toUpperCase();
      if (["COMPLETED", "CANCELLED", "REVOKED", "EXPIRED"].includes(st)) {
        return false;
      }
      // If end date has elapsed (prior to today), it is expired and must not appear
      if (m.endDate && m.endDate < todayStr) {
        return false;
      }
      // If start date is in the future, it is not yet active
      if (m.startDate && m.startDate > todayStr) {
        return false;
      }
      return true;
    });

    if (!memberSearch?.trim()) return activeList;
    const q = memberSearch.toLowerCase();
    return activeList.filter(
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
    let list = [];
    const monthSessions = monthTracking?.category3_ScheduledClasses?.sessions;
    if (Array.isArray(monthSessions) && monthSessions.length > 0) {
      list = monthSessions;
    } else {
      const isBatchMatch = (sBatchId) => {
        if (!sBatchId || !batch?.id) return false;
        if (sBatchId === batch.id) return true;
        const cleanS = sBatchId.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanB = batch.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanS === cleanB;
      };
      const filtered = sessions.filter((s) => {
        if (!isBatchMatch(s.batchId)) return false;
        if (s.sessionDate && selectedMonth) {
          return s.sessionDate.startsWith(selectedMonth);
        }
        return true;
      });
      if (filtered.length > 0) {
        list = filtered;
      } else {
        const batchList = sessions.filter((s) => isBatchMatch(s.batchId));
        if (batchList.length > 0) {
          list = batchList;
        } else {
          list = masterClassItems.map((item) => ({
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
        }
      }
    }

    // Strictly enforce only one class per single day in batch scheduled classes
    const uniqueByDate = new Map();
    for (const s of list) {
      const dateKey = s.sessionDate || s.displayDate || s.id;
      if (!uniqueByDate.has(dateKey)) {
        uniqueByDate.set(dateKey, s);
      } else {
        const existing = uniqueByDate.get(dateKey);
        // Prefer substituted session, or assigned class with explicit classId
        if (s.isSubstituted && !existing.isSubstituted) {
          uniqueByDate.set(dateKey, s);
        } else if (!existing.isSubstituted && s.classId && !existing.classId) {
          uniqueByDate.set(dateKey, s);
        } else if (s.updatedAt && existing.updatedAt && new Date(s.updatedAt) > new Date(existing.updatedAt)) {
          if (!existing.isSubstituted || s.isSubstituted) {
            uniqueByDate.set(dateKey, s);
          }
        }
      }
    }

    const uniqueList = Array.from(uniqueByDate.values()).sort((a, b) => {
      const dA = a.sessionDate || "";
      const dB = b.sessionDate || "";
      if (dA && dB) return dA.localeCompare(dB);
      return (a.classNumber || 0) - (b.classNumber || 0);
    });

    const trainerMap = new Map(
      (allTrainers || []).map((t) => [t.id, t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.id])
    );

    return uniqueList.map((s, idx) => {
      let coachName = s.coachName;
      let substituteCoachName = s.substituteCoachName;
      let originalCoachName = s.originalCoachName;

      if (s.substituteCoachId && trainerMap.has(s.substituteCoachId)) {
        substituteCoachName = trainerMap.get(s.substituteCoachId);
      }
      if (s.originalCoachId && trainerMap.has(s.originalCoachId)) {
        originalCoachName = trainerMap.get(s.originalCoachId);
      }
      if (s.coachId && trainerMap.has(s.coachId)) {
        coachName = trainerMap.get(s.coachId);
      }

      // If substituted, conducting coach is the substitute coach
      if (s.isSubstituted && s.substituteCoachId) {
        coachName = substituteCoachName || coachName;
      }

      return {
        ...s,
        classNumber: idx + 1,
        coachName: coachName || "Assigned Coach",
        substituteCoachName,
        originalCoachName: originalCoachName || coachName,
      };
    });
  }, [sessions, batch, monthTracking, selectedMonth, masterClassItems, masterSchedule, members.length, allTrainers]);

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
      } else if (
        s.status === "TODAY" ||
        s.sessionDate === todayLocal ||
        s.sessionDate === todayUtc
      ) {
        todayCount++;
      } else if (s.status === "COMPLETED" || (s.sessionDate && s.sessionDate < todayLocal)) {
        completed++;
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
      if (sessionsTab === "All") return true;
      if (sessionsTab === "Cancelled") return s.status === "CANCELLED";
      if (sessionsTab === "Completed") {
        return s.status !== "CANCELLED" && (s.status === "COMPLETED" || (s.sessionDate && s.sessionDate < todayLocal));
      }
      if (sessionsTab === "Today") {
        if (s.status === "CANCELLED") return false;
        return s.status === "TODAY" || s.sessionDate === todayLocal || s.sessionDate === todayUtc;
      }
      if (sessionsTab === "Upcoming") {
        if (s.status === "CANCELLED") return false;
        return (
          s.sessionDate !== todayLocal &&
          s.sessionDate !== todayUtc &&
          s.status !== "TODAY" &&
          s.status !== "COMPLETED" &&
          (!s.sessionDate || s.sessionDate > todayLocal)
        );
      }
      return true;
    });

    return filtered.sort((a, b) => a.classNumber - b.classNumber);
  }, [currentBatchSessions, sessionsTab]);

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
    sessionNotes,
    setSessionNotes,
  };
}
