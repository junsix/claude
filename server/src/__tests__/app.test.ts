import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Express App", () => {
  const app = createApp({ dataDir: "./data-test" });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns 400 if X-Profile-Id header is missing on profile-required routes", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_PROFILE");
  });

  it("returns standard error format for 404", async () => {
    const res = await request(app)
      .get("/api/nonexistent")
      .set("X-Profile-Id", "prof_test");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
