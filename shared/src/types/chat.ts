import type { ConversationId, ProjectId, MessageId, Timestamped } from "./common.js";
import type { ContentBlock } from "./content.js";

export interface SessionInfo {
  branchTip: MessageId;
  createdAt: string;
}

export interface ConversationUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  messageCount: number;
}

export interface ConversationMeta extends Timestamped {
  id: ConversationId;
  title: string;
  projectId: ProjectId | null;
  model: string;
  style: string;
  starred: boolean;
  sessions: Record<string, SessionInfo>;
  activeBranchTip: MessageId;
  usage: ConversationUsage;
}

export interface Message {
  id: MessageId;
  parentId: MessageId | null;
  role: "user" | "assistant";
  content: ContentBlock[];
  attachments: string[];
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
  sdkMessageUuid?: string;
  createdAt: string;
}
