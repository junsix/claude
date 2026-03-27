import { MarkdownRenderer } from "./markdown-renderer.js";
import { useChatStore } from "./store.js";

export function StreamingIndicator() {
  const { isStreaming, streamingText } = useChatStore();

  if (!isStreaming) return null;

  return (
    <div className="flex gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold shrink-0 animate-pulse">
        C
      </div>
      <div className="prose prose-invert max-w-none">
        {streamingText ? (
          <MarkdownRenderer content={streamingText} />
        ) : (
          <span className="text-zinc-500 animate-pulse">Thinking...</span>
        )}
      </div>
    </div>
  );
}
