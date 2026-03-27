import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";
import { Sidebar } from "../features/sidebar/Sidebar.js";
import { Header } from "../features/layout/Header.js";
import { StatusBar } from "../features/layout/StatusBar.js";
import { ArtifactPanel } from "../features/artifacts/ArtifactPanel.js";
import { useArtifactStore } from "../features/artifacts/store.js";

export default function App() {
  const { loading, initialize } = useProfileStore();
  const panelOpen = useArtifactStore((s) => s.panelOpen);

  useEffect(() => { initialize(); }, [initialize]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
        {panelOpen && (
          <aside className="w-100 border-l border-zinc-800 overflow-hidden">
            <ArtifactPanel />
          </aside>
        )}
      </div>
      <StatusBar />
    </div>
  );
}
