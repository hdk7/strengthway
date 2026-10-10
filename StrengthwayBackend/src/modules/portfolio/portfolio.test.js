"use strict";

jest.setTimeout(30000);

const request = require("supertest");
const { connectDB, disconnectDB } = require("../../config/database");
const app = require("../../app");
const PortfolioItem = require("./portfolio.model");
const {
  PORTFOLIO_CATEGORY,
  PORTFOLIO_STATUS,
  PORTFOLIO_ASPECT_RATIO,
} = require("../../shared/constants");

describe("Portfolio Module Integration Suite", () => {
  const testItemId = `PORT-TEST-${Date.now().toString().slice(-4)}`;

  beforeAll(async () => {
    await connectDB();
    await PortfolioItem.deleteOne({ id: testItemId });
  });

  afterAll(async () => {
    await PortfolioItem.deleteOne({ id: testItemId });
    await disconnectDB();
  });

  // ── 1. GET /api/v1/portfolio/public
  test("GET /api/v1/portfolio/public — returns grouped portfolio categories with active items", async () => {
    const res = await request(app).get("/api/v1/portfolio/public");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.photos)).toBe(true);
    expect(Array.isArray(res.body.data.movementVideos)).toBe(true);
    expect(Array.isArray(res.body.data.sessionClips)).toBe(true);
    expect(Array.isArray(res.body.data.sessionDisciplines)).toBe(true);
    expect(Array.isArray(res.body.data.feedbackStories)).toBe(true);
    expect(Array.isArray(res.body.data.homepagePhotos)).toBe(true);
  });

  // ── 2. GET /api/v1/portfolio (Admin List & Stats)
  test("GET /api/v1/portfolio — returns paginated list with stats", async () => {
    const res = await request(app).get("/api/v1/portfolio");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.stats).toBeDefined();
    expect(typeof res.body.data.stats.total).toBe("number");
    expect(typeof res.body.data.stats.active).toBe("number");
  });

  // ── 3. POST /api/v1/portfolio — Create new item
  test("POST /api/v1/portfolio — creates a new portfolio item with valid payload", async () => {
    const payload = {
      id: testItemId,
      category: PORTFOLIO_CATEGORY.PHOTO,
      title: "Test Athletic Handstand Hold",
      description: "Athlete demonstrating straight line vertical handstand stabilization.",
      mediaUrl: "/assets/portfolio-photo-1.jpg",
      aspectRatio: PORTFOLIO_ASPECT_RATIO.FOUR_BY_FIVE,
      altText: "Test handstand hold on floor",
      featuredOnHome: true,
      displayOrder: 99,
      status: PORTFOLIO_STATUS.ACTIVE,
    };

    const res = await request(app).post("/api/v1/portfolio").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testItemId);
    expect(res.body.data.title).toBe("Test Athletic Handstand Hold");
    expect(res.body.data.category).toBe(PORTFOLIO_CATEGORY.PHOTO);
    expect(res.body.data.featuredOnHome).toBe(true);
  });

  // ── 4. Validation: Missing title or mediaUrl (422)
  test("POST /api/v1/portfolio — rejects payload missing required fields with 422", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio")
      .send({ category: PORTFOLIO_CATEGORY.PHOTO });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  // ── 5. GET /api/v1/portfolio/:id
  test("GET /api/v1/portfolio/:id — retrieves specific portfolio item", async () => {
    const res = await request(app).get(`/api/v1/portfolio/${testItemId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testItemId);
  });

  // ── 6. PUT /api/v1/portfolio/:id — Update item
  test("PUT /api/v1/portfolio/:id — updates portfolio item", async () => {
    const res = await request(app)
      .put(`/api/v1/portfolio/${testItemId}`)
      .send({
        title: "Updated Handstand Hold",
        featuredOnHome: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Handstand Hold");
    expect(res.body.data.featuredOnHome).toBe(false);
  });

  // ── 7. PATCH /api/v1/portfolio/:id/toggle-status
  test("PATCH /api/v1/portfolio/:id/toggle-status — toggles status between Active and Draft", async () => {
    const res1 = await request(app).patch(`/api/v1/portfolio/${testItemId}/toggle-status`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.status).toBe(PORTFOLIO_STATUS.DRAFT);

    const res2 = await request(app).patch(`/api/v1/portfolio/${testItemId}/toggle-status`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBe(PORTFOLIO_STATUS.ACTIVE);
  });

  // ── 8. PATCH /api/v1/portfolio/reorder
  test("PATCH /api/v1/portfolio/reorder — batch reorders items", async () => {
    const res = await request(app)
      .patch("/api/v1/portfolio/reorder")
      .send({
        items: [{ id: testItemId, displayOrder: 15 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await request(app).get(`/api/v1/portfolio/${testItemId}`);
    expect(check.body.data.displayOrder).toBe(15);
  });

  // ── 9. PATCH /api/v1/portfolio/:id/soft-delete
  test("PATCH /api/v1/portfolio/:id/soft-delete — soft deletes item", async () => {
    const res = await request(app).patch(`/api/v1/portfolio/${testItemId}/soft-delete`);
    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(true);
    expect(res.body.data.deletedAt).toBeDefined();
  });

  // ── 10. PATCH /api/v1/portfolio/:id/restore
  test("PATCH /api/v1/portfolio/:id/restore — restores soft-deleted item", async () => {
    const res = await request(app).patch(`/api/v1/portfolio/${testItemId}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(false);
    expect(res.body.data.deletedAt).toBeNull();
  });

  // ── 11. DELETE /api/v1/portfolio/:id/permanent
  test("DELETE /api/v1/portfolio/:id/permanent — permanently deletes item", async () => {
    const res = await request(app).delete(`/api/v1/portfolio/${testItemId}/permanent`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/v1/portfolio/${testItemId}`);
    expect(check.status).toBe(404);
  });
});
