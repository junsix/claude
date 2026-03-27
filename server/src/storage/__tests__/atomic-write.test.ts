import { describe, it, expect, afterEach } from "vitest";
import { atomicWrite, readJson } from "../atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-atomic");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("atomicWrite", () => {
  it("writes JSON to file atomically", async () => {
    const filePath = path.join(TEST_DIR, "test.json");
    await atomicWrite(filePath, { hello: "world" });
    const content = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(content).toEqual({ hello: "world" });
  });

  it("creates parent directories if missing", async () => {
    const filePath = path.join(TEST_DIR, "deep", "nested", "test.json");
    await atomicWrite(filePath, { nested: true });
    const content = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(content).toEqual({ nested: true });
  });

  it("does not leave temp files on success", async () => {
    const filePath = path.join(TEST_DIR, "clean.json");
    await atomicWrite(filePath, { clean: true });
    const files = await fs.readdir(TEST_DIR);
    expect(files).toEqual(["clean.json"]);
  });
});

describe("readJson", () => {
  it("reads and parses JSON file", async () => {
    const filePath = path.join(TEST_DIR, "read.json");
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ foo: "bar" }));
    const result = await readJson(filePath);
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null for missing file", async () => {
    const result = await readJson(path.join(TEST_DIR, "missing.json"));
    expect(result).toBeNull();
  });
});
