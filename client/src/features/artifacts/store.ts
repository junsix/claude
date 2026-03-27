import { create } from "zustand";
import type { Artifact } from "@claude-copy/shared";
import { apiFetch } from "../../lib/api-client.js";

interface ArtifactStore {
  panelOpen: boolean;
  activeArtifact: Artifact | null;
  activeContent: string;
  activeTab: "preview" | "code";
  togglePanel: () => void;
  openArtifact: (artifactId: string) => Promise<void>;
  closePanel: () => void;
  setTab: (tab: "preview" | "code") => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  panelOpen: false,
  activeArtifact: null,
  activeContent: "",
  activeTab: "preview",

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  closePanel: () => set({ panelOpen: false, activeArtifact: null, activeContent: "" }),
  setTab: (tab) => set({ activeTab: tab }),

  openArtifact: async (artifactId: string) => {
    const result = await apiFetch<{ artifact: Artifact; content: string }>(`/artifacts/${artifactId}`);
    set({ activeArtifact: result.artifact, activeContent: result.content, panelOpen: true, activeTab: "preview" });
  },
}));
