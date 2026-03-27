import type { Project, KnowledgeFile } from "@claude-copy/shared";
import { ProjectStorage } from "./storage.js";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";

export class ProjectService {
  constructor(private storage: ProjectStorage) {}

  async create(dataDir: string, params: { name: string; description?: string }): Promise<Project> {
    const id = `proj_${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const project: Project = {
      id, name: params.name, description: params.description ?? "",
      conversationIds: [], knowledgeFiles: [], localPaths: [],
      defaultModel: "claude-sonnet-4-6", createdAt: now, updatedAt: now,
    };
    await this.storage.create(dataDir, project);
    return project;
  }

  async get(dataDir: string, projId: string): Promise<Project | null> {
    return this.storage.getMeta(dataDir, projId);
  }

  async list(dataDir: string): Promise<Project[]> {
    return this.storage.list(dataDir);
  }

  async update(dataDir: string, projId: string, updates: Partial<Pick<Project, "name" | "description" | "defaultModel">>): Promise<Project> {
    const project = await this.storage.getMeta(dataDir, projId);
    if (!project) throw new Error("Project not found");
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.defaultModel !== undefined) project.defaultModel = updates.defaultModel;
    await this.storage.saveMeta(dataDir, projId, project);
    return project;
  }

  async remove(dataDir: string, projId: string): Promise<void> {
    await this.storage.remove(dataDir, projId);
  }

  async getInstructions(dataDir: string, projId: string): Promise<string> {
    return this.storage.getInstructions(dataDir, projId);
  }

  async saveInstructions(dataDir: string, projId: string, content: string): Promise<void> {
    await this.storage.saveInstructions(dataDir, projId, content);
  }

  async addLocalPath(dataDir: string, projId: string, localPath: string): Promise<Project> {
    const project = await this.storage.getMeta(dataDir, projId);
    if (!project) throw new Error("Project not found");
    if (!project.localPaths.includes(localPath)) {
      project.localPaths.push(localPath);
      await this.storage.saveMeta(dataDir, projId, project);
    }
    return project;
  }

  async removeLocalPath(dataDir: string, projId: string, localPath: string): Promise<Project> {
    const project = await this.storage.getMeta(dataDir, projId);
    if (!project) throw new Error("Project not found");
    project.localPaths = project.localPaths.filter((p) => p !== localPath);
    await this.storage.saveMeta(dataDir, projId, project);
    return project;
  }

  async addKnowledgeFile(dataDir: string, projId: string, file: { name: string; buffer: Buffer }): Promise<KnowledgeFile> {
    const project = await this.storage.getMeta(dataDir, projId);
    if (!project) throw new Error("Project not found");
    const fileId = `kf_${uuid().slice(0, 8)}`;
    const ext = path.extname(file.name);
    const dest = path.join(this.storage.getKnowledgeDir(dataDir, projId), `${fileId}${ext}`);
    await fs.writeFile(dest, file.buffer);
    const kf: KnowledgeFile = { id: fileId, name: file.name, size: file.buffer.length, addedAt: new Date().toISOString() };
    project.knowledgeFiles.push(kf);
    await this.storage.saveMeta(dataDir, projId, project);
    return kf;
  }

  async removeKnowledgeFile(dataDir: string, projId: string, fileId: string): Promise<void> {
    const project = await this.storage.getMeta(dataDir, projId);
    if (!project) throw new Error("Project not found");
    const kf = project.knowledgeFiles.find((f) => f.id === fileId);
    if (kf) {
      const ext = path.extname(kf.name);
      const filePath = path.join(this.storage.getKnowledgeDir(dataDir, projId), `${fileId}${ext}`);
      await fs.rm(filePath, { force: true });
    }
    project.knowledgeFiles = project.knowledgeFiles.filter((f) => f.id !== fileId);
    await this.storage.saveMeta(dataDir, projId, project);
  }
}
