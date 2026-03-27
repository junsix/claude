import type { ConversationMeta } from "@claude-copy/shared";
import { ConversationItem } from "./ConversationItem.js";

interface ConversationListProps {
  conversations: ConversationMeta[];
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

export function ConversationList({ conversations }: ConversationListProps) {
  const starred = conversations.filter((c) => c.starred);
  const unstarred = conversations.filter((c) => !c.starred);

  const today = unstarred.filter((c) => isToday(c.updatedAt));
  const yesterday = unstarred.filter((c) => isYesterday(c.updatedAt));
  const last7 = unstarred.filter((c) => !isToday(c.updatedAt) && !isYesterday(c.updatedAt) && isWithinDays(c.updatedAt, 7));
  const older = unstarred.filter((c) => !isWithinDays(c.updatedAt, 7));

  const sections = [
    { label: "Starred", items: starred },
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterday },
    { label: "Last 7 days", items: last7 },
    { label: "Older", items: older },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="flex-1 overflow-y-auto space-y-3">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="text-xs text-zinc-600 font-medium px-2 mb-1">{section.label}</div>
          {section.items.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      ))}
      {conversations.length === 0 && (
        <div className="text-center text-zinc-600 text-sm py-8">No conversations yet</div>
      )}
    </div>
  );
}
