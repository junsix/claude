import { useArtifactStore } from "./store.js";

export function ArtifactCodeView() {
  const { activeContent, activeArtifact } = useArtifactStore();
  if (!activeArtifact) return null;

  return (
    <div className="h-full overflow-auto">
      <pre className="p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap">{activeContent}</pre>
    </div>
  );
}
