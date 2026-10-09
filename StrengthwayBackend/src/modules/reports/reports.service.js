"use strict";

const Batch = require("../batches/batch.model");
const Member = require("../members/member.model");
const Trainer = require("../trainers/trainer.model");
const Session = require("../schedules/session.model");
const MasterSchedule = require("../schedules/schedule.model");
const Attendance = require("../attendance/attendance.model");
const TrainerLog = require("../attendance/trainerLog.model");
const BatchAssignment = require("../batches/batchAssignment.model");
const batchService = require("../batches/batch.service");

class ReportsService {
  /**
   * 1. Batch-wise Monthly Summary Report
   */
  async getMonthlyBatchReport(yearMonth, batchId) {
    const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : new Date().toISOString().slice(0, 7);

    // If specific batchId is requested
    if (batchId && batchId !== "ALL" && batchId !== "All") {
      const tracking = await batchService.getBatchMonthTracking(batchId, ym);
      return {
        type: "SINGLE_BATCH",
        monthYear: ym,
        data: tracking,
      };
    }

    // Aggregate report across all active batches
    const batches = await Batch.find({ status: "Active" }).sort({ id: 1 }).lean();
    const batchBreakdown = [];

    let totalMaxPax = 0;
    let totalPrimaryPax = 0;
    let totalFlexInPax = 0;
    let totalSessions = 0;
    let totalCompletedSessions = 0;
    let totalPresentSum = 0;
    let totalAttendanceRecords = 0;

    for (const b of batches) {
      const tracking = await batchService.getBatchMonthTracking(b.id, ym);
      totalMaxPax += tracking.summary.maxPax;
      totalPrimaryPax += tracking.summary.primaryPax;
      totalFlexInPax += tracking.summary.flexInPax;
      totalSessions += tracking.summary.totalSessions;
      totalCompletedSessions += tracking.summary.completedSessions;

      const flexOutPax = (tracking.category2_Members?.primaryMembers || []).filter((m) => m.isFlexOutActive).length;
      const headroom = Math.max(0, tracking.summary.maxPax - (tracking.summary.primaryPax + tracking.summary.flexInPax));
      const completedList = (tracking.category3_ScheduledClasses?.sessions || []).filter((s) => s.status === "COMPLETED");
      const totalAttendeesInBatch = completedList.reduce((sum, s) => sum + (s.attendedCount || 0), 0);
      const avgClassAttendance = completedList.length > 0 ? Math.round(totalAttendeesInBatch / completedList.length) : 0;
      const flexRatio = flexOutPax > 0 ? `${tracking.summary.flexInPax}:${flexOutPax}` : (tracking.summary.flexInPax > 0 ? `${tracking.summary.flexInPax}:0` : "0:0");

      batchBreakdown.push({
        batchId: b.id,
        name: b.name,
        shortName: b.shortName,
        timingLabel: b.timingLabel,
        daysLabel: b.daysLabel,
        maxPax: tracking.summary.maxPax,
        primaryPax: tracking.summary.primaryPax,
        flexInPax: tracking.summary.flexInPax,
        flexOutPax,
        flexRatio,
        capacityHeadroom: headroom,
        occupancyPercent: tracking.summary.occupancyPercent,
        totalSessions: tracking.summary.totalSessions,
        completedSessions: tracking.summary.completedSessions,
        attendanceRate: tracking.summary.overallAttendanceRate,
        averageClassAttendance: avgClassAttendance,
        trainersCount: tracking.category1_Trainers.length,
      });
    }

    const avgOccupancy = totalMaxPax > 0 ? Math.min(100, Math.round(((totalPrimaryPax + totalFlexInPax) / totalMaxPax) * 100)) : 0;
    const avgAttendance = batchBreakdown.length > 0
      ? Math.round(batchBreakdown.reduce((sum, b) => sum + b.attendanceRate, 0) / batchBreakdown.length)
      : 0;

    return {
      type: "ALL_BATCHES",
      monthYear: ym,
      summary: {
        totalBatches: batches.length,
        totalMaxCapacity: totalMaxPax,
        totalEnrolledPrimary: totalPrimaryPax,
        totalActiveFlexPasses: totalFlexInPax,
        averageCapacityUtilization: avgOccupancy,
        totalScheduledSessions: totalSessions,
        totalCompletedSessions: totalCompletedSessions,
        averageAttendanceRate: avgAttendance,
        totalCapacityHeadroom: Math.max(0, totalMaxPax - (totalPrimaryPax + totalFlexInPax)),
      },
      batches: batchBreakdown,
    };
  }

