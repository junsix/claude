import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api-client.js";
import type { Project } from "@claude-copy/shared";

export function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<(Project & { instructions: string }) | null>(null);
  const [instructions, setInstructions] = useState("");
  const [newPath, setNewPath] = useState("");

  useEffect(() => {
    if (!id) return;
    apiFetch<Project & { instructions: string }>(`/projects/${id}`).then((p) => {
      setProject(p);
      setInstructions(p.instructions);
    });
  }, [id]);

  if (!project) return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;

  const saveInstructions = async () => {
    await apiFetch(`/projects/${id}/instructions`, { method: "PUT", body: JSON.stringify({ content: instructions }) });
  };

  const addPath = async () => {
    if (!newPath.trim()) return;
    const updated = await apiFetch<Project>(`/projects/${id}/local-paths`, { method: "POST", body: JSON.stringify({ path: newPath }) });
    setProject({ ...project, ...updated, instructions });
    setNewPath("");
  };

  const removePath = async (p: string) => {
    const updated = await apiFetch<Project>(`/projects/${id}/local-paths`, { method: "DELETE", body: JSON.stringify({ path: p }) });
    setProject({ ...project, ...updated, instructions });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      <h1 className="text-xl font-semibold">Project Settings: {project.name}</h1>

      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Custom Instructions</h2>
        <textarea
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm min-h-32 focus:outline-none focus:border-zinc-500"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          onBlur={saveInstructions}
          placeholder="Enter custom instructions for this project..."
        />
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Knowledge Files ({project.knowledgeFiles.length})</h2>
        {project.knowledgeFiles.map((kf) => (
          <div key={kf.id} className="flex items-center gap-2 text-sm text-zinc-400 py-1">
            <span>{kf.name}</span>
            <span className="text-xs text-zinc-600">({Math.round(kf.size / 1024)}KB)</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Local Paths</h2>
        {project.localPaths.map((p) => (
          <div key={p} className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded flex-1">{p}</span>
            <button className="text-xs text-red-400 hover:text-red-300" onClick={() => removePath(p)}>Remove</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none"
            placeholder="/path/to/folder"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
          />
          <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded" onClick={addPath}>Add</button>
        </div>
      </div>
    </div>
  );
}
