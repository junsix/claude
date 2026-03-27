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

    const abortController = new AbortController();
    this.claudeService.setAbortController(conversationId, abortController);

    const textContent = content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    try {
      const stream = this.claudeService.streamConversation({
        prompt: textContent,
        model,
        systemPrompt,
        abortController,
      });

      let assistantText = "";
      let usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

      for await (const event of stream) {
        if (event.type === "text_delta" && event.text) {
          assistantText += event.text;
          yield { type: "assistant_chunk", text: event.text };
        }

        if (event.type === "message_complete") {
          // Use the full text from SDK (more reliable than concatenated deltas)
          if (event.fullText) assistantText = event.fullText;
          usage.inputTokens = event.usage?.inputTokens ?? 0;
          usage.outputTokens = event.usage?.outputTokens ?? 0;
          usage.costUsd = event.costUsd ?? 0;
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

      // Update meta
      meta.activeBranchTip = assistantMsgId;
      meta.usage.totalInputTokens += usage.inputTokens;
      meta.usage.totalOutputTokens += usage.outputTokens;
      meta.usage.totalCostUsd += usage.costUsd;
      meta.usage.messageCount += 2;

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
}
