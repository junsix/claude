import { Router } from "express";
import { ProjectService } from "./service.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

export function createProjectRoutes(service: ProjectService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const projects = await service.list(req.dataDir);
    res.json({ data: projects });
  });

  router.post("/", async (req, res) => {
    const project = await service.create(req.dataDir, req.body);
    res.status(201).json(project);
  });

  router.get("/:id", async (req, res) => {
    const project = await service.get(req.dataDir, req.params.id);
    if (!project) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } }); return; }
    const instructions = await service.getInstructions(req.dataDir, req.params.id);
    res.json({ ...project, instructions });
  });

  router.put("/:id", async (req, res) => {
    const updated = await service.update(req.dataDir, req.params.id, req.body);
    res.json(updated);
  });

  router.delete("/:id", async (req, res) => {
    await service.remove(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  router.put("/:id/instructions", async (req, res) => {
    await service.saveInstructions(req.dataDir, req.params.id, req.body.content);
    res.json({ ok: true });
  });

  router.post("/:id/knowledge", upload.single("file"), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: { code: "NO_FILE", message: "No file uploaded" } }); return; }
    const kf = await service.addKnowledgeFile(req.dataDir, req.params.id, { name: req.file.originalname, buffer: req.file.buffer });
    res.status(201).json(kf);
  });

  router.delete("/:id/knowledge/:fid", async (req, res) => {
    await service.removeKnowledgeFile(req.dataDir, req.params.id, req.params.fid);
    res.json({ ok: true });
  });

  router.post("/:id/local-paths", async (req, res) => {
    const project = await service.addLocalPath(req.dataDir, req.params.id, req.body.path);
    res.json(project);
  });

  router.delete("/:id/local-paths", async (req, res) => {
    const project = await service.removeLocalPath(req.dataDir, req.params.id, req.body.path);
    res.json(project);
  });

  return router;
}
