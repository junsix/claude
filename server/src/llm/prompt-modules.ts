import type { Profile, MemoryEntry, CustomStyle, Project } from "@claude-copy/shared";
import type { KnowledgeFileContent } from "./system-prompt-builder.js";
import { estimateTokens } from "./system-prompt-builder.js";

// ─── Assembly Context ───────────────────────────────────────

export interface AssemblyContext {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  project: Project | null;
  projectInstructions: string | null;
  knowledgeFiles: KnowledgeFileContent[];
  date: string;
  features: FeatureFlags;
}

export interface FeatureFlags {
  memory: boolean;
  artifacts: boolean;
  localFiles: boolean;
}

// ─── Module Definition ──────────────────────────────────────

export interface PromptModule {
  id: string;
  tag: string;
  priority: number;       // lower = assembled first
  budget: number;         // max tokens for this module
  required: boolean;      // always include regardless of condition
  condition: (ctx: AssemblyContext) => boolean;
  render: (ctx: AssemblyContext) => string | null;
}

// ─── Module Registry ────────────────────────────────────────

const modules: PromptModule[] = [];

export function registerModule(module: PromptModule): void {
  modules.push(module);
  modules.sort((a, b) => a.priority - b.priority);
}

export function getModules(): readonly PromptModule[] {
  return modules;
}

export function clearModules(): void {
  modules.length = 0;
}

// ─── Assembler ──────────────────────────────────────────────

const TOTAL_BUDGET = 30_000;

export function assembleSystemPrompt(ctx: AssemblyContext): string {
  const activeModules = modules.filter(
    (m) => m.required || m.condition(ctx),
  );

  const sections: string[] = [];
  let usedTokens = 0;

  for (const mod of activeModules) {
    const remaining = TOTAL_BUDGET - usedTokens;
    if (remaining <= 0) break;

    const content = mod.render(ctx);
    if (!content) continue;

    const budget = Math.min(mod.budget, remaining);
    const truncated = truncateToTokenBudget(content, budget);
    const wrapped = `<${mod.tag}>\n${truncated}\n</${mod.tag}>`;

    usedTokens += estimateTokens(wrapped);
    sections.push(wrapped);
  }

  return sections.join("\n\n");
}

function truncateToTokenBudget(text: string, budget: number): string {
  if (estimateTokens(text) <= budget) return text;
  const charLimit = budget * 3;
  return text.slice(0, charLimit) + "\n[... truncated]";
}

// ─── Built-in Module Definitions ────────────────────────────

registerModule({
  id: "claude_behavior",
  tag: "claude_behavior",
  priority: 0,
  budget: 2_000,
  required: true,
  condition: () => true,
  render: (ctx) => `You are Claude, an AI assistant by Anthropic. You are helpful, harmless, and honest.

- Respond in the user's preferred language unless instructed otherwise
- Be direct and concise; avoid unnecessary filler
- Use markdown formatting (headings, lists, code blocks) when it aids clarity
- Never fabricate information — say "I don't know" when uncertain
- When writing code, prefer correctness and readability over cleverness
- Current date: ${ctx.date}`,
});

registerModule({
  id: "user_profile",
  tag: "user_profile",
  priority: 10,
  budget: 1_000,
  required: true,
  condition: () => true,
  render: (ctx) => {
    const lines = [
      `Name: ${ctx.profile.name}`,
      ctx.profile.role ? `Role: ${ctx.profile.role}` : null,
      ctx.profile.expertise.length > 0 ? `Expertise: ${ctx.profile.expertise.join(", ")}` : null,
      ctx.profile.language ? `Preferred language: ${ctx.profile.language}` : null,
    ].filter(Boolean);

    if (ctx.profile.globalInstructions) {
      lines.push("", "Global instructions from user:", ctx.profile.globalInstructions);
    }

    return lines.join("\n");
  },
});

registerModule({
  id: "memory_system",
  tag: "memory_system",
  priority: 20,
  budget: 500,
  required: false,
  condition: (ctx) => ctx.features.memory,
  render: () => `You have access to stored memories about this user from past conversations.
Use them naturally as background context to personalize responses.

Rules:
- NEVER say "Based on my memories", "I remember that", or similar phrases
- Incorporate memory knowledge seamlessly — the user should feel understood, not surveilled
- If a memory seems outdated or contradicted by current conversation, note it
- When the user explicitly asks you to remember something, confirm and the system will save it`,
});

