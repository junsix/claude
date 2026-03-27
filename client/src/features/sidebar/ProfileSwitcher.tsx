import { useState } from "react";
import { useProfileStore } from "../../hooks/use-profile.js";

export function ProfileSwitcher() {
  const { index, activeProfile, switchProfile } = useProfileStore();
  const [open, setOpen] = useState(false);

  if (!index || !activeProfile) return null;

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 text-sm text-zinc-300 hover:text-zinc-100"
        onClick={() => setOpen(!open)}
      >
        <span>{activeProfile.name}</span>
        <span className="text-zinc-600 text-xs">v</span>
      </button>
      {open && (
        <div className="absolute left-0 top-8 bg-zinc-800 border border-zinc-700 rounded-lg py-1 z-50 min-w-40 shadow-lg">
          {index.profiles.map((p) => (
            <button
              key={p.id}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 ${p.id === activeProfile.id ? "text-orange-400" : "text-zinc-300"}`}
              onClick={() => { switchProfile(p.id); setOpen(false); }}
            >
              {p.name} {p.id === activeProfile.id && "\u2713"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
