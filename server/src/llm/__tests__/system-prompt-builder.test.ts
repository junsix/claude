import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../system-prompt-builder.js";
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";

const mockProfile: Profile = {
  id: "prof_1", name: "Dev", avatar: "dev", role: "Developer",
  expertise: ["TypeScript"], language: "ko",
  globalInstructions: "Always respond in Korean",
  defaults: { model: "claude-sonnet-4-6", style: "concise" },
};

describe("buildSystemPrompt", () => {
  it("includes profile info and global instructions", () => {
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style: null, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("Developer");
    expect(result).toContain("Always respond in Korean");
  });

  it("includes active memories", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "User prefers TypeScript", category: "preference", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const result = buildSystemPrompt({ profile: mockProfile, memories, style: null, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("User prefers TypeScript");
  });

  it("includes project instructions", () => {
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style: null, projectInstructions: "Use TDD always", knowledgeContext: null });
    expect(result).toContain("Use TDD always");
  });

  it("includes style prompt", () => {
    const style: CustomStyle = { id: "s1", name: "Brief", description: "", prompt: "Be very brief", sampleText: null, createdAt: "" };
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("Be very brief");
  });

  it("assembles in correct order", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "MEMORY_MARKER", category: "fact", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const style: CustomStyle = { id: "s1", name: "X", description: "", prompt: "STYLE_MARKER", sampleText: null, createdAt: "" };
    const result = buildSystemPrompt({ profile: mockProfile, memories, style, projectInstructions: "PROJECT_MARKER", knowledgeContext: "KNOWLEDGE_MARKER" });

    const profileIdx = result.indexOf("Always respond in Korean");
    const memoryIdx = result.indexOf("MEMORY_MARKER");
    const projectIdx = result.indexOf("PROJECT_MARKER");
    const knowledgeIdx = result.indexOf("KNOWLEDGE_MARKER");
    const styleIdx = result.indexOf("STYLE_MARKER");

    expect(profileIdx).toBeLessThan(memoryIdx);
    expect(memoryIdx).toBeLessThan(projectIdx);
    expect(projectIdx).toBeLessThan(knowledgeIdx);
    expect(knowledgeIdx).toBeLessThan(styleIdx);
  });
});
