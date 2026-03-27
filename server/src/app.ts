import express from "express";
import cors from "cors";
import { profileMiddleware } from "./middleware/profile.js";
import { errorHandler, AppError } from "./middleware/error-handler.js";
import { ProfileService } from "./features/profiles/service.js";
import { createProfileRoutes } from "./features/profiles/routes.js";
import { ConversationStorage } from "./features/chat/storage.js";
import { ChatService } from "./features/chat/service.js";
import { createChatRoutes } from "./features/chat/routes.js";
import { ClaudeService } from "./llm/claude-service.js";

interface AppOptions {
  dataDir: string;
}

export function createApp(options: AppOptions): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Health check — no profile required
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "0.0.1", uptime: process.uptime() });
  });

  // Profile management — no X-Profile-Id required
  const profileService = new ProfileService(options.dataDir);
  app.use("/api/profiles", createProfileRoutes(profileService));

  // All /api routes below require profile
  const profileRouter = express.Router();
  profileRouter.use(profileMiddleware(options.dataDir));

  // Placeholder — routes will be mounted here in later tasks
  profileRouter.get("/conversations", (_req, res) => {
    res.json({ data: [], nextCursor: null });
  });

  const claudeService = new ClaudeService();
  const convStorage = new ConversationStorage();
  const chatService = new ChatService(convStorage, claudeService);
  profileRouter.use("/chat", createChatRoutes(chatService, convStorage, claudeService));

  app.use("/api", profileRouter);

  // 404 handler
  app.use((_req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", "Resource not found"));
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
