import { describe, it, expect } from "vitest";
import { buildSystemPrompt, estimateTokens } from "../system-prompt-builder.js";
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";

const mockProfile: Profile = {
  id: "prof_1", name: "Dev", avatar: "dev", role: "Developer",
  expertise: ["TypeScript"], language: "ko",
  globalInstructions: "Always respond in Korean",
  defaults: { model: "claude-sonnet-4-6", style: "concise" },
};

const baseParams = { profile: mockProfile, memories: [], style: null, projectInstructions: null, knowledgeFiles: [] };

describe("buildSystemPrompt", () => {
  it("wraps output in XML tags", () => {
    const result = buildSystemPrompt(baseParams);
    expect(result).toContain("<claude_behavior>");
    expect(result).toContain("</claude_behavior>");
    expect(result).toContain("<user_profile>");
    expect(result).toContain("</user_profile>");
  });

  it("includes profile info and global instructions", () => {
    const result = buildSystemPrompt(baseParams);
    expect(result).toContain("Developer");
    expect(result).toContain("Always respond in Korean");
  });

  it("includes active memories when present", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "User prefers TypeScript", category: "preference", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const result = buildSystemPrompt({ ...baseParams, memories });
    expect(result).toContain("User prefers TypeScript");
    expect(result).toContain("<memory_system>");
    expect(result).toContain("<user_memories>");
  });

  it("excludes memory modules when no memories", () => {
    const result = buildSystemPrompt({ ...baseParams, memories: [], features: { memory: true, artifacts: false, localFiles: false } });
    expect(result).toContain("<memory_system>");    // system rules still shown
    expect(result).not.toContain("<user_memories>"); // but no entries
  });

  it("includes project instructions when present", () => {
    const result = buildSystemPrompt({ ...baseParams, projectInstructions: "Use TDD always" });
    expect(result).toContain("Use TDD always");
    expect(result).toContain("<project_context>");
  });

  it("includes artifacts info by default", () => {
    const result = buildSystemPrompt(baseParams);
    expect(result).toContain("<artifacts_info>");
    expect(result).toContain("self-contained content");
  });

  it("excludes artifacts info when feature disabled", () => {
    const result = buildSystemPrompt({ ...baseParams, features: { memory: true, artifacts: false, localFiles: false } });
    expect(result).not.toContain("<artifacts_info>");
  });

  it("includes style prompt when present", () => {
    const style: CustomStyle = { id: "s1", name: "Brief", description: "", prompt: "Be very brief", sampleText: null, createdAt: "" };
    const result = buildSystemPrompt({ ...baseParams, style });
    expect(result).toContain("Be very brief");
    expect(result).toContain("<response_style>");
  });

  it("assembles modules in priority order", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "MEMORY_MARKER", category: "fact", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const style: CustomStyle = { id: "s1", name: "X", description: "", prompt: "STYLE_MARKER", sampleText: null, createdAt: "" };
    const knowledgeFiles = [{ name: "doc.txt", content: "KNOWLEDGE_MARKER", size: 100 }];
    const result = buildSystemPrompt({ ...baseParams, memories, style, projectInstructions: "PROJECT_MARKER", knowledgeFiles });

    const behaviorIdx = result.indexOf("<claude_behavior>");
    const profileIdx = result.indexOf("<user_profile>");
    const memoryIdx = result.indexOf("MEMORY_MARKER");
    const projectIdx = result.indexOf("PROJECT_MARKER");
    const knowledgeIdx = result.indexOf("KNOWLEDGE_MARKER");
    const styleIdx = result.indexOf("STYLE_MARKER");

    expect(behaviorIdx).toBeLessThan(profileIdx);
    expect(profileIdx).toBeLessThan(memoryIdx);
    expect(memoryIdx).toBeLessThan(projectIdx);
    expect(projectIdx).toBeLessThan(knowledgeIdx);
    expect(knowledgeIdx).toBeLessThan(styleIdx);
  });
});

describe("estimateTokens", () => {
  it("estimates Latin text at ~4 chars per token", () => {
    const text = "Hello world, this is a test.";
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThanOrEqual(5);
    expect(tokens).toBeLessThanOrEqual(10);
  });

  it("estimates CJK text at ~2 chars per token", () => {
    const text = "한국어로 작성된 텍스트입니다";
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThanOrEqual(5);
    expect(tokens).toBeLessThanOrEqual(10);
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });
});

describe("token budget", () => {
  it("caps memories at 50 entries", () => {
    const memories: MemoryEntry[] = Array.from({ length: 80 }, (_, i) => ({
      id: `m${i}`, content: `Memory item ${i}`, category: "fact" as const,
      source: { conversationId: "c1", extractedAt: "" }, active: true,
    }));
    const result = buildSystemPrompt({ ...baseParams, memories });
    const count = (result.match(/Memory item/g) || []).length;
    expect(count).toBeLessThanOrEqual(50);
    expect(count).toBeGreaterThan(0);
  });

  it("truncates large knowledge files", () => {
    const largeContent = "x".repeat(200_000);
    const knowledgeFiles = [{ name: "huge.txt", content: largeContent, size: 200_000 }];
    const result = buildSystemPrompt({ ...baseParams, knowledgeFiles });
    expect(result).toContain("[... truncated]");
    expect(result.length).toBeLessThan(largeContent.length);
  });
});
