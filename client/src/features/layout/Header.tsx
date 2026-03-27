import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../../hooks/use-profile.js";

export function Header() {
  const navigate = useNavigate();
  const { activeProfile } = useProfileStore();

  return (
    <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
      <span className="font-semibold text-sm">Claude Copy</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">{activeProfile?.name}</span>
        <button className="text-zinc-400 hover:text-zinc-200 text-xs" onClick={() => navigate("/settings")}>
          Settings
        </button>
      </div>
    </header>
  );
}
