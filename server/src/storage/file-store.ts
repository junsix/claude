import { atomicWrite, readJson } from "./atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class FileStore {
  constructor(private baseDir: string) {}

  private entityDir(collection: string, id: string): string {
    return path.join(this.baseDir, collection, id);
  }

  private metaPath(collection: string, id: string): string {
    return path.join(this.entityDir(collection, id), "meta.json");
  }

  async save(collection: string, id: string, data: unknown): Promise<void> {
    await atomicWrite(this.metaPath(collection, id), data);
  }

  async load<T = unknown>(collection: string, id: string): Promise<T | null> {
    return readJson<T>(this.metaPath(collection, id));
  }

  async list(collection: string): Promise<string[]> {
    const dir = path.join(this.baseDir, collection);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async remove(collection: string, id: string): Promise<void> {
    const dir = this.entityDir(collection, id);
    await fs.rm(dir, { recursive: true, force: true });
  }

  getEntityDir(collection: string, id: string): string {
    return this.entityDir(collection, id);
  }
}
