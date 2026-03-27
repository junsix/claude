import { MarkdownRenderer } from "./markdown-renderer.js";
import { ThinkingBlock } from "./ThinkingBlock.js";
import { useChatStore } from "./store.js";

export function StreamingIndicator() {
  const { isStreaming, streamingText, thinkingText, isThinking } = useChatStore();

  if (!isStreaming) return null;

  return (
    <div className="flex gap-3 py-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5 animate-pulse"
        style={{ background: "var(--color-accent)" }}>
        C
      </div>
      <div className="flex-1 min-w-0">
        {/* Thinking block (live) */}
        {thinkingText && (
          <ThinkingBlock thinking={thinkingText} isLive={isThinking} />
        )}

        {/* Response text */}
        {streamingText ? (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
            <MarkdownRenderer content={streamingText} />
          </div>
        ) : !thinkingText ? (
          <div className="flex items-center gap-1.5 pt-2">
            <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "var(--color-text-tertiary)" }} />
            <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "var(--color-text-tertiary)" }} />
            <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "var(--color-text-tertiary)" }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
