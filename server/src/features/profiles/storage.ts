import type { ProfilesIndex, Profile } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class ProfileStorage {
  private indexPath: string;

  constructor(private dataDir: string) {
    this.indexPath = path.join(dataDir, "profiles", "profiles.json");
  }

  async readIndex(): Promise<ProfilesIndex | null> {
    return readJson<ProfilesIndex>(this.indexPath);
  }

  async writeIndex(index: ProfilesIndex): Promise<void> {
    await atomicWrite(this.indexPath, index);
  }

  async readProfile(profileId: string): Promise<Profile | null> {
    const profilePath = path.join(this.dataDir, "profiles", profileId, "profile.json");
    return readJson<Profile>(profilePath);
  }

  async writeProfile(profileId: string, profile: Profile): Promise<void> {
    const profilePath = path.join(this.dataDir, "profiles", profileId, "profile.json");
    await atomicWrite(profilePath, profile);
  }

  async ensureProfileDirs(profileId: string): Promise<void> {
    const base = path.join(this.dataDir, "profiles", profileId);
    const dirs = ["conversations", "projects", "artifacts", "memory", "memory/entries", "styles", "uploads", "generated"];
    for (const dir of dirs) {
      await fs.mkdir(path.join(base, dir), { recursive: true });
    }
  }

  async removeProfile(profileId: string): Promise<void> {
    const dir = path.join(this.dataDir, "profiles", profileId);
    await fs.rm(dir, { recursive: true, force: true });
  }
}
