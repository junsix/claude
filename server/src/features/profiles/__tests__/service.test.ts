import { describe, it, expect, afterEach } from "vitest";
import { ProfileService } from "../service.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-profiles");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("ProfileService", () => {
  it("initializes with a default profile if none exist", async () => {
    const svc = new ProfileService(TEST_DIR);
    const index = await svc.initialize();
    expect(index.profiles.length).toBe(1);
    expect(index.activeProfileId).toBe(index.profiles[0].id);
  });

  it("creates a new profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const profile = await svc.createProfile({ name: "Test Profile", avatar: "test" });
    expect(profile.name).toBe("Test Profile");
    const index = await svc.getIndex();
    expect(index.profiles.length).toBe(2);
  });

  it("gets profile by id", async () => {
    const svc = new ProfileService(TEST_DIR);
    const index = await svc.initialize();
    const profile = await svc.getProfile(index.profiles[0].id);
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("Default");
  });

  it("switches active profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const p2 = await svc.createProfile({ name: "Second", avatar: "2" });
    await svc.setActiveProfile(p2.id);
    const index = await svc.getIndex();
    expect(index.activeProfileId).toBe(p2.id);
  });

  it("deletes a profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const p2 = await svc.createProfile({ name: "ToDelete", avatar: "x" });
    await svc.deleteProfile(p2.id);
    const index = await svc.getIndex();
    expect(index.profiles.length).toBe(1);
  });
});
