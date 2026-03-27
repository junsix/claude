import { useState, useEffect } from "react";
import { useProfileStore } from "../../hooks/use-profile.js";
import { apiFetch } from "../../lib/api-client.js";
import type { Profile } from "@claude-copy/shared";

export function ProfileEditor() {
  const { activeProfile } = useProfileStore();
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (activeProfile) setForm({ ...activeProfile });
  }, [activeProfile]);

  const save = async () => {
    if (!activeProfile) return;
    await apiFetch(`/profiles/${activeProfile.id}`, { method: "PUT", body: JSON.stringify(form) });
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Name</label>
        <input className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={save} />
      </div>
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Role</label>
        <input className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm" value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} onBlur={save} />
      </div>
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Language</label>
        <input className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm" value={form.language ?? ""} onChange={(e) => setForm({ ...form, language: e.target.value })} onBlur={save} />
      </div>
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Global Instructions</label>
        <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm min-h-24" value={form.globalInstructions ?? ""} onChange={(e) => setForm({ ...form, globalInstructions: e.target.value })} onBlur={save} placeholder="Instructions applied to all conversations..." />
      </div>
    </div>
  );
}
