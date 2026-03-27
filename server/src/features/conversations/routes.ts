import { Router } from "express";
import { ConversationManagementService } from "./service.js";
import { ConversationStorage } from "../chat/storage.js";

export function createConversationRoutes(service: ConversationManagementService): Router {
  const router = Router();
  const storage = new ConversationStorage();

  router.get("/", async (req, res) => {
    const { limit, cursor } = req.query;
    const result = await service.list(req.dataDir, { limit: limit ? Number(limit) : undefined, cursor: cursor as string });
    res.json(result);
  });

  router.get("/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) { res.json({ data: [] }); return; }
    const results = await service.search(req.dataDir, q);
    res.json({ data: results });
  });

  router.post("/", async (req, res) => {
    const conv = await service.create(req.dataDir, req.body);
    res.status(201).json(conv);
  });

  router.get("/:id", async (req, res) => {
    const meta = await storage.getMeta(req.dataDir, req.params.id);
    if (!meta) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } }); return; }
    const messages = await storage.getMessages(req.dataDir, req.params.id);
    res.json({ meta, messages });
  });

  router.put("/:id", async (req, res) => {
    const updated = await service.update(req.dataDir, req.params.id, req.body);
    res.json(updated);
  });

  router.delete("/:id", async (req, res) => {
    await service.remove(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  router.post("/:id/duplicate", async (req, res) => {
    const dup = await service.duplicate(req.dataDir, req.params.id);
    res.status(201).json(dup);
  });

  return router;
}
