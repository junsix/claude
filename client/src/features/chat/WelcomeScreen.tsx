import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "../sidebar/store.js";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { createConversation } = useSidebarStore();

  const handleNew = async () => {
    const conv = await createConversation("claude-sonnet-4-6", "normal");
    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="text-4xl font-light text-zinc-300">Claude Copy</div>
      <p className="text-sm text-zinc-500 max-w-md text-center">
        Start a conversation with Claude. Your messages and data are stored locally.
      </p>
      <button
        className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-full text-sm font-medium transition"
        onClick={handleNew}
      >
        Start New Conversation
      </button>
    </div>
  );
}
