import type { MemoryEntry, CustomStyle, AppSettings } from "@claude-copy/shared";
import { DEFAULT_SETTINGS } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class SettingsStorage {
  async getAppSettings(dataDir: string): Promise<AppSettings> {
    const settingsPath = path.join(dataDir, "..", "..", "settings.json");
    return (await readJson<AppSettings>(settingsPath)) ?? { ...DEFAULT_SETTINGS };
  }

  async saveAppSettings(dataDir: string, settings: AppSettings): Promise<void> {
    const settingsPath = path.join(dataDir, "..", "..", "settings.json");
    await atomicWrite(settingsPath, settings);
  }

  async listMemories(dataDir: string): Promise<MemoryEntry[]> {
    const dir = path.join(dataDir, "memory", "entries");
    try {
      const files = await fs.readdir(dir);
      const entries: MemoryEntry[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const entry = await readJson<MemoryEntry>(path.join(dir, file));
        if (entry) entries.push(entry);
      }
      return entries;
    } catch { return []; }
  }

  async saveMemory(dataDir: string, entry: MemoryEntry): Promise<void> {
    const dir = path.join(dataDir, "memory", "entries");
    await fs.mkdir(dir, { recursive: true });
    await atomicWrite(path.join(dir, `${entry.id}.json`), entry);
  }

  async deleteMemory(dataDir: string, memoryId: string): Promise<void> {
    const filePath = path.join(dataDir, "memory", "entries", `${memoryId}.json`);
    await fs.rm(filePath, { force: true });
  }

  async listStyles(dataDir: string): Promise<CustomStyle[]> {
    const dir = path.join(dataDir, "styles");
    try {
      const files = await fs.readdir(dir);
      const styles: CustomStyle[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const style = await readJson<CustomStyle>(path.join(dir, file));
        if (style) styles.push(style);
      }
      return styles;
    } catch { return []; }
  }

  async saveStyle(dataDir: string, style: CustomStyle): Promise<void> {
    const dir = path.join(dataDir, "styles");
    await fs.mkdir(dir, { recursive: true });
    await atomicWrite(path.join(dir, `${style.id}.json`), style);
  }

  async deleteStyle(dataDir: string, styleId: string): Promise<void> {
    const filePath = path.join(dataDir, "styles", `${styleId}.json`);
    await fs.rm(filePath, { force: true });
  }
}
