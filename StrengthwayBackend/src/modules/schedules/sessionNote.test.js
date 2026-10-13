"use strict";

jest.setTimeout(30000);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { connectDB, disconnectDB } = require("../../config/database");
const app = require("../../app");
const { JWT_SECRET } = require("../../config/env");
const SessionNote = require("./sessionNote.model");
const Session = require("./session.model");
const Batch = require("../batches/batch.model");

describe("Session Notes Module Suite (Multi-Trainer, 30-Day Window, RBAC)", () => {
  const ts = Date.now().toString().slice(-4);
  const testBatchId = `BATCH-TEST-${ts}`;
  const testSessionId = `SESS-TEST-${ts}`;
  const testOldSessionId = `SESS-OLD-${ts}`;
  const testTrainerId1 = "TRN-101";
  const testTrainerId2 = "TRN-102";
  const otherTrainerId = "TRN-999";

  const adminToken = jwt.sign(
    { id: "USR-ADMIN-1", role: "admin", name: "Super Admin", email: "admin@test.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const trainer1Token = jwt.sign(
    { id: "USR-TRN-1", role: "trainer", trainerId: testTrainerId1, name: "Dolliee Ellens", email: "trainer1@test.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const trainer2Token = jwt.sign(
    { id: "USR-TRN-2", role: "trainer", trainerId: testTrainerId2, name: "Ashwin Kumar", email: "trainer2@test.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const memberToken = jwt.sign(
    { id: "USR-MEM-1", role: "member", memberId: "MEM-2001", name: "Gym Member", email: "member@test.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  beforeAll(async () => {
    await connectDB();

    // Create test batch with 2 assigned trainers
    await Batch.create({
      id: testBatchId,
      name: "Test Strength Batch",
      shortName: "TSB",
      trainerIds: [testTrainerId1, testTrainerId2],
      daysPattern: "Mon, Wed, Fri",
      timingLabel: "06:00 AM - 07:00 AM",
      currentPax: 15,
      maxPax: 25,
      status: "Active",
    });

    // Create a completed session for today
    const today = new Date().toISOString().slice(0, 10);
    await Session.create({
      id: testSessionId,
      batchId: testBatchId,
      batchName: "Test Strength Batch",
      className: "Barbell Cleans",
      classNumber: 1,
      coachId: testTrainerId1,
      coachName: "Dolliee Ellens",
      sessionDate: today,
      startTime: "06:00 AM",
      endTime: "07:00 AM",
      timing: "06:00 AM - 07:00 AM",
      status: "COMPLETED",
    });

    // Create an old session (45 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const oldDateStr = oldDate.toISOString().slice(0, 10);
    await Session.create({
      id: testOldSessionId,
      batchId: testBatchId,
      batchName: "Test Strength Batch",
      className: "Old Deadlifts",
      classNumber: 2,
      coachId: testTrainerId1,
      coachName: "Dolliee Ellens",
      sessionDate: oldDateStr,
      startTime: "06:00 AM",
      endTime: "07:00 AM",
      timing: "06:00 AM - 07:00 AM",
      status: "COMPLETED",
    });
  });

  afterAll(async () => {
    await Batch.deleteOne({ id: testBatchId });
    await Session.deleteMany({ id: { $in: [testSessionId, testOldSessionId] } });
    await SessionNote.deleteMany({ sessionId: { $in: [testSessionId, testOldSessionId] } });
    await disconnectDB();
  });

  test("Members cannot access session notes (403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/v1/session-notes")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  test("Trainer 1 can submit session notes for their own completed class", async () => {
    const res = await request(app)
      .post("/api/v1/session-notes")
      .set("Authorization", `Bearer ${trainer1Token}`)
      .send({
        sessionId: testSessionId,
        trainerId: testTrainerId1,
        sessionSummary: "High intensity, all 15 athletes hit target weights.",
        memberPerformance: "Excellent form on power cleans.",
        observations: "One athlete reported slight wrist fatigue.",
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainerId).toBe(testTrainerId1);
    expect(res.body.data.sessionSummary).toBe("High intensity, all 15 athletes hit target weights.");
    expect(res.body.data.status).toBe("SUBMITTED");
  });

  test("Trainer 1 cannot submit notes on behalf of Trainer 2", async () => {
    const res = await request(app)
      .post("/api/v1/session-notes")
      .set("Authorization", `Bearer ${trainer1Token}`)
      .send({
        sessionId: testSessionId,
        trainerId: testTrainerId2,
        sessionSummary: "Sneaky attempt to edit coach 2 notes",
      });

    expect(res.status).toBe(403);
  });

  test("Trainer 2 can independently submit their own notes for the same session", async () => {
    const res = await request(app)
      .post("/api/v1/session-notes")
      .set("Authorization", `Bearer ${trainer2Token}`)
      .send({
        sessionId: testSessionId,
        trainerId: testTrainerId2,
        sessionSummary: "Assisted with mobility and warmup drills.",
        memberPerformance: "Solid recovery pacing.",
        observations: "Floor chalk needed refilling.",
        followUpRequired: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainerId).toBe(testTrainerId2);
    expect(res.body.data.followUpRequired).toBe(true);
  });

  test("Trainer 1 cannot edit notes after 30-day deadline has expired", async () => {
    const res = await request(app)
      .post("/api/v1/session-notes")
      .set("Authorization", `Bearer ${trainer1Token}`)
      .send({
        sessionId: testOldSessionId,
        trainerId: testTrainerId1,
        sessionSummary: "Trying to edit 45 days late",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/30 days/i);
  });

  test("Admin can edit notes even after 30 days (Admin override)", async () => {
    const res = await request(app)
      .post("/api/v1/session-notes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sessionId: testOldSessionId,
        trainerId: testTrainerId1,
        sessionSummary: "Admin retroactive audit note approved.",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionSummary).toBe("Admin retroactive audit note approved.");
  });

  test("Admin daily overview returns both trainers with their submission status", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .get(`/api/v1/session-notes/daily?date=${today}&batchId=${testBatchId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const matchSession = res.body.data.find((s) => s.sessionId === testSessionId);
    expect(matchSession).toBeDefined();
    expect(matchSession.assignedTrainers.length).toBe(2);

    const t1 = matchSession.assignedTrainers.find((t) => t.trainerId === testTrainerId1);
    expect(t1.status).toBe("Submitted");
    expect(t1.note).toBeDefined();
    expect(t1.note.sessionSummary).toContain("High intensity");

    const t2 = matchSession.assignedTrainers.find((t) => t.trainerId === testTrainerId2);
    expect(t2.status).toBe("Submitted");
    expect(t2.note.followUpRequired).toBe(true);
  });
});
