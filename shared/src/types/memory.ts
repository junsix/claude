import type { MemoryId, ConversationId } from "./common.js";

export type MemoryCategory = "preference" | "fact" | "context";

export interface MemoryEntry {
  id: MemoryId;
  content: string;
  category: MemoryCategory;
  source: {
    conversationId: ConversationId;
    extractedAt: string;
  };
  active: boolean;
}
