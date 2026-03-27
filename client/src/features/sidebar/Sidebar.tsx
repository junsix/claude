import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "./store.js";
import { SearchBar } from "./SearchBar.js";
import { ConversationList } from "./ConversationList.js";
import { ProfileSwitcher } from "./ProfileSwitcher.js";

export function Sidebar() {
  const navigate = useNavigate();
  const { conversations, searchQuery, searchResults, collapsed, loadConversations, createConversation } = useSidebarStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (collapsed) return null;

  const handleNewChat = async () => {
    const conv = await createConversation("claude-sonnet-4-6", "normal");
    navigate(`/chat/${conv.id}`);
  };

  const displayedConversations = searchQuery ? searchResults : conversations;

  return (
    <aside className="w-70 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-3 flex items-center justify-between border-b border-zinc-800">
        <div className="text-sm font-semibold">Claude Copy</div>
        <button
          className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded"
          onClick={handleNewChat}
        >
          + New
        </button>
      </div>
      <div className="p-2">
        <ProfileSwitcher />
      </div>
      <div className="px-2 pb-2">
        <SearchBar />
      </div>
      <ConversationList conversations={displayedConversations} />
    </aside>
  );
}
