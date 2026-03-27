import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api-client.js";
import type { FileEntry } from "@claude-copy/shared";

interface FileBrowserProps {
  projectId: string;
  rootPath: string;
}

export function FileBrowser({ projectId, rootPath }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [entries, setEntries] = useState<FileEntry[]>([]);

  useEffect(() => {
    apiFetch<{ data: FileEntry[] }>(`/files/browse?projectId=${projectId}&path=${encodeURIComponent(currentPath)}`)
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]));
  }, [projectId, currentPath]);

  return (
    <div className="text-sm">
      <div className="text-xs text-zinc-600 font-mono mb-2 truncate">{currentPath}</div>
      {currentPath !== rootPath && (
        <button className="text-xs text-zinc-500 hover:text-zinc-300 mb-1" onClick={() => setCurrentPath(rootPath)}>&larr; Back to root</button>
      )}
      {entries.map((entry) => (
        <div
          key={entry.path}
          className="flex items-center gap-2 py-0.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
          onClick={() => entry.isDirectory && setCurrentPath(entry.path)}
        >
          <span className="text-xs">{entry.isDirectory ? "\uD83D\uDCC1" : "\uD83D\uDCC4"}</span>
          <span className="truncate">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}
