import { createBrowserRouter } from "react-router-dom";
import App from "./App.js";
import { ChatView } from "../features/chat/ChatView.js";
import { ProjectView } from "../features/projects/ProjectView.js";
import { ProjectSettings } from "../features/projects/ProjectSettings.js";
import { SettingsView } from "../features/settings/SettingsView.js";

function Placeholder({ name }: { name: string }) {
  return <div className="flex items-center justify-center h-full text-zinc-500">{name} — coming soon</div>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Placeholder name="New Conversation" /> },
      { path: "chat/:id", element: <ChatView /> },
      { path: "project/:id", element: <ProjectView /> },
      { path: "project/:id/settings", element: <ProjectSettings /> },
      { path: "settings", element: <SettingsView /> },
    ],
  },
]);
