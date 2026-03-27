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
    return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading conversation...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-medium">{meta.title}</h1>
      </div>
      <MessageList />
      <MessageInput />
    </div>
  );
}
