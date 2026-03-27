import { query } from "@anthropic-ai/claude-agent-sdk";

interface ConversationParams {
  prompt: string;
  model: string;
  systemPrompt: string;
  abortController?: AbortController;
}

interface StreamEvent {
  type: "text_delta" | "message_complete" | "error";
  text?: string;
  fullText?: string;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  sessionId?: string;
}

export class ClaudeService {
  private activeAbortControllers = new Map<string, AbortController>();

  /**
   * Query via Claude Code SDK, then stream the response word-by-word as SSE events.
   */
  async *streamConversation(params: ConversationParams): AsyncGenerator<StreamEvent> {
    const ac = params.abortController ?? new AbortController();

    const q = query({
      prompt: params.prompt,
      options: {
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
      },
    });

    let fullText = "";
    let sessionId = "";
    let usage = { inputTokens: 0, outputTokens: 0 };
    let costUsd = 0;

    // Collect the full response from SDK
    for await (const msg of q) {
      if (msg.session_id) sessionId = msg.session_id;

      if (msg.type === "assistant") {
        const textBlocks = msg.message.content.filter((b: { type: string }) => b.type === "text");
        fullText = textBlocks.map((b: { text: string }) => b.text).join("");
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

    // Simulate streaming: yield word-by-word with small delays
    if (fullText) {
      // Split into small chunks (~3-5 words each) for natural streaming feel
      const words = fullText.split(/(\s+)/);
      let buffer = "";
      let wordCount = 0;

      for (const word of words) {
        if (ac.signal.aborted) break;
        buffer += word;
        if (/\S/.test(word)) wordCount++;

        // Flush every 3 words or at sentence boundaries
        if (wordCount >= 3 || /[.!?\n]$/.test(buffer.trim())) {
          yield { type: "text_delta", text: buffer };
          buffer = "";
          wordCount = 0;
          // Small delay for streaming effect
          await new Promise((r) => setTimeout(r, 30));
        }
      }
      // Flush remaining buffer
      if (buffer) {
        yield { type: "text_delta", text: buffer };
      }
    }

    yield {
      type: "message_complete",
      fullText,
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
