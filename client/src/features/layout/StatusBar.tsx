import { useChatStore } from "../chat/store.js";

export function StatusBar() {
  const { meta } = useChatStore();
  const usage = meta?.usage;
  if (!usage || usage.messageCount === 0) return null;

  return (
    <div className="text-center py-1.5 text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
      {usage.totalInputTokens.toLocaleString()} in / {usage.totalOutputTokens.toLocaleString()} out · ${usage.totalCostUsd.toFixed(4)}
    </div>
  );
}
