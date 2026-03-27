import type { Message, ConversationMeta, MessageId } from "@claude-copy/shared";

export function getActivePath(messages: Message[], leafId: MessageId): Message[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const path: Message[] = [];
  let current = byId.get(leafId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function getSiblings(messages: Message[], messageId: MessageId): Message[] {
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) return [];
  return messages.filter((m) => m.parentId === msg.parentId);
}

export function getChildren(messages: Message[], messageId: MessageId): Message[] {
  return messages.filter((m) => m.parentId === messageId);
}

export function findSessionForBranchTip(meta: ConversationMeta, branchTip: MessageId): string | null {
  for (const [sessionId, info] of Object.entries(meta.sessions)) {
    if (info.branchTip === branchTip) return sessionId;
  }
  return null;
}
