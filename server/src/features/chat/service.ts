import type { ConversationMeta, Message, MessageId, ContentBlock, ChatSSEEvent } from "@claude-copy/shared";
import { ConversationStorage } from "./storage.js";
import { ClaudeService } from "../../llm/claude-service.js";
import { buildSystemPrompt } from "../../llm/system-prompt-builder.js";
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";
import { v4 as uuid } from "uuid";

interface ChatContext {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  projectInstructions: string | null;
  knowledgeContext: string | null;
}

export class ChatService {
  constructor(
    private convStorage: ConversationStorage,
    private claudeService: ClaudeService,
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

    // Save user message
    const userMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
    const userMsg: Message = {
      id: userMsgId,
      parentId: (parentId ?? (meta.activeBranchTip || null)) as MessageId | null,
      role: "user",
      content,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    await this.convStorage.addMessage(dataDir, conversationId, userMsg);
    yield { type: "user_saved", messageId: userMsgId };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Determine if resume or start new
    const abortController = new AbortController();
    this.claudeService.setAbortController(conversationId, abortController);

    const textContent = content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    try {
      // Find active session to resume
      const activeSessionId = Object.entries(meta.sessions).find(
        ([, info]) => info.branchTip === meta.activeBranchTip,
      )?.[0];

      const stream = activeSessionId
        ? this.claudeService.resumeConversation({
            prompt: textContent,
            sessionId: activeSessionId,
            model,
            systemPrompt,
            abortController,
          })
        : this.claudeService.startConversation({
            prompt: textContent,
            model,
            systemPrompt,
            abortController,
          });

      let assistantText = "";
      let newSessionId = "";
      let usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

      for await (const msg of stream) {
        if (msg.session_id) newSessionId = msg.session_id;

        if (msg.type === "assistant") {
          const textBlocks = msg.message.content.filter((b: { type: string }) => b.type === "text");
          for (const block of textBlocks) {
            assistantText += (block as { text: string }).text;
            yield { type: "assistant_chunk", text: (block as { text: string }).text };
          }
          if (msg.message.usage) {
            usage.inputTokens += msg.message.usage.input_tokens ?? 0;
            usage.outputTokens += msg.message.usage.output_tokens ?? 0;
          }
        }

        if (msg.type === "result") {
          usage.costUsd = msg.total_cost_usd ?? 0;
        }
      }

      // Save assistant message
      const assistantMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
      const assistantMsg: Message = {
        id: assistantMsgId,
        parentId: userMsgId,
        role: "assistant",
        content: [{ type: "text", text: assistantText }],
        attachments: [],
        model,
        usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
        createdAt: new Date().toISOString(),
      };
      await this.convStorage.addMessage(dataDir, conversationId, assistantMsg);

      // Update session map
      if (newSessionId) {
        meta.sessions[newSessionId] = { branchTip: assistantMsgId, createdAt: new Date().toISOString() };
      }
      meta.activeBranchTip = assistantMsgId;
      meta.usage.totalInputTokens += usage.inputTokens;
      meta.usage.totalOutputTokens += usage.outputTokens;
      meta.usage.totalCostUsd += usage.costUsd;
      meta.usage.messageCount += 2;
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
}
