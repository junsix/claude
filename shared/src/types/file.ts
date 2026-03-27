import type { FileId } from "./common.js";

export interface UploadedFile {
  id: FileId;
  name: string;
  size: number;
  mimeType: string;
  path: string;
  createdAt: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}
