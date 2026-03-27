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
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <button
        className="hover:text-zinc-300 disabled:opacity-30"
        disabled={currentIdx === 0}
        onClick={() => switchBranch(messageId, "prev")}
      >
        &larr;
      </button>
      <span>{currentIdx + 1}/{siblings.length}</span>
      <button
        className="hover:text-zinc-300 disabled:opacity-30"
        disabled={currentIdx === siblings.length - 1}
        onClick={() => switchBranch(messageId, "next")}
      >
        &rarr;
      </button>
    </div>
  );
}
