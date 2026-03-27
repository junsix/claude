import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client.js";
import type { Project, ConversationMeta } from "@claude-copy/shared";

export function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<(Project & { instructions: string }) | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);

  useEffect(() => {
    if (!id) return;
    apiFetch<Project & { instructions: string }>(`/projects/${id}`).then(setProject);
    apiFetch<{ data: ConversationMeta[] }>("/conversations?limit=50").then((res) =>
      setConversations(res.data.filter((c) => c.projectId === id))
    );
  }, [id]);

  if (!project) return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <button
          className="text-xs text-zinc-500 hover:text-zinc-300"
          onClick={() => navigate(`/project/${id}/settings`)}
        >
          Settings
        </button>
      </div>
      {project.description && <p className="text-sm text-zinc-400 mb-6">{project.description}</p>}

      <div className="mb-4">
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Local Paths ({project.localPaths.length})</h2>
        {project.localPaths.map((p) => (
          <div key={p} className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded mb-1">{p}</div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Conversations ({conversations.length})</h2>
        {conversations.map((c) => (
          <div
            key={c.id}
            className="text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer py-1"
            onClick={() => navigate(`/chat/${c.id}`)}
          >
            {c.title}
          </div>
        ))}
        {conversations.length === 0 && <p className="text-xs text-zinc-600">No conversations in this project</p>}
      </div>
    </div>
  );
}
