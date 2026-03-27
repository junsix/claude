import type { ProjectId, ConversationId, Timestamped } from "./common.js";

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  addedAt: string;
}

export interface Project extends Timestamped {
  id: ProjectId;
  name: string;
  description: string;
  conversationIds: ConversationId[];
  knowledgeFiles: KnowledgeFile[];
  localPaths: string[];
  defaultModel: string;
}
