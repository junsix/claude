import type { ConversationMeta, Message, MessageId, ContentBlock, ChatSSEEvent } from "@claude-copy/shared";
import { ConversationStorage } from "./storage.js";
import { ClaudeService } from "../../llm/claude-service.js";
import { ProjectStorage } from "../projects/storage.js";
import { buildSystemPrompt, type KnowledgeFileContent } from "../../llm/system-prompt-builder.js";
import { findSessionForBranchTip, findSessionContainingMessage, getLastAssistantInPath } from "./branch.js";
import type { Profile, MemoryEntry, CustomStyle, AppSettings } from "@claude-copy/shared";
import { DEFAULT_SETTINGS } from "@claude-copy/shared";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";

interface ChatContext {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  settings?: AppSettings;
}

export class ChatService {
  constructor(
    private convStorage: ConversationStorage,
    private claudeService: ClaudeService,
    private projectStorage: ProjectStorage,
  ) {}

  async *sendMessage(
    dataDir: string,
    conversationId: string,
    content: ContentBlock[],
    parentId: string | undefined,
    model: string,
    context: ChatContext,
  ): AsyncGenerator<ChatSSEEvent> {
    const meta = await this.convStorage.getMeta(dataDir, conversationId);
    if (!meta) throw new Error("Conversation not found");

    const messages = await this.convStorage.getMessages(dataDir, conversationId);

    // Save user message
    const resolvedParentId = (parentId ?? (meta.activeBranchTip || null)) as MessageId | null;
    const userMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
    const userMsg: Message = {
      id: userMsgId,
      parentId: resolvedParentId,
      role: "user",
      content,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    await this.convStorage.addMessage(dataDir, conversationId, userMsg);
    yield { type: "user_saved", messageId: userMsgId };

    // Resolve session strategy
    const sessionStrategy = this.resolveSessionStrategy(meta, messages, resolvedParentId);

    // Resolve project context
    let cwd: string | undefined;
    let additionalDirectories: string[] | undefined;
    let projectInstructions: string | null = null;
    let knowledgeFiles: KnowledgeFileContent[] = [];
    let project: import("@claude-copy/shared").Project | null = null;

    if (meta.projectId) {
      project = await this.projectStorage.getMeta(dataDir, meta.projectId);
      if (project) {
        if (project.localPaths.length > 0) {
          cwd = project.localPaths[0];
          additionalDirectories = project.localPaths.slice(1);
        }
        projectInstructions = await this.projectStorage.getInstructions(dataDir, meta.projectId) || null;
        knowledgeFiles = await this.loadKnowledgeFiles(dataDir, meta.projectId, project.knowledgeFiles);
      }
    }

    // Build system prompt — modules are conditionally assembled based on context
    const systemPrompt = buildSystemPrompt({
      profile: context.profile,
      memories: context.memories,
      style: context.style,
      projectInstructions,
      knowledgeFiles,
      project,
    });

    const abortController = new AbortController();
    this.claudeService.setAbortController(conversationId, abortController);

    const textContent = content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    try {
      const settings = context.settings ?? DEFAULT_SETTINGS;
      const stream = this.claudeService.streamConversation({
        prompt: textContent,
        model,
        systemPrompt,
        abortController,
        ...sessionStrategy,
        cwd,
        additionalDirectories,
        toolPolicy: "readonly",
        thinking: settings.thinking,
        thinkingBudgetTokens: settings.thinkingBudgetTokens,
        maxBudgetUsd: settings.maxBudgetUsd,
      });

      let assistantText = "";
      let thinkingText = "";
      let usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      let sessionId = "";
      let sdkMessageUuid = "";

      for await (const event of stream) {
        if (event.type === "thinking" && event.text) {
          thinkingText += event.text;
          yield { type: "thinking", text: event.text };
        }

        if (event.type === "text_delta" && event.text) {
          assistantText += event.text;
          yield { type: "assistant_chunk", text: event.text };
        }

        if (event.type === "tool_use" && event.toolName) {
          yield { type: "tool_use", toolName: event.toolName, toolId: event.toolId ?? "" };
        }

        if (event.type === "tool_result") {
          yield { type: "tool_result", toolId: event.toolId ?? "", summary: event.summary ?? "" };
        }

        if (event.type === "message_complete") {
          // If text wasn't streamed, emit it now as a single chunk
          if (event.fullText && !assistantText) {
            yield { type: "assistant_chunk", text: event.fullText };
          }
          if (event.fullText) assistantText = event.fullText;
          if (event.thinkingText) thinkingText = event.thinkingText;
          usage.inputTokens = event.usage?.inputTokens ?? 0;
          usage.outputTokens = event.usage?.outputTokens ?? 0;
          usage.costUsd = event.costUsd ?? 0;
          if (event.sessionId) sessionId = event.sessionId;
          if (event.sdkMessageUuid) sdkMessageUuid = event.sdkMessageUuid;
        }
      }

      // Save assistant message
      const assistantMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
      const assistantContent: ContentBlock[] = [];
      if (thinkingText) {
        assistantContent.push({ type: "thinking", thinking: thinkingText });
      }
      assistantContent.push({ type: "text", text: assistantText });

      const assistantMsg: Message = {
        id: assistantMsgId,
        parentId: userMsgId,
        role: "assistant",
        content: assistantContent,
        attachments: [],
        model,
        usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
        sdkMessageUuid: sdkMessageUuid || undefined,
        createdAt: new Date().toISOString(),
      };
      await this.convStorage.addMessage(dataDir, conversationId, assistantMsg);

      // Update meta — branch tip + session tracking
      meta.activeBranchTip = assistantMsgId;
      meta.usage.totalInputTokens += usage.inputTokens;
      meta.usage.totalOutputTokens += usage.outputTokens;
      meta.usage.totalCostUsd += usage.costUsd;
      meta.usage.messageCount += 2;

      if (sessionId) {
        meta.sessions[sessionId] = {
          branchTip: assistantMsgId,
          createdAt: meta.sessions[sessionId]?.createdAt ?? new Date().toISOString(),
        };
      }

      // Auto-generate title on first exchange
      if (meta.usage.messageCount === 2 && meta.title === "New Conversation") {
        const { generateTitle } = await import("./title-generator.js");
        const titleMsgs = [
          { role: "user", text: textContent },
          { role: "assistant", text: assistantText },
        ];
        meta.title = await generateTitle(titleMsgs);
      }

      await this.convStorage.saveMeta(dataDir, conversationId, meta);

      yield { type: "assistant_done", messageId: assistantMsgId, artifactIds: [] };
      yield { type: "done", usage };
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        yield { type: "error", code: "aborted", message: "Generation aborted by user" };
      } else {
        yield { type: "error", code: "sdk_error", message: (err as Error).message };
      }
    } finally {
      this.claudeService.clearAbortController(conversationId);
    }
  }

