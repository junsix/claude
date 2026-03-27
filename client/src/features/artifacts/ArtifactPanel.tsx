import { useArtifactStore } from "./store.js";
import { ArtifactPreview } from "./ArtifactPreview.js";
import { ArtifactCodeView } from "./ArtifactCodeView.js";

export function ArtifactPanel() {
  const { activeArtifact, activeTab, setTab, closePanel } = useArtifactStore();

  if (!activeArtifact) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-sm font-medium truncate">{activeArtifact.title}</span>
        <div className="flex items-center gap-2">
          <button
            className={`text-xs px-2 py-1 rounded ${activeTab === "preview" ? "bg-zinc-700" : "hover:bg-zinc-800"}`}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${activeTab === "code" ? "bg-zinc-700" : "hover:bg-zinc-800"}`}
            onClick={() => setTab("code")}
          >
            Code
          </button>
          <button className="text-xs text-zinc-500 hover:text-zinc-300 ml-2" onClick={closePanel}>
            x
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" ? <ArtifactPreview /> : <ArtifactCodeView />}
      </div>
      <div className="px-3 py-1.5 border-t border-zinc-800 text-xs text-zinc-600">
        v{activeArtifact.currentVersion} | {activeArtifact.type} | {activeArtifact.language}
      </div>
    </div>
  );
}
