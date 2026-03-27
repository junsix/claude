import type { ConversationMeta } from "@claude-copy/shared";
import { ConversationStorage } from "../chat/storage.js";

export class ConversationManagementService {
  constructor(private storage: ConversationStorage) {}

  async list(dataDir: string, params: { limit?: number; cursor?: string }): Promise<{ data: ConversationMeta[]; nextCursor: string | null }> {
    const all = await this.storage.listConversations(dataDir);
    const limit = params.limit ?? 20;
    let startIdx = 0;
    if (params.cursor) {
      startIdx = all.findIndex((c) => c.id === params.cursor) + 1;
    }
    const data = all.slice(startIdx, startIdx + limit);
    const nextCursor = startIdx + limit < all.length ? data[data.length - 1]?.id ?? null : null;
    return { data, nextCursor };
  }

  async search(dataDir: string, query: string): Promise<ConversationMeta[]> {
    const all = await this.storage.listConversations(dataDir);
    const q = query.toLowerCase();
    return all.filter((c) => c.title.toLowerCase().includes(q));
  }

  async create(dataDir: string, params: { model: string; style: string; projectId?: string }): Promise<ConversationMeta> {
    return this.storage.createConversation(dataDir, params);
  }

  async update(dataDir: string, convId: string, updates: Partial<Pick<ConversationMeta, "title" | "starred" | "projectId" | "model" | "style">>): Promise<ConversationMeta> {
    const meta = await this.storage.getMeta(dataDir, convId);
    if (!meta) throw new Error("Conversation not found");
    if (updates.title !== undefined) meta.title = updates.title;
    if (updates.starred !== undefined) meta.starred = updates.starred;
    if (updates.projectId !== undefined) meta.projectId = updates.projectId;
    if (updates.model !== undefined) meta.model = updates.model;
    if (updates.style !== undefined) meta.style = updates.style;
    await this.storage.saveMeta(dataDir, convId, meta);
    return meta;
  }

  async remove(dataDir: string, convId: string): Promise<void> {
    await this.storage.deleteConversation(dataDir, convId);
  }

  async duplicate(dataDir: string, convId: string): Promise<ConversationMeta> {
    const meta = await this.storage.getMeta(dataDir, convId);
    if (!meta) throw new Error("Conversation not found");
    const messages = await this.storage.getMessages(dataDir, convId);
    const newConv = await this.storage.createConversation(dataDir, { model: meta.model, style: meta.style, projectId: meta.projectId ?? undefined });
    for (const msg of messages) {
      await this.storage.addMessage(dataDir, newConv.id, msg);
    }
    newConv.title = `${meta.title} (copy)`;
    await this.storage.saveMeta(dataDir, newConv.id, newConv);
    return newConv;
  }
}
