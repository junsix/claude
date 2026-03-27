export type ConversationId = string;
export type ProjectId = string;
export type ArtifactId = string;
export type ProfileId = string;
export type MessageId = string;
export type FileId = string;
export type MemoryId = string;
export type StyleId = string;

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}
