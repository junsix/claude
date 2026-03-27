import type { ContentBlock } from "./content.js";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ChatSSEEvent =
  | { type: "user_saved"; messageId: string }
  | { type: "thinking"; text: string }
  | { type: "assistant_chunk"; text: string }
  | { type: "assistant_done"; messageId: string; artifactIds: string[] }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number; costUsd: number } }
  | { type: "error"; code: string; message: string; retryAfter?: number };

export interface SendMessageRequest {
  content: ContentBlock[];
  parentId?: string;
  model?: string;
  style?: string;
  attachments?: string[];
}

export interface RetryRequest {
  model?: string;
}

export interface EditMessageRequest {
  content: ContentBlock[];
  model?: string;
  style?: string;
}
