import { Router } from "express";
import { FileStorage } from "./storage.js";
import { FileService } from "./service.js";
import { ProjectStorage } from "../projects/storage.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

export function createFileRoutes(fileStorage: FileStorage, fileService: FileService, projectStorage: ProjectStorage): Router {
  const router = Router();

  // IMPORTANT: /browse and /read must be registered BEFORE /:id
  // to avoid Express matching "browse" and "read" as :id params.

  router.get("/browse", async (req, res) => {
    const { projectId, path: reqPath } = req.query;
    if (!projectId || !reqPath) { res.status(400).json({ error: { code: "BAD_REQUEST", message: "projectId and path required" } }); return; }
    const project = await projectStorage.getMeta(req.dataDir, projectId as string);
    if (!project) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } }); return; }
    const entries = await fileService.browse(project.localPaths, reqPath as string);
    res.json({ data: entries });
  });

  router.get("/read", async (req, res) => {
    const { projectId, path: reqPath } = req.query;
    if (!projectId || !reqPath) { res.status(400).json({ error: { code: "BAD_REQUEST", message: "projectId and path required" } }); return; }
    const project = await projectStorage.getMeta(req.dataDir, projectId as string);
    if (!project) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } }); return; }
    const content = await fileService.readFile(project.localPaths, reqPath as string);
    res.json({ content });
  });

  router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: { code: "NO_FILE", message: "No file" } }); return; }
    const uploaded = await fileStorage.saveUpload(req.dataDir, req.file);
    res.status(201).json(uploaded);
  });

  router.get("/:id", async (req, res) => {
    const file = await fileStorage.getFile(req.dataDir, req.params.id);
    if (!file) { res.status(404).json({ error: { code: "NOT_FOUND", message: "File not found" } }); return; }
    res.json(file);
  });

  router.get("/:id/download", async (req, res) => {
    const file = await fileStorage.getFile(req.dataDir, req.params.id);
    if (!file) { res.status(404).json({ error: { code: "NOT_FOUND", message: "File not found" } }); return; }
    res.download(file.path, file.name);
  });

  router.delete("/:id", async (req, res) => {
    await fileStorage.deleteFile(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  return router;
}
