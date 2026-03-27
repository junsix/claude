import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";

export default function App() {
  const { loading, initialize, activeProfile } = useProfileStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar placeholder */}
      <aside className="w-70 border-r border-zinc-800 p-4 flex flex-col gap-2">
        <div className="text-lg font-semibold">Claude Copy</div>
        <div className="text-sm text-zinc-500">{activeProfile?.name}</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
