import type { FileEntry } from "@claude-copy/shared";
import fs from "node:fs/promises";
import path from "node:path";
import { validatePath } from "./path-validator.js";

export class FileService {
  async browse(localPaths: string[], requestedPath: string): Promise<FileEntry[]> {
    if (!validatePath(requestedPath, localPaths)) throw new Error("Access denied: path not in allowed directories");
    const resolved = path.resolve(requestedPath);
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      path: path.join(resolved, e.name),
      isDirectory: e.isDirectory(),
      size: undefined, // size requires stat, skip for listing
    }));
  }

  async readFile(localPaths: string[], requestedPath: string): Promise<string> {
    if (!validatePath(requestedPath, localPaths)) throw new Error("Access denied: path not in allowed directories");
    const resolved = path.resolve(requestedPath);
    const stat = await fs.stat(resolved);
    if (stat.size > 10 * 1024 * 1024) throw new Error("File too large (>10MB)");
    return fs.readFile(resolved, "utf-8");
  }
}
