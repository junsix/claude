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
          <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-zinc-800/50 px-4 py-2.5 flex items-center">
        <h1 className="text-sm font-medium text-zinc-300 truncate">{meta.title}</h1>
      </div>
      <MessageList />
      <MessageInput />
    </div>
  );
}
