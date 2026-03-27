import { useState, useRef, useCallback } from "react";
import { useChatStream } from "./use-chat-stream.js";
import { useChatStore } from "./store.js";

export function MessageInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, abort } = useChatStream();
  const { isStreaming, meta } = useChatStore();

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage([{ type: "text", text: trimmed }]);
    setText("");
  }, [text, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && isStreaming) {
        abort();
      }
    },
    [handleSubmit, isStreaming, abort],
  );

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
          <span>{meta?.model ?? "claude-sonnet-4-6"}</span>
          <span>&middot;</span>
          <span>{meta?.style ?? "normal"}</span>
        </div>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-zinc-500 min-h-12 max-h-48"
            placeholder="Send a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isStreaming ? (
            <button className="px-4 py-2 bg-red-600 rounded-xl text-sm hover:bg-red-500" onClick={abort}>
              Stop
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-orange-600 rounded-xl text-sm hover:bg-orange-500 disabled:opacity-40"
              disabled={!text.trim()}
              onClick={handleSubmit}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
