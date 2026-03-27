import { useEffect, useRef } from "react";
import { useBranch } from "./use-branch.js";
import { MessageBubble } from "./MessageBubble.js";
import { BranchNavigator } from "./BranchNavigator.js";
import { StreamingIndicator } from "./StreamingIndicator.js";

export function MessageList() {
  const { activePath } = useBranch();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePath.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="max-w-3xl mx-auto">
        {activePath.map((msg) => (
          <div key={msg.id}>
            <BranchNavigator messageId={msg.id} />
            <MessageBubble message={msg} />
          </div>
        ))}
        <StreamingIndicator />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