registerModule({
  id: "user_memories",
  tag: "user_memories",
  priority: 21,
  budget: 2_000,
  required: false,
  condition: (ctx) => ctx.features.memory && ctx.memories.length > 0,
  render: (ctx) => {
    const MAX_ENTRIES = 50;
    const capped = ctx.memories.slice(0, MAX_ENTRIES);
    const lines: string[] = [];
    let tokens = 0;

    for (const m of capped) {
      const line = `- [${m.category}] ${m.content}`;
      const lineTokens = estimateTokens(line);
      if (tokens + lineTokens > 1_800) break;
      lines.push(line);
      tokens += lineTokens;
    }

    return lines.length > 0 ? lines.join("\n") : null;
  },
});

registerModule({
  id: "artifacts_info",
  tag: "artifacts_info",
  priority: 30,
  budget: 1_500,
  required: false,
  condition: (ctx) => ctx.features.artifacts,
  render: () => `When generating substantial, self-contained content, create it as an artifact.
The system will detect and extract artifacts from your response automatically.

Create artifacts for:
- React/JSX components (with \`export default\`, 10+ lines)
- Complete HTML pages (\`<!DOCTYPE\` or \`<html\`, 10+ lines)
- SVG graphics (\`<svg\` root element, 5+ lines)
- Mermaid diagrams (\`graph\`, \`flowchart\`, \`sequenceDiagram\`, etc., 3+ lines)
- Long standalone documents (50+ lines of markdown)

Do NOT create artifacts for:
- Short code snippets or illustrative examples
- Inline code explanations
- Partial fragments that aren't self-contained

When updating an existing artifact, describe what you are changing, then provide the complete updated version. Always include the full content, not just the diff.`,
});

registerModule({
  id: "project_instructions",
  tag: "project_context",
  priority: 40,
  budget: 2_000,
  required: false,
  condition: (ctx) => !!ctx.projectInstructions,
  render: (ctx) => {
    const lines: string[] = [];
    if (ctx.project) {
      lines.push(`Project: ${ctx.project.name}`);
      if (ctx.project.description) lines.push(`Description: ${ctx.project.description}`);
      lines.push("");
    }
    lines.push("Project instructions:", ctx.projectInstructions!);
    return lines.join("\n");
  },
});

registerModule({
  id: "project_knowledge",
  tag: "project_knowledge",
  priority: 41,
  budget: 20_000,
  required: false,
  condition: (ctx) => ctx.knowledgeFiles.length > 0,
  render: (ctx) => {
    const SMALL = 5_000;
    const LARGE = 20_000;
    const parts: string[] = [];
    let tokens = 0;

    for (const file of ctx.knowledgeFiles) {
      const fileTokens = estimateTokens(file.content);
      const remaining = 19_000 - tokens;
      if (remaining <= 100) break;

      if (fileTokens <= SMALL && fileTokens <= remaining) {
        const part = `### ${file.name}\n${file.content}`;
        parts.push(part);
        tokens += estimateTokens(part);
      } else if (fileTokens <= LARGE) {
        const budget = Math.min(remaining - 50, SMALL);
        const truncated = truncateToTokenBudget(file.content, budget);
        parts.push(`### ${file.name}\n${truncated}`);
        tokens += budget + 50;
      } else {
        const budget = Math.min(remaining - 100, 1_000);
        const preview = truncateToTokenBudget(file.content, budget);
        parts.push(`### ${file.name} (preview — use Read tool for full content)\n${preview}`);
        tokens += budget + 100;
      }
    }

    return parts.length > 0 ? parts.join("\n\n") : null;
  },
});

registerModule({
  id: "local_files_info",
  tag: "local_files",
  priority: 42,
  budget: 500,
  required: false,
  condition: (ctx) => ctx.features.localFiles && !!ctx.project?.localPaths?.length,
  render: (ctx) => {
    const paths = ctx.project!.localPaths;
    const lines = [
      `This conversation is linked to a local project. You can browse and read files using tools.`,
      `Working directory: ${paths[0]}`,
    ];
    if (paths.length > 1) {
      lines.push(`Additional directories: ${paths.slice(1).join(", ")}`);
    }
    return lines.join("\n");
  },
});

registerModule({
  id: "response_style",
  tag: "response_style",
  priority: 90,
  budget: 500,
  required: false,
  condition: (ctx) => !!ctx.style?.prompt,
  render: (ctx) => ctx.style!.prompt,
});
