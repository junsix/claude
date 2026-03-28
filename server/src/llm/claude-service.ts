import { query, forkSession } from "@anthropic-ai/claude-agent-sdk";

export type ToolPolicy = "none" | "readonly" | "full";
export type ThinkingMode = "adaptive" | "enabled" | "disabled";

// ─── Structured Logger ──────────────────────────────────────

const LOG_PREFIX = "[Claude]";

function log(event: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString().slice(11, 23);
  const detail = data ? " " + JSON.stringify(data) : "";
  console.log(`${ts} ${LOG_PREFIX} ${event}${detail}`);
}

export interface ConversationParams {
  prompt: string;
  model: string;
  systemPrompt: string;
  abortController?: AbortController;
  // Session management
  sessionId?: string;
  forkFromSession?: string;
  forkAtMessageUuid?: string;
  // Project directories
  cwd?: string;
  additionalDirectories?: string[];
  // Tool control
  toolPolicy?: ToolPolicy;
  // Thinking & budget
  thinking?: ThinkingMode;
  thinkingBudgetTokens?: number;
  maxBudgetUsd?: number;
}

export interface StreamEvent {
  type: "thinking" | "text_delta" | "tool_use" | "tool_result" | "message_complete" | "error";
  text?: string;
  fullText?: string;
  thinkingText?: string;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  sessionId?: string;
  sdkMessageUuid?: string;
  toolName?: string;
  toolId?: string;
  summary?: string;
}

export class ClaudeService {
  private activeAbortControllers = new Map<string, AbortController>();

  async *streamConversation(params: ConversationParams): AsyncGenerator<StreamEvent> {
    const ac = params.abortController ?? new AbortController();
    const startTime = Date.now();

    log("query:start", {
      model: params.model,
      resume: params.sessionId ?? null,
      fork: params.forkFromSession ?? null,
      cwd: params.cwd ?? null,
      thinking: params.thinking ?? "adaptive",
    });

    // Resolve session: fork if needed, otherwise resume
    let resumeSessionId = params.sessionId;

    if (params.forkFromSession) {
      try {
        log("fork:start", { from: params.forkFromSession, at: params.forkAtMessageUuid });
        const forkResult = await forkSession(params.forkFromSession, {
          upToMessageId: params.forkAtMessageUuid,
        });
        resumeSessionId = forkResult.sessionId;
        log("fork:done", { newSession: forkResult.sessionId });
      } catch (err) {
        log("fork:failed", { error: (err as Error).message });
        resumeSessionId = undefined;
      }
    }

    // Build SDK options
    const policy = params.toolPolicy ?? (params.cwd ? "readonly" : "none");
    const { maxTurns, allowedTools, disallowedTools } = resolveToolPolicy(policy);
    log("tools", { policy, maxTurns });

    const options: Record<string, unknown> = {
      model: params.model,
      systemPrompt: params.systemPrompt,
      maxTurns,
      abortController: ac,
      includePartialMessages: true,
      persistSession: true,
      thinking: resolveThinkingConfig(params.thinking ?? "adaptive", params.thinkingBudgetTokens ?? 128_000),
    };

    if (params.maxBudgetUsd) options.maxBudgetUsd = params.maxBudgetUsd;

    if (allowedTools) options.allowedTools = allowedTools;
    if (disallowedTools) options.disallowedTools = disallowedTools;
    if (resumeSessionId) options.resume = resumeSessionId;
    if (params.cwd) options.cwd = params.cwd;
    if (params.additionalDirectories?.length) {
      options.additionalDirectories = params.additionalDirectories;
    }

    try {
      yield* this.iterateQuery(
        query({ prompt: params.prompt, options: options as any }),
        ac,
      );
    } catch (err) {
      // Fallback: if session expired/not found, retry without resume
      if (resumeSessionId && this.isSessionExpiredError(err)) {
        console.warn(`[ClaudeService] Session ${resumeSessionId} expired, starting fresh`);
        delete options.resume;
        yield* this.iterateQuery(
          query({ prompt: params.prompt, options: options as any }),
          ac,
        );
      } else {
        throw err;
      }
    }
  }

