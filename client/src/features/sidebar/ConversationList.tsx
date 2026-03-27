import type { ConversationMeta } from "@claude-copy/shared";
import { ConversationItem } from "./ConversationItem.js";

interface ConversationListProps {
  conversations: ConversationMeta[];
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(dateStr).toDateString() === yesterday.toDateString();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
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
    <div className="flex-1 overflow-y-auto px-2 space-y-3">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="text-[11px] font-medium uppercase tracking-wide px-2 mb-1" style={{ color: "var(--color-text-tertiary)" }}>
            {section.label}
          </div>
          {section.items.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      ))}
      {conversations.length === 0 && (
        <div className="text-center text-sm py-8" style={{ color: "var(--color-text-tertiary)" }}>
          No conversations yet
        </div>
      )}
    </div>
  );
}
