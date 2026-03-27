import { Router } from "express";
import { SettingsService } from "./service.js";

export function createSettingsRoutes(service: SettingsService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const settings = await service.getSettings(req.dataDir);
    res.json(settings);
  });

  router.put("/", async (req, res) => {
    const updated = await service.updateSettings(req.dataDir, req.body);
    res.json(updated);
  });

  router.get("/memories", async (req, res) => {
    const memories = await service.listMemories(req.dataDir);
    res.json({ data: memories });
  });

  router.put("/memories/:id", async (req, res) => {
    await service.updateMemory(req.dataDir, req.params.id, req.body);
    res.json({ ok: true });
  });

  router.delete("/memories/:id", async (req, res) => {
    await service.deleteMemory(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  router.delete("/memories", async (req, res) => {
    await service.deleteAllMemories(req.dataDir);
    res.json({ ok: true });
  });

  router.get("/styles", async (req, res) => {
    const styles = await service.listStyles(req.dataDir);
    res.json({ data: styles });
  });

  router.post("/styles", async (req, res) => {
    const style = await service.createStyle(req.dataDir, req.body);
    res.status(201).json(style);
  });

  router.put("/styles/:id", async (req, res) => {
    await service.updateStyle(req.dataDir, req.params.id, req.body);
    res.json({ ok: true });
  });

  router.delete("/styles/:id", async (req, res) => {
    await service.deleteStyle(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  return router;
}
