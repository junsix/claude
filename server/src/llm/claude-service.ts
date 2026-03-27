import { query } from "@anthropic-ai/claude-agent-sdk";

interface StartConversationParams {
  prompt: string;
  model: string;
  systemPrompt: string;
  cwd?: string;
  additionalDirectories?: string[];
  abortController?: AbortController;
}

interface ResumeConversationParams {
  prompt: string;
  sessionId: string;
  model: string;
  systemPrompt?: string;
  abortController?: AbortController;
}

interface ForkConversationParams {
  prompt: string;
  sessionId: string;
  resumeAtMessageId: string;
  model: string;
  systemPrompt?: string;
  abortController?: AbortController;
}

export class ClaudeService {
  private activeAbortControllers = new Map<string, AbortController>();

  async *startConversation(params: StartConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        model: params.model,
        systemPrompt: params.systemPrompt,
        cwd: params.cwd,
        additionalDirectories: params.additionalDirectories,
        maxTurns: 1,
        abortController: ac,
        includePartialMessages: true,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
  }

  async *resumeConversation(params: ResumeConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        resume: params.sessionId,
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
        includePartialMessages: true,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
  }

  async *forkConversation(params: ForkConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        resume: params.sessionId,
        resumeSessionAt: params.resumeAtMessageId,
        forkSession: true,
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
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