  /**
   * 2. Member-wise Monthly Attendance & Compliance Report
   */
  async getMonthlyMemberReport(yearMonth, statusFilter) {
    const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : new Date().toISOString().slice(0, 7);

    const filter = { isDeleted: false };
    if (statusFilter && statusFilter !== "All" && statusFilter !== "ALL" && statusFilter !== "LowAttendance" && statusFilter !== "AT_RISK") {
      filter.status = statusFilter;
    }

    const members = await Member.find(filter).sort({ firstName: 1 }).lean();
    const attendanceRecords = await Attendance.find({ monthYear: ym }).lean();
    const flexAssignments = await BatchAssignment.find({
      status: "ACTIVE",
      assignmentType: "TEMPORARY_FLEX",
    }).lean();

    let memberRows = members.map((m) => {
      const records = attendanceRecords.filter((a) => a.memberId === m.id);
      const isAttended = (st) => ["PRESENT", "LATE", "CHECKED_IN", "CHECKED_OUT"].includes(st);
      const presentCount = records.filter((a) => isAttended(a.status)).length;
      const absentCount = records.filter((a) => a.status === "ABSENT").length;
      const flexCount = records.filter((a) => a.isFlexAttendance && isAttended(a.status)).length;
      const primaryPresentCount = Math.max(0, presentCount - flexCount);
      const totalLogged = records.length;
      const attendanceRate = totalLogged > 0 ? Math.round((presentCount / totalLogged) * 100) : 0;
      const hasActiveFlex = flexAssignments.some((f) => f.memberId === m.id);
      const isAtRisk = totalLogged >= 3 ? attendanceRate < 60 : (totalLogged > 0 && attendanceRate < 60);

      return {
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        mobile: m.mobile,
        status: m.status,
        batchId: m.batchId || "",
        batchName: m.batchName || "Unassigned",
        batchTiming: m.batchTiming || "",
        totalLoggedSessions: totalLogged,
        presentCount,
        absentCount,
        primaryPresentCount,
        flexCount,
        attendanceRate,
        hasActiveFlex,
        isAtRisk,
      };
    });

    if (statusFilter === "LowAttendance" || statusFilter === "AT_RISK") {
      memberRows = memberRows.filter((m) => m.isAtRisk);
    }

    const atRiskCount = memberRows.filter((m) => m.isAtRisk).length;
    const flexUsersCount = memberRows.filter((m) => m.hasActiveFlex || m.flexCount > 0).length;
    const avgAttendance = memberRows.length > 0
      ? Math.round(memberRows.reduce((sum, m) => sum + m.attendanceRate, 0) / memberRows.length)
      : 0;

    return {
      monthYear: ym,
      summary: {
        totalMembers: memberRows.length,
        averageAttendanceRate: avgAttendance,
        atRiskMembersCount: atRiskCount,
        flexPassUsersCount: flexUsersCount,
      },
      members: memberRows,
    };
  }

  /**
   * 3. Trainer-wise Monthly Performance & Conduction Report
   */
  async getMonthlyTrainerReport(yearMonth) {
    const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : new Date().toISOString().slice(0, 7);

    const trainers = await Trainer.find({ isDeleted: false }).sort({ name: 1 }).lean();
    const trainerLogs = await TrainerLog.find({ monthYear: ym }).lean();
    const sessions = await Session.find({ sessionDate: { $regex: `^${ym}` } }).lean();

    const trainerRows = trainers.map((t) => {
      const logs = trainerLogs.filter((l) => l.trainerId === t.id);
      const conductedLogs = logs.filter((l) => l.status === "CONDUCTED");
      const substituteLogs = trainerLogs.filter((l) => l.substituteTrainerId === t.id && l.status === "CONDUCTED");
      const scheduledSessions = sessions.filter((s) => s.coachId === t.id);
      const totalMinutes = conductedLogs.reduce((sum, l) => sum + (l.durationMinutes || 60), 0) + substituteLogs.reduce((sum, l) => sum + (l.durationMinutes || 60), 0);
      const totalAttendees = conductedLogs.reduce((sum, l) => sum + (l.attendeesCount || 0), 0) + substituteLogs.reduce((sum, l) => sum + (l.attendeesCount || 0), 0);
      const totalConducted = conductedLogs.length + substituteLogs.length;
      const avgClassAttendance = totalConducted > 0 ? Math.round(totalAttendees / totalConducted) : 0;

      return {
        trainerId: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        shift: t.shift,
        status: t.status,
        classesScheduled: scheduledSessions.length,
        classesConducted: totalConducted,
        substituteCoverages: substituteLogs.length,
        coachingHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalAttendeesCoached: totalAttendees,
        avgClassAttendance,
      };
    });

    const totalConducted = trainerRows.reduce((sum, t) => sum + t.classesConducted, 0);
    const totalHours = Math.round(trainerRows.reduce((sum, t) => sum + t.coachingHours, 0) * 10) / 10;
    const totalAttendeesAll = trainerRows.reduce((sum, t) => sum + t.totalAttendeesCoached, 0);
    const totalSubstituteCoverages = trainerRows.reduce((sum, t) => sum + (t.substituteCoverages || 0), 0);

    return {
      monthYear: ym,
      summary: {
        totalTrainers: trainers.length,
        totalClassesConducted: totalConducted,
        totalCoachingHours: totalHours,
        totalAttendeesCoached: totalAttendeesAll,
        avgAttendanceAcrossTrainers: totalConducted > 0 ? Math.round(totalAttendeesAll / totalConducted) : 0,
        totalSubstituteCoverages,
      },
      trainers: trainerRows,
    };
  }

