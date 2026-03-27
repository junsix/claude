import { create } from "zustand";
import type { ConversationMeta } from "@claude-copy/shared";
import { apiFetch } from "../../lib/api-client.js";

interface SidebarStore {
  conversations: ConversationMeta[];
  searchQuery: string;
  searchResults: ConversationMeta[];
  collapsed: boolean;
  loading: boolean;

  loadConversations: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  toggleCollapsed: () => void;
  createConversation: (model: string, style: string) => Promise<ConversationMeta>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversation: (id: string, updates: { title?: string; starred?: boolean }) => Promise<void>;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  conversations: [],
  searchQuery: "",
  searchResults: [],
  collapsed: false,
  loading: false,

  loadConversations: async () => {
    set({ loading: true });
    const result = await apiFetch<{ data: ConversationMeta[]; nextCursor: string | null }>("/conversations?limit=50");
    set({ conversations: result.data, loading: false });
  },

  search: async (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) { set({ searchResults: [] }); return; }
    const result = await apiFetch<{ data: ConversationMeta[] }>(`/conversations/search?q=${encodeURIComponent(query)}`);
    set({ searchResults: result.data });
  },

  clearSearch: () => set({ searchQuery: "", searchResults: [] }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

  createConversation: async (model: string, style: string) => {
    const conv = await apiFetch<ConversationMeta>("/conversations", {
      method: "POST",
      body: JSON.stringify({ model, style }),
    });
    await get().loadConversations();
    return conv;
  },

  deleteConversation: async (id: string) => {
    await apiFetch(`/conversations/${id}`, { method: "DELETE" });
    await get().loadConversations();
  },

  updateConversation: async (id: string, updates: { title?: string; starred?: boolean }) => {
    await apiFetch(`/conversations/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    await get().loadConversations();
  },
}));
