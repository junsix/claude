import type { ProfileId } from "./common.js";

export interface ProfileSummary {
  id: ProfileId;
  name: string;
  avatar: string;
  createdAt: string;
}

export interface ProfilesIndex {
  activeProfileId: ProfileId;
  profiles: ProfileSummary[];
}

export interface Profile {
  id: ProfileId;
  name: string;
  avatar: string;
  role: string;
  expertise: string[];
  language: string;
  globalInstructions: string;
  defaults: {
    model: string;
    style: string;
  };
}
