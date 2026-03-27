import { useNavigate, useParams } from "react-router-dom";
import type { ConversationMeta } from "@claude-copy/shared";
import { useSidebarStore } from "./store.js";
import { useState } from "react";

interface ConversationItemProps {
  conversation: ConversationMeta;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const navigate = useNavigate();
  const { id: activeId } = useParams();
  const { deleteConversation, updateConversation } = useSidebarStore();
  const [showMenu, setShowMenu] = useState(false);
  const isActive = activeId === conversation.id;

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition"
      style={{
        background: isActive ? "rgba(217,119,87,0.12)" : "transparent",
        color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
      }}
      onClick={() => navigate(`/chat/${conversation.id}`)}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {conversation.starred && <span className="text-amber-500 text-xs">★</span>}
      <span className="truncate flex-1">{conversation.title}</span>
      <div className="relative">
        <button
          className="opacity-0 group-hover:opacity-100 text-xs px-1 transition"
          style={{ color: "var(--color-text-tertiary)" }}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        >
          ···
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 bg-white border rounded-lg py-1 z-50 min-w-32 shadow-lg" style={{ borderColor: "var(--color-border)" }}>
            <button
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              style={{ color: "var(--color-text)" }}
              onClick={(e) => { e.stopPropagation(); updateConversation(conversation.id, { starred: !conversation.starred }); setShowMenu(false); }}
            >
              {conversation.starred ? "Unstar" : "Star"}
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-red-500"
              onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); setShowMenu(false); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
