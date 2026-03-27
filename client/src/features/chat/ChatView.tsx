import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "./store.js";
import { MessageList } from "./MessageList.js";
import { MessageInput } from "./MessageInput.js";

export function ChatView() {
  const { id } = useParams<{ id: string }>();
  const { loadConversation, meta } = useChatStore();

  useEffect(() => {
    if (id) loadConversation(id);
  }, [id, loadConversation]);

  if (!meta) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "var(--color-accent)" }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "var(--color-accent)" }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "var(--color-accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-4 py-2.5 flex items-center border-b" style={{ borderColor: "var(--color-border-light)" }}>
        <h1 className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{meta.title}</h1>
      </div>
      <MessageList />
      <div className="shrink-0">
        <MessageInput />
      </div>
    </div>
  );
}
