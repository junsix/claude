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
    <aside className="w-[260px] flex flex-col h-full border-r" style={{ background: "var(--color-bg-sidebar)", borderColor: "var(--color-border)" }}>
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Claude Copy</span>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition hover:opacity-80"
          style={{ background: "var(--color-accent)", color: "white" }}
          onClick={handleNewChat}
          title="New conversation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <div className="px-4 pb-3">
        <ProfileSwitcher />
      </div>
      <div className="px-3 pb-3">
        <SearchBar />
      </div>
      <ConversationList conversations={displayedConversations} />
    </aside>
  );
}
