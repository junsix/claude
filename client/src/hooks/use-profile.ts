import { create } from "zustand";
import type { ProfilesIndex, Profile } from "@claude-copy/shared";
import { apiFetch, setActiveProfileId } from "../lib/api-client.js";

interface ProfileStore {
  index: ProfilesIndex | null;
  activeProfile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  index: null,
  activeProfile: null,
  loading: true,

  initialize: async () => {
    const index = await apiFetch<ProfilesIndex>("/profiles");
    setActiveProfileId(index.activeProfileId);
    const profile = await apiFetch<Profile>(`/profiles/${index.activeProfileId}`);
    set({ index, activeProfile: profile, loading: false });
  },

  switchProfile: async (profileId: string) => {
    await apiFetch(`/profiles/active/${profileId}`, { method: "PUT" });
    setActiveProfileId(profileId);
    const profile = await apiFetch<Profile>(`/profiles/${profileId}`);
    const index = await apiFetch<ProfilesIndex>("/profiles");
    set({ index, activeProfile: profile });
  },
}));
