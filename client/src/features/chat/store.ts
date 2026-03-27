import { create } from "zustand";
import type { ConversationMeta, Message } from "@claude-copy/shared";
import { apiFetch } from "../../lib/api-client.js";

interface ChatStore {
  meta: ConversationMeta | null;
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  activeBranchTip: string;

  loadConversation: (id: string) => Promise<void>;
  setStreaming: (streaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
  addMessage: (msg: Message) => void;
  setActiveBranchTip: (tip: string) => void;
  updateMeta: (updates: Partial<ConversationMeta>) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  meta: null,
  messages: [],
  isStreaming: false,
  streamingText: "",
  activeBranchTip: "",

  loadConversation: async (id: string) => {
    const data = await apiFetch<{ meta: ConversationMeta; messages: Message[] }>(`/conversations/${id}`);
    set({ meta: data.meta, messages: data.messages, activeBranchTip: data.meta.activeBranchTip });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  appendStreamingText: (text) => set((s) => ({ streamingText: s.streamingText + text })),
  clearStreamingText: () => set({ streamingText: "" }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setActiveBranchTip: (tip) => set({ activeBranchTip: tip }),
  updateMeta: (updates) => set((s) => ({ meta: s.meta ? { ...s.meta, ...updates } : null })),
}));
