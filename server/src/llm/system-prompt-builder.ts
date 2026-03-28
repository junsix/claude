import type { Profile, MemoryEntry, CustomStyle, Project } from "@claude-copy/shared";
import { assembleSystemPrompt, type AssemblyContext, type FeatureFlags } from "./prompt-modules.js";

export interface KnowledgeFileContent {
  name: string;
  content: string;
  size: number;
}

export interface BuildSystemPromptParams {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  projectInstructions: string | null;
  knowledgeFiles: KnowledgeFileContent[];
  project?: Project | null;
  features?: Partial<FeatureFlags>;
}

// Rough token estimator: ~4 chars/token for Latin, ~2 for CJK
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjkCount = 0;
  for (const char of text) {
    if (char.charCodeAt(0) > 0x2e80) cjkCount++;
  }
  const latinCount = text.length - cjkCount;
  return Math.ceil(latinCount / 4 + cjkCount / 2);
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const ctx: AssemblyContext = {
    profile: params.profile,
    memories: params.memories,
    style: params.style,
    project: params.project ?? null,
    projectInstructions: params.projectInstructions,
    knowledgeFiles: params.knowledgeFiles,
    date: new Date().toISOString().split("T")[0],
    features: {
      memory: params.features?.memory ?? true,
      artifacts: params.features?.artifacts ?? true,
      localFiles: params.features?.localFiles ?? (params.project?.localPaths?.length ?? 0) > 0,
    },
  };

  return assembleSystemPrompt(ctx);
}
