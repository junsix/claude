import { useState } from "react";
import { useProfileStore } from "../../hooks/use-profile.js";

export function ProfileSwitcher() {
  const { index, activeProfile, switchProfile } = useProfileStore();
  const [open, setOpen] = useState(false);

  if (!index || !activeProfile) return null;

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 text-sm transition"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => setOpen(!open)}
      >
        <span>{activeProfile.name}</span>
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-8 bg-white border rounded-lg py-1 z-50 min-w-40 shadow-lg" style={{ borderColor: "var(--color-border)" }}>
          {index.profiles.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              style={{ color: p.id === activeProfile.id ? "var(--color-accent)" : "var(--color-text)" }}
              onClick={() => { switchProfile(p.id); setOpen(false); }}
            >
              {p.name} {p.id === activeProfile.id && "✓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
