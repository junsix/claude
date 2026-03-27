import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api-client.js";
import type { CustomStyle } from "@claude-copy/shared";
import { BUILTIN_STYLES } from "@claude-copy/shared";

export function StyleManager() {
  const [styles, setStyles] = useState<CustomStyle[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  const load = () => apiFetch<{ data: CustomStyle[] }>("/settings/styles").then((r) => setStyles(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    await apiFetch("/settings/styles", { method: "POST", body: JSON.stringify({ name: newName, description: "", prompt: newPrompt }) });
    setNewName(""); setNewPrompt(""); load();
  };

  const remove = async (id: string) => {
    await apiFetch(`/settings/styles/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-300 mb-2">Built-in Styles</h3>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {Object.entries(BUILTIN_STYLES).map(([id, style]) => (
          <div key={id} className="bg-zinc-900 rounded-lg p-3">
            <div className="text-sm font-medium">{style.name}</div>
            <div className="text-xs text-zinc-500 mt-1">{style.prompt || "Default style"}</div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-medium text-zinc-300 mb-2">Custom Styles ({styles.length})</h3>
      {styles.map((style) => (
        <div key={style.id} className="flex items-start gap-2 py-2 border-b border-zinc-800/50">
          <div className="flex-1">
            <div className="text-sm">{style.name}</div>
            <div className="text-xs text-zinc-500">{style.prompt}</div>
          </div>
          <button className="text-xs text-zinc-600 hover:text-red-400" onClick={() => remove(style.id)}>x</button>
        </div>
      ))}

      <div className="mt-4 space-y-2">
        <input className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm" placeholder="Style name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm min-h-16" placeholder="Style prompt..." value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} />
        <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded" onClick={create}>Create Style</button>
      </div>
    </div>
  );
}
