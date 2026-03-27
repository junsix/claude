import type { ConversationMeta, Message, ConversationId, MessageId } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

export class ConversationStorage {
  private convDir(dataDir: string, convId: ConversationId): string {
    return path.join(dataDir, "conversations", convId);
  }

  async createConversation(dataDir: string, params: { model: string; style: string; projectId?: string }): Promise<ConversationMeta> {
    const id = `conv_${uuid().slice(0, 8)}` as ConversationId;
    const now = new Date().toISOString();
    const meta: ConversationMeta = {
      id, title: "New Conversation",
      projectId: params.projectId ?? null,
      model: params.model, style: params.style, starred: false,
      createdAt: now, updatedAt: now,
      sessions: {}, activeBranchTip: "" as MessageId,
      usage: { totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0, messageCount: 0 },
    };

    const dir = this.convDir(dataDir, id);
    await fs.mkdir(path.join(dir, "attachments"), { recursive: true });
    await atomicWrite(path.join(dir, "meta.json"), meta);
    await atomicWrite(path.join(dir, "messages.json"), []);
    return meta;
  }

  async getMeta(dataDir: string, convId: ConversationId): Promise<ConversationMeta | null> {
    return readJson<ConversationMeta>(path.join(this.convDir(dataDir, convId), "meta.json"));
  }

  async saveMeta(dataDir: string, convId: ConversationId, meta: ConversationMeta): Promise<void> {
    meta.updatedAt = new Date().toISOString();
    await atomicWrite(path.join(this.convDir(dataDir, convId), "meta.json"), meta);
  }

  async getMessages(dataDir: string, convId: ConversationId): Promise<Message[]> {
    return (await readJson<Message[]>(path.join(this.convDir(dataDir, convId), "messages.json"))) ?? [];
  }

  async addMessage(dataDir: string, convId: ConversationId, message: Message): Promise<void> {
    const messages = await this.getMessages(dataDir, convId);
    messages.push(message);
    await atomicWrite(path.join(this.convDir(dataDir, convId), "messages.json"), messages);
  }

  async listConversations(dataDir: string): Promise<ConversationMeta[]> {
    const dir = path.join(dataDir, "conversations");
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const metas: ConversationMeta[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const meta = await this.getMeta(dataDir, entry.name as ConversationId);
        if (meta) metas.push(meta);
      }
      return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async deleteConversation(dataDir: string, convId: ConversationId): Promise<void> {
    await fs.rm(this.convDir(dataDir, convId), { recursive: true, force: true });
  }
}
