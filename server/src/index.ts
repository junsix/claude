import { createApp } from "./app.js";
import path from "node:path";
import fs from "node:fs/promises";

const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.resolve("../data");

async function main() {
  await fs.mkdir(path.join(DATA_DIR, "profiles"), { recursive: true });
  const app = createApp({ dataDir: DATA_DIR });
  app.listen(PORT, () => {
    console.log(`Claude Copy server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
  });
}

main().catch(console.error);
