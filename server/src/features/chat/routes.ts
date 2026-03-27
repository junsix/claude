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

    try {
      const stream = chatService.sendMessage(
        req.dataDir,
        conversationId,
        body.content,
        body.parentId,
        body.model ?? "claude-sonnet-4-6",
        {
          profile: {
            id: req.profileId, name: "", avatar: "", role: "", expertise: [],
            language: "en", globalInstructions: "",
            defaults: { model: "claude-sonnet-4-6", style: "normal" },
          },
          memories: [],
          style: null,
          projectInstructions: null,
          knowledgeContext: null,
        },
      );

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
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
