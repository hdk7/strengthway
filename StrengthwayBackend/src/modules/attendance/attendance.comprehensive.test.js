"use strict";

const mongoose = require("mongoose");
const attendanceService = require("./attendance.service");
const Attendance = require("./attendance.model");
const TrainerLog = require("./trainerLog.model");
const TrainerInterval = require("./trainerInterval.model");
const AttendanceAudit = require("./attendanceAudit.model");
const Batch = require("../batches/batch.model");
const Member = require("../members/member.model");
const Trainer = require("../trainers/trainer.model");
const Session = require("../schedules/session.model");
const BatchAssignment = require("../batches/batchAssignment.model");
const TrainerLeave = require("./trainerLeave.model");
const { connectDB, disconnectDB } = require("../../config/database");
const {
  calculateSessionOverlap,
  parseTimeToMinutes,
  groupConsecutiveSessions,
  generateRemarks,
} = require("./attendanceTimeUtils");

describe("Gym CRM Attendance Management Suite", () => {
  const TEST_DATE = "2026-10-15";
  const BATCH_1 = "BATCH-T1";
  const BATCH_2 = "BATCH-T2";
  const MEMBER_1 = "MEM-9001";
  const TRAINER_1 = "TRN-901";
  const TRAINER_SUB = "TRN-902";

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test collections
    await Promise.all([
      Attendance.deleteMany({ date: TEST_DATE }),
      TrainerLog.deleteMany({ date: TEST_DATE }),
      TrainerInterval.deleteMany({ date: TEST_DATE }),
      AttendanceAudit.deleteMany({ date: TEST_DATE }),
      Batch.deleteMany({ id: { $in: [BATCH_1, BATCH_2] } }),
      Member.deleteMany({ id: MEMBER_1 }),
      Trainer.deleteMany({ id: { $in: [TRAINER_1, TRAINER_SUB] } }),
      Session.deleteMany({ sessionDate: TEST_DATE }),
      BatchAssignment.deleteMany({ memberId: MEMBER_1 }),
    ]);
    await disconnectDB();
  });

  beforeEach(async () => {
    await Promise.all([
      Attendance.deleteMany({ date: TEST_DATE }),
      TrainerLog.deleteMany({ date: TEST_DATE }),
      TrainerInterval.deleteMany({ date: TEST_DATE }),
      AttendanceAudit.deleteMany({ date: TEST_DATE }),
      Session.deleteMany({ sessionDate: TEST_DATE }),
    ]);

    // Seed test batches
    await Batch.findOneAndUpdate(
      { id: BATCH_1 },
      {
        id: BATCH_1,
        name: "Morning CrossFit",
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        daysPattern: "CUSTOM",
        daysList: ["Thursday", "Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
        status: "Active",
      },
      { upsert: true }
    );

    await Batch.findOneAndUpdate(
      { id: BATCH_2 },
      {
        id: BATCH_2,
        name: "Morning Strength",
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        daysPattern: "CUSTOM",
        daysList: ["Thursday", "Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
        status: "Active",
      },
      { upsert: true }
    );

    // Seed test member
    await Member.findOneAndUpdate(
      { id: MEMBER_1 },
      {
        id: MEMBER_1,
        firstName: "Marcus",
        lastName: "Aurelius",
        fullName: "Marcus Aurelius",
        email: "marcus.aurelius@strengthway.test",
        mobile: "9876543210",
        gender: "Male",
        dob: "1990-01-01",
        batchId: BATCH_1,
        status: "Active",
        isDeleted: false,
      },
      { upsert: true }
    );

    // Seed test primary trainer
    await Trainer.findOneAndUpdate(
      { id: TRAINER_1 },
      {
        id: TRAINER_1,
        name: "Coach Hercules",
        email: "hercules.coach@strengthway.test",
        phone: "9876543211",
        experience: "5 years",
        batchIds: [BATCH_1, BATCH_2],
        status: "Active",
        isDeleted: false,
      },
      { upsert: true }
    );

    // Seed test substitute trainer
    await Trainer.findOneAndUpdate(
      { id: TRAINER_SUB },
      {
        id: TRAINER_SUB,
        name: "Coach Achilles",
        email: "achilles.sub@strengthway.test",
        phone: "9876543212",
        experience: "3 years",
        batchIds: [],
        status: "Active",
        isDeleted: false,
      },
      { upsert: true }
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 1: Member Attendance & Duplicate Prevention
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 1: Member Attendance & Duplicate Prevention", () => {
    test("checks in and checks out member, calculating exact visit duration", async () => {
      // 1. Check in
      const checkInRecord = await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:05 AM",
        markedBy: "Admin",
      });

      expect(checkInRecord).toBeDefined();
      expect(checkInRecord.status).toBe("PRESENT");
      expect(checkInRecord.checkInTime).toBe("06:05 AM");
      expect(checkInRecord.checkOutTime).toBe("");

      // 2. Check out
      const checkOutRecord = await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:05 AM",
        checkOutTime: "07:15 AM",
        markedBy: "Admin",
      });

      expect(checkOutRecord.checkInTime).toBe("06:05 AM");
      expect(checkOutRecord.checkOutTime).toBe("07:15 AM");
      // 6:05 AM (365m) to 7:15 AM (435m) = 70 minutes
      expect(checkOutRecord.durationMinutes).toBe(70);
    });

    test("enforces maximum one attendance record per member per calendar day across batches", async () => {
      // Mark present in BATCH_1
      await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:00 AM",
        checkOutTime: "07:00 AM",
      });

      // Attempt to mark present in a different batch (BATCH_2) on the same day
      await expect(
        attendanceService.markAttendance({
          date: TEST_DATE,
          batchId: BATCH_2,
          memberId: MEMBER_1,
          status: "PRESENT",
          checkInTime: "07:00 AM",
          checkOutTime: "08:00 AM",
        })
      ).rejects.toThrow(/Duplicate attendance conflict.*restricted to a maximum of one class attendance/i);

      // Verify database still has exactly one record for this member on this date
      const count = await Attendance.countDocuments({ date: TEST_DATE, memberId: MEMBER_1 });
      expect(count).toBe(1);
    });

    test("handles repeated check-in attempts idempotently without creating duplicates", async () => {
      await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:00 AM",
      });

      // Repeated attempt
      const secondAttempt = await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:00 AM",
      });

      expect(secondAttempt.checkInTime).toBe("06:00 AM");
      const totalDocs = await Attendance.countDocuments({ date: TEST_DATE, memberId: MEMBER_1 });
      expect(totalDocs).toBe(1);
    });

    test("flags missing check-out as CHECKOUT_PENDING exception with required verification remarks", async () => {
      // Past session without check-out
      const record = await attendanceService.markAttendance({
        date: "2026-10-01", // past date
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:00 AM",
      });

      expect(record.status).toBe("PRESENT");
      expect(record.isException).toBe(true);
      expect(record.exceptionType).toBe("CHECKOUT_PENDING");
      expect(record.remarks).toContain("Check-out time not recorded. Admin verification required.");

      // Clean up past test doc
      await Attendance.deleteMany({ date: "2026-10-01", memberId: MEMBER_1 });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 2, 3 & 4: Trainer Consecutive & Continuous Attendance Calculations
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 2 & 3: Trainer Attendance & Continuous Consecutive Sessions", () => {
    test("calculates teaching duration overlap vs presence duration, excluding off-schedule time", () => {
      // Session: 6:00 AM (360) to 7:00 AM (420)
      // Trainer: 5:50 AM (350) to 7:10 AM (430)
      const overlap = calculateSessionOverlap(350, 430, 360, 420);
      expect(overlap).toBe(60); // only scheduled period counted!

      // Actual presence duration: 430 - 350 = 80 minutes
      const presence = 430 - 350;
      expect(presence).toBe(80);
    });

    test("supports continuous attendance across consecutive sessions (5:55 AM - 8:05 AM)", async () => {
      // Seed two consecutive sessions:
      // Session 1: 06:00 AM - 07:00 AM
      // Session 2: 07:00 AM - 08:00 AM
      const session1 = await Session.create({
        id: "SESS-CONSEC-1",
        batchId: BATCH_1,
        batchName: "Morning CrossFit",
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        classNumber: 1,
        status: "SCHEDULED",
      });

      const session2 = await Session.create({
        id: "SESS-CONSEC-2",
        batchId: BATCH_2,
        batchName: "Morning Strength",
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        classNumber: 2,
        status: "SCHEDULED",
      });

      // 1. Single check-in for the consecutive session block at 5:55 AM
      const inResult = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: session1.id,
        checkInTime: "05:55 AM",
      });

      expect(inResult.interval).toBeDefined();
      expect(inResult.interval.isContinuous).toBe(true);
      expect(inResult.interval.checkInTime).toBe("05:55 AM");
      expect(inResult.interval.sessionIds).toContain(session1.id);
      expect(inResult.interval.sessionIds).toContain(session2.id);

      // 2. Single check-out at 8:05 AM
      const outResult = await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        intervalId: inResult.interval.id,
        checkOutTime: "08:05 AM",
      });

      const { interval, logs } = outResult;

      // Actual presence: 5:55 AM (355) to 8:05 AM (485) = 130 minutes
      expect(interval.actualDurationMinutes).toBe(130);

      // Total scheduled teaching duration: 60 + 60 = 120 minutes
      expect(interval.totalTeachingDurationMinutes).toBe(120);

      // Verify per-session logs have separate overlap calculation
      expect(logs.length).toBe(2);
      const log1 = logs.find((l) => l.sessionId === session1.id);
      const log2 = logs.find((l) => l.sessionId === session2.id);

      expect(log1.durationMinutes).toBe(60); // Session 1 teaching duration
      expect(log2.durationMinutes).toBe(60); // Session 2 teaching duration
      expect(log1.status).toBe("CONDUCTED");
      expect(log2.status).toBe("CONDUCTED");
    });

    test("calculates separate overlap when trainer arrives late across consecutive sessions", async () => {
      // Session 1: 06:00 AM - 07:00 AM
      // Session 2: 07:00 AM - 08:00 AM
      const session1 = await Session.create({
        id: "SESS-LATE-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        classNumber: 1,
        status: "SCHEDULED",
      });

      const session2 = await Session.create({
        id: "SESS-LATE-2",
        batchId: BATCH_2,
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        classNumber: 2,
        status: "SCHEDULED",
      });

      // Trainer arrives at 6:20 AM and checks out at 8:00 AM
      const inRes = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: session1.id,
        checkInTime: "06:20 AM",
      });

      const outRes = await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        intervalId: inRes.interval.id,
        checkOutTime: "08:00 AM",
      });

      const log1 = outRes.logs.find((l) => l.sessionId === session1.id);
      const log2 = outRes.logs.find((l) => l.sessionId === session2.id);

      // Session 1 overlap: 6:20 AM to 7:00 AM = 40 minutes (late arrival remarks)
      expect(log1.durationMinutes).toBe(40);
      expect(log1.remarks).toContain("Checked in 20 minutes after the scheduled start time.");
      expect(log1.isException).toBe(true);

      // Session 2 overlap: 7:00 AM to 8:00 AM = 60 minutes (full attendance)
      expect(log2.durationMinutes).toBe(60);
      expect(log2.remarks).toContain("Attended on schedule.");

      // Total presence: 6:20 to 8:00 = 100 minutes
      expect(outRes.interval.actualDurationMinutes).toBe(100);
      expect(outRes.interval.totalTeachingDurationMinutes).toBe(100);
    });

    test("separates morning and evening sessions due to meaningful break", () => {
      const sessions = [
        { id: "S1", startTime: "06:00 AM", endTime: "07:00 AM" },
        { id: "S2", startTime: "07:00 AM", endTime: "08:00 AM" },
        { id: "S3", startTime: "05:00 PM", endTime: "06:00 PM" },
      ];

      const blocks = groupConsecutiveSessions(sessions, 15);
      expect(blocks.length).toBe(2);

      // Block 1: 06:00 AM - 08:00 AM (consecutive)
      expect(blocks[0].sessions.length).toBe(2);
      expect(blocks[0].isConsecutive).toBe(true);

      // Block 2: 05:00 PM - 06:00 PM (separate interval)
      expect(blocks[1].sessions.length).toBe(1);
      expect(blocks[1].isConsecutive).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 5, 6 & 7: Window Restrictions, Substitute Trainers & Audit Trail
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 5, 6 & 7: Restrictions, Substitute Trainers & Admin Audit Log", () => {
    test("associates attendance with substitute trainer when session is substituted", async () => {
      const subSession = await Session.create({
        id: "SESS-SUB-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        isSubstituted: true,
        substituteCoachId: TRAINER_SUB,
        substituteCoachName: "Coach Achilles",
        substitutionStatus: "ACTIVE",
        substitutionReason: "Leave",
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      // Substitute trainer checks in
      const inRes = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_SUB,
        date: TEST_DATE,
        sessionId: subSession.id,
        checkInTime: "06:00 AM",
      });

      expect(inRes.interval.trainerId).toBe(TRAINER_SUB);
      expect(inRes.logs[0].trainerId).toBe(TRAINER_SUB);
      expect(inRes.logs[0].substituteTrainerId).toBe(TRAINER_SUB);
      expect(inRes.logs[0].originalTrainerId).toBe(TRAINER_1);
    });

    test("records full audit log when administrator performs an attendance override", async () => {
      const overridePayload = {
        date: TEST_DATE,
        memberId: MEMBER_1,
        batchId: BATCH_1,
        checkInTime: "06:10 AM",
        checkOutTime: "07:20 AM",
        reason: "Biometric sensor glitch at main gate. Verified via CCTV log.",
        notes: "Approved by Head Coach",
      };

      const updatedRecord = await attendanceService.adminOverrideMemberAttendance(
        overridePayload,
        { name: "SuperAdmin", username: "superadmin" }
      );

      expect(updatedRecord).toBeDefined();
      expect(updatedRecord.checkInTime).toBe("06:10 AM");
      expect(updatedRecord.checkOutTime).toBe("07:20 AM");
      expect(updatedRecord.durationMinutes).toBe(70);
      expect(updatedRecord.remarks).toContain("Biometric sensor glitch");

      // Verify audit trail entry was recorded
      const audits = await attendanceService.getAttendanceAuditLogs({
        memberId: MEMBER_1,
        date: TEST_DATE,
      });

      expect(audits.length).toBeGreaterThan(0);
      expect(audits[0].attendanceType).toBe("MEMBER");
      expect(audits[0].reason).toContain("Biometric sensor glitch");
      expect(audits[0].performedBy).toBe("SuperAdmin");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 1 (Extended): Automatic Member Checkout at End Time + 1 Hour
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 1 (Extended): Member Auto-Checkout at End Time + 1 Hour", () => {
    test("automatically checks out member who forgot checkout at class end time + 1 hour with audit log", async () => {
      // 1. Member checked in at 06:00 AM, forgot to checkout
      await attendanceService.markAttendance({
        date: TEST_DATE,
        batchId: BATCH_1,
        memberId: MEMBER_1,
        status: "PRESENT",
        checkInTime: "06:00 AM",
        markedBy: "Member",
      });

      // 2. Trigger auto-checkout process for TEST_DATE and BATCH_1
      const result = await attendanceService.processMemberAutoCheckouts(TEST_DATE, BATCH_1);
      expect(result.count).toBe(1);

      // 3. Verify attendance record is updated
      const record = await Attendance.findOne({ date: TEST_DATE, memberId: MEMBER_1 }).lean();
      expect(record.checkOutTime).toBe("08:00 AM"); // BATCH_1 ends at 07:00 AM + 1 hr = 08:00 AM
      expect(record.checkoutBy).toBe("SYSTEM");
      expect(record.isSystemGenerated).toBe(true);
      expect(record.durationMinutes).toBe(120); // 06:00 AM to 08:00 AM = 120 mins
      expect(record.status).toBe("PRESENT"); // Primary status remains PRESENT

      // 4. Verify audit log was recorded
      const audits = await attendanceService.getAttendanceAuditLogs({
        memberId: MEMBER_1,
        date: TEST_DATE,
        attendanceType: "MEMBER",
      });
      const autoAudit = audits.find((a) => a.action === "AUTO_CHECKOUT");
      expect(autoAudit).toBeDefined();
      expect(autoAudit.performedBy).toBe("SYSTEM");
      expect(autoAudit.reason).toContain("Automatic system checkout");

      // 5. Test idempotency: running again should not process or duplicate
      const retryResult = await attendanceService.processMemberAutoCheckouts(TEST_DATE, BATCH_1);
      expect(retryResult.count).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 3 (Extended): Consecutive Trainer Sessions ("Add Another Session")
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 3 (Extended): Consecutive Trainer Sessions Transition", () => {
    test("transitions attendance from current session to next consecutive session via Add Another Session", async () => {
      const sess1 = await Session.create({
        id: "SESS-TRANS-1",
        batchId: BATCH_1,
        batchName: "Morning CrossFit",
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      const sess2 = await Session.create({
        id: "SESS-TRANS-2",
        batchId: BATCH_2,
        batchName: "Morning Strength",
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: TEST_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "SCHEDULED",
      });

      // 1. Coach checks in to first session
      await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: sess1.id,
        checkInTime: "05:55 AM",
      });

      // 2. Coach completes Session 1 and clicks "Add Another Session" to transition to Session 2 at 07:05 AM
      const transitionResult = await attendanceService.trainerAddAnotherSession(
        {
          trainerId: TRAINER_1,
          date: TEST_DATE,
          currentSessionId: sess1.id,
          nextSessionId: sess2.id,
          transitionTime: "07:05 AM",
        },
        { name: "Coach Hercules", role: "trainer" }
      );

      expect(transitionResult).toBeDefined();
      expect(transitionResult.previousSession.sessionId).toBe(sess1.id);
      expect(transitionResult.previousSession.checkOutTime).toBe("07:05 AM");
      expect(transitionResult.previousSession.durationMinutes).toBe(60); // 06:00 to 07:00 overlap
      expect(transitionResult.previousSession.transitionedToSessionId).toBe(sess2.id);

      expect(transitionResult.nextSession.sessionId).toBe(sess2.id);
      expect(transitionResult.nextSession.checkInTime).toBe("07:05 AM");
      expect(transitionResult.nextSession.transitionedFromSessionId).toBe(sess1.id);

      // Verify audit trail entry was recorded
      const audits = await attendanceService.getAttendanceAuditLogs({
        trainerId: TRAINER_1,
        date: TEST_DATE,
      });
      const transAudit = audits.find((a) => a.action === "SESSION_TRANSITION");
      expect(transAudit).toBeDefined();
      expect(transAudit.reason).toContain("transitioned to consecutive session");

      // Verify session schedule enrichment shows consecutive next session eligibility
      const dailySchedule = await attendanceService.getTrainerDailySchedule(TRAINER_1, TEST_DATE);
      expect(dailySchedule.trainerId).toBe(TRAINER_1);
      expect(dailySchedule.blocks.length).toBeGreaterThan(0);
    });

    test("rejects Add Another Session if next session is cancelled or assigned to another coach", async () => {
      const currentSess = await Session.create({
        id: "SESS-ERR-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      const cancelledSess = await Session.create({
        id: "SESS-ERR-CANCELLED",
        batchId: BATCH_2,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "CANCELLED",
      });

      await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: currentSess.id,
        checkInTime: "06:00 AM",
      });

      await expect(
        attendanceService.trainerAddAnotherSession({
          trainerId: TRAINER_1,
          date: TEST_DATE,
          currentSessionId: currentSess.id,
          nextSessionId: cancelledSess.id,
        })
      ).rejects.toThrow(/Cannot transition to a cancelled session/i);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 4 (Extended): Morning and Evening Batches Without Overlap
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 4 (Extended): Morning and Evening Batches", () => {
    test("tracks separate attendance intervals and excludes between-session break from teaching duration", async () => {
      // Batch 3: Evening HIIT (05:00 PM - 06:00 PM)
      const BATCH_EVENING = "BATCH-EVE";
      await Batch.findOneAndUpdate(
        { id: BATCH_EVENING },
        {
          id: BATCH_EVENING,
          name: "Evening HIIT",
          startTime: "05:00 PM",
          endTime: "06:00 PM",
          daysPattern: "CUSTOM",
          daysList: ["Thursday", "Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
          status: "Active",
        },
        { upsert: true }
      );

      const morningSession = await Session.create({
        id: "SESS-MORN-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      const eveningSession = await Session.create({
        id: "SESS-EVE-1",
        batchId: BATCH_EVENING,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "05:00 PM",
        endTime: "06:00 PM",
        status: "SCHEDULED",
      });

      // 1. Morning Shift: Check In at 06:00 AM, Check Out at 07:00 AM
      const mornIn = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: morningSession.id,
        checkInTime: "06:00 AM",
      });
      await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        intervalId: mornIn.interval.id,
        checkOutTime: "07:00 AM",
      });

      // 2. Evening Shift: Separate Check In required at 05:00 PM, Check Out at 06:00 PM
      const eveIn = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        sessionId: eveningSession.id,
        checkInTime: "05:00 PM",
      });
      await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: TEST_DATE,
        intervalId: eveIn.interval.id,
        checkOutTime: "06:00 PM",
      });

      // Verify separate records exist
      const logs = await TrainerLog.find({ date: TEST_DATE, trainerId: TRAINER_1 }).lean();
      expect(logs.length).toBe(2);

      const mornLog = logs.find((l) => l.sessionId === morningSession.id);
      const eveLog = logs.find((l) => l.sessionId === eveningSession.id);

      expect(mornLog.durationMinutes).toBe(60);
      expect(eveLog.durationMinutes).toBe(60);

      // Verify total teaching duration does NOT include the 10-hour gap between shifts
      const totalTeaching = mornLog.durationMinutes + eveLog.durationMinutes;
      expect(totalTeaching).toBe(120); // Exactly 2 hours, not 12 hours!
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 5 & 6 (Extended): Admin Correction of Continuous Sessions & Flags
  // ────────────────────────────────────────────────────────────────────────────
  describe("Phase 5 & 6 (Extended): Admin Corrections & Exception Flags", () => {
    test("allows Admin to correct continuous session when trainer forgot Add Another Session", async () => {
      const s1 = await Session.create({
        id: "SESS-MISSED-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      const s2 = await Session.create({
        id: "SESS-MISSED-2",
        batchId: BATCH_2,
        coachId: TRAINER_1,
        sessionDate: TEST_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "SCHEDULED",
      });

      // Admin corrects the breakdown for both sessions with mandatory reason
      const correctionResult = await attendanceService.adminCorrectContinuousSession(
        {
          date: TEST_DATE,
          trainerId: TRAINER_1,
          sourceSessionId: s1.id,
          reason: "Coach taught consecutive classes but omitted Add Another Session action. Corrected after schedule review.",
          sessionCorrections: [
            {
              sessionId: s1.id,
              checkInTime: "06:00 AM",
              checkOutTime: "07:00 AM",
              remarks: "Session 1 conducted on schedule (admin corrected).",
            },
            {
              sessionId: s2.id,
              checkInTime: "07:00 AM",
              checkOutTime: "08:00 AM",
              remarks: "Session 2 conducted on schedule (admin corrected).",
            },
          ],
        },
        { name: "Gym Director", username: "director" }
      );

      expect(correctionResult).toBeDefined();
      expect(correctionResult.logs.length).toBe(2);

      const log1 = correctionResult.logs.find((l) => l.sessionId === s1.id);
      const log2 = correctionResult.logs.find((l) => l.sessionId === s2.id);

      expect(log1.durationMinutes).toBe(60);
      expect(log2.durationMinutes).toBe(60);
      expect(["PRESENT", "CONDUCTED"]).toContain(log1.status);
      expect(["PRESENT", "CONDUCTED"]).toContain(log2.status);

      // Verify audit logs exist
      const audits = await attendanceService.getAttendanceAuditLogs({
        trainerId: TRAINER_1,
        date: TEST_DATE,
      });
      const correctionAudit = audits.find((a) => a.reason.includes("omitted Add Another Session"));
      expect(correctionAudit).toBeDefined();
      expect(correctionAudit.performedBy).toBe("Gym Director");
    });

    test("flags missing trainer checkout for admin review without assuming auto-checkout", async () => {
      // Trainer check in for a past date without checkout
      const PAST_DATE = "2026-10-02";
      await Promise.all([
        TrainerLog.deleteMany({ date: PAST_DATE }),
        TrainerInterval.deleteMany({ date: PAST_DATE }),
        Session.deleteMany({ sessionDate: PAST_DATE }),
      ]);

      const pastSession = await Session.create({
        id: "SESS-PAST-1",
        batchId: BATCH_1,
        coachId: TRAINER_1,
        sessionDate: PAST_DATE,
        startTime: "06:00 AM",
        endTime: "07:00 AM",
        status: "SCHEDULED",
      });

      const pastLog = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: PAST_DATE,
        sessionId: pastSession.id,
        checkInTime: "06:00 AM",
        isAdminOverride: true,
        overrideReason: "Historical check-in test",
      });

      expect(pastLog.interval.checkInTime).toBe("06:00 AM");
      expect(pastLog.interval.checkOutTime).toBe(""); // Not auto-checked out!
      expect(pastLog.logs.length).toBeGreaterThan(0);
      expect(pastLog.logs[0].checkInTime).toBe("06:00 AM");
      expect(pastLog.logs[0].checkOutTime).toBe(""); // Not auto-checked out!
      // Status is strictly PRESENT
      expect(pastLog.logs[0].status).toBe("PRESENT");

      // Clean up past date
      await Promise.all([
        TrainerLog.deleteMany({ date: PAST_DATE }),
        TrainerInterval.deleteMany({ date: PAST_DATE }),
        Session.deleteMany({ sessionDate: PAST_DATE }),
      ]);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Phase 7 (Extended): Batch-Specific Trainer Attendance Workflow (Admin & Trainer)
  // ────────────────────────────────────────────────────────────────────────────
  describe("Batch-Specific Trainer Attendance Workflow (Admin & Trainer)", () => {
    const BATCH_SPEC_1 = "BATCH-SPEC-1";
    const BATCH_SPEC_2 = "BATCH-SPEC-2";
    const SPEC_DATE = "2026-10-21";

    beforeEach(async () => {
      await Promise.all([
        TrainerLog.deleteMany({ date: SPEC_DATE }),
        TrainerInterval.deleteMany({ date: SPEC_DATE }),
        Session.deleteMany({ sessionDate: SPEC_DATE }),
        AttendanceAudit.deleteMany({ date: SPEC_DATE }),
        Batch.findOneAndUpdate(
          { id: BATCH_SPEC_1 },
          {
            id: BATCH_SPEC_1,
            name: "Morning CrossFit",
            startTime: "07:00 AM",
            endTime: "08:00 AM",
            coachId: TRAINER_1,
            coachName: "Coach Hercules",
            status: "Active",
            daysPattern: "CUSTOM",
            daysList: ["Wednesday"],
          },
          { upsert: true }
        ),
        Batch.findOneAndUpdate(
          { id: BATCH_SPEC_2 },
          {
            id: BATCH_SPEC_2,
            name: "Evening Powerlifting",
            startTime: "06:00 PM",
            endTime: "07:00 PM",
            coachId: TRAINER_1,
            coachName: "Coach Hercules",
            status: "Active",
            daysPattern: "CUSTOM",
            daysList: ["Wednesday"],
          },
          { upsert: true }
        ),
      ]);
    });

    afterAll(async () => {
      await Promise.all([
        TrainerLog.deleteMany({ date: SPEC_DATE }),
        TrainerInterval.deleteMany({ date: SPEC_DATE }),
        Session.deleteMany({ sessionDate: SPEC_DATE }),
        AttendanceAudit.deleteMany({ date: SPEC_DATE }),
        Batch.deleteMany({ id: { $in: [BATCH_SPEC_1, BATCH_SPEC_2] } }),
      ]);
    });

    test("enforces 1-hour before/after check-in window and 1-hour after checkout window", async () => {
      const morningSession = await Session.create({
        id: "SESS-SPEC-MORN",
        batchId: BATCH_SPEC_1,
        batchName: "Morning CrossFit",
        coachId: TRAINER_1,
        coachName: "Coach Hercules",
        sessionDate: SPEC_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "SCHEDULED",
      });

      // Attempt check-in at 05:45 AM (75 mins before 07:00 AM) -> must fail
      await expect(
        attendanceService.trainerCheckIn({
          trainerId: TRAINER_1,
          date: SPEC_DATE,
          sessionId: morningSession.id,
          checkInTime: "05:45 AM",
        })
      ).rejects.toThrow(/Check-in restricted/i);

      // Attempt check-in at 06:15 AM (45 mins before 07:00 AM) -> must succeed
      const inRes = await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: morningSession.id,
        checkInTime: "06:15 AM",
      });
      expect(inRes.interval.checkInTime).toBe("06:15 AM");

      // Attempt check-out at 09:15 AM (75 mins after 08:00 AM end) -> must fail without admin override
      await expect(
        attendanceService.trainerCheckOut({
          trainerId: TRAINER_1,
          date: SPEC_DATE,
          sessionId: morningSession.id,
          checkOutTime: "09:15 AM",
        })
      ).rejects.toThrow(/Check-out restricted/i);

      // Attempt check-out at 08:30 AM (30 mins after 08:00 AM end) -> must succeed
      const outRes = await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: morningSession.id,
        checkOutTime: "08:30 AM",
      });

      expect(outRes.interval.checkOutTime).toBe("08:30 AM");
      // Presence: 06:15 to 08:30 = 135 mins
      expect(outRes.interval.actualDurationMinutes).toBe(135);
      // Scheduled teaching overlap: 07:00 to 08:00 = 60 mins
      expect(outRes.interval.totalTeachingDurationMinutes).toBe(60);
    });

    test("records attendance for selected session without affecting another session on the same day", async () => {
      const morningSession = await Session.create({
        id: "SESS-SPEC-MORN-2",
        batchId: BATCH_SPEC_1,
        coachId: TRAINER_1,
        sessionDate: SPEC_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "SCHEDULED",
      });

      const eveningSession = await Session.create({
        id: "SESS-SPEC-EVE-2",
        batchId: BATCH_SPEC_2,
        coachId: TRAINER_1,
        sessionDate: SPEC_DATE,
        startTime: "06:00 PM",
        endTime: "07:00 PM",
        status: "SCHEDULED",
      });

      // Record morning session attendance
      await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: morningSession.id,
        checkInTime: "07:00 AM",
      });
      await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: morningSession.id,
        checkOutTime: "08:00 AM",
      });

      // Verify evening session has NO attendance yet
      const eveLogBefore = await TrainerLog.findOne({
        date: SPEC_DATE,
        trainerId: TRAINER_1,
        sessionId: eveningSession.id,
      });
      expect(eveLogBefore).toBeNull();

      // Record evening session attendance
      await attendanceService.trainerCheckIn({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: eveningSession.id,
        checkInTime: "06:00 PM",
      });
      await attendanceService.trainerCheckOut({
        trainerId: TRAINER_1,
        date: SPEC_DATE,
        sessionId: eveningSession.id,
        checkOutTime: "07:00 PM",
      });

      // Both morning and evening have distinct, uncorrupted logs
      const mornLog = await TrainerLog.findOne({
        date: SPEC_DATE,
        trainerId: TRAINER_1,
        sessionId: morningSession.id,
      });
      const eveLog = await TrainerLog.findOne({
        date: SPEC_DATE,
        trainerId: TRAINER_1,
        sessionId: eveningSession.id,
      });

      expect(mornLog.checkInTime).toBe("07:00 AM");
      expect(mornLog.checkOutTime).toBe("08:00 AM");
      expect(mornLog.durationMinutes).toBe(60);

      expect(eveLog.checkInTime).toBe("06:00 PM");
      expect(eveLog.checkOutTime).toBe("07:00 PM");
      expect(eveLog.durationMinutes).toBe(60);
    });

    test("admin override requires mandatory reason and writes complete audit log", async () => {
      const session = await Session.create({
        id: "SESS-ADMIN-OVR",
        batchId: BATCH_SPEC_1,
        coachId: TRAINER_1,
        sessionDate: SPEC_DATE,
        startTime: "07:00 AM",
        endTime: "08:00 AM",
        status: "SCHEDULED",
      });

      // Admin override without reason -> must fail
      await expect(
        attendanceService.adminOverrideTrainerAttendance({
          date: SPEC_DATE,
          trainerId: TRAINER_1,
          batchId: BATCH_SPEC_1,
          sessionId: session.id,
          checkInTime: "07:00 AM",
          checkOutTime: "08:00 AM",
          reason: "",
        })
      ).rejects.toThrow(/Override reason is mandatory/i);

      // Admin override with valid reason
      const adminUser = { name: "SuperAdmin", username: "superadmin", role: "admin" };
      const overrideResult = await attendanceService.adminOverrideTrainerAttendance(
        {
          date: SPEC_DATE,
          trainerId: TRAINER_1,
          batchId: BATCH_SPEC_1,
          sessionId: session.id,
          checkInTime: "07:05 AM",
          checkOutTime: "08:00 AM",
          status: "CONDUCTED",
          reason: "Manual biometric failure correction verified by front desk",
        },
        adminUser
      );

      const logRecord = overrideResult?.log || overrideResult;
      expect(logRecord).toBeDefined();
      expect(logRecord.checkInTime).toBe("07:05 AM");
      expect(logRecord.checkOutTime).toBe("08:00 AM");
      expect(logRecord.durationMinutes).toBe(55);

      // Verify audit log
      const audit = await AttendanceAudit.findOne({
        date: SPEC_DATE,
        trainerId: TRAINER_1,
        sessionId: session.id,
      });

      expect(audit).toBeDefined();
      expect(audit.performedBy).toBe("SuperAdmin");
      expect(audit.reason).toBe("Manual biometric failure correction verified by front desk");
      expect(audit.updatedValues.checkInTime).toBe("07:05 AM");
      expect(audit.updatedValues.checkOutTime).toBe("08:00 AM");
    });
  });
});

