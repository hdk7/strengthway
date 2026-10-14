"use strict";

jest.setTimeout(30000);

const { connectDB, disconnectDB } = require("../../config/database");
const Batch = require("./batch.model");
const Member = require("../members/member.model");
const BatchAssignment = require("./batchAssignment.model");
const BatchAudit = require("./batchAudit.model");
const Attendance = require("../attendance/attendance.model");
const batchValidationService = require("./batchValidation.service");
const batchAssignmentService = require("./batchAssignment.service");
const attendanceService = require("../attendance/attendance.service");
const {
  ASSIGNMENT_TYPE,
  ASSIGNMENT_STATUS,
  BATCH_AUDIT_ACTION,
  BATCH_AUDIT_ROLE,
  ATTENDANCE_STATUS,
} = require("../../shared/constants");

describe("Comprehensive Flex, Permanent Transfer, Audit Logs & Attendance Suite", () => {
  const ts = Date.now().toString().slice(-6);
  const srcBatchId = `BAT-SRC-${ts}`;
  const tgtBatchId = `BAT-TGT-${ts}`;
  const otherBatchId = `BAT-OTH-${ts}`;
  const memberAId = `MEM-A-${ts}`;
  const memberBId = `MEM-B-${ts}`;

  // Helper date strings
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const futureEndStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  beforeAll(async () => {
    await connectDB();

    // Clean up any stale records
    await Batch.deleteMany({ id: { $in: [srcBatchId, tgtBatchId, otherBatchId] } });
    await Member.deleteMany({ id: { $in: [memberAId, memberBId] } });
    await BatchAssignment.deleteMany({ memberId: { $in: [memberAId, memberBId] } });
    await BatchAudit.deleteMany({ memberId: { $in: [memberAId, memberBId] } });
    await Attendance.deleteMany({ memberId: { $in: [memberAId, memberBId] } });

    // Seed Source Batch
    await Batch.create({
      id: srcBatchId,
      name: `Morning Alpha ${ts}`,
      shortName: "Alpha",
      startTime: "06:00 AM",
      endTime: "07:00 AM",
      timingLabel: "06:00 AM - 07:00 AM",
      daysPattern: "All Days",
      daysLabel: "Everyday",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      maxPax: 30,
      currentPax: 2,
      memberIds: [memberAId, memberBId],
      status: "Active",
    });

    // Seed Target Batch
    await Batch.create({
      id: tgtBatchId,
      name: `Evening Beta ${ts}`,
      shortName: "Beta",
      startTime: "06:00 PM",
      endTime: "07:00 PM",
      timingLabel: "06:00 PM - 07:00 PM",
      daysPattern: "All Days",
      daysLabel: "Everyday",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      maxPax: 30,
      currentPax: 0,
      memberIds: [],
      status: "Active",
    });

    // Seed Other Batch (for unauthorized check)
    await Batch.create({
      id: otherBatchId,
      name: `Night Gamma ${ts}`,
      shortName: "Gamma",
      startTime: "08:00 PM",
      endTime: "09:00 PM",
      timingLabel: "08:00 PM - 09:00 PM",
      daysPattern: "All Days",
      daysLabel: "Everyday",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      maxPax: 30,
      currentPax: 0,
      memberIds: [],
      status: "Active",
    });

    // Seed Member A
    await Member.create({
      id: memberAId,
      firstName: "Alex",
      lastName: "Hunter",
      gender: "Male",
      dob: "1995-05-15",
      email: `alex.${ts}@gym.test`,
      mobile: "+1555001001",
      batchId: srcBatchId,
      batchName: `Morning Alpha ${ts}`,
      status: "Active",
      planExpiresAt: new Date(Date.now() + 30 * 86400000),
      activeFlexAssignments: [],
      batchHistory: [
        {
          batchId: srcBatchId,
          batchName: `Morning Alpha ${ts}`,
          assignedAt: new Date(),
          assignmentType: ASSIGNMENT_TYPE.INITIAL_ENROLLMENT,
        },
      ],
    });

    // Seed Member B
    await Member.create({
      id: memberBId,
      firstName: "Blake",
      lastName: "Stone",
      gender: "Male",
      dob: "1994-08-20",
      email: `blake.${ts}@gym.test`,
      mobile: "+1555001002",
      batchId: srcBatchId,
      batchName: `Morning Alpha ${ts}`,
      status: "Active",
      planExpiresAt: new Date(Date.now() + 30 * 86400000),
      activeFlexAssignments: [],
      batchHistory: [
        {
          batchId: srcBatchId,
          batchName: `Morning Alpha ${ts}`,
          assignedAt: new Date(),
          assignmentType: ASSIGNMENT_TYPE.INITIAL_ENROLLMENT,
        },
      ],
    });
  });

  afterAll(async () => {
    await Batch.deleteMany({ id: { $in: [srcBatchId, tgtBatchId, otherBatchId] } });
    await Member.deleteMany({ id: { $in: [memberAId, memberBId] } });
    await BatchAssignment.deleteMany({ memberId: { $in: [memberAId, memberBId] } });
    await BatchAudit.deleteMany({ memberId: { $in: [memberAId, memberBId] } });
    await Attendance.deleteMany({ memberId: { $in: [memberAId, memberBId] } });
    await disconnectDB();
  });

  // =========================================================================
  // TEST SECTION 1: Temporary Batch Flex Workflow & Dual Audit Logging
  // =========================================================================
  let flexTxnId = null;
  let flexAssignmentId = null;

  test("1. Successfully creates Temporary Batch Flex and generates linked dual audit logs", async () => {
    const flexPayload = {
      memberId: memberAId,
      sourceBatchId: srcBatchId,
      targetBatchId: tgtBatchId,
      startDate: todayStr,
      endDate: futureEndStr,
      reason: "Work shift change for a week",
      transferredBy: "ADM-001",
    };

    const result = await batchAssignmentService.createFlexibleAssignment(flexPayload);

    flexAssignmentId = result.assignment.id;
    flexTxnId = result.assignment.transactionId;

    expect(result).toBeDefined();
    expect(result.assignment).toBeDefined();
    expect(result.assignment.id).toMatch(/^ASG-/);
    expect(result.assignment.transactionId).toMatch(/^TXN-FLX-/);
    expect(result.assignment.status).toBe(ASSIGNMENT_STATUS.ACTIVE);

    // Verify Member document: Home batch must remain unchanged!
    const memberDoc = await Member.findOne({ id: memberAId });
    expect(memberDoc.batchId).toBe(srcBatchId);
    expect(memberDoc.activeFlexAssignments.length).toBe(1);
    expect(memberDoc.activeFlexAssignments[0].targetBatchId).toBe(tgtBatchId);
    expect(memberDoc.activeFlexAssignments[0].transactionId).toBe(flexTxnId);

    // Verify dual audit logs in BatchAudit
    const sourceAudit = await BatchAudit.findOne({
      batchId: srcBatchId,
      transactionId: flexTxnId,
      batchRole: BATCH_AUDIT_ROLE.SOURCE,
    });
    expect(sourceAudit).toBeDefined();
    expect(sourceAudit.memberId).toBe(memberAId);
    expect(sourceAudit.actionType).toBe(BATCH_AUDIT_ACTION.FLEX_ACTIVATED);
    expect(sourceAudit.targetBatchId).toBe(tgtBatchId);
    expect(sourceAudit.status.toUpperCase()).toBe(ASSIGNMENT_STATUS.ACTIVE);
    expect(sourceAudit.performedBy).toBe("ADM-001");

    const targetAudit = await BatchAudit.findOne({
      batchId: tgtBatchId,
      transactionId: flexTxnId,
      batchRole: BATCH_AUDIT_ROLE.TARGET,
    });
    expect(targetAudit).toBeDefined();
    expect(targetAudit.memberId).toBe(memberAId);
    expect(targetAudit.sourceBatchId).toBe(srcBatchId);
    expect(targetAudit.status.toUpperCase()).toBe(ASSIGNMENT_STATUS.ACTIVE);
    expect(targetAudit.attendanceCount).toBe(0);

    // Both logs must reference the exact same transaction ID
    expect(sourceAudit.transactionId).toBe(targetAudit.transactionId);
  });

  test("2. Prevents overlapping / conflicting flex assignment for the same member", async () => {
    const conflictingPayload = {
      memberId: memberAId,
      targetBatchId: otherBatchId,
      startDate: todayStr,
      endDate: futureEndStr,
      reason: "Conflicting flex attempt",
    };

    await expect(
      batchAssignmentService.createFlexibleAssignment(conflictingPayload, "ADM-001")
    ).rejects.toThrow(/already has an active flexible pass/i);
  });

  // =========================================================================
  // TEST SECTION 2: Attendance Enforcement During Temporary Flex
  // =========================================================================
  test("3. Allows attendance in target batch during authorized flex period and tracks attendance count", async () => {
    const attResult = await attendanceService.markAttendance({
      memberId: memberAId,
      batchId: tgtBatchId,
      date: todayStr,
      status: ATTENDANCE_STATUS.PRESENT,
      checkInTime: "06:15 PM",
      markedBy: "ADM-001",
    });

    expect(attResult).toBeDefined();
    expect(attResult.isFlexAttendance).toBe(true);
    expect(attResult.originalPrimaryBatchId).toBe(srcBatchId);
    expect(attResult.batchId).toBe(tgtBatchId);

    // Check that target audit record attendanceCount was incremented
    const targetAudit = await BatchAudit.findOne({
      batchId: tgtBatchId,
      transactionId: flexTxnId,
      batchRole: BATCH_AUDIT_ROLE.TARGET,
    });
    expect(targetAudit.attendanceCount).toBe(1);
  });

  test("4. Disallows attendance in source batch on dates member is flexed out", async () => {
    await expect(
      attendanceService.markAttendance({
        memberId: memberAId,
        batchId: srcBatchId,
        date: todayStr,
        status: ATTENDANCE_STATUS.PRESENT,
        checkInTime: "06:15 AM",
        markedBy: "ADM-001",
      })
    ).rejects.toThrow(/temporary flex pass/i);
  });

  test("5. Disallows attendance in unauthorized batch during flex", async () => {
    await expect(
      attendanceService.markAttendance({
        memberId: memberAId,
        batchId: otherBatchId,
        date: todayStr,
        status: ATTENDANCE_STATUS.PRESENT,
        checkInTime: "08:15 PM",
        markedBy: "ADM-001",
      })
    ).rejects.toThrow(/not authorized to attend batch/i);
  });

  test("6. Prevents duplicate check-in for the same member on the same date", async () => {
    await expect(
      attendanceService.markAttendance({
        memberId: memberAId,
        batchId: srcBatchId,
        date: todayStr,
        status: ATTENDANCE_STATUS.PRESENT,
        checkInTime: "06:30 AM",
        markedBy: "ADM-001",
      })
    ).rejects.toThrow();
  });

  // =========================================================================
  // TEST SECTION 3: Permanent Batch Transfer Workflow & Audit Logs
  // =========================================================================
  test("7. Executes permanent batch transfer, records dual audit logs, and preserves history", async () => {
    const transferPayload = {
      memberId: memberBId,
      sourceBatchId: srcBatchId,
      targetBatchId: tgtBatchId,
      effectiveDate: todayStr,
      reason: "Permanent relocation of office",
    };

    const transferResult = await batchAssignmentService.executePermanentTransfer(
      transferPayload,
      "ADM-002"
    );

    expect(transferResult).toBeDefined();
    expect(transferResult.assignment).toBeDefined();
    expect(transferResult.assignment.transactionId).toMatch(/^TXN-TRF-/);
    const trfTxnId = transferResult.assignment.transactionId;

    // Check member assignment is now target batch
    const memberB = await Member.findOne({ id: memberBId });
    expect(memberB.batchId).toBe(tgtBatchId);
    expect(memberB.batchHistory.length).toBeGreaterThanOrEqual(2);

    // Verify source batch audit log (TRANSFER_OUT)
    const srcTrfAudit = await BatchAudit.findOne({
      batchId: srcBatchId,
      transactionId: trfTxnId,
      batchRole: BATCH_AUDIT_ROLE.SOURCE,
    });
    expect(srcTrfAudit).toBeDefined();
    expect(srcTrfAudit.actionType).toBe(BATCH_AUDIT_ACTION.TRANSFER_OUT);
    expect(srcTrfAudit.sourceBatchId).toBe(srcBatchId);
    expect(srcTrfAudit.targetBatchId).toBe(tgtBatchId);
    expect(srcTrfAudit.reason).toBe("Permanent relocation of office");

    // Verify target batch audit log (TRANSFER_IN)
    const tgtTrfAudit = await BatchAudit.findOne({
      batchId: tgtBatchId,
      transactionId: trfTxnId,
      batchRole: BATCH_AUDIT_ROLE.TARGET,
    });
    expect(tgtTrfAudit).toBeDefined();
    expect(tgtTrfAudit.actionType).toBe(BATCH_AUDIT_ACTION.TRANSFER_IN);
    expect(tgtTrfAudit.sourceBatchId).toBe(srcBatchId);
    expect(tgtTrfAudit.targetBatchId).toBe(tgtBatchId);

    // Both logs must reference identical transaction ID
    expect(srcTrfAudit.transactionId).toBe(tgtTrfAudit.transactionId);

    // Now test attendance: permitted in target batch, blocked in previous source batch
    const attPermResult = await attendanceService.markAttendance({
      memberId: memberBId,
      batchId: tgtBatchId,
      date: todayStr,
      status: ATTENDANCE_STATUS.PRESENT,
      checkInTime: "06:20 PM",
      markedBy: "ADM-002",
    });
    expect(attPermResult).toBeDefined();
    expect(attPermResult.batchId).toBe(tgtBatchId);

    // Blocked in source batch
    await expect(
      attendanceService.markAttendance({
        memberId: memberBId,
        batchId: srcBatchId,
        date: todayStr,
        status: ATTENDANCE_STATUS.PRESENT,
        checkInTime: "06:30 AM",
        markedBy: "ADM-002",
      })
    ).rejects.toThrow();
  });

  // =========================================================================
  // TEST SECTION 4: Automatic Rejoining Engine & Downtime Catch-Up
  // =========================================================================
  test("8. Automatically rejoins expired flex assignments and updates audit logs idempotently", async () => {
    // Manually expire Member A's flex assignment in DB to simulate passage of time or downtime
    await BatchAssignment.updateOne(
      { id: flexAssignmentId },
      {
        $set: {
          startDate: "2026-01-01",
          endDate: yesterdayStr,
        },
      }
    );
    await Member.updateOne(
      { id: memberAId, "activeFlexAssignments.assignmentId": flexAssignmentId },
      {
        $set: {
          "activeFlexAssignments.$.startDate": "2026-01-01",
          "activeFlexAssignments.$.endDate": yesterdayStr,
        },
      }
    );

    // Run expiration background processor
    const processResult = await batchAssignmentService.processExpiredFlexAssignments();
    expect(processResult.rejoinedCount).toBeGreaterThanOrEqual(1);

    // Member A should now be restored to original primary batch and activeFlexAssignments cleared
    const updatedMemberA = await Member.findOne({ id: memberAId });
    expect(updatedMemberA.batchId).toBe(srcBatchId);
    expect(updatedMemberA.activeFlexAssignments.length).toBe(0);

    // Assignment must be marked COMPLETED and isRejoined = true
    const updatedAssignment = await BatchAssignment.findOne({ id: flexAssignmentId });
    expect(updatedAssignment.status).toBe(ASSIGNMENT_STATUS.COMPLETED);
    expect(updatedAssignment.isRejoined).toBe(true);
    expect(updatedAssignment.rejoinedAt).toBeDefined();

    // Both source and target audit logs should reflect COMPLETED status and rejoinedAt
    const updatedSrcAudit = await BatchAudit.findOne({
      batchId: srcBatchId,
      transactionId: flexTxnId,
    });
    expect(updatedSrcAudit.status).toBe(ASSIGNMENT_STATUS.COMPLETED);
    expect(updatedSrcAudit.rejoinedAt).toBeDefined();

    const updatedTgtAudit = await BatchAudit.findOne({
      batchId: tgtBatchId,
      transactionId: flexTxnId,
    });
    expect(updatedTgtAudit.status).toBe(ASSIGNMENT_STATUS.COMPLETED);
    expect(updatedTgtAudit.rejoinedAt).toBeDefined();

    // Idempotency: Calling processExpiredFlexAssignments again should result in 0 rejoined
    const secondRun = await batchAssignmentService.processExpiredFlexAssignments();
    expect(secondRun.rejoinedCount).toBe(0);
  });

  // =========================================================================
  // TEST SECTION 5: Batch Audit Logs Query & Retrieval Endpoint
  // =========================================================================
  test("9. Retrieves comprehensive audit trail with filters for both source and target batches", async () => {
    const srcLogs = await batchAssignmentService.getBatchAuditLogs(srcBatchId, {
      memberId: memberAId,
    });

    expect(srcLogs.logs.length).toBeGreaterThanOrEqual(1);
    expect(srcLogs.logs[0].transactionId).toBe(flexTxnId);
    expect(srcLogs.logs[0].batchRole).toBe(BATCH_AUDIT_ROLE.SOURCE);

    const tgtLogs = await batchAssignmentService.getBatchAuditLogs(tgtBatchId, {
      memberId: memberAId,
    });

    expect(tgtLogs.logs.length).toBeGreaterThanOrEqual(1);
    expect(tgtLogs.logs[0].transactionId).toBe(flexTxnId);
    expect(tgtLogs.logs[0].batchRole).toBe(BATCH_AUDIT_ROLE.TARGET);
    expect(tgtLogs.logs[0].attendanceCount).toBe(1);
  });
});
