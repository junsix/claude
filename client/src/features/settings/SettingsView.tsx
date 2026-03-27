import { useState } from "react";
import { ProfileEditor } from "./ProfileEditor.js";
import { MemoryManager } from "./MemoryManager.js";
import { StyleManager } from "./StyleManager.js";

type Tab = "profile" | "memory" | "styles";

export function SettingsView() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
        {(["profile", "memory", "styles"] as Tab[]).map((t) => (
          <button key={t} className={`text-sm ${tab === t ? "text-orange-400 font-medium" : "text-zinc-500 hover:text-zinc-300"}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "profile" && <ProfileEditor />}
      {tab === "memory" && <MemoryManager />}
      {tab === "styles" && <StyleManager />}
    </div>
  );
}
