import { Router } from "express";
import { ProfileService } from "./service.js";

export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const index = await profileService.getIndex();
    res.json(index);
  });

  router.post("/", async (req, res) => {
    const { name, avatar } = req.body;
    const profile = await profileService.createProfile({ name, avatar });
    res.status(201).json(profile);
  });

  router.get("/:id", async (req, res) => {
    const profile = await profileService.getProfile(req.params.id);
    if (!profile) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found" } }); return; }
    res.json(profile);
  });

  router.put("/:id", async (req, res) => {
    const updated = await profileService.updateProfile(req.params.id, req.body);
    res.json(updated);
  });

  router.put("/active/:id", async (req, res) => {
    await profileService.setActiveProfile(req.params.id);
    res.json({ ok: true });
  });

  router.delete("/:id", async (req, res) => {
    await profileService.deleteProfile(req.params.id);
    res.json({ ok: true });
  });

  return router;
}
