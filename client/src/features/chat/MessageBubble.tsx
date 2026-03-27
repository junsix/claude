import { useState } from "react";
import type { Message } from "@claude-copy/shared";
import { MarkdownRenderer } from "./markdown-renderer.js";
import { ThinkingBlock } from "./ThinkingBlock.js";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showCopy, setShowCopy] = useState(false);
  const isUser = message.role === "user";
  const textContent = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  const thinkingContent = message.content
    .filter((b) => b.type === "thinking")
    .map((b) => (b as { type: "thinking"; thinking: string }).thinking)
    .join("\n");

  return (
    <div
      className={`group relative flex gap-3 py-4 ${isUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5"
          style={{ background: "var(--color-accent)" }}>
          C
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
        <div className={isUser
          ? "inline-block rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]"
          : "max-w-none"
        } style={isUser ? { background: "var(--color-user-bubble)" } : {}}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text)" }}>{textContent}</p>
          ) : (
            <>
              {thinkingContent && <ThinkingBlock thinking={thinkingContent} />}
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-code:text-rose-600 prose-code:bg-gray-50 prose-code:px-1 prose-code:rounded">
                <MarkdownRenderer content={textContent} />
              </div>
            </>
          )}
        </div>

        {showCopy && (
          <div className={`flex mt-1 ${isUser ? "justify-end" : ""}`}>
            <button
              className="text-[10px] px-2 py-0.5 rounded transition"
              style={{ color: "var(--color-text-tertiary)", background: "var(--color-border-light)" }}
              onClick={() => navigator.clipboard.writeText(textContent)}
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
