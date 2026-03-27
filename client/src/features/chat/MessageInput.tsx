import { useState, useRef, useCallback } from "react";
import { useChatStream } from "./use-chat-stream.js";
import { useChatStore } from "./store.js";
import { apiFetch } from "../../lib/api-client.js";
import { BUILTIN_STYLES } from "@claude-copy/shared";

const MODELS = [
  { id: "claude-opus-4-6", label: "Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
];

export function MessageInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, abort } = useChatStream();
  const { isStreaming, meta, updateMeta } = useChatStore();
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const currentModel = MODELS.find((m) => m.id === meta?.model) ?? MODELS[1];
  const currentStyleId = meta?.style ?? "normal";

  const handleModelChange = async (modelId: string) => {
    if (!meta) return;
    setShowModelMenu(false);
    updateMeta({ model: modelId });
    await apiFetch(`/conversations/${meta.id}`, {
      method: "PUT",
      body: JSON.stringify({ model: modelId }),
    }).catch(() => {});
  };

  const handleStyleChange = async (styleId: string) => {
    if (!meta) return;
    setShowStyleMenu(false);
    updateMeta({ style: styleId });
    await apiFetch(`/conversations/${meta.id}`, {
      method: "PUT",
      body: JSON.stringify({ style: styleId }),
    }).catch(() => {});
  };

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
        <div className="flex items-center gap-3 mb-2">
          {/* Model selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-2.5 py-1.5 transition"
              onClick={() => { setShowModelMenu(!showModelMenu); setShowStyleMenu(false); }}
            >
              <span className="text-zinc-300">{currentModel.label}</span>
              <span className="text-zinc-600 text-[10px]">&#9662;</span>
            </button>
            {showModelMenu && (
              <div className="absolute bottom-9 left-0 bg-zinc-800 border border-zinc-700 rounded-lg py-1 z-50 min-w-44 shadow-xl">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 flex items-center justify-between ${
                      m.id === meta?.model ? "text-orange-400" : "text-zinc-300"
                    }`}
                    onClick={() => handleModelChange(m.id)}
                  >
                    <span>{m.label}</span>
                    {m.id === meta?.model && <span>&#10003;</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-2.5 py-1.5 transition"
              onClick={() => { setShowStyleMenu(!showStyleMenu); setShowModelMenu(false); }}
            >
              <span className="text-zinc-300">
                {BUILTIN_STYLES[currentStyleId as keyof typeof BUILTIN_STYLES]?.name ?? currentStyleId}
              </span>
              <span className="text-zinc-600 text-[10px]">&#9662;</span>
            </button>
            {showStyleMenu && (
              <div className="absolute bottom-9 left-0 bg-zinc-800 border border-zinc-700 rounded-lg py-1 z-50 min-w-44 shadow-xl">
                {Object.entries(BUILTIN_STYLES).map(([id, style]) => (
                  <button
                    key={id}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 flex items-center justify-between ${
                      id === currentStyleId ? "text-orange-400" : "text-zinc-300"
                    }`}
                    onClick={() => handleStyleChange(id)}
                  >
                    <div>
                      <div>{style.name}</div>
                      {style.prompt && <div className="text-[10px] text-zinc-500 mt-0.5">{style.prompt.slice(0, 40)}...</div>}
                    </div>
                    {id === currentStyleId && <span>&#10003;</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
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
