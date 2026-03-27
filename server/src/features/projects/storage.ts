import type { Project } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class ProjectStorage {
  private projDir(dataDir: string, projId: string): string {
    return path.join(dataDir, "projects", projId);
  }

  async create(dataDir: string, project: Project): Promise<void> {
    const dir = this.projDir(dataDir, project.id);
    await fs.mkdir(path.join(dir, "knowledge"), { recursive: true });
    await atomicWrite(path.join(dir, "meta.json"), project);
    await fs.writeFile(path.join(dir, "instructions.md"), "", "utf-8");
  }

  async getMeta(dataDir: string, projId: string): Promise<Project | null> {
    return readJson<Project>(path.join(this.projDir(dataDir, projId), "meta.json"));
  }

  async saveMeta(dataDir: string, projId: string, project: Project): Promise<void> {
    project.updatedAt = new Date().toISOString();
    await atomicWrite(path.join(this.projDir(dataDir, projId), "meta.json"), project);
  }

  async getInstructions(dataDir: string, projId: string): Promise<string> {
    try {
      return await fs.readFile(path.join(this.projDir(dataDir, projId), "instructions.md"), "utf-8");
    } catch { return ""; }
  }

  async saveInstructions(dataDir: string, projId: string, content: string): Promise<void> {
    await fs.writeFile(path.join(this.projDir(dataDir, projId), "instructions.md"), content, "utf-8");
  }

  async list(dataDir: string): Promise<Project[]> {
    const dir = path.join(dataDir, "projects");
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const projects: Project[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const meta = await this.getMeta(dataDir, entry.name);
        if (meta) projects.push(meta);
      }
      return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async remove(dataDir: string, projId: string): Promise<void> {
    await fs.rm(this.projDir(dataDir, projId), { recursive: true, force: true });
  }

  getKnowledgeDir(dataDir: string, projId: string): string {
    return path.join(this.projDir(dataDir, projId), "knowledge");
  }
}
