import { describe, it, expect, afterEach } from "vitest";
import { FileStore } from "../file-store.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-filestore");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("FileStore", () => {
  it("creates and reads an entity", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "test" });
    const result = await store.load("items", "item_1");
    expect(result).toEqual({ name: "test" });
  });

  it("lists entities in a collection", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "a" });
    await store.save("items", "item_2", { name: "b" });
    const ids = await store.list("items");
    expect(ids.sort()).toEqual(["item_1", "item_2"]);
  });

  it("deletes an entity", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "test" });
    await store.remove("items", "item_1");
    const result = await store.load("items", "item_1");
    expect(result).toBeNull();
  });

  it("returns null for missing entity", async () => {
    const store = new FileStore(TEST_DIR);
    const result = await store.load("items", "missing");
    expect(result).toBeNull();
  });
});
