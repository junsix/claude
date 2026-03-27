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
    await apiFetch(`/conversations/${meta.id}`, { method: "PUT", body: JSON.stringify({ model: modelId }) }).catch(() => {});
  };

  const handleStyleChange = async (styleId: string) => {
    if (!meta) return;
    setShowStyleMenu(false);
    updateMeta({ style: styleId });
    await apiFetch(`/conversations/${meta.id}`, { method: "PUT", body: JSON.stringify({ style: styleId }) }).catch(() => {});
  };

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage([{ type: "text", text: trimmed }]);
    setText("");
  }, [text, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
      if (e.key === "Escape" && isStreaming) { abort(); }
    },
    [handleSubmit, isStreaming, abort],
  );

  return (
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)" }}>
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent px-4 pt-4 pb-2 text-sm resize-none focus:outline-none min-h-[52px] max-h-[200px]"
            style={{ color: "var(--color-text)" }}
            placeholder="Message Claude..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              {/* Model selector */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
                  style={{ color: "var(--color-text-secondary)" }}
                  onClick={() => { setShowModelMenu(!showModelMenu); setShowStyleMenu(false); }}
                >
                  <span>{currentModel.label}</span>
                  <span className="text-[10px]">▾</span>
                </button>
                {showModelMenu && (
                  <div className="absolute bottom-9 left-0 bg-white border rounded-xl py-1.5 z-50 min-w-48 shadow-lg" style={{ borderColor: "var(--color-border)" }}>
                    {MODELS.map((m) => (
                      <button key={m.id}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between transition"
                        style={{ color: m.id === meta?.model ? "var(--color-accent)" : "var(--color-text)" }}
                        onClick={() => handleModelChange(m.id)}
                      >
                        <span>{m.label}</span>
                        {m.id === meta?.model && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Style selector */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
                  style={{ color: "var(--color-text-secondary)" }}
                  onClick={() => { setShowStyleMenu(!showStyleMenu); setShowModelMenu(false); }}
                >
                  <span>{BUILTIN_STYLES[currentStyleId as keyof typeof BUILTIN_STYLES]?.name ?? currentStyleId}</span>
                  <span className="text-[10px]">▾</span>
                </button>
                {showStyleMenu && (
                  <div className="absolute bottom-9 left-0 bg-white border rounded-xl py-1.5 z-50 min-w-48 shadow-lg" style={{ borderColor: "var(--color-border)" }}>
                    {Object.entries(BUILTIN_STYLES).map(([id, style]) => (
                      <button key={id}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition"
                        style={{ color: id === currentStyleId ? "var(--color-accent)" : "var(--color-text)" }}
                        onClick={() => handleStyleChange(id)}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button className="w-8 h-8 flex items-center justify-center rounded-lg transition" style={{ background: "var(--color-text-tertiary)" }} onClick={abort} title="Stop">
                  <div className="w-3 h-3 bg-white rounded-sm" />
                </button>
              ) : (
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition text-white disabled:opacity-30"
                  style={{ background: "var(--color-accent)" }}
                  disabled={!text.trim()}
                  onClick={handleSubmit}
                  title="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
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