  /**
   * 4. Scheduled Classes Monthly Progression Report
   */
  async getMonthlyClassReport(yearMonth, scheduleId) {
    const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : new Date().toISOString().slice(0, 7);

    const filter = { sessionDate: { $regex: `^${ym}` } };
    if (scheduleId) {
      filter.masterScheduleId = scheduleId;
    }

    const sessions = await Session.find(filter).sort({ sessionDate: 1, classNumber: 1 }).lean();
    const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
    const scheduledSessions = sessions.filter((s) => s.status === "SCHEDULED");
    const todaySessions = sessions.filter((s) => s.status === "TODAY");
    const cancelledSessions = sessions.filter((s) => s.status === "CANCELLED");

    const totalAttendees = completedSessions.reduce((sum, s) => sum + (s.attendedCount || 0), 0);
    const avgAttendance = completedSessions.length > 0 ? Math.round(totalAttendees / completedSessions.length) : 0;
    const completionRate = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

    // Batch Curriculum Progression Breakdown
    const batchMap = new Map();
    for (const s of sessions) {
      const bId = s.batchId || "GLOBAL";
      if (!batchMap.has(bId)) {
        batchMap.set(bId, {
          batchId: bId,
          batchName: s.batchName || bId,
          totalCurriculumClasses: 12,
          monthSessionsCount: 0,
          completedCount: 0,
          scheduledCount: 0,
          todayCount: 0,
          cancelledCount: 0,
          totalAttendees: 0,
          nextClassDate: null,
          notesCount: 0,
        });
      }
      const bObj = batchMap.get(bId);
      bObj.monthSessionsCount += 1;
      if (s.status === "COMPLETED") {
        bObj.completedCount += 1;
        bObj.totalAttendees += (s.attendedCount || 0);
      } else if (s.status === "SCHEDULED") {
        bObj.scheduledCount += 1;
        if (!bObj.nextClassDate || s.sessionDate < bObj.nextClassDate) {
          bObj.nextClassDate = s.sessionDate;
        }
      } else if (s.status === "TODAY") {
        bObj.todayCount += 1;
      } else if (s.status === "CANCELLED") {
        bObj.cancelledCount += 1;
      }
      if (s.notes && s.notes.trim()) {
        bObj.notesCount += 1;
      }
    }

    const batchesProgress = Array.from(batchMap.values()).map((bp) => ({
      ...bp,
      completionPercentage: Math.min(100, Math.round((bp.completedCount / bp.totalCurriculumClasses) * 100)),
      remainingClasses: Math.max(0, bp.totalCurriculumClasses - bp.completedCount),
      averageAttendance: bp.completedCount > 0 ? Math.round(bp.totalAttendees / bp.completedCount) : 0,
    }));

    const feedbackNotes = sessions
      .filter((s) => s.notes && s.notes.trim())
      .map((s) => ({
        sessionId: s.id,
        sessionDate: s.sessionDate,
        batchName: s.batchName,
        coachName: s.coachName,
        className: s.className || s.title || `Class #${s.classNumber}`,
        classNumber: s.classNumber,
        notes: s.notes,
      }));

    return {
      monthYear: ym,
      summary: {
        totalSessions: sessions.length,
        completedCount: completedSessions.length,
        scheduledCount: scheduledSessions.length,
        todayCount: todaySessions.length,
        cancelledCount: cancelledSessions.length,
        completionRatePercent: completionRate,
        totalAttendeesCount: totalAttendees,
        averageAttendancePerClass: avgAttendance,
      },
      batchesProgress,
      feedbackNotes,
      sessions,
    };
  }
}

module.exports = new ReportsService();
