import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";

interface BuildSystemPromptParams {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  projectInstructions: string | null;
  knowledgeContext: string | null;
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const sections: string[] = [];

  // 1. Profile & global instructions
  const profileLines = [
    `## User Profile`,
    `Name: ${params.profile.name}`,
    params.profile.role ? `Role: ${params.profile.role}` : null,
    params.profile.expertise.length > 0 ? `Expertise: ${params.profile.expertise.join(", ")}` : null,
    params.profile.language ? `Language: ${params.profile.language}` : null,
  ].filter(Boolean).join("\n");
  sections.push(profileLines);

  if (params.profile.globalInstructions) {
    sections.push(`## Global Instructions\n${params.profile.globalInstructions}`);
  }

  // 2. Active memories
  if (params.memories.length > 0) {
    const memoryLines = params.memories.map((m) => `- ${m.content}`).join("\n");
    sections.push(`## User Memory\n${memoryLines}`);
  }

  // 3. Project instructions
  if (params.projectInstructions) {
    sections.push(`## Project Instructions\n${params.projectInstructions}`);
  }

  // 4. Knowledge files
  if (params.knowledgeContext) {
    sections.push(`## Project Knowledge\n${params.knowledgeContext}`);
  }

  // 5. Style
  if (params.style && params.style.prompt) {
    sections.push(`## Response Style\n${params.style.prompt}`);
  }

  return sections.join("\n\n");
}
