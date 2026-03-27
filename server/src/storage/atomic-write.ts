import fs from "node:fs/promises";
import path from "node:path";

export async function atomicWrite(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, filePath);
  } catch (err) {
    await fs.rm(tempPath, { force: true });
    throw err;
  }
}

export async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
