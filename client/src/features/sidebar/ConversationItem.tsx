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
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
        isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
      }`}
      onClick={() => navigate(`/chat/${conversation.id}`)}
    >
      {conversation.starred && <span className="text-yellow-500 text-xs">*</span>}
      <span className="truncate flex-1">{conversation.title}</span>
      <div className="relative">
        <button
          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 text-xs px-1"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        >
          ...
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 bg-zinc-800 border border-zinc-700 rounded-lg py-1 z-50 min-w-32 shadow-lg">
            <button
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700"
              onClick={(e) => { e.stopPropagation(); updateConversation(conversation.id, { starred: !conversation.starred }); setShowMenu(false); }}
            >
              {conversation.starred ? "Unstar" : "Star"}
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-700"
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
