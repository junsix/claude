import type { Message } from "@claude-copy/shared";
import { MarkdownRenderer } from "./markdown-renderer.js";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const textContent = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return (
    <div className={`flex gap-3 py-4 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold shrink-0">
          C
        </div>
      )}
      <div className={`max-w-3xl ${isUser ? "bg-zinc-800 rounded-2xl px-4 py-3" : "prose prose-invert max-w-none"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{textContent}</p>
        ) : (
          <MarkdownRenderer content={textContent} />
        )}
      </div>
    </div>
  );
}
