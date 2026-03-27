import type { MemoryEntry, CustomStyle, AppSettings } from "@claude-copy/shared";
import { SettingsStorage } from "./storage.js";
import { v4 as uuid } from "uuid";

export class SettingsService {
  constructor(private storage: SettingsStorage) {}

  async getSettings(dataDir: string): Promise<AppSettings> {
    return this.storage.getAppSettings(dataDir);
  }

  async updateSettings(dataDir: string, updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.storage.getAppSettings(dataDir);
    const updated = { ...current, ...updates };
    await this.storage.saveAppSettings(dataDir, updated);
    return updated;
  }

  async listMemories(dataDir: string): Promise<MemoryEntry[]> {
    return this.storage.listMemories(dataDir);
  }

  async updateMemory(dataDir: string, memoryId: string, updates: Partial<MemoryEntry>): Promise<void> {
    const memories = await this.storage.listMemories(dataDir);
    const mem = memories.find((m) => m.id === memoryId);
    if (!mem) throw new Error("Memory not found");
    Object.assign(mem, updates);
    await this.storage.saveMemory(dataDir, mem);
  }

  async deleteMemory(dataDir: string, memoryId: string): Promise<void> {
    await this.storage.deleteMemory(dataDir, memoryId);
  }

  async deleteAllMemories(dataDir: string): Promise<void> {
    const memories = await this.storage.listMemories(dataDir);
    for (const m of memories) {
      await this.storage.deleteMemory(dataDir, m.id);
    }
  }

  async listStyles(dataDir: string): Promise<CustomStyle[]> {
    return this.storage.listStyles(dataDir);
  }

  async createStyle(dataDir: string, params: { name: string; description: string; prompt: string }): Promise<CustomStyle> {
    const style: CustomStyle = {
      id: `style_${uuid().slice(0, 8)}`, name: params.name,
      description: params.description, prompt: params.prompt,
      sampleText: null, createdAt: new Date().toISOString(),
    };
    await this.storage.saveStyle(dataDir, style);
    return style;
  }

  async updateStyle(dataDir: string, styleId: string, updates: Partial<CustomStyle>): Promise<void> {
    const styles = await this.storage.listStyles(dataDir);
    const style = styles.find((s) => s.id === styleId);
    if (!style) throw new Error("Style not found");
    Object.assign(style, updates, { id: styleId });
    await this.storage.saveStyle(dataDir, style);
  }

  async deleteStyle(dataDir: string, styleId: string): Promise<void> {
    await this.storage.deleteStyle(dataDir, styleId);
  }
}
