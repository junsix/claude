import { useState } from "react";
import type { Message } from "@claude-copy/shared";
import { MarkdownRenderer } from "./markdown-renderer.js";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === "user";
  const textContent = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
  };

  return (
    <div
      className={`group relative flex gap-4 py-5 ${isUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-1 ${
        isUser ? "bg-zinc-700 text-zinc-300" : "bg-gradient-to-br from-orange-500 to-amber-600 text-white"
      }`}>
        {isUser ? "U" : "C"}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
        <div className={isUser
          ? "inline-block bg-zinc-800/80 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]"
          : "max-w-none"
        }>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap text-zinc-100 leading-relaxed">{textContent}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
              <MarkdownRenderer content={textContent} />
            </div>
          )}
        </div>

        {/* Hover actions */}
        {showActions && (
          <div className={`flex items-center gap-1 mt-1.5 ${isUser ? "justify-end" : ""}`}>
            <button
              className="text-[10px] text-zinc-600 hover:text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-0.5 rounded transition"
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
