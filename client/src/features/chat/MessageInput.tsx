import { useState, useRef, useCallback, useEffect } from "react";
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

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [text]);

  const handleModelChange = async (modelId: string) => {
    if (!meta) return;
    setShowModelMenu(false);
    updateMeta({ model: modelId });
    await apiFetch(`/conversations/${meta.id}`, {
      method: "PUT", body: JSON.stringify({ model: modelId }),
    }).catch(() => {});
  };

  const handleStyleChange = async (styleId: string) => {
    if (!meta) return;
    setShowStyleMenu(false);
    updateMeta({ style: styleId });
    await apiFetch(`/conversations/${meta.id}`, {
      method: "PUT", body: JSON.stringify({ style: styleId }),
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
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent px-4 pt-4 pb-2 text-sm resize-none focus:outline-none min-h-[52px] max-h-[200px] placeholder:text-zinc-600"
            placeholder="Message Claude..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          {/* Bottom bar inside the card */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              {/* Model selector */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg px-2 py-1.5 transition"
                  onClick={() => { setShowModelMenu(!showModelMenu); setShowStyleMenu(false); }}
                >
                  <span>{currentModel.label}</span>
                  <span className="text-[10px]">&#9662;</span>
                </button>
                {showModelMenu && (
                  <div className="absolute bottom-9 left-0 bg-zinc-800 border border-zinc-700 rounded-xl py-1.5 z-50 min-w-48 shadow-xl">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700/50 flex items-center justify-between transition ${
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
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg px-2 py-1.5 transition"
                  onClick={() => { setShowStyleMenu(!showStyleMenu); setShowModelMenu(false); }}
                >
                  <span>{BUILTIN_STYLES[currentStyleId as keyof typeof BUILTIN_STYLES]?.name ?? currentStyleId}</span>
                  <span className="text-[10px]">&#9662;</span>
                </button>
                {showStyleMenu && (
                  <div className="absolute bottom-9 left-0 bg-zinc-800 border border-zinc-700 rounded-xl py-1.5 z-50 min-w-48 shadow-xl">
                    {Object.entries(BUILTIN_STYLES).map(([id, style]) => (
                      <button
                        key={id}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700/50 transition ${
                          id === currentStyleId ? "text-orange-400" : "text-zinc-300"
                        }`}
                        onClick={() => handleStyleChange(id)}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Send / Stop */}
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  className="w-8 h-8 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
                  onClick={abort}
                  title="Stop"
                >
                  <div className="w-3 h-3 bg-zinc-300 rounded-sm" />
                </button>
              ) : (
                <button
                  className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg transition disabled:opacity-20 disabled:hover:bg-zinc-100"
                  disabled={!text.trim()}
                  onClick={handleSubmit}
                  title="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
