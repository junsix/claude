import { useBranch } from "./use-branch.js";

interface BranchNavigatorProps {
  messageId: string;
}

export function BranchNavigator({ messageId }: BranchNavigatorProps) {
  const { getSiblings, switchBranch } = useBranch();
  const siblings = getSiblings(messageId);
  if (siblings.length <= 1) return null;
  const currentIdx = siblings.findIndex((s) => s.id === messageId);

  return (
    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
      <button className="hover:opacity-70 disabled:opacity-30" disabled={currentIdx === 0} onClick={() => switchBranch(messageId, "prev")}>←</button>
      <span>{currentIdx + 1}/{siblings.length}</span>
      <button className="hover:opacity-70 disabled:opacity-30" disabled={currentIdx === siblings.length - 1} onClick={() => switchBranch(messageId, "next")}>→</button>
    </div>
  );
}
