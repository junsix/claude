import { useState } from "react";

interface ThinkingBlockProps {
  thinking: string;
  isLive?: boolean;
}

export function ThinkingBlock({ thinking, isLive = false }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(isLive);

  if (!thinking) return null;

  return (
    <div className="my-2 rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)", background: "#FDFCFA" }}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-gray-50"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
        {isLive ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
            Thinking...
          </span>
        ) : (
          <span>View thinking</span>
        )}
        {!isLive && (
          <span style={{ color: "var(--color-text-tertiary)" }}>
            ({thinking.split(/\s+/).length} words)
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--color-border-light)" }}>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed mt-2 font-mono" style={{ color: "var(--color-text-secondary)" }}>
            {thinking}
          </pre>
        </div>
      )}
    </div>
  );
}
