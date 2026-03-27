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
    <aside className="w-64 border-r border-zinc-800/50 flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-200">Claude Copy</span>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-zinc-200"
          onClick={handleNewChat}
          title="New conversation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Profile */}
      <div className="px-4 pb-3">
        <ProfileSwitcher />
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <SearchBar />
      </div>

      {/* Conversation list */}
      <ConversationList conversations={displayedConversations} />
    </aside>
  );
}
