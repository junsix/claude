import { useChatStore } from "../chat/store.js";

export function StatusBar() {
  const { meta } = useChatStore();
  const usage = meta?.usage;

  return (
    <footer className="h-7 border-t border-zinc-800 flex items-center px-4 text-xs text-zinc-500 gap-4 shrink-0">
      {usage && usage.messageCount > 0 ? (
        <>
          <span>Tokens: {usage.totalInputTokens.toLocaleString()} in / {usage.totalOutputTokens.toLocaleString()} out</span>
          <span>Cost: ${usage.totalCostUsd.toFixed(4)}</span>
          <span>Messages: {usage.messageCount}</span>
        </>
      ) : (
        <span>Ready</span>
      )}
    </footer>
  );
}
