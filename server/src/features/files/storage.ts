import type { UploadedFile } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

export class FileStorage {
  async saveUpload(dataDir: string, file: { originalname: string; buffer: Buffer; mimetype: string }): Promise<UploadedFile> {
    const id = `file_${uuid().slice(0, 8)}`;
    const ext = path.extname(file.originalname);
    const uploadsDir = path.join(dataDir, "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${id}${ext}`);
    await fs.writeFile(filePath, file.buffer);

    const metadata: UploadedFile = {
      id, name: file.originalname, size: file.buffer.length,
      mimeType: file.mimetype, path: filePath,
      createdAt: new Date().toISOString(),
    };
    await atomicWrite(path.join(uploadsDir, `${id}.json`), metadata);
    return metadata;
  }

  async getFile(dataDir: string, fileId: string): Promise<UploadedFile | null> {
    const uploadsDir = path.join(dataDir, "uploads");
    return readJson<UploadedFile>(path.join(uploadsDir, `${fileId}.json`));
  }

  async deleteFile(dataDir: string, fileId: string): Promise<void> {
    const meta = await this.getFile(dataDir, fileId);
    if (meta) {
      await fs.rm(meta.path, { force: true });
      await fs.rm(path.join(dataDir, "uploads", `${fileId}.json`), { force: true });
    }
  }
}
