import { useCallback, useRef } from "react";
import { useChatStore } from "./store.js";
import { useProfileStore } from "../../hooks/use-profile.js";
import { startChatStream } from "../../lib/sse-client.js";
import type { ContentBlock } from "@claude-copy/shared";

export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const {
    meta, setStreaming, appendStreamingText, clearStreamingText,
    appendThinkingText, setIsThinking, clearThinking, loadConversation,
  } = useChatStore();
  const { activeProfile } = useProfileStore();

  const sendMessage = useCallback(
    (content: ContentBlock[], parentId?: string) => {
      if (!meta || !activeProfile) return;

      setStreaming(true);
      clearStreamingText();
      clearThinking();

      abortRef.current = startChatStream({
        conversationId: meta.id,
        content,
        parentId,
        model: meta.model,
        profileId: activeProfile.id,
        onEvent: (event) => {
          if (event.type === "thinking") {
            appendThinkingText((event as { type: "thinking"; text: string }).text);
          }
          if (event.type === "assistant_chunk") {
            setIsThinking(false);
            appendStreamingText(event.text);
          }
          if (event.type === "assistant_done" || event.type === "done") {
            loadConversation(meta.id);
          }
        },
        onError: (err) => {
          console.error("Stream error:", err);
          setStreaming(false);
          clearThinking();
        },
        onDone: () => {
          setStreaming(false);
          clearStreamingText();
          clearThinking();
        },
      });
    },
    [meta, activeProfile, setStreaming, appendStreamingText, clearStreamingText, appendThinkingText, setIsThinking, clearThinking, loadConversation],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    clearStreamingText();
    clearThinking();
  }, [setStreaming, clearStreamingText, clearThinking]);

  return { sendMessage, abort };
}
