import type { ProfilesIndex, Profile } from "@claude-copy/shared";
import { ProfileStorage } from "./storage.js";
import { v4 as uuid } from "uuid";

export class ProfileService {
  private storage: ProfileStorage;

  constructor(dataDir: string) {
    this.storage = new ProfileStorage(dataDir);
  }

  async initialize(): Promise<ProfilesIndex> {
    let index = await this.storage.readIndex();
    if (index && index.profiles.length > 0) return index;

    const defaultId = `prof_${uuid().slice(0, 8)}`;
    const defaultProfile: Profile = {
      id: defaultId, name: "Default", avatar: "default", role: "",
      expertise: [], language: "en", globalInstructions: "",
      defaults: { model: "claude-sonnet-4-6", style: "normal" },
    };

    index = {
      activeProfileId: defaultId,
      profiles: [{ id: defaultId, name: "Default", avatar: "default", createdAt: new Date().toISOString() }],
    };

    await this.storage.writeIndex(index);
    await this.storage.ensureProfileDirs(defaultId);
    await this.storage.writeProfile(defaultId, defaultProfile);
    return index;
  }

  async getIndex(): Promise<ProfilesIndex> {
    const index = await this.storage.readIndex();
    if (!index) return this.initialize();
    return index;
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return this.storage.readProfile(profileId);
  }

  async createProfile(params: { name: string; avatar: string }): Promise<Profile> {
    const id = `prof_${uuid().slice(0, 8)}`;
    const profile: Profile = {
      id, name: params.name, avatar: params.avatar, role: "",
      expertise: [], language: "en", globalInstructions: "",
      defaults: { model: "claude-sonnet-4-6", style: "normal" },
    };

    await this.storage.ensureProfileDirs(id);
    await this.storage.writeProfile(id, profile);

    const index = await this.getIndex();
    index.profiles.push({ id, name: params.name, avatar: params.avatar, createdAt: new Date().toISOString() });
    await this.storage.writeIndex(index);
    return profile;
  }

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const profile = await this.storage.readProfile(profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);
    const updated = { ...profile, ...updates, id: profileId };
    await this.storage.writeProfile(profileId, updated);

    const index = await this.getIndex();
    const entry = index.profiles.find((p) => p.id === profileId);
    if (entry && updates.name) entry.name = updates.name;
    if (entry && updates.avatar) entry.avatar = updates.avatar;
    await this.storage.writeIndex(index);
    return updated;
  }

  async setActiveProfile(profileId: string): Promise<void> {
    const index = await this.getIndex();
    if (!index.profiles.some((p) => p.id === profileId)) throw new Error(`Profile not found: ${profileId}`);
    index.activeProfileId = profileId;
    await this.storage.writeIndex(index);
  }

  async deleteProfile(profileId: string): Promise<void> {
    const index = await this.getIndex();
    if (index.profiles.length <= 1) throw new Error("Cannot delete the last profile");
    index.profiles = index.profiles.filter((p) => p.id !== profileId);
    if (index.activeProfileId === profileId) index.activeProfileId = index.profiles[0].id;
    await this.storage.writeIndex(index);
    await this.storage.removeProfile(profileId);
  }
}
