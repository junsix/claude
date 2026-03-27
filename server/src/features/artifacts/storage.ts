import type { Artifact } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class ArtifactStorage {
  private artDir(dataDir: string, artId: string): string {
    return path.join(dataDir, "artifacts", artId);
  }

  async create(dataDir: string, artifact: Artifact, content: string): Promise<void> {
    const dir = this.artDir(dataDir, artifact.id);
    await fs.mkdir(path.join(dir, "versions"), { recursive: true });
    await atomicWrite(path.join(dir, "meta.json"), artifact);
    const ext = this.extForType(artifact.type, artifact.language);
    await fs.writeFile(path.join(dir, `content${ext}`), content, "utf-8");
  }

  async getMeta(dataDir: string, artId: string): Promise<Artifact | null> {
    return readJson<Artifact>(path.join(this.artDir(dataDir, artId), "meta.json"));
  }

  async getContent(dataDir: string, artId: string, artifact: Artifact): Promise<string> {
    const ext = this.extForType(artifact.type, artifact.language);
    return fs.readFile(path.join(this.artDir(dataDir, artId), `content${ext}`), "utf-8");
  }

  async updateContent(dataDir: string, artId: string, artifact: Artifact, newContent: string): Promise<void> {
    const dir = this.artDir(dataDir, artId);
    const ext = this.extForType(artifact.type, artifact.language);
    // Save current to versions
    const currentContent = await this.getContent(dataDir, artId, artifact);
    await fs.writeFile(path.join(dir, "versions", `v${artifact.currentVersion}${ext}`), currentContent, "utf-8");
    // Write new
    artifact.currentVersion += 1;
    artifact.updatedAt = new Date().toISOString();
    await atomicWrite(path.join(dir, "meta.json"), artifact);
    await fs.writeFile(path.join(dir, `content${ext}`), newContent, "utf-8");
  }

  async getVersion(dataDir: string, artId: string, artifact: Artifact, version: number): Promise<string | null> {
    const ext = this.extForType(artifact.type, artifact.language);
    try {
      return await fs.readFile(path.join(this.artDir(dataDir, artId), "versions", `v${version}${ext}`), "utf-8");
    } catch { return null; }
  }

  async remove(dataDir: string, artId: string): Promise<void> {
    await fs.rm(this.artDir(dataDir, artId), { recursive: true, force: true });
  }

  private extForType(type: string, language: string): string {
    const map: Record<string, string> = { react: ".tsx", html: ".html", svg: ".svg", mermaid: ".mmd", markdown: ".md" };
    return map[type] ?? `.${language || "txt"}`;
  }
}
