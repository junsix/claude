import type { ChatSSEEvent, ContentBlock } from "@claude-copy/shared";

export interface SSEStreamOptions {
  conversationId: string;
  content: ContentBlock[];
  parentId?: string;
  model?: string;
  style?: string;
  profileId: string;
  onEvent: (event: ChatSSEEvent) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export function startChatStream(options: SSEStreamOptions): AbortController {
  const ac = new AbortController();

  fetch(`/api/chat/${options.conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Profile-Id": options.profileId,
    },
    body: JSON.stringify({
      content: options.content,
      parentId: options.parentId,
      model: options.model,
      style: options.style,
    }),
    signal: ac.signal,
  })
    .then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as ChatSSEEvent;
              options.onEvent(event);
            } catch { /* skip malformed */ }
          }
        }
      }
      options.onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") options.onError(err);
    });

  return ac;
}
