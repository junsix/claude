import { useArtifactStore } from "./store.js";
import { buildSandboxHtml } from "./sandbox-builder.js";

export function ArtifactPreview() {
  const { activeArtifact, activeContent } = useArtifactStore();
  if (!activeArtifact) return null;

  const html = buildSandboxHtml(activeArtifact.type, activeContent);
  if (!html) return <div className="p-4 text-zinc-500">Preview not available for this type</div>;

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-scripts"
      className="w-full h-full border-0 bg-zinc-950"
      title="Artifact Preview"
    />
  );
}
