import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";
import { Sidebar } from "../features/sidebar/Sidebar.js";

export default function App() {
  const { loading, initialize } = useProfileStore();

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
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
