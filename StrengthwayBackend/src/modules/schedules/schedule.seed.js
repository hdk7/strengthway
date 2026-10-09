"use strict";

const {
  DEFAULT_12_CLASS_CURRICULUM,
  BATCH_1_CURRICULUM,
  BATCH_2_CURRICULUM,
  BATCH_3_CURRICULUM,
  BATCH_4_CURRICULUM,
  BATCH_5_CURRICULUM,
  BATCH_6_CURRICULUM,
  BATCH_CURRICULUMS,
  SEED_HOLIDAYS,
  SEED_SCHEDULES,
} = require("./schedule.data");

function calculateSequentialMapping(daysList, totalClasses = 12, startDateStr) {
  const cleanDays =
    Array.isArray(daysList) && daysList.length > 0 ? daysList : ["Monday", "Wednesday", "Friday"];

  let start = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(start.getTime())) {
    start = new Date();
  }
  start.setHours(0, 0, 0, 0);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysLower = cleanDays.map((d) => d.toLowerCase());

  const items = [];
  let currentDate = new Date(start);
  let count = 0;
  let safety = 0;

  while (count < totalClasses && safety < 120) {
    const dayName = dayNames[currentDate.getDay()];
    if (daysLower.includes(dayName.toLowerCase())) {
      const classNum = count + 1;
      const weekNum = Math.floor(count / cleanDays.length) + 1;
      const mappedDayName = dayName;

      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      items.push({
        classNumber: classNum,
        weekNumber: weekNum,
        dayOfWeek: mappedDayName,
        sessionNumber: classNum,
        date: dateStr,
        displayDate: currentDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    safety++;
  }

  while (items.length < totalClasses) {
    const classNum = items.length + 1;
    const weekNum = Math.floor((classNum - 1) / cleanDays.length) + 1;
    const dayIndex = (classNum - 1) % cleanDays.length;
    items.push({
      classNumber: classNum,
      weekNumber: weekNum,
      dayOfWeek: cleanDays[dayIndex] || "Monday",
      sessionNumber: classNum,
      date: "",
      displayDate: `Week ${weekNum} â€¢ ${cleanDays[dayIndex] || "Monday"}`,
    });
  }

  return items;
}

function createItemsForSchedule(schedule, curriculum = null) {
  let activeCurriculum = curriculum;
  if (!activeCurriculum) {
    const assignedBatchId =
      Array.isArray(schedule.batchIds) && schedule.batchIds.length > 0
        ? schedule.batchIds[0]
        : schedule.batchId;

    if (assignedBatchId && BATCH_CURRICULUMS[assignedBatchId]) {
      activeCurriculum = BATCH_CURRICULUMS[assignedBatchId];
    } else if (schedule.id === "mcs_001") {
      activeCurriculum = BATCH_1_CURRICULUM;
    } else if (schedule.id === "mcs_002") {
      activeCurriculum = BATCH_2_CURRICULUM;
    } else if (schedule.id === "mcs_003") {
      activeCurriculum = BATCH_3_CURRICULUM;
    } else if (schedule.id === "mcs_004") {
      activeCurriculum = BATCH_4_CURRICULUM;
    } else if (schedule.id === "mcs_005") {
      activeCurriculum = BATCH_5_CURRICULUM;
    } else if (schedule.id === "mcs_006") {
      activeCurriculum = BATCH_6_CURRICULUM;
    } else {
      activeCurriculum = DEFAULT_12_CLASS_CURRICULUM;
    }
  }

  const mapping = calculateSequentialMapping(
    schedule.daysList,
    schedule.totalClasses || 12,
    schedule.startDate
  );

  return mapping.map((m, idx) => {
    const curr = activeCurriculum[idx] || {
      subject: `Class ${m.classNumber}: Functional Strength Phase ${m.weekNumber}`,
      message: `Detailed workout instruction for session ${m.sessionNumber}.`,
    };
    return {
      id: `item_${schedule.id}_${String(m.classNumber).padStart(2, "0")}`,
      masterScheduleId: schedule.id,
      classNumber: m.classNumber,
      weekNumber: m.weekNumber,
      dayOfWeek: m.dayOfWeek,
      subject: curr.subject,
      message: curr.message,
      sessionDate: m.date,
      displayDate: m.displayDate,
      status: "ACTIVE",
    };
  });
}

function generateSessionsForSchedule(schedule, items, targetBatchId = null) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let batchIdsToProcess = [];
  if (targetBatchId) {
    batchIdsToProcess = [targetBatchId];
  } else if (Array.isArray(schedule.batchIds) && schedule.batchIds.length > 0) {
    batchIdsToProcess = schedule.batchIds;
  } else if (schedule.batchId) {
    batchIdsToProcess = [schedule.batchId];
  }

  if (batchIdsToProcess.length === 0) {
    return [];
  }

  const allGeneratedSessions = [];

  batchIdsToProcess.forEach((bId) => {
    const batchDays = schedule.daysList && schedule.daysList.length > 0
      ? schedule.daysList
      : ["Monday", "Wednesday", "Friday"];

    const mapping = calculateSequentialMapping(
      batchDays,
      (items && items.length) || schedule.totalClasses || 12,
      schedule.startDate
    );

    const batchName = schedule.batchName || bId;
    const startTime = schedule.startTime || "06:00 AM";
    const endTime = schedule.endTime || "07:00 AM";
    const timing = schedule.timing || `${startTime} - ${endTime}`;
    const capacity = schedule.capacity || 28;

    (items || []).forEach((item, idx) => {
      const map = mapping[idx] || {};
      const dateStr = map.date || item.sessionDate || "";

      let sessionStatus = "SCHEDULED";
      if (dateStr) {
        if (dateStr === today || dateStr === todayLocal) {
          sessionStatus = "TODAY";
        }
      }

      allGeneratedSessions.push({
        id: `SES-${schedule.id}-${bId}-${String(item.classNumber).padStart(2, "0")}`,
        masterScheduleId: schedule.id,
        masterScheduleName: schedule.name,
        masterClassItemId: item.id,
        classNumber: item.classNumber,
        weekNumber: item.weekNumber || map.weekNumber || 1,
        dayOfWeek: map.dayOfWeek || item.dayOfWeek || "Monday",
        batchId: bId,
        batchName,
        coachId: schedule.coachId || "TRN-101",
        coachName: schedule.coachName || "Assigned Coach",
        sessionDate: dateStr,
        displayDate: map.displayDate || item.displayDate || "",
        startTime,
        endTime,
        timing,
        subject: item.subject,
        message: item.message,
        status: sessionStatus,
        notes: "",
        capacity,
        attendedCount: 0,
        feedback: "",
      });
    });
  });

  return allGeneratedSessions;
}

module.exports = {
  DEFAULT_12_CLASS_CURRICULUM,
  BATCH_CURRICULUMS,
  SEED_HOLIDAYS,
  SEED_SCHEDULES,
  calculateSequentialMapping,
  createItemsForSchedule,
  generateSessionsForSchedule,
};

