import { query } from "@anthropic-ai/claude-agent-sdk";

interface ConversationParams {
  prompt: string;
  model: string;
  systemPrompt: string;
  abortController?: AbortController;
}

interface StreamEvent {
  type: "thinking" | "text_delta" | "message_complete" | "error";
  text?: string;
  fullText?: string;
  thinkingText?: string;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  sessionId?: string;
}

export class ClaudeService {
  private activeAbortControllers = new Map<string, AbortController>();

  async *streamConversation(params: ConversationParams): AsyncGenerator<StreamEvent> {
    const ac = params.abortController ?? new AbortController();

    const q = query({
      prompt: params.prompt,
      options: {
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
        thinking: {
          type: "enabled",
          budgetTokens: 10000,
        },
      },
    });

    let fullText = "";
    let thinkingText = "";
    let sessionId = "";
    let usage = { inputTokens: 0, outputTokens: 0 };
    let costUsd = 0;

    // Collect the full response from SDK
    for await (const msg of q) {
      if (msg.session_id) sessionId = msg.session_id;

      if (msg.type === "assistant") {
        const blocks = msg.message.content as Array<{ type: string; text?: string; thinking?: string }>;

        // Extract thinking blocks
        for (const block of blocks) {
          if (block.type === "thinking" && block.thinking) {
            thinkingText += block.thinking;
          }
          if (block.type === "text" && block.text) {
            fullText += block.text;
          }
        }

        if (msg.message.usage) {
          usage.inputTokens += msg.message.usage.input_tokens ?? 0;
          usage.outputTokens += msg.message.usage.output_tokens ?? 0;
        }
      }

      if (msg.type === "result") {
        costUsd = msg.total_cost_usd ?? 0;
        if (!fullText && msg.result) fullText = msg.result;
      }
    }

    // 1. Yield thinking first (word-by-word)
    if (thinkingText) {
      const words = thinkingText.split(/(\s+)/);
      let buffer = "";
      let wordCount = 0;

      for (const word of words) {
        if (ac.signal.aborted) break;
        buffer += word;
        if (/\S/.test(word)) wordCount++;

        if (wordCount >= 5 || /[.!?\n]$/.test(buffer.trim())) {
          yield { type: "thinking", text: buffer };
          buffer = "";
          wordCount = 0;
          await new Promise((r) => setTimeout(r, 15));
        }
      }
      if (buffer) {
        yield { type: "thinking", text: buffer };
      }
    }

    // 2. Yield response text (word-by-word)
    if (fullText) {
      const words = fullText.split(/(\s+)/);
      let buffer = "";
      let wordCount = 0;

      for (const word of words) {
        if (ac.signal.aborted) break;
        buffer += word;
        if (/\S/.test(word)) wordCount++;

        if (wordCount >= 3 || /[.!?\n]$/.test(buffer.trim())) {
          yield { type: "text_delta", text: buffer };
          buffer = "";
          wordCount = 0;
          await new Promise((r) => setTimeout(r, 30));
        }
      }
      if (buffer) {
        yield { type: "text_delta", text: buffer };
      }
    }

    yield {
      type: "message_complete",
      fullText,
      thinkingText,
      usage,
      costUsd,
      sessionId,
    };
  }

  setAbortController(conversationId: string, ac: AbortController): void {
    this.activeAbortControllers.set(conversationId, ac);
  }

  abort(conversationId: string): boolean {
    const ac = this.activeAbortControllers.get(conversationId);
    if (ac) {
      ac.abort();
      this.activeAbortControllers.delete(conversationId);
      return true;
    }
    return false;
  }

  clearAbortController(conversationId: string): void {
    this.activeAbortControllers.delete(conversationId);
  }
}
