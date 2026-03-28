import { Router } from "express";
import { ChatService } from "./service.js";
import { ConversationStorage } from "./storage.js";
import { ClaudeService } from "../../llm/claude-service.js";
import type { SendMessageRequest } from "@claude-copy/shared";

export function createChatRoutes(chatService: ChatService, convStorage: ConversationStorage, claudeService: ClaudeService): Router {
  const router = Router();

  // POST /api/chat/:conversationId/messages — SSE streaming
  router.post("/:conversationId/messages", async (req, res) => {
    const { conversationId } = req.params;
    const body = req.body as SendMessageRequest;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      // Load real profile context
      const { ProfileService } = await import("../profiles/service.js");
      const { SettingsStorage } = await import("../settings/storage.js");

      const profileSvc = new ProfileService(req.dataDir.replace(/[/\\]profiles[/\\].*$/, ""));
      const settingsStorage = new SettingsStorage();

      const profile = await profileSvc.getProfile(req.profileId);
      const memories = await settingsStorage.listMemories(req.dataDir);
      const settings = await settingsStorage.getAppSettings(req.dataDir);

      const stream = chatService.sendMessage(
        req.dataDir,
        conversationId,
        body.content,
        body.parentId,
        body.model ?? "claude-sonnet-4-6",
        {
          profile: profile!,
          memories: memories.filter(m => m.active),
          style: null,
          settings,
        },
      );

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      }
    } catch (err: unknown) {
      res.write(`data: ${JSON.stringify({ type: "error", code: "internal", message: (err as Error).message })}\n\n`);
    }
    res.end();
  });

  // POST /api/chat/:conversationId/abort
  router.post("/:conversationId/abort", (req, res) => {
    const aborted = claudeService.abort(req.params.conversationId);
    res.json({ aborted });
  });

  return router;
}
