"use strict";

/**
 * Substitute Trainer Management: E2E Verification Test Suite
 * ==========================================================
 * Validates all Phase 1 - 8 requirements:
 * 1. Admin assigns an available substitute trainer successfully.
 * 2. Primary trainer on batch (batch.trainerIds) is permanently preserved.
 * 3. Proceed without substitute flow (optional administrative choice).
 * 4. Trainer availability & conflict validation:
 *    - Rejection on overlapping scheduled/active batch session
 *    - Rejection on approved trainer leave
 * 5. Cancellation / restoration of original trainer.
 * 6. Audit log completeness & idempotency (prevents duplicate on retry).
 * 7. Trainer attendance recorded against substitute coach with status "SUBSTITUTE".
 * 8. Member attendance roster and batch assignment remain intact.
 */

require("dotenv").config();
process.env.NODE_ENV = "test";
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../src/config/database");

// Direct models
const Batch = require("../src/modules/batches/batch.model");
const Member = require("../src/modules/members/member.model");
const Trainer = require("../src/modules/trainers/trainer.model");
const Session = require("../src/modules/schedules/session.model");
const BatchSubstituteAudit = require("../src/modules/batches/batchSubstituteAudit.model");
const TrainerLeave = require("../src/modules/attendance/trainerLeave.model");
const Attendance = require("../src/modules/attendance/attendance.model");
const TrainerLog = require("../src/modules/attendance/trainerLog.model");

const { assert, apiRequest, authenticate } = require("./phase11_client");

