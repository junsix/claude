import type { Artifact, ArtifactType } from "@claude-copy/shared";
import { ArtifactStorage } from "./storage.js";
import { v4 as uuid } from "uuid";

export class ArtifactService {
  constructor(private storage: ArtifactStorage) {}

  async create(dataDir: string, params: {
    title: string; type: ArtifactType; language: string;
    content: string; conversationId: string; messageId: string;
  }): Promise<Artifact> {
    const id = `art_${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const artifact: Artifact = {
      id, title: params.title, type: params.type, language: params.language,
      conversationId: params.conversationId, messageId: params.messageId,
      currentVersion: 1, createdAt: now, updatedAt: now,
    };
    await this.storage.create(dataDir, artifact, params.content);
    return artifact;
  }

  async get(dataDir: string, artId: string): Promise<{ artifact: Artifact; content: string } | null> {
    const artifact = await this.storage.getMeta(dataDir, artId);
    if (!artifact) return null;
    const content = await this.storage.getContent(dataDir, artId, artifact);
    return { artifact, content };
  }

  async getVersion(dataDir: string, artId: string, version: number): Promise<string | null> {
    const artifact = await this.storage.getMeta(dataDir, artId);
    if (!artifact) return null;
    if (version === artifact.currentVersion) return this.storage.getContent(dataDir, artId, artifact);
    return this.storage.getVersion(dataDir, artId, artifact, version);
  }

  async remove(dataDir: string, artId: string): Promise<void> {
    await this.storage.remove(dataDir, artId);
  }
}
