import { createBrowserRouter } from "react-router-dom";
import App from "./App.js";
import { ChatView } from "../features/chat/ChatView.js";
import { WelcomeScreen } from "../features/chat/WelcomeScreen.js";
import { ProjectView } from "../features/projects/ProjectView.js";
import { ProjectSettings } from "../features/projects/ProjectSettings.js";
import { SettingsView } from "../features/settings/SettingsView.js";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <WelcomeScreen /> },
      { path: "chat/:id", element: <ChatView /> },
      { path: "project/:id", element: <ProjectView /> },
      { path: "project/:id/settings", element: <ProjectSettings /> },
      { path: "settings", element: <SettingsView /> },
    ],
  },
]);
