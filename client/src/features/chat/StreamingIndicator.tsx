import { MarkdownRenderer } from "./markdown-renderer.js";
import { useChatStore } from "./store.js";

export function StreamingIndicator() {
  const { isStreaming, streamingText } = useChatStore();

  if (!isStreaming) return null;

  return (
    <div className="group relative flex gap-4 py-5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-1 animate-pulse">
        C
      </div>
      <div className="flex-1 min-w-0">
        {streamingText ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
            <MarkdownRenderer content={streamingText} />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pt-2">
            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
