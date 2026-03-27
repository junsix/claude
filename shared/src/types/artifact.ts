import type { ArtifactId, ConversationId, MessageId, Timestamped } from "./common.js";

export type ArtifactType = "react" | "html" | "svg" | "mermaid" | "markdown" | "code";

export interface Artifact extends Timestamped {
  id: ArtifactId;
  title: string;
  type: ArtifactType;
  language: string;
  conversationId: ConversationId;
  messageId: MessageId;
  currentVersion: number;
}