  private async *iterateQuery(
    q: AsyncGenerator<any, void>,
    ac: AbortController,
  ): AsyncGenerator<StreamEvent> {
    let fullText = "";
    let thinkingText = "";
    let sessionId = "";
    let sdkMessageUuid = "";
    let usage = { inputTokens: 0, outputTokens: 0 };
    let costUsd = 0;
    const startTime = Date.now();
    let firstTokenTime = 0;
    let msgCount = 0;

    // Track block types by index for stream_event parsing
    const blockTypes = new Map<number, "thinking" | "text">();

    for await (const msg of q) {
      msgCount++;
      if (ac.signal.aborted) { log("stream:aborted"); break; }
      if (msg.session_id && !sessionId) {
        sessionId = msg.session_id;
        log("session:id", { sessionId });
      } else if (msg.session_id) {
        sessionId = msg.session_id;
      }

      if (msg.type === "stream_event") {
        // Real token-level streaming via includePartialMessages
        const evt = msg.event;

        if (evt.type === "content_block_start") {
          if (evt.content_block?.type === "tool_use") {
            log("block:tool_use", { name: evt.content_block.name, id: evt.content_block.id });
            yield { type: "tool_use", toolName: evt.content_block.name, toolId: evt.content_block.id };
          } else {
            const blockType = evt.content_block?.type === "thinking" ? "thinking" : "text";
            blockTypes.set(evt.index, blockType);
            log("block:start", { index: evt.index, type: blockType });
            if (blockType === "text" && !firstTokenTime) firstTokenTime = Date.now();
          }
        } else if (evt.type === "content_block_delta") {
          const blockType = blockTypes.get(evt.index);

          if (blockType === "thinking" && evt.delta?.type === "thinking_delta" && evt.delta.thinking) {
            thinkingText += evt.delta.thinking;
            yield { type: "thinking", text: evt.delta.thinking };
          } else if (blockType === "text" && evt.delta?.type === "text_delta" && evt.delta.text) {
            fullText += evt.delta.text;
            yield { type: "text_delta", text: evt.delta.text };
          }
        }
      } else if (msg.type === "tool_use_summary") {
        yield { type: "tool_result", summary: msg.summary };
      } else if (msg.type === "assistant") {
        // Complete assistant turn — capture UUID and reconcile text
        if (msg.uuid) sdkMessageUuid = msg.uuid;
        log("msg:assistant", { uuid: msg.uuid, hadStreamedText: !!fullText, hadStreamedThinking: !!thinkingText });

        // If we didn't get stream events (fallback), extract and yield text from the full message
        const streamedText = fullText;
        const blocks = msg.message?.content as Array<{ type: string; text?: string; thinking?: string }> | undefined;
        if (blocks) {
          for (const block of blocks) {
            if (block.type === "thinking" && block.thinking && !thinkingText) {
              thinkingText = block.thinking;
              yield { type: "thinking", text: block.thinking };
            }
            if (block.type === "text" && block.text && !streamedText) {
              fullText = block.text;
              yield { type: "text_delta", text: block.text };
            }
          }
        }

        if (msg.message?.usage) {
          usage.inputTokens += msg.message.usage.input_tokens ?? 0;
          usage.outputTokens += msg.message.usage.output_tokens ?? 0;
        }
      } else if (msg.type === "result") {
        costUsd = msg.total_cost_usd ?? 0;
        if (!fullText && msg.result) fullText = msg.result;
        if (msg.usage) {
          usage.inputTokens = msg.usage.input_tokens ?? usage.inputTokens;
          usage.outputTokens = msg.usage.output_tokens ?? usage.outputTokens;
        }
        log("msg:result", {
          subtype: msg.subtype,
          isError: msg.is_error,
          turns: msg.num_turns,
          costUsd,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
      } else {
        // Log unhandled SDK message types for debugging
        if (msg.type !== "system" && msg.type !== "user") {
          log("msg:other", { type: msg.type, subtype: msg.subtype });
        }
      }
    }

    const elapsed = Date.now() - startTime;
    const ttft = firstTokenTime ? firstTokenTime - startTime : null;
    log("query:done", {
      elapsed: `${elapsed}ms`,
      ttft: ttft ? `${ttft}ms` : "n/a",
      sdkMessages: msgCount,
      thinkingChars: thinkingText.length,
      responseChars: fullText.length,
      sessionId,
    });

    yield {
      type: "message_complete",
      fullText,
      thinkingText,
      usage,
      costUsd,
      sessionId,
      sdkMessageUuid,
    };
  }

  private isSessionExpiredError(err: unknown): boolean {
    const message = (err as Error)?.message ?? "";
    return /session.*not found|ENOENT|no such session/i.test(message);
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

// ─── Tool Policy Resolution ─────────────────────────────────

const READONLY_TOOLS = [
  "Read", "Glob", "Grep", "WebSearch", "WebFetch",
];

const WRITE_DENY = [
  "Write", "Edit", "Bash", "NotebookEdit",
];

function resolveThinkingConfig(
  mode: ThinkingMode,
  budgetTokens: number,
): Record<string, unknown> {
  switch (mode) {
    case "adaptive":
      return { type: "adaptive" };
    case "enabled":
      return { type: "enabled", budgetTokens };
    case "disabled":
      return { type: "disabled" };
  }
}

function resolveToolPolicy(policy: ToolPolicy): {
  maxTurns: number;
  allowedTools?: string[];
  disallowedTools?: string[];
} {
  switch (policy) {
    case "none":
      return { maxTurns: 1 };

    case "readonly":
      return {
        maxTurns: 5,
        allowedTools: READONLY_TOOLS,
        disallowedTools: WRITE_DENY,
      };

    case "full":
      return {
        maxTurns: 10,
      };
  }
}