  private resolveSessionStrategy(
    meta: ConversationMeta,
    messages: Message[],
    parentId: MessageId | null,
  ): { sessionId?: string; forkFromSession?: string; forkAtMessageUuid?: string } {
    if (!parentId) return {};

    // Continuing the active branch
    if (parentId === meta.activeBranchTip) {
      const sessionId = findSessionForBranchTip(meta, meta.activeBranchTip);
      return sessionId ? { sessionId } : {};
    }

    // Forking: parentId is somewhere in an existing branch
    const match = findSessionContainingMessage(meta, messages, parentId);
    if (match) {
      const lastAssistant = getLastAssistantInPath(messages, parentId);
      return {
        forkFromSession: match.sessionId,
        forkAtMessageUuid: lastAssistant?.sdkMessageUuid,
      };
    }

    return {};
  }

  private async loadKnowledgeFiles(
    dataDir: string,
    projectId: string,
    knowledgeFileMetas: Array<{ id: string; name: string; size: number }>,
  ): Promise<KnowledgeFileContent[]> {
    const knowledgeDir = this.projectStorage.getKnowledgeDir(dataDir, projectId);
    const results: KnowledgeFileContent[] = [];

    for (const kf of knowledgeFileMetas) {
      try {
        const ext = path.extname(kf.name);
        const filePath = path.join(knowledgeDir, `${kf.id}${ext}`);
        const content = await fs.readFile(filePath, "utf-8");
        results.push({ name: kf.name, content, size: kf.size });
      } catch {
        // Skip unreadable files
      }
    }

    return results;
  }
}
