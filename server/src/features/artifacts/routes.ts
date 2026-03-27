import { Router } from "express";
import { ArtifactService } from "./service.js";

export function createArtifactRoutes(service: ArtifactService): Router {
  const router = Router();

  router.get("/:id", async (req, res) => {
    const result = await service.get(req.dataDir, req.params.id);
    if (!result) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Artifact not found" } }); return; }
    res.json(result);
  });

  router.get("/:id/versions/:v", async (req, res) => {
    const content = await service.getVersion(req.dataDir, req.params.id, Number(req.params.v));
    if (content === null) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Version not found" } }); return; }
    res.json({ content });
  });

  router.delete("/:id", async (req, res) => {
    await service.remove(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  return router;
}