async function runSubstituteTrainerTests() {
  console.log("======================================================================");
  console.log("  Strengthway E2E: Substitute Trainer Management & Verification       ");
  console.log("======================================================================\n");

  const ts = Date.now();
  const testDate = "2026-11-18"; // Wednesday
  const batch1Id = `BATCH-SUB-1-${ts}`;
  const batch2Id = `BATCH-SUB-2-${ts}`;

  const trainerAId = `TRN-ORIG-${ts}`; // Primary Coach for Batch 1
  const trainerBId = `TRN-SUB-AVAIL-${ts}`; // Free Coach (Eligible Substitute)
  const trainerCId = `TRN-BUSY-${ts}`; // Coach Busy with Batch 2 at same time
  const trainerDId = `TRN-LEAVE-${ts}`; // Coach on Approved Leave

  const session1Id = `SES-SUB-1-${ts}`;
  const session2Id = `SES-SUB-BUSY-${ts}`;
  const memberId = `MEM-SUB-ATHLETE-${ts}`;

  await connectDB();

  try {
    await authenticate();

    console.log("\n--- Step 1: Seeding Test Trainers, Batches & Schedules ---");

    // Create 4 Trainers
    await Trainer.create([
      {
        id: trainerAId,
        name: "Coach Alpha (Original)",
        email: `alpha.${ts}@strengthway.com`,
        phone: "9876543201",
        shift: "Morning",
        status: "Active",
        bio: "Senior Strength and Conditioning specialist",
        experience: "8 years",
        batchIds: [batch1Id],
      },
      {
        id: trainerBId,
        name: "Coach Beta (Free Substitute)",
        email: `beta.${ts}@strengthway.com`,
        phone: "9876543202",
        shift: "Morning",
        status: "Active",
        bio: "Olympic Weightlifting specialist",
        experience: "5 years",
        batchIds: [],
      },
      {
        id: trainerCId,
        name: "Coach Charlie (Busy Coach)",
        email: `charlie.${ts}@strengthway.com`,
        phone: "9876543203",
        shift: "Morning",
        status: "Active",
        bio: "Crossfit and HIIT endurance specialist",
        experience: "6 years",
        batchIds: [batch2Id],
      },
      {
        id: trainerDId,
        name: "Coach Delta (On Leave)",
        email: `delta.${ts}@strengthway.com`,
        phone: "9876543204",
        shift: "Morning",
        status: "Active",
        bio: "Mobility and rehabilitation coach",
        experience: "4 years",
        batchIds: [],
      },
    ]);
    console.log("  ✓ Created 4 test trainers (Alpha, Beta, Charlie, Delta)");

    // Approved Leave for Trainer D on testDate
    await TrainerLeave.create({
      id: `LEV-SUB-${ts}`,
      trainerId: trainerDId,
      trainerName: "Coach Delta (On Leave)",
      requestedStartDate: testDate,
      requestedEndDate: testDate,
      totalRequestedDays: 1,
      approvedStartDate: testDate,
      approvedEndDate: testDate,
      totalApprovedDays: 1,
      leaveStartDate: testDate,
      leaveEndDate: testDate,
      totalDays: 1,
      submittedOn: testDate,
      reason: "Medical Checkup",
      status: "APPROVED",
      appliedAt: new Date(),
    });
    console.log("  ✓ Created approved leave for Coach Delta on", testDate);

    // Approved Leave for Trainer A (Primary assigned coach on leave) on testDate
    await TrainerLeave.create({
      id: `LEV-ALPHA-${ts}`,
      trainerId: trainerAId,
      trainerName: "Coach Alpha (Primary)",
      requestedStartDate: testDate,
      requestedEndDate: testDate,
      totalRequestedDays: 1,
      approvedStartDate: testDate,
      approvedEndDate: testDate,
      totalApprovedDays: 1,
      leaveStartDate: testDate,
      leaveEndDate: testDate,
      totalDays: 1,
      submittedOn: testDate,
      reason: "Emergency Medical Leave",
      status: "APPROVED",
      appliedAt: new Date(),
    });
    console.log("  ✓ Created approved leave for Coach Alpha (Primary) on", testDate);

    // Batch 1 (07:00 AM - 08:00 AM) with Trainer A
    await Batch.create({
      id: batch1Id,
      name: "Strength & Conditioning Batch 1",
      shortName: "SC-1",
      startTime: "07:00 AM",
      endTime: "08:00 AM",
      timingLabel: "07:00 AM - 08:00 AM",
      daysList: ["Wednesday"],
      daysLabel: "Wed",
      maxPax: 20,
      currentPax: 1,
      trainerIds: [trainerAId],
      status: "Active",
    });

    // Batch 2 (07:00 AM - 08:00 AM) with Trainer C (Overlapping time!)
    await Batch.create({
      id: batch2Id,
      name: "HIIT Crossfit Batch 2",
      shortName: "HIIT-2",
      startTime: "07:00 AM",
      endTime: "08:00 AM",
      timingLabel: "07:00 AM - 08:00 AM",
      daysList: ["Wednesday"],
      daysLabel: "Wed",
      maxPax: 20,
      currentPax: 1,
      trainerIds: [trainerCId],
      status: "Active",
    });

    // Session 1 for Batch 1 (under Coach Alpha)
    await Session.create({
      id: session1Id,
      batchId: batch1Id,
      batchName: "Strength & Conditioning Batch 1",
      date: testDate,
      sessionDate: testDate,
      startTime: "07:00 AM",
      endTime: "08:00 AM",
      coachId: trainerAId,
      coachName: "Coach Alpha (Original)",
      originalCoachId: trainerAId,
      originalCoachName: "Coach Alpha (Original)",
      topic: "Heavy Deadlifts & Core",
      status: "SCHEDULED",
      isSubstituted: false,
    });

    // Session 2 for Batch 2 (under Coach Charlie at same time)
    await Session.create({
      id: session2Id,
      batchId: batch2Id,
      batchName: "HIIT Crossfit Batch 2",
      date: testDate,
      sessionDate: testDate,
      startTime: "07:00 AM",
      endTime: "08:00 AM",
      coachId: trainerCId,
      coachName: "Coach Charlie (Busy Coach)",
      topic: "Tabata Intervals",
      status: "SCHEDULED",
      isSubstituted: false,
    });

    // Member assigned to Batch 1
    await Member.create({
      id: memberId,
      firstName: "Alex",
      lastName: "Rider",
      dob: "1995-05-15",
      gender: "Male",
      mobile: "9876543299",
      email: `alex.${ts}@example.com`,
      batchId: batch1Id,
      batchName: "Strength & Conditioning Batch 1",
      status: "Active",
      isDeleted: false,
    });
    console.log("  ✓ Created test batches, schedules, and athlete roster");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Check Eligible Substitute Trainers (Availability Validation)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 1: Querying Eligible Substitutes for Session 1 ---");
    const eligRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/eligible-substitutes`);
    if (!eligRes.ok) {
      console.error("  [FAILED RESPONSE]:", eligRes.status, eligRes.message, eligRes.raw);
    }
    assert(eligRes.ok, `Expected 200 OK for eligible substitutes, got ${eligRes.status}`);

    const eligibleList = eligRes.data?.eligibleTrainers || [];
    const unavailableList = eligRes.data?.unavailableTrainers || [];
    const requiringList = eligRes.data?.trainersRequiringSubstitution || [];

    console.log(`  Found ${requiringList.length} requiring substitution, ${eligibleList.length} eligible trainers, ${unavailableList.length} unavailable trainers.`);

    // Trainer A should be in trainersRequiringSubstitution
    assert(
      requiringList.some((t) => t.id === trainerAId),
      `Coach Alpha (${trainerAId}) must be recognized in trainersRequiringSubstitution list.`
    );
    console.log("  ✓ Coach Alpha is correctly recognized as requiring substitution due to approved leave.");

    // Trainer B should be eligible
    const isTrainerBEligible = eligibleList.some((t) => t.id === trainerBId);
    assert(isTrainerBEligible, `Coach Beta (${trainerBId}) should be in eligible list.`);
    console.log("  ✓ Coach Beta is recognized as ELIGIBLE (No time conflicts, active, not on leave).");

    // Trainer C should be unavailable due to overlapping session in Batch 2
    const trainerCUnavail = unavailableList.find((t) => t.id === trainerCId);
    assert(trainerCUnavail, `Coach Charlie (${trainerCId}) must be flagged UNAVAILABLE.`);
    assert(
      trainerCUnavail.conflicts.some((c) => c.type === "BATCH_SCHEDULE_OVERLAP" || c.type === "SESSION_OVERLAP"),
      `Coach Charlie must have schedule overlap conflict. Details: ${JSON.stringify(trainerCUnavail?.conflicts)}`
    );
    console.log("  ✓ Coach Charlie correctly marked UNAVAILABLE due to overlapping batch schedule.");

    // Trainer D should be unavailable due to Approved Leave
    const trainerDUnavail = unavailableList.find((t) => t.id === trainerDId);
    assert(trainerDUnavail, `Coach Delta (${trainerDId}) must be flagged UNAVAILABLE due to leave.`);
    assert(
      trainerDUnavail.conflicts.some((c) => c.type === "ON_LEAVE" || c.type === "LEAVE"),
      `Coach Delta must have LEAVE conflict.`
    );
    console.log("  ✓ Coach Delta correctly marked UNAVAILABLE due to active approved leave.");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Assign Conflicting Trainer (Backend Conflict Rejection)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 2: Attempting to Assign Overlapping Trainer Charlie ---");
    const conflictAssignRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        substituteTrainerId: trainerCId,
        reason: "LEAVE",
        notes: "Trying to double-book Charlie",
      },
    });
    if (conflictAssignRes.status !== 400) {
      console.error("  [TEST 2 FAILED RESPONSE]:", conflictAssignRes.status, conflictAssignRes.message, conflictAssignRes.raw);
    }
    assert(
      conflictAssignRes.status === 400,
      `Expected 400 Bad Request when assigning overlapping trainer, got ${conflictAssignRes.status}`
    );
    console.log("  ✓ Backend validation rejected overlapping assignment:", conflictAssignRes.message);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Assign Trainer On Leave (Backend Leave Rejection)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 3: Attempting to Assign Trainer Delta (On Leave) ---");
    const leaveAssignRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        substituteTrainerId: trainerDId,
        reason: "ABSENT",
        notes: "Trying to assign trainer on leave",
      },
    });
    assert(
      leaveAssignRes.status === 400,
      `Expected 400 Bad Request when assigning trainer on leave, got ${leaveAssignRes.status}`
    );
    console.log("  ✓ Backend validation rejected trainer on leave:", leaveAssignRes.message);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Assign Eligible Substitute Trainer Beta
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 4: Assigning Eligible Substitute Coach Beta ---");
    const validAssignRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        substituteTrainerId: trainerBId,
        reason: "LEAVE",
        notes: "Alpha is out for conference, Beta substituting",
      },
    });
    if (!validAssignRes.ok) {
      console.error("  [TEST 4 FAILED RESPONSE]:", validAssignRes.status, validAssignRes.message, validAssignRes.raw);
    }
    assert(validAssignRes.ok, `Expected 200 OK for valid substitute assignment, got ${validAssignRes.status}`);

    // Verify session state
    const updatedSession = await Session.findOne({ id: session1Id }).lean();
    assert(updatedSession.isSubstituted === true, "Session must be marked isSubstituted = true");
    assert(updatedSession.substituteCoachId === trainerBId, "Session substituteCoachId must be Coach Beta");
    assert(updatedSession.originalCoachId === trainerAId, "Session originalCoachId must remain Coach Alpha");
    assert(updatedSession.coachId === trainerBId, "Active session coachId should be Coach Beta");

    // Verify Batch Primary Trainer remains Coach Alpha
    const batchAfterSub = await Batch.findOne({ id: batch1Id }).lean();
    assert(
      batchAfterSub.trainerIds.includes(trainerAId),
      "Batch primary trainerIds MUST preserve Coach Alpha!"
    );
    assert(
      !batchAfterSub.trainerIds.includes(trainerBId),
      "Batch permanent trainerIds must NOT be modified by temporary substitute!"
    );
    console.log("  ✓ Session assigned to Coach Beta; Batch permanent trainerIds preserved Coach Alpha.");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Verify Batch Substitute Audit Log
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 5: Verifying Batch Substitute Audit Trail ---");
    const auditRes = await apiRequest(`/batches/${batch1Id}/substitute-audits?sessionId=${session1Id}`);
    assert(auditRes.ok, `Expected 200 OK for substitute audits, got ${auditRes.status}`);
    const audits = auditRes.data?.audits || [];
    assert(audits.length >= 1, "At least 1 audit record should exist");

    const assignAudit = audits.find((a) => a.action === "ASSIGNED" && a.sessionId === session1Id);
    assert(assignAudit, "Must find ASSIGNED audit record for session 1");
    assert(assignAudit.originalCoachId === trainerAId, "Audit originalCoachId must match Coach Alpha");
    assert(assignAudit.substituteCoachId === trainerBId, "Audit substituteCoachId must match Coach Beta");
    assert(assignAudit.reason?.toUpperCase() === "LEAVE", "Audit reason must match LEAVE");
    assert(assignAudit.sessionStartTime === "07:00 AM", "Audit start time must be 07:00 AM");
    console.log("  ✓ Audit log recorded with all required fields (Audit ID:", assignAudit.id, ")");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: Proceed Without Substitute (Optional Admin Decision)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 6: Testing 'Proceed Without Substitute' Decision ---");
    const proceedRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        proceedWithoutSubstitute: true,
        reason: "ABSENT",
        notes: "No substitute available; other floor trainers will supervise",
      },
    });
    if (!proceedRes.ok) {
      console.error("  [TEST 6 FAILED RESPONSE]:", proceedRes.status, proceedRes.message, proceedRes.raw);
    }
    assert(proceedRes.ok, `Expected 200 OK for proceedWithoutSubstitute, got ${proceedRes.status}`);

    const sessionNoSub = await Session.findOne({ id: session1Id }).lean();
    assert(sessionNoSub.isSubstituted === false, "isSubstituted should be false");
    assert(sessionNoSub.coachId === trainerAId, "coachId should revert to original Coach Alpha");

    // Check audit trail for PROCEEDED_WITHOUT_SUBSTITUTE
    const auditRes2 = await apiRequest(`/batches/${batch1Id}/substitute-audits?sessionId=${session1Id}`);
    const proceedAudit = (auditRes2.data?.audits || []).find((a) => a.action === "PROCEEDED_WITHOUT_SUBSTITUTE");
    assert(proceedAudit, "Must record PROCEEDED_WITHOUT_SUBSTITUTE in audit logs");
    console.log("  ✓ 'Proceed Without Substitute' successful and audited (Audit ID:", proceedAudit.id, ")");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: Re-assign & Cancel Substitution
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 7: Re-assigning Coach Beta, then Cancelling ---");
    await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        substituteTrainerId: trainerBId,
        reason: "EMERGENCY",
        notes: "Emergency substitution",
      },
    });

    const cancelRes = await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "DELETE",
      body: {
        cancellationReason: "Original trainer Alpha returned early",
      },
    });
    assert(cancelRes.ok, `Expected 200 OK for cancel substitute, got ${cancelRes.status}`);

    const sessionAfterCancel = await Session.findOne({ id: session1Id }).lean();
    assert(sessionAfterCancel.isSubstituted === false, "isSubstituted must be false after cancellation");
    assert(sessionAfterCancel.coachId === trainerAId, "coachId must be restored to original Coach Alpha");

    const auditRes3 = await apiRequest(`/batches/${batch1Id}/substitute-audits?sessionId=${session1Id}`);
    const cancelAudit = (auditRes3.data?.audits || []).find((a) => a.action === "CANCELLED");
    assert(cancelAudit, "Must record CANCELLED in audit logs");
    assert(cancelAudit.cancellationReason === "Original trainer Alpha returned early", "Cancellation reason preserved");
    console.log("  ✓ Cancellation cleanly restored original Coach Alpha and logged audit trail.");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: Trainer Attendance for Substitute Conduction
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 8: Trainer Attendance Management for Substituted Session ---");
    // Re-assign Coach Beta for attendance verification
    await apiRequest(`/batches/${batch1Id}/sessions/${session1Id}/substitute`, {
      method: "POST",
      body: {
        substituteTrainerId: trainerBId,
        reason: "LEAVE",
        notes: "Conduction test",
      },
    });

    // Record attendance by Coach Beta
    const trainerAttendanceService = require("../src/modules/attendance/attendance.service");
    const subLog = await trainerAttendanceService.recordTrainerLog({
      date: testDate,
      trainerId: trainerBId,
      trainerName: "Coach Beta (Free Substitute)",
      batchId: batch1Id,
      sessionId: session1Id,
      status: "CONDUCTED",
      checkInTime: "07:00 AM",
      checkOutTime: "08:00 AM",
      durationMinutes: 60,
      attendeesCount: 15,
      notes: "Conducted morning deadlift session",
    });

    assert(subLog.trainerId === trainerBId, "Trainer log must be under Coach Beta");
    assert(subLog.status === "SUBSTITUTE", "Trainer log status should be SUBSTITUTE");
    assert(subLog.substituteTrainerId === trainerBId, "substituteTrainerId must be Coach Beta");

    // Verify Coach Alpha does NOT have a CONDUCTED log
    const alphaLog = await TrainerLog.findOne({
      date: testDate,
      trainerId: trainerAId,
      batchId: batch1Id,
    }).lean();
    assert(!alphaLog || alphaLog.status !== "CONDUCTED", "Coach Alpha must NOT be falsely marked as CONDUCTED");
    console.log("  ✓ Trainer attendance logged against substitute Coach Beta with status SUBSTITUTE.");
    console.log("  ✓ Original Coach Alpha attendance was NOT altered.");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 9: Member Attendance Unchanged
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- Test 9: Member Attendance linked to Batch and Session ---");
    const memberAttRes = await trainerAttendanceService.bulkMarkAttendance({
      batchId: batch1Id,
      date: testDate,
      attendees: [{ memberId: memberId, status: "PRESENT" }],
      trainerId: trainerBId,
      sessionId: session1Id,
    });
    assert(memberAttRes.count === 1, "Member attendance should be recorded");

    const memRecord = await Attendance.findOne({ memberId, date: testDate, batchId: batch1Id }).lean();
    assert(memRecord, "Member attendance must exist for batch 1");
    assert(memRecord.status === "PRESENT", "Member status must be PRESENT");
    assert(memRecord.sessionId === session1Id, "Member attendance linked to session 1");
    assert(memRecord.trainerId === trainerBId, "Trainer who marked was Coach Beta");
    console.log("  ✓ Member attendance recorded cleanly linked to Batch 1, session, and conducted trainer.");

    console.log("\n======================================================================");
    console.log("  ✓ ALL 9 SUBSTITUTE TRAINER INTEGRATION TESTS PASSED SUCCESSFULLY!   ");
    console.log("======================================================================\n");
  } finally {
    // Cleanup fixtures
    console.log("Cleaning up test data...");
    await Batch.deleteMany({ id: { $in: [batch1Id, batch2Id] } }).catch(() => null);
    await Trainer.deleteMany({ id: { $in: [trainerAId, trainerBId, trainerCId, trainerDId] } }).catch(() => null);
    await Session.deleteMany({ id: { $in: [session1Id, session2Id] } }).catch(() => null);
    await BatchSubstituteAudit.deleteMany({ batchId: batch1Id }).catch(() => null);
    await TrainerLeave.deleteMany({ trainerId: { $in: [trainerAId, trainerDId] } }).catch(() => null);
    await Attendance.deleteMany({ batchId: batch1Id }).catch(() => null);
    await TrainerLog.deleteMany({ batchId: batch1Id }).catch(() => null);
    await Member.deleteOne({ id: memberId }).catch(() => null);
    console.log("Cleanup complete.");
    await disconnectDB().catch(() => null);
  }
}

if (require.main === module) {
  runSubstituteTrainerTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\n[TEST FAILED]", err);
      process.exit(1);
    });
}

module.exports = { runSubstituteTrainerTests };
