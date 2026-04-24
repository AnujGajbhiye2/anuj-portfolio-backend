import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApp } from "../app";
import { adminCookie } from "./helpers/auth";
import { makeContact } from "./helpers/factories";
import * as contactRepo from "../modules/contact/contact.repository";

vi.mock("../modules/contact/contact.repository", () => ({
  insertContact: vi.fn(),
  listContacts: vi.fn(),
  countContacts: vi.fn(),
}));

const app = createApp();

const validBody = {
  name: "Jane Doe",
  email: "jane@example.com",
  message: "This is a test message long enough to pass validation",
};

describe("Contact routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Public: submit contact form ───────────────────────────────────────────

  describe("POST /api/contact", () => {
    it("returns 201 with id on valid submission", async () => {
      vi.mocked(contactRepo.insertContact).mockResolvedValueOnce(
        makeContact({ id: 42 }),
      );

      const res = await request(app).post("/api/contact").send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBe(42);
    });

    it("returns 400 when name is too short (min 2 chars)", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ ...validBody, name: "J" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.issues.name).toBeDefined();
    });

    it("returns 400 on invalid email", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ ...validBody, email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.issues.email).toBeDefined();
    });

    it("returns 400 when message is too short (min 10 chars)", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ ...validBody, message: "short" });

      expect(res.status).toBe(400);
      expect(res.body.issues.message).toBeDefined();
    });

    it("returns 400 when all fields are missing", async () => {
      const res = await request(app).post("/api/contact").send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Admin: list submissions ───────────────────────────────────────────────

  describe("GET /api/contact", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/contact");
      expect(res.status).toBe(401);
    });

    it("returns 200 with submissions and total when authed", async () => {
      vi.mocked(contactRepo.listContacts).mockResolvedValueOnce([
        makeContact(),
      ]);
      vi.mocked(contactRepo.countContacts).mockResolvedValueOnce(1);

      const res = await request(app)
        .get("/api/contact")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it("respects limit and offset query params", async () => {
      vi.mocked(contactRepo.listContacts).mockResolvedValueOnce([]);
      vi.mocked(contactRepo.countContacts).mockResolvedValueOnce(0);

      const res = await request(app)
        .get("/api/contact?limit=10&offset=20")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(10);
      expect(res.body.offset).toBe(20);
      // Verify the repository was called with the parsed params
      expect(contactRepo.listContacts).toHaveBeenCalledWith(10, 20);
    });

    it("caps limit at 100 regardless of query param", async () => {
      vi.mocked(contactRepo.listContacts).mockResolvedValueOnce([]);
      vi.mocked(contactRepo.countContacts).mockResolvedValueOnce(0);

      await request(app)
        .get("/api/contact?limit=999")
        .set("Cookie", adminCookie());

      // handler does Math.min(Number(limit) || 50, 100) so 999 becomes 100
      expect(contactRepo.listContacts).toHaveBeenCalledWith(100, 0);
    });
  });
});
