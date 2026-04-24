// Auth has no DB — the router handles everything inline with bcrypt + jwt.
// No vi.mock needed. We use the real bcrypt and jwt with test credentials
// from setup.ts. bcrypt.hashSync runs at module load time with ADMIN_PASSWORD,
// so the hash will be of 'test-password-12345' from setup.ts.
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../app";
import { adminCookie } from "./helpers/auth";

const app = createApp();

// Must match process.env.ADMIN_PASSWORD set in setup.ts
const CORRECT_PASSWORD = "test-password-12345";

describe("Auth routes", () => {
  describe("POST /api/auth/login", () => {
    it("returns 200, user body, and a Set-Cookie header on correct password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: CORRECT_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("admin");
      // Set-Cookie header proves the httpOnly JWT cookie was attached
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 401 on wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid password");
    });

    it("returns 400 when password field is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 204 and clears the cookie", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(204);
      // Set-Cookie with max-age=0 or expires in the past means the cookie is cleared
      const setCookie = res.headers["set-cookie"]?.[0] ?? "";
      expect(setCookie).toMatch(/token=/);
      expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 200 with valid JWT cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("admin");
    });

    it("returns 401 with no cookie", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("returns 401 with an invalid token string", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "token=not.a.valid.jwt");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  });
});
