import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api-client.js";
import type { MemoryEntry } from "@claude-copy/shared";

export function MemoryManager() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);

  const load = () => apiFetch<{ data: MemoryEntry[] }>("/settings/memories").then((r) => setMemories(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (mem: MemoryEntry) => {
    await apiFetch(`/settings/memories/${mem.id}`, { method: "PUT", body: JSON.stringify({ active: !mem.active }) });
    load();
  };

  const remove = async (id: string) => {
    await apiFetch(`/settings/memories/${id}`, { method: "DELETE" });
    load();
  };

  const clearAll = async () => {
    await apiFetch("/settings/memories", { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-400">{memories.length} memories</span>
        {memories.length > 0 && (
          <button className="text-xs text-red-400 hover:text-red-300" onClick={clearAll}>Clear all</button>
        )}
      </div>
      {memories.map((mem) => (
        <div key={mem.id} className="flex items-start gap-3 py-2 border-b border-zinc-800/50">
          <button className={`text-xs mt-0.5 ${mem.active ? "text-green-400" : "text-zinc-600"}`} onClick={() => toggle(mem)}>
            {mem.active ? "ON" : "OFF"}
          </button>
          <div className="flex-1">
            <p className="text-sm text-zinc-300">{mem.content}</p>
            <span className="text-xs text-zinc-600">{mem.category}</span>
          </div>
          <button className="text-xs text-zinc-600 hover:text-red-400" onClick={() => remove(mem.id)}>x</button>
        </div>
      ))}
      {memories.length === 0 && <p className="text-sm text-zinc-600">No memories yet</p>}
    </div>
  );
}
