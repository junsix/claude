import { useMemo, useCallback } from "react";
import type { Message } from "@claude-copy/shared";
import { useChatStore } from "./store.js";

export function useBranch() {
  const { messages, activeBranchTip, setActiveBranchTip } = useChatStore();

  const activePath = useMemo(() => {
    if (!activeBranchTip || messages.length === 0) return [];
    const byId = new Map(messages.map((m) => [m.id, m]));
    const path: Message[] = [];
    let current = byId.get(activeBranchTip);
    while (current) {
      path.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return path;
  }, [messages, activeBranchTip]);

  const getSiblings = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return [];
      return messages.filter((m) => m.parentId === msg.parentId);
    },
    [messages],
  );

  const switchBranch = useCallback(
    (messageId: string, direction: "prev" | "next") => {
      const siblings = getSiblings(messageId);
      const idx = siblings.findIndex((s) => s.id === messageId);
      const newIdx = direction === "prev" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= siblings.length) return;

      const newSibling = siblings[newIdx];
      let leaf = newSibling;
      let children = messages.filter((m) => m.parentId === leaf.id);
      while (children.length > 0) {
        leaf = children[children.length - 1];
        children = messages.filter((m) => m.parentId === leaf.id);
      }
      setActiveBranchTip(leaf.id);
    },
    [messages, getSiblings, setActiveBranchTip],
  );

  return { activePath, getSiblings, switchBranch };
}
