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
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-semibold" style={{ background: "var(--color-accent)" }}>
        C
      </div>
      <div className="text-2xl font-light" style={{ color: "var(--color-text)" }}>
        How can I help you today?
      </div>
      <p className="text-sm max-w-md text-center" style={{ color: "var(--color-text-secondary)" }}>
        Start a conversation with Claude. Your messages and data are stored locally on your machine.
      </p>
      <button
        className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition hover:opacity-90"
        style={{ background: "var(--color-accent)" }}
        onClick={handleNew}
      >
        Start New Conversation
      </button>
    </div>
  );
}
