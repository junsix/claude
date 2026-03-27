import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";
import { Sidebar } from "../features/sidebar/Sidebar.js";
import { ArtifactPanel } from "../features/artifacts/ArtifactPanel.js";
import { useArtifactStore } from "../features/artifacts/store.js";

export default function App() {
  const { loading, initialize } = useProfileStore();
  const panelOpen = useArtifactStore((s) => s.panelOpen);

  useEffect(() => { initialize(); }, [initialize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "var(--color-accent)" }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "var(--color-accent)" }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "var(--color-accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      {panelOpen && (
        <aside className="w-[420px] border-l overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          <ArtifactPanel />
        </aside>
      )}
    </div>
  );
}
