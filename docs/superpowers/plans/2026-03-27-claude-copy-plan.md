# Claude Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app replicating Claude web features (chat, projects, artifacts, file management) using Claude Code SDK, React + Express, and file-based storage with multi-profile support.

**Architecture:** Monorepo with npm workspaces — `client/` (React + Vite), `server/` (Express), `shared/` (types). File-based JSON/Markdown storage in `data/profiles/{id}/`. Claude Code SDK (`query()` API) for LLM, SSE for streaming responses to client.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, shadcn/ui, Zustand, Express, @anthropic-ai/claude-agent-sdk, react-markdown, vitest

---

## File Map

### `shared/` — Shared Types

| File | Responsibility |
|------|---------------|
| `shared/src/types/common.ts` | Shared utility types (ID generators, timestamps, pagination) |
| `shared/src/types/content.ts` | `ContentBlock` union type |
| `shared/src/types/chat.ts` | `ConversationMeta`, `Message`, `SessionMap` |
| `shared/src/types/project.ts` | `Project`, `KnowledgeFile` |
| `shared/src/types/artifact.ts` | `Artifact`, `ArtifactType` |
| `shared/src/types/file.ts` | `UploadedFile`, `ProcessedFile` |
| `shared/src/types/profile.ts` | `Profile`, `ProfilesIndex` |
| `shared/src/types/memory.ts` | `MemoryEntry`, `MemoryCategory` |
| `shared/src/types/style.ts` | `CustomStyle`, `BuiltinStyleId` |
| `shared/src/types/settings.ts` | `AppSettings` |
| `shared/src/types/api.ts` | API request/response types, `ApiError`, `PaginatedResponse` |
| `shared/src/index.ts` | Re-exports all types |

### `server/` — Express Backend

| File | Responsibility |
|------|---------------|
| `server/src/app.ts` | Express app setup, middleware registration, route mounting |
| `server/src/index.ts` | Server entry point, startup validation |
| `server/src/storage/atomic-write.ts` | `atomicWrite()` — safe JSON file writes |
| `server/src/storage/write-queue.ts` | `ProfileWriteQueue` — per-profile write serialization |
| `server/src/storage/file-store.ts` | Generic file-store helpers (read/write/list/delete JSON dirs) |
| `server/src/middleware/profile.ts` | `X-Profile-Id` header → `req.profileId` + `req.dataDir` |
| `server/src/middleware/error-handler.ts` | Global error handler → standardized `{ error: { code, message } }` |
| `server/src/features/profiles/routes.ts` | Profile CRUD endpoints |
| `server/src/features/profiles/service.ts` | Profile business logic |
| `server/src/features/profiles/storage.ts` | Profile file operations |
| `server/src/llm/claude-service.ts` | SDK wrapper: `startConversation`, `resumeConversation`, `abortConversation` |
| `server/src/llm/system-prompt-builder.ts` | Assemble systemPrompt from profile + memory + project + style |
| `server/src/features/chat/routes.ts` | SSE chat endpoints (messages, retry, edit, abort) |
| `server/src/features/chat/service.ts` | Chat orchestration (save msg → call SDK → stream → save response) |
| `server/src/features/chat/storage.ts` | Conversation file operations (meta.json, messages.json) |
| `server/src/features/chat/branch.ts` | Branch tree utilities (get path, get siblings, find session) |
| `server/src/features/chat/title-generator.ts` | Auto-title via claude-haiku-4-5 |
| `server/src/features/conversations/routes.ts` | Conversation list/search/CRUD endpoints |
| `server/src/features/conversations/service.ts` | List, search, rename, star, delete, duplicate |
| `server/src/features/projects/routes.ts` | Project CRUD + instructions + knowledge + local-paths |
| `server/src/features/projects/service.ts` | Project business logic |
| `server/src/features/projects/storage.ts` | Project file operations |
| `server/src/features/artifacts/routes.ts` | Artifact CRUD + versions + download |
| `server/src/features/artifacts/service.ts` | Artifact business logic |
| `server/src/features/artifacts/storage.ts` | Artifact file operations |
| `server/src/features/artifacts/detector.ts` | Artifact detection from assistant response |
| `server/src/features/files/routes.ts` | Upload, download, browse, read |
| `server/src/features/files/service.ts` | File processing (text extraction) |
| `server/src/features/files/storage.ts` | File storage operations |
| `server/src/features/files/path-validator.ts` | Local path security validation |
| `server/src/features/settings/routes.ts` | Settings + memory + styles endpoints |
| `server/src/features/settings/service.ts` | Settings, memory extraction, style management |
| `server/src/features/settings/storage.ts` | Settings/memory/style file operations |

### `client/` — React Frontend

| File | Responsibility |
|------|---------------|
| `client/src/main.tsx` | React entry point |
| `client/src/app/App.tsx` | Root component — layout shell + routing |
| `client/src/app/router.tsx` | React Router config |
| `client/src/app/providers.tsx` | Global providers (theme, profile context) |
| `client/src/lib/api-client.ts` | Fetch wrapper with profile header injection |
| `client/src/lib/sse-client.ts` | SSE helper for chat streaming |
| `client/src/lib/utils.ts` | General utilities (cn, date formatting) |
| `client/src/hooks/use-profile.ts` | Profile state (Zustand store) |
| `client/src/components/ui/` | shadcn/ui components (button, input, dropdown, dialog, etc.) |
| `client/src/features/sidebar/Sidebar.tsx` | Sidebar shell — search, sections, profile switcher |
| `client/src/features/sidebar/ConversationList.tsx` | Grouped conversation list (starred, projects, recent) |
| `client/src/features/sidebar/ConversationItem.tsx` | Single item + context menu |
| `client/src/features/sidebar/SearchBar.tsx` | Search input |
| `client/src/features/sidebar/ProfileSwitcher.tsx` | Profile dropdown |
| `client/src/features/sidebar/store.ts` | Sidebar Zustand store |
| `client/src/features/chat/ChatView.tsx` | Main chat page (messages + input) |
| `client/src/features/chat/MessageList.tsx` | Scrollable message list |
| `client/src/features/chat/MessageBubble.tsx` | Single message rendering (markdown + artifacts) |
| `client/src/features/chat/MessageInput.tsx` | Input area (textarea + attach + model + style selectors) |
| `client/src/features/chat/BranchNavigator.tsx` | ← 1/3 → branch controls |
| `client/src/features/chat/StreamingIndicator.tsx` | Typing/thinking indicator |
| `client/src/features/chat/store.ts` | Chat Zustand store |
| `client/src/features/chat/use-chat-stream.ts` | Hook: SSE connection + message state |
| `client/src/features/chat/use-branch.ts` | Hook: branch tree traversal |
| `client/src/features/chat/markdown-renderer.tsx` | react-markdown with all plugins configured |
| `client/src/features/artifacts/ArtifactPanel.tsx` | Right panel shell (tabs, resize) |
| `client/src/features/artifacts/ArtifactPreview.tsx` | Sandboxed iframe preview |
| `client/src/features/artifacts/ArtifactCodeView.tsx` | Source code view |
| `client/src/features/artifacts/ArtifactVersionNav.tsx` | Version ← → navigation |
| `client/src/features/artifacts/sandbox-builder.ts` | Build iframe srcDoc for React/HTML/SVG/Mermaid |
| `client/src/features/artifacts/store.ts` | Artifact panel Zustand store |
| `client/src/features/projects/ProjectView.tsx` | Project detail page |
| `client/src/features/projects/ProjectSettings.tsx` | Project settings (instructions, knowledge, paths) |
| `client/src/features/projects/KnowledgeManager.tsx` | Upload/delete knowledge files |
| `client/src/features/projects/LocalPathManager.tsx` | Add/remove local folder links |
| `client/src/features/files/FileDropZone.tsx` | Drag-and-drop overlay |
| `client/src/features/files/FileChip.tsx` | Attachment chip in messages |
| `client/src/features/files/FileBrowser.tsx` | Local folder tree browser |
| `client/src/features/settings/SettingsView.tsx` | Settings page shell |
| `client/src/features/settings/ProfileEditor.tsx` | Profile edit form |
| `client/src/features/settings/MemoryManager.tsx` | Memory list/edit/delete |
| `client/src/features/settings/StyleManager.tsx` | Style list/create/edit |
| `client/src/features/settings/GlobalInstructions.tsx` | Global instructions editor |
| `client/src/features/layout/Header.tsx` | App header (profile switcher, settings) |
| `client/src/features/layout/StatusBar.tsx` | Bottom bar (memory, tokens, cost) |
| `client/src/features/layout/ThemeProvider.tsx` | Theme toggle (light/dark/system) |

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/index.ts`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json with workspaces**

```json
{
  "name": "claude-copy",
  "private": true,
  "workspaces": ["shared", "server", "client"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w shared && npm run build -w server && npm run build -w client",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "npm run test -w server"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 3: Create shared package**

`shared/package.json`:
```json
{
  "name": "@claude-copy/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

`shared/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

`shared/src/index.ts`:
```typescript
// Types will be added in Task 2
export {};
```

- [ ] **Step 4: Create server package**

`server/package.json`:
```json
{
  "name": "@claude-copy/server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@claude-copy/shared": "workspace:*",
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "multer": "^2.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.12",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

`server/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

`server/src/index.ts`:
```typescript
console.log("Server placeholder — will be replaced in Task 5");
```

- [ ] **Step 5: Create client package**

`client/package.json`:
```json
{
  "name": "@claude-copy/client",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@claude-copy/shared": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

`client/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

`client/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

`client/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Copy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`client/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>Claude Copy — client placeholder</div>
  </StrictMode>,
);
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
data/
.superpowers/
*.tmp.*
.env
```

- [ ] **Step 7: Install dependencies and verify**

Run: `npm install`

Expected: Successful install, workspaces linked.

- [ ] **Step 8: Verify server starts**

Run: `npm run dev -w server`

Expected: Prints "Server placeholder" via tsx watch.

- [ ] **Step 9: Verify client starts**

Run: `npm run dev -w client`

Expected: Vite dev server on http://localhost:5173 showing "Claude Copy — client placeholder".

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.base.json shared/ server/ client/ .gitignore
git commit -m "feat: scaffold monorepo with shared, server, and client workspaces"
```

---

## Task 2: Shared Types

**Files:**
- Create: `shared/src/types/common.ts`
- Create: `shared/src/types/content.ts`
- Create: `shared/src/types/chat.ts`
- Create: `shared/src/types/project.ts`
- Create: `shared/src/types/artifact.ts`
- Create: `shared/src/types/file.ts`
- Create: `shared/src/types/profile.ts`
- Create: `shared/src/types/memory.ts`
- Create: `shared/src/types/style.ts`
- Create: `shared/src/types/settings.ts`
- Create: `shared/src/types/api.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Create common.ts**

```typescript
export type ConversationId = string;
export type ProjectId = string;
export type ArtifactId = string;
export type ProfileId = string;
export type MessageId = string;
export type FileId = string;
export type MemoryId = string;
export type StyleId = string;

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Create content.ts**

```typescript
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "artifact_ref"; artifactId: string }
  | { type: "file_ref"; fileId: string; name: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };
```

- [ ] **Step 3: Create chat.ts**

```typescript
import type { ConversationId, ProjectId, MessageId, Timestamped } from "./common.js";
import type { ContentBlock } from "./content.js";

export interface SessionInfo {
  branchTip: MessageId;
  createdAt: string;
}

export interface ConversationUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  messageCount: number;
}

export interface ConversationMeta extends Timestamped {
  id: ConversationId;
  title: string;
  projectId: ProjectId | null;
  model: string;
  style: string;
  starred: boolean;
  sessions: Record<string, SessionInfo>;
  activeBranchTip: MessageId;
  usage: ConversationUsage;
}

export interface Message {
  id: MessageId;
  parentId: MessageId | null;
  role: "user" | "assistant";
  content: ContentBlock[];
  attachments: string[];
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
  createdAt: string;
}
```

- [ ] **Step 4: Create project.ts**

```typescript
import type { ProjectId, ConversationId, Timestamped } from "./common.js";

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  addedAt: string;
}

export interface Project extends Timestamped {
  id: ProjectId;
  name: string;
  description: string;
  conversationIds: ConversationId[];
  knowledgeFiles: KnowledgeFile[];
  localPaths: string[];
  defaultModel: string;
}
```

- [ ] **Step 5: Create artifact.ts**

```typescript
import type { ArtifactId, ConversationId, MessageId, Timestamped } from "./common.js";

export type ArtifactType = "react" | "html" | "svg" | "mermaid" | "markdown" | "code";

export interface Artifact extends Timestamped {
  id: ArtifactId;
  title: string;
  type: ArtifactType;
  language: string;
  conversationId: ConversationId;
  messageId: MessageId;
  currentVersion: number;
}
```

- [ ] **Step 6: Create file.ts**

```typescript
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
```

- [ ] **Step 7: Create profile.ts**

```typescript
import type { ProfileId } from "./common.js";

export interface ProfileSummary {
  id: ProfileId;
  name: string;
  avatar: string;
  createdAt: string;
}

export interface ProfilesIndex {
  activeProfileId: ProfileId;
  profiles: ProfileSummary[];
}

export interface Profile {
  id: ProfileId;
  name: string;
  avatar: string;
  role: string;
  expertise: string[];
  language: string;
  globalInstructions: string;
  defaults: {
    model: string;
    style: string;
  };
}
```

- [ ] **Step 8: Create memory.ts**

```typescript
import type { MemoryId, ConversationId } from "./common.js";

export type MemoryCategory = "preference" | "fact" | "context";

export interface MemoryEntry {
  id: MemoryId;
  content: string;
  category: MemoryCategory;
  source: {
    conversationId: ConversationId;
    extractedAt: string;
  };
  active: boolean;
}
```

- [ ] **Step 9: Create style.ts**

```typescript
import type { StyleId } from "./common.js";

export type BuiltinStyleId = "normal" | "concise" | "explanatory" | "formal";

export interface CustomStyle {
  id: StyleId;
  name: string;
  description: string;
  prompt: string;
  sampleText: string | null;
  createdAt: string;
}

export const BUILTIN_STYLES: Record<BuiltinStyleId, { name: string; prompt: string }> = {
  normal: { name: "Normal", prompt: "" },
  concise: { name: "Concise", prompt: "Be brief and direct. Skip unnecessary elaboration." },
  explanatory: { name: "Explanatory", prompt: "Explain concepts thoroughly with examples. Assume the reader is learning." },
  formal: { name: "Formal", prompt: "Use formal, professional language. Structure responses clearly with headings when appropriate." },
};
```

- [ ] **Step 10: Create settings.ts**

```typescript
export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
  sidebarWidth: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  sidebarWidth: 280,
};
```

- [ ] **Step 11: Create api.ts**

```typescript
import type { ContentBlock } from "./content.js";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// SSE event types sent from server to client during chat streaming
export type ChatSSEEvent =
  | { type: "user_saved"; messageId: string }
  | { type: "assistant_chunk"; text: string }
  | { type: "assistant_done"; messageId: string; artifactIds: string[] }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number; costUsd: number } }
  | { type: "error"; code: string; message: string; retryAfter?: number };

// Request bodies
export interface SendMessageRequest {
  content: ContentBlock[];
  parentId?: string;
  model?: string;
  style?: string;
  attachments?: string[];
}

export interface RetryRequest {
  model?: string;
}

export interface EditMessageRequest {
  content: ContentBlock[];
  model?: string;
  style?: string;
}
```

- [ ] **Step 12: Update shared/src/index.ts**

```typescript
export * from "./types/common.js";
export * from "./types/content.js";
export * from "./types/chat.js";
export * from "./types/project.js";
export * from "./types/artifact.js";
export * from "./types/file.js";
export * from "./types/profile.js";
export * from "./types/memory.js";
export * from "./types/style.js";
export * from "./types/settings.js";
export * from "./types/api.js";
```

- [ ] **Step 13: Verify typecheck passes**

Run: `npx tsc --noEmit -p shared/tsconfig.json`

Expected: No errors.

- [ ] **Step 14: Commit**

```bash
git add shared/
git commit -m "feat: add shared type definitions for all domain models"
```

---

## Task 3: Storage Layer

**Files:**
- Create: `server/src/storage/atomic-write.ts`
- Create: `server/src/storage/write-queue.ts`
- Create: `server/src/storage/file-store.ts`
- Test: `server/src/storage/__tests__/atomic-write.test.ts`
- Test: `server/src/storage/__tests__/write-queue.test.ts`
- Test: `server/src/storage/__tests__/file-store.test.ts`

- [ ] **Step 1: Write test for atomicWrite**

```typescript
// server/src/storage/__tests__/atomic-write.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { atomicWrite, readJson } from "../atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-atomic");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("atomicWrite", () => {
  it("writes JSON to file atomically", async () => {
    const filePath = path.join(TEST_DIR, "test.json");
    await atomicWrite(filePath, { hello: "world" });
    const content = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(content).toEqual({ hello: "world" });
  });

  it("creates parent directories if missing", async () => {
    const filePath = path.join(TEST_DIR, "deep", "nested", "test.json");
    await atomicWrite(filePath, { nested: true });
    const content = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(content).toEqual({ nested: true });
  });

  it("does not leave temp files on success", async () => {
    const filePath = path.join(TEST_DIR, "clean.json");
    await atomicWrite(filePath, { clean: true });
    const files = await fs.readdir(TEST_DIR);
    expect(files).toEqual(["clean.json"]);
  });
});

describe("readJson", () => {
  it("reads and parses JSON file", async () => {
    const filePath = path.join(TEST_DIR, "read.json");
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ foo: "bar" }));
    const result = await readJson(filePath);
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null for missing file", async () => {
    const result = await readJson(path.join(TEST_DIR, "missing.json"));
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/storage/__tests__/atomic-write.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement atomicWrite**

```typescript
// server/src/storage/atomic-write.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/src/storage/__tests__/atomic-write.test.ts`

Expected: All tests PASS.

- [ ] **Step 5: Write test for ProfileWriteQueue**

```typescript
// server/src/storage/__tests__/write-queue.test.ts
import { describe, it, expect } from "vitest";
import { ProfileWriteQueue } from "../write-queue.js";

describe("ProfileWriteQueue", () => {
  it("serializes writes for the same profile", async () => {
    const queue = new ProfileWriteQueue();
    const order: number[] = [];

    const p1 = queue.enqueue("prof_1", async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
    });
    const p2 = queue.enqueue("prof_1", async () => {
      order.push(2);
    });

    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
  });

  it("allows parallel writes for different profiles", async () => {
    const queue = new ProfileWriteQueue();
    const order: string[] = [];

    const p1 = queue.enqueue("prof_a", async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push("a");
    });
    const p2 = queue.enqueue("prof_b", async () => {
      order.push("b");
    });

    await Promise.all([p1, p2]);
    // b finishes before a because they run in parallel
    expect(order).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run server/src/storage/__tests__/write-queue.test.ts`

Expected: FAIL.

- [ ] **Step 7: Implement ProfileWriteQueue**

```typescript
// server/src/storage/write-queue.ts
export class ProfileWriteQueue {
  private queues = new Map<string, Promise<void>>();

  async enqueue(profileId: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.queues.get(profileId) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.queues.set(profileId, next);
    return next;
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run server/src/storage/__tests__/write-queue.test.ts`

Expected: All tests PASS.

- [ ] **Step 9: Write test for FileStore**

```typescript
// server/src/storage/__tests__/file-store.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { FileStore } from "../file-store.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-filestore");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("FileStore", () => {
  it("creates and reads an entity", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "test" });
    const result = await store.load("items", "item_1");
    expect(result).toEqual({ name: "test" });
  });

  it("lists entities in a collection", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "a" });
    await store.save("items", "item_2", { name: "b" });
    const ids = await store.list("items");
    expect(ids.sort()).toEqual(["item_1", "item_2"]);
  });

  it("deletes an entity", async () => {
    const store = new FileStore(TEST_DIR);
    await store.save("items", "item_1", { name: "test" });
    await store.remove("items", "item_1");
    const result = await store.load("items", "item_1");
    expect(result).toBeNull();
  });

  it("returns null for missing entity", async () => {
    const store = new FileStore(TEST_DIR);
    const result = await store.load("items", "missing");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run server/src/storage/__tests__/file-store.test.ts`

Expected: FAIL.

- [ ] **Step 11: Implement FileStore**

```typescript
// server/src/storage/file-store.ts
import { atomicWrite, readJson } from "./atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class FileStore {
  constructor(private baseDir: string) {}

  private entityDir(collection: string, id: string): string {
    return path.join(this.baseDir, collection, id);
  }

  private metaPath(collection: string, id: string): string {
    return path.join(this.entityDir(collection, id), "meta.json");
  }

  async save(collection: string, id: string, data: unknown): Promise<void> {
    await atomicWrite(this.metaPath(collection, id), data);
  }

  async load<T = unknown>(collection: string, id: string): Promise<T | null> {
    return readJson<T>(this.metaPath(collection, id));
  }

  async list(collection: string): Promise<string[]> {
    const dir = path.join(this.baseDir, collection);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async remove(collection: string, id: string): Promise<void> {
    const dir = this.entityDir(collection, id);
    await fs.rm(dir, { recursive: true, force: true });
  }

  getEntityDir(collection: string, id: string): string {
    return this.entityDir(collection, id);
  }
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run server/src/storage/__tests__/file-store.test.ts`

Expected: All tests PASS.

- [ ] **Step 13: Commit**

```bash
git add server/src/storage/
git commit -m "feat: add storage layer — atomic writes, write queue, and file store"
```

---

## Task 4: Server Foundation (Express App + Middleware)

**Files:**
- Create: `server/src/app.ts`
- Create: `server/src/middleware/profile.ts`
- Create: `server/src/middleware/error-handler.ts`
- Modify: `server/src/index.ts`
- Test: `server/src/__tests__/app.test.ts`

- [ ] **Step 1: Write test for server health and middleware**

```typescript
// server/src/__tests__/app.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Express App", () => {
  const app = createApp({ dataDir: "./data-test" });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns 400 if X-Profile-Id header is missing on profile-required routes", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_PROFILE");
  });

  it("returns standard error format for 404", async () => {
    const res = await request(app)
      .get("/api/nonexistent")
      .set("X-Profile-Id", "prof_test");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/__tests__/app.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement error-handler middleware**

```typescript
// server/src/middleware/error-handler.ts
import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
```

- [ ] **Step 4: Implement profile middleware**

```typescript
// server/src/middleware/profile.ts
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { AppError } from "./error-handler.js";

declare global {
  namespace Express {
    interface Request {
      profileId: string;
      dataDir: string;
    }
  }
}

export function profileMiddleware(dataRoot: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const profileId = req.headers["x-profile-id"] as string | undefined;
    if (!profileId) {
      throw new AppError(400, "MISSING_PROFILE", "X-Profile-Id header is required");
    }
    req.profileId = profileId;
    req.dataDir = path.join(dataRoot, "profiles", profileId);
    next();
  };
}
```

- [ ] **Step 5: Implement createApp**

```typescript
// server/src/app.ts
import express from "express";
import cors from "cors";
import { profileMiddleware } from "./middleware/profile.js";
import { errorHandler, AppError } from "./middleware/error-handler.js";

interface AppOptions {
  dataDir: string;
}

export function createApp(options: AppOptions): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Health check — no profile required
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "0.0.1", uptime: process.uptime() });
  });

  // All /api routes below require profile
  const profileRouter = express.Router();
  profileRouter.use(profileMiddleware(options.dataDir));

  // Placeholder — routes will be mounted here in later tasks
  profileRouter.get("/conversations", (_req, res) => {
    res.json({ data: [], nextCursor: null });
  });

  app.use("/api", profileRouter);

  // 404 handler
  app.use((_req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", "Resource not found"));
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 6: Update server entry point**

```typescript
// server/src/index.ts
import { createApp } from "./app.js";
import path from "node:path";
import fs from "node:fs/promises";

const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.resolve("../data");

async function main() {
  // Ensure data directory exists
  await fs.mkdir(path.join(DATA_DIR, "profiles"), { recursive: true });

  const app = createApp({ dataDir: DATA_DIR });
  app.listen(PORT, () => {
    console.log(`Claude Copy server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
  });
}

main().catch(console.error);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run server/src/__tests__/app.test.ts`

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add server/src/app.ts server/src/index.ts server/src/middleware/ server/src/__tests__/
git commit -m "feat: add Express app with profile middleware, error handling, and health check"
```

---

## Task 5: Profile System

**Files:**
- Create: `server/src/features/profiles/storage.ts`
- Create: `server/src/features/profiles/service.ts`
- Create: `server/src/features/profiles/routes.ts`
- Test: `server/src/features/profiles/__tests__/service.test.ts`
- Modify: `server/src/app.ts` — mount profile routes

- [ ] **Step 1: Write test for profile service**

```typescript
// server/src/features/profiles/__tests__/service.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { ProfileService } from "../service.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TEST_DIR = path.join(os.tmpdir(), "claude-copy-test-profiles");

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("ProfileService", () => {
  it("initializes with a default profile if none exist", async () => {
    const svc = new ProfileService(TEST_DIR);
    const index = await svc.initialize();
    expect(index.profiles.length).toBe(1);
    expect(index.activeProfileId).toBe(index.profiles[0].id);
  });

  it("creates a new profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const profile = await svc.createProfile({ name: "Test Profile", avatar: "test" });
    expect(profile.name).toBe("Test Profile");
    const index = await svc.getIndex();
    expect(index.profiles.length).toBe(2);
  });

  it("gets profile by id", async () => {
    const svc = new ProfileService(TEST_DIR);
    const index = await svc.initialize();
    const profile = await svc.getProfile(index.profiles[0].id);
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("Default");
  });

  it("switches active profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const p2 = await svc.createProfile({ name: "Second", avatar: "2" });
    await svc.setActiveProfile(p2.id);
    const index = await svc.getIndex();
    expect(index.activeProfileId).toBe(p2.id);
  });

  it("deletes a profile", async () => {
    const svc = new ProfileService(TEST_DIR);
    await svc.initialize();
    const p2 = await svc.createProfile({ name: "ToDelete", avatar: "x" });
    await svc.deleteProfile(p2.id);
    const index = await svc.getIndex();
    expect(index.profiles.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/features/profiles/__tests__/service.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement profile storage**

```typescript
// server/src/features/profiles/storage.ts
import type { ProfilesIndex, Profile } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";

export class ProfileStorage {
  private indexPath: string;

  constructor(private dataDir: string) {
    this.indexPath = path.join(dataDir, "profiles", "profiles.json");
  }

  async readIndex(): Promise<ProfilesIndex | null> {
    return readJson<ProfilesIndex>(this.indexPath);
  }

  async writeIndex(index: ProfilesIndex): Promise<void> {
    await atomicWrite(this.indexPath, index);
  }

  async readProfile(profileId: string): Promise<Profile | null> {
    const profilePath = path.join(this.dataDir, "profiles", profileId, "profile.json");
    return readJson<Profile>(profilePath);
  }

  async writeProfile(profileId: string, profile: Profile): Promise<void> {
    const profilePath = path.join(this.dataDir, "profiles", profileId, "profile.json");
    await atomicWrite(profilePath, profile);
  }

  async ensureProfileDirs(profileId: string): Promise<void> {
    const base = path.join(this.dataDir, "profiles", profileId);
    const dirs = ["conversations", "projects", "artifacts", "memory", "memory/entries", "styles", "uploads", "generated"];
    for (const dir of dirs) {
      await fs.mkdir(path.join(base, dir), { recursive: true });
    }
  }

  async removeProfile(profileId: string): Promise<void> {
    const dir = path.join(this.dataDir, "profiles", profileId);
    await fs.rm(dir, { recursive: true, force: true });
  }
}
```

- [ ] **Step 4: Implement profile service**

```typescript
// server/src/features/profiles/service.ts
import type { ProfilesIndex, Profile, ProfileSummary } from "@claude-copy/shared";
import { ProfileStorage } from "./storage.js";
import { v4 as uuid } from "uuid";

export class ProfileService {
  private storage: ProfileStorage;

  constructor(dataDir: string) {
    this.storage = new ProfileStorage(dataDir);
  }

  async initialize(): Promise<ProfilesIndex> {
    let index = await this.storage.readIndex();
    if (index && index.profiles.length > 0) return index;

    const defaultId = `prof_${uuid().slice(0, 8)}`;
    const defaultProfile: Profile = {
      id: defaultId,
      name: "Default",
      avatar: "default",
      role: "",
      expertise: [],
      language: "en",
      globalInstructions: "",
      defaults: { model: "claude-sonnet-4-6", style: "normal" },
    };

    index = {
      activeProfileId: defaultId,
      profiles: [{ id: defaultId, name: "Default", avatar: "default", createdAt: new Date().toISOString() }],
    };

    await this.storage.writeIndex(index);
    await this.storage.ensureProfileDirs(defaultId);
    await this.storage.writeProfile(defaultId, defaultProfile);
    return index;
  }

  async getIndex(): Promise<ProfilesIndex> {
    const index = await this.storage.readIndex();
    if (!index) return this.initialize();
    return index;
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return this.storage.readProfile(profileId);
  }

  async createProfile(params: { name: string; avatar: string }): Promise<Profile> {
    const id = `prof_${uuid().slice(0, 8)}`;
    const profile: Profile = {
      id,
      name: params.name,
      avatar: params.avatar,
      role: "",
      expertise: [],
      language: "en",
      globalInstructions: "",
      defaults: { model: "claude-sonnet-4-6", style: "normal" },
    };

    await this.storage.ensureProfileDirs(id);
    await this.storage.writeProfile(id, profile);

    const index = await this.getIndex();
    index.profiles.push({ id, name: params.name, avatar: params.avatar, createdAt: new Date().toISOString() });
    await this.storage.writeIndex(index);

    return profile;
  }

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const profile = await this.storage.readProfile(profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);
    const updated = { ...profile, ...updates, id: profileId };
    await this.storage.writeProfile(profileId, updated);

    // Update summary in index
    const index = await this.getIndex();
    const entry = index.profiles.find((p) => p.id === profileId);
    if (entry && updates.name) entry.name = updates.name;
    if (entry && updates.avatar) entry.avatar = updates.avatar;
    await this.storage.writeIndex(index);

    return updated;
  }

  async setActiveProfile(profileId: string): Promise<void> {
    const index = await this.getIndex();
    if (!index.profiles.some((p) => p.id === profileId)) {
      throw new Error(`Profile not found: ${profileId}`);
    }
    index.activeProfileId = profileId;
    await this.storage.writeIndex(index);
  }

  async deleteProfile(profileId: string): Promise<void> {
    const index = await this.getIndex();
    if (index.profiles.length <= 1) throw new Error("Cannot delete the last profile");
    index.profiles = index.profiles.filter((p) => p.id !== profileId);
    if (index.activeProfileId === profileId) {
      index.activeProfileId = index.profiles[0].id;
    }
    await this.storage.writeIndex(index);
    await this.storage.removeProfile(profileId);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run server/src/features/profiles/__tests__/service.test.ts`

Expected: All tests PASS.

- [ ] **Step 6: Implement profile routes**

```typescript
// server/src/features/profiles/routes.ts
import { Router } from "express";
import { ProfileService } from "./service.js";

export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  // These routes don't require X-Profile-Id (they manage profiles themselves)
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
```

- [ ] **Step 7: Mount profile routes in app.ts**

Add to `server/src/app.ts` — import and mount before the profileRouter:

```typescript
import { ProfileService } from "./features/profiles/service.js";
import { createProfileRoutes } from "./features/profiles/routes.js";

// Inside createApp():
const profileService = new ProfileService(options.dataDir);

// Profile routes — no auth/profile middleware needed
app.use("/api/profiles", createProfileRoutes(profileService));
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add server/src/features/profiles/ server/src/app.ts
git commit -m "feat: add profile system with CRUD, storage, and API routes"
```

---

## Task 6: Claude SDK Service

**Files:**
- Create: `server/src/llm/claude-service.ts`
- Create: `server/src/llm/system-prompt-builder.ts`
- Test: `server/src/llm/__tests__/system-prompt-builder.test.ts`

- [ ] **Step 1: Write test for system prompt builder**

```typescript
// server/src/llm/__tests__/system-prompt-builder.test.ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../system-prompt-builder.js";
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";

const mockProfile: Profile = {
  id: "prof_1", name: "Dev", avatar: "dev", role: "Developer",
  expertise: ["TypeScript"], language: "ko",
  globalInstructions: "Always respond in Korean",
  defaults: { model: "claude-sonnet-4-6", style: "concise" },
};

describe("buildSystemPrompt", () => {
  it("includes profile info and global instructions", () => {
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style: null, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("Developer");
    expect(result).toContain("Always respond in Korean");
  });

  it("includes active memories", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "User prefers TypeScript", category: "preference", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const result = buildSystemPrompt({ profile: mockProfile, memories, style: null, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("User prefers TypeScript");
  });

  it("includes project instructions", () => {
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style: null, projectInstructions: "Use TDD always", knowledgeContext: null });
    expect(result).toContain("Use TDD always");
  });

  it("includes style prompt", () => {
    const style: CustomStyle = { id: "s1", name: "Brief", description: "", prompt: "Be very brief", sampleText: null, createdAt: "" };
    const result = buildSystemPrompt({ profile: mockProfile, memories: [], style, projectInstructions: null, knowledgeContext: null });
    expect(result).toContain("Be very brief");
  });

  it("assembles in correct order", () => {
    const memories: MemoryEntry[] = [
      { id: "m1", content: "MEMORY_MARKER", category: "fact", source: { conversationId: "c1", extractedAt: "" }, active: true },
    ];
    const style: CustomStyle = { id: "s1", name: "X", description: "", prompt: "STYLE_MARKER", sampleText: null, createdAt: "" };
    const result = buildSystemPrompt({ profile: mockProfile, memories, style, projectInstructions: "PROJECT_MARKER", knowledgeContext: "KNOWLEDGE_MARKER" });

    const profileIdx = result.indexOf("Always respond in Korean");
    const memoryIdx = result.indexOf("MEMORY_MARKER");
    const projectIdx = result.indexOf("PROJECT_MARKER");
    const knowledgeIdx = result.indexOf("KNOWLEDGE_MARKER");
    const styleIdx = result.indexOf("STYLE_MARKER");

    expect(profileIdx).toBeLessThan(memoryIdx);
    expect(memoryIdx).toBeLessThan(projectIdx);
    expect(projectIdx).toBeLessThan(knowledgeIdx);
    expect(knowledgeIdx).toBeLessThan(styleIdx);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/llm/__tests__/system-prompt-builder.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement system-prompt-builder**

```typescript
// server/src/llm/system-prompt-builder.ts
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";

interface BuildSystemPromptParams {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  projectInstructions: string | null;
  knowledgeContext: string | null;
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const sections: string[] = [];

  // 1. Profile & global instructions
  const profileLines = [
    `## User Profile`,
    `Name: ${params.profile.name}`,
    params.profile.role ? `Role: ${params.profile.role}` : null,
    params.profile.expertise.length > 0 ? `Expertise: ${params.profile.expertise.join(", ")}` : null,
    params.profile.language ? `Language: ${params.profile.language}` : null,
  ].filter(Boolean).join("\n");
  sections.push(profileLines);

  if (params.profile.globalInstructions) {
    sections.push(`## Global Instructions\n${params.profile.globalInstructions}`);
  }

  // 2. Active memories
  if (params.memories.length > 0) {
    const memoryLines = params.memories.map((m) => `- ${m.content}`).join("\n");
    sections.push(`## User Memory\n${memoryLines}`);
  }

  // 3. Project instructions
  if (params.projectInstructions) {
    sections.push(`## Project Instructions\n${params.projectInstructions}`);
  }

  // 4. Knowledge files
  if (params.knowledgeContext) {
    sections.push(`## Project Knowledge\n${params.knowledgeContext}`);
  }

  // 5. Style
  if (params.style && params.style.prompt) {
    sections.push(`## Response Style\n${params.style.prompt}`);
  }

  return sections.join("\n\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/src/llm/__tests__/system-prompt-builder.test.ts`

Expected: All tests PASS.

- [ ] **Step 5: Implement claude-service**

```typescript
// server/src/llm/claude-service.ts
import { query } from "@anthropic-ai/claude-agent-sdk";

interface StartConversationParams {
  prompt: string;
  model: string;
  systemPrompt: string;
  cwd?: string;
  additionalDirectories?: string[];
  abortController?: AbortController;
}

interface ResumeConversationParams {
  prompt: string;
  sessionId: string;
  model: string;
  systemPrompt?: string;
  abortController?: AbortController;
}

interface ForkConversationParams {
  prompt: string;
  sessionId: string;
  resumeAtMessageId: string;
  model: string;
  systemPrompt?: string;
  abortController?: AbortController;
}

export class ClaudeService {
  private activeAbortControllers = new Map<string, AbortController>();

  async *startConversation(params: StartConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        model: params.model,
        systemPrompt: params.systemPrompt,
        cwd: params.cwd,
        additionalDirectories: params.additionalDirectories,
        maxTurns: 1,
        abortController: ac,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
  }

  async *resumeConversation(params: ResumeConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        resume: params.sessionId,
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
  }

  async *forkConversation(params: ForkConversationParams) {
    const ac = params.abortController ?? new AbortController();
    const q = query({
      prompt: params.prompt,
      options: {
        resume: params.sessionId,
        resumeSessionAt: params.resumeAtMessageId,
        forkSession: true,
        model: params.model,
        systemPrompt: params.systemPrompt,
        maxTurns: 1,
        abortController: ac,
      },
    });
    for await (const msg of q) {
      yield msg;
    }
  }

  setAbortController(conversationId: string, ac: AbortController): void {
    this.activeAbortControllers.set(conversationId, ac);
  }

  abort(conversationId: string): boolean {
    const ac = this.activeAbortControllers.get(conversationId);
    if (ac) {
      ac.abort();
      this.activeAbortControllers.delete(conversationId);
      return true;
    }
    return false;
  }

  clearAbortController(conversationId: string): void {
    this.activeAbortControllers.delete(conversationId);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add server/src/llm/
git commit -m "feat: add Claude SDK service and system prompt builder"
```

---

## Task 7: Conversation Storage & Branch Utilities

**Files:**
- Create: `server/src/features/chat/storage.ts`
- Create: `server/src/features/chat/branch.ts`
- Test: `server/src/features/chat/__tests__/branch.test.ts`

- [ ] **Step 1: Write test for branch utilities**

```typescript
// server/src/features/chat/__tests__/branch.test.ts
import { describe, it, expect } from "vitest";
import { getActivePath, getSiblings, findSessionForBranchTip } from "../branch.js";
import type { Message, ConversationMeta } from "@claude-copy/shared";

const messages: Message[] = [
  { id: "m1", parentId: null, role: "user", content: [{ type: "text", text: "Hi" }], attachments: [], createdAt: "" },
  { id: "m2", parentId: "m1", role: "assistant", content: [{ type: "text", text: "Hello" }], attachments: [], createdAt: "" },
  { id: "m3", parentId: "m1", role: "assistant", content: [{ type: "text", text: "Hey" }], attachments: [], createdAt: "" },
  { id: "m4", parentId: "m2", role: "user", content: [{ type: "text", text: "How?" }], attachments: [], createdAt: "" },
  { id: "m5", parentId: "m4", role: "assistant", content: [{ type: "text", text: "Like this" }], attachments: [], createdAt: "" },
];

describe("getActivePath", () => {
  it("returns path from root to the given leaf", () => {
    const path = getActivePath(messages, "m5");
    expect(path.map((m) => m.id)).toEqual(["m1", "m2", "m4", "m5"]);
  });

  it("returns path for a branch leaf", () => {
    const path = getActivePath(messages, "m3");
    expect(path.map((m) => m.id)).toEqual(["m1", "m3"]);
  });
});

describe("getSiblings", () => {
  it("returns siblings of a message", () => {
    const sibs = getSiblings(messages, "m2");
    expect(sibs.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("returns single item if no siblings", () => {
    const sibs = getSiblings(messages, "m1");
    expect(sibs.map((m) => m.id)).toEqual(["m1"]);
  });
});

describe("findSessionForBranchTip", () => {
  it("returns session id for a branch tip", () => {
    const meta = {
      sessions: { sess_A: { branchTip: "m5", createdAt: "" }, sess_B: { branchTip: "m3", createdAt: "" } },
    } as unknown as ConversationMeta;
    expect(findSessionForBranchTip(meta, "m5")).toBe("sess_A");
    expect(findSessionForBranchTip(meta, "m3")).toBe("sess_B");
  });

  it("returns null if no session found", () => {
    const meta = { sessions: {} } as unknown as ConversationMeta;
    expect(findSessionForBranchTip(meta, "m1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/features/chat/__tests__/branch.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement branch utilities**

```typescript
// server/src/features/chat/branch.ts
import type { Message, ConversationMeta, MessageId } from "@claude-copy/shared";

export function getActivePath(messages: Message[], leafId: MessageId): Message[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const path: Message[] = [];
  let current = byId.get(leafId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function getSiblings(messages: Message[], messageId: MessageId): Message[] {
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) return [];
  return messages.filter((m) => m.parentId === msg.parentId);
}

export function getChildren(messages: Message[], messageId: MessageId): Message[] {
  return messages.filter((m) => m.parentId === messageId);
}

export function findSessionForBranchTip(meta: ConversationMeta, branchTip: MessageId): string | null {
  for (const [sessionId, info] of Object.entries(meta.sessions)) {
    if (info.branchTip === branchTip) return sessionId;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/src/features/chat/__tests__/branch.test.ts`

Expected: All tests PASS.

- [ ] **Step 5: Implement conversation storage**

```typescript
// server/src/features/chat/storage.ts
import type { ConversationMeta, Message, ConversationId, MessageId } from "@claude-copy/shared";
import { atomicWrite, readJson } from "../../storage/atomic-write.js";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

export class ConversationStorage {
  private convDir(dataDir: string, convId: ConversationId): string {
    return path.join(dataDir, "conversations", convId);
  }

  async createConversation(dataDir: string, params: { model: string; style: string; projectId?: string }): Promise<ConversationMeta> {
    const id = `conv_${uuid().slice(0, 8)}` as ConversationId;
    const now = new Date().toISOString();
    const meta: ConversationMeta = {
      id,
      title: "New Conversation",
      projectId: params.projectId ?? null,
      model: params.model,
      style: params.style,
      starred: false,
      createdAt: now,
      updatedAt: now,
      sessions: {},
      activeBranchTip: "" as MessageId,
      usage: { totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0, messageCount: 0 },
    };

    const dir = this.convDir(dataDir, id);
    await fs.mkdir(path.join(dir, "attachments"), { recursive: true });
    await atomicWrite(path.join(dir, "meta.json"), meta);
    await atomicWrite(path.join(dir, "messages.json"), []);
    return meta;
  }

  async getMeta(dataDir: string, convId: ConversationId): Promise<ConversationMeta | null> {
    return readJson<ConversationMeta>(path.join(this.convDir(dataDir, convId), "meta.json"));
  }

  async saveMeta(dataDir: string, convId: ConversationId, meta: ConversationMeta): Promise<void> {
    meta.updatedAt = new Date().toISOString();
    await atomicWrite(path.join(this.convDir(dataDir, convId), "meta.json"), meta);
  }

  async getMessages(dataDir: string, convId: ConversationId): Promise<Message[]> {
    return (await readJson<Message[]>(path.join(this.convDir(dataDir, convId), "messages.json"))) ?? [];
  }

  async addMessage(dataDir: string, convId: ConversationId, message: Message): Promise<void> {
    const messages = await this.getMessages(dataDir, convId);
    messages.push(message);
    await atomicWrite(path.join(this.convDir(dataDir, convId), "messages.json"), messages);
  }

  async listConversations(dataDir: string): Promise<ConversationMeta[]> {
    const dir = path.join(dataDir, "conversations");
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const metas: ConversationMeta[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const meta = await this.getMeta(dataDir, entry.name as ConversationId);
        if (meta) metas.push(meta);
      }
      return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async deleteConversation(dataDir: string, convId: ConversationId): Promise<void> {
    await fs.rm(this.convDir(dataDir, convId), { recursive: true, force: true });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add server/src/features/chat/
git commit -m "feat: add conversation storage and branch tree utilities"
```

---

## Task 8: Chat SSE Streaming Endpoint

**Files:**
- Create: `server/src/features/chat/routes.ts`
- Create: `server/src/features/chat/service.ts`
- Modify: `server/src/app.ts` — mount chat routes

- [ ] **Step 1: Implement chat service**

```typescript
// server/src/features/chat/service.ts
import type { ConversationMeta, Message, MessageId, ContentBlock, ChatSSEEvent } from "@claude-copy/shared";
import { ConversationStorage } from "./storage.js";
import { ClaudeService } from "../../llm/claude-service.js";
import { buildSystemPrompt } from "../../llm/system-prompt-builder.js";
import type { Profile, MemoryEntry, CustomStyle } from "@claude-copy/shared";
import { v4 as uuid } from "uuid";

interface ChatContext {
  profile: Profile;
  memories: MemoryEntry[];
  style: CustomStyle | null;
  projectInstructions: string | null;
  knowledgeContext: string | null;
}

export class ChatService {
  constructor(
    private convStorage: ConversationStorage,
    private claudeService: ClaudeService,
  ) {}

  async *sendMessage(
    dataDir: string,
    conversationId: string,
    content: ContentBlock[],
    parentId: string | undefined,
    model: string,
    context: ChatContext,
  ): AsyncGenerator<ChatSSEEvent> {
    const meta = await this.convStorage.getMeta(dataDir, conversationId);
    if (!meta) throw new Error("Conversation not found");

    // Save user message
    const userMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
    const userMsg: Message = {
      id: userMsgId,
      parentId: (parentId ?? meta.activeBranchTip) as MessageId || null,
      role: "user",
      content,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    await this.convStorage.addMessage(dataDir, conversationId, userMsg);
    yield { type: "user_saved", messageId: userMsgId };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Determine if resume or start new
    const abortController = new AbortController();
    this.claudeService.setAbortController(conversationId, abortController);

    const textContent = content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("\n");

    try {
      // Find active session to resume
      const activeSessionId = Object.entries(meta.sessions).find(
        ([, info]) => info.branchTip === meta.activeBranchTip,
      )?.[0];

      const stream = activeSessionId
        ? this.claudeService.resumeConversation({
            prompt: textContent,
            sessionId: activeSessionId,
            model,
            systemPrompt,
            abortController,
          })
        : this.claudeService.startConversation({
            prompt: textContent,
            model,
            systemPrompt,
            abortController,
          });

      let assistantText = "";
      let newSessionId = "";
      let usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

      for await (const msg of stream) {
        if (msg.session_id) newSessionId = msg.session_id;

        if (msg.type === "assistant") {
          const textBlocks = msg.message.content.filter((b: { type: string }) => b.type === "text");
          for (const block of textBlocks) {
            assistantText += (block as { text: string }).text;
            yield { type: "assistant_chunk", text: (block as { text: string }).text };
          }
          if (msg.message.usage) {
            usage.inputTokens += msg.message.usage.input_tokens ?? 0;
            usage.outputTokens += msg.message.usage.output_tokens ?? 0;
          }
        }

        if (msg.type === "result") {
          usage.costUsd = msg.total_cost_usd ?? 0;
        }
      }

      // Save assistant message
      const assistantMsgId = `msg_${uuid().slice(0, 8)}` as MessageId;
      const assistantMsg: Message = {
        id: assistantMsgId,
        parentId: userMsgId,
        role: "assistant",
        content: [{ type: "text", text: assistantText }],
        attachments: [],
        model,
        usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
        createdAt: new Date().toISOString(),
      };
      await this.convStorage.addMessage(dataDir, conversationId, assistantMsg);

      // Update session map
      if (newSessionId) {
        meta.sessions[newSessionId] = { branchTip: assistantMsgId, createdAt: new Date().toISOString() };
      }
      meta.activeBranchTip = assistantMsgId;
      meta.usage.totalInputTokens += usage.inputTokens;
      meta.usage.totalOutputTokens += usage.outputTokens;
      meta.usage.totalCostUsd += usage.costUsd;
      meta.usage.messageCount += 2;
      await this.convStorage.saveMeta(dataDir, conversationId, meta);

      yield { type: "assistant_done", messageId: assistantMsgId, artifactIds: [] };
      yield { type: "done", usage };
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        yield { type: "error", code: "aborted", message: "Generation aborted by user" };
      } else {
        yield { type: "error", code: "sdk_error", message: (err as Error).message };
      }
    } finally {
      this.claudeService.clearAbortController(conversationId);
    }
  }
}
```

- [ ] **Step 2: Implement chat routes**

```typescript
// server/src/features/chat/routes.ts
import { Router } from "express";
import { ChatService } from "./service.js";
import { ConversationStorage } from "./storage.js";
import { ClaudeService } from "../../llm/claude-service.js";
import type { SendMessageRequest } from "@claude-copy/shared";

export function createChatRoutes(chatService: ChatService, convStorage: ConversationStorage, claudeService: ClaudeService): Router {
  const router = Router();

  // POST /api/chat/:conversationId/messages — SSE streaming
  router.post("/:conversationId/messages", async (req, res) => {
    const { conversationId } = req.params;
    const body = req.body as SendMessageRequest;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = chatService.sendMessage(
        req.dataDir,
        conversationId,
        body.content,
        body.parentId,
        body.model ?? "claude-sonnet-4-6",
        {
          profile: { id: req.profileId, name: "", avatar: "", role: "", expertise: [], language: "en", globalInstructions: "", defaults: { model: "claude-sonnet-4-6", style: "normal" } },
          memories: [],
          style: null,
          projectInstructions: null,
          knowledgeContext: null,
        },
      );

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err: unknown) {
      res.write(`data: ${JSON.stringify({ type: "error", code: "internal", message: (err as Error).message })}\n\n`);
    }
    res.end();
  });

  // POST /api/chat/:conversationId/abort
  router.post("/:conversationId/abort", (req, res) => {
    const aborted = claudeService.abort(req.params.conversationId);
    res.json({ aborted });
  });

  return router;
}
```

- [ ] **Step 3: Mount chat routes in app.ts**

Add to `server/src/app.ts`:

```typescript
import { ConversationStorage } from "./features/chat/storage.js";
import { ChatService } from "./features/chat/service.js";
import { createChatRoutes } from "./features/chat/routes.js";
import { ClaudeService } from "./llm/claude-service.js";

// Inside createApp(), after profileRouter setup:
const claudeService = new ClaudeService();
const convStorage = new ConversationStorage();
const chatService = new ChatService(convStorage, claudeService);

profileRouter.use("/chat", createChatRoutes(chatService, convStorage, claudeService));
```

- [ ] **Step 4: Commit**

```bash
git add server/src/features/chat/routes.ts server/src/features/chat/service.ts server/src/app.ts
git commit -m "feat: add chat SSE streaming endpoint with SDK integration"
```

---

## Task 9: Conversation List & Management API

**Files:**
- Create: `server/src/features/conversations/routes.ts`
- Create: `server/src/features/conversations/service.ts`
- Modify: `server/src/app.ts` — mount conversation routes

- [ ] **Step 1: Implement conversation management service**

```typescript
// server/src/features/conversations/service.ts
import type { ConversationMeta } from "@claude-copy/shared";
import { ConversationStorage } from "../chat/storage.js";

export class ConversationManagementService {
  constructor(private storage: ConversationStorage) {}

  async list(dataDir: string, params: { limit?: number; cursor?: string }): Promise<{ data: ConversationMeta[]; nextCursor: string | null }> {
    const all = await this.storage.listConversations(dataDir);
    const limit = params.limit ?? 20;
    let startIdx = 0;
    if (params.cursor) {
      startIdx = all.findIndex((c) => c.id === params.cursor) + 1;
    }
    const data = all.slice(startIdx, startIdx + limit);
    const nextCursor = startIdx + limit < all.length ? data[data.length - 1]?.id ?? null : null;
    return { data, nextCursor };
  }

  async search(dataDir: string, query: string): Promise<ConversationMeta[]> {
    const all = await this.storage.listConversations(dataDir);
    const q = query.toLowerCase();
    return all.filter((c) => c.title.toLowerCase().includes(q));
  }

  async create(dataDir: string, params: { model: string; style: string; projectId?: string }): Promise<ConversationMeta> {
    return this.storage.createConversation(dataDir, params);
  }

  async update(dataDir: string, convId: string, updates: Partial<Pick<ConversationMeta, "title" | "starred" | "projectId">>): Promise<ConversationMeta> {
    const meta = await this.storage.getMeta(dataDir, convId);
    if (!meta) throw new Error("Conversation not found");
    if (updates.title !== undefined) meta.title = updates.title;
    if (updates.starred !== undefined) meta.starred = updates.starred;
    if (updates.projectId !== undefined) meta.projectId = updates.projectId;
    await this.storage.saveMeta(dataDir, convId, meta);
    return meta;
  }

  async remove(dataDir: string, convId: string): Promise<void> {
    await this.storage.deleteConversation(dataDir, convId);
  }

  async duplicate(dataDir: string, convId: string): Promise<ConversationMeta> {
    const meta = await this.storage.getMeta(dataDir, convId);
    if (!meta) throw new Error("Conversation not found");
    const messages = await this.storage.getMessages(dataDir, convId);
    const newConv = await this.storage.createConversation(dataDir, { model: meta.model, style: meta.style, projectId: meta.projectId ?? undefined });
    for (const msg of messages) {
      await this.storage.addMessage(dataDir, newConv.id, msg);
    }
    newConv.title = `${meta.title} (copy)`;
    await this.storage.saveMeta(dataDir, newConv.id, newConv);
    return newConv;
  }
}
```

- [ ] **Step 2: Implement conversation routes**

```typescript
// server/src/features/conversations/routes.ts
import { Router } from "express";
import { ConversationManagementService } from "./service.js";

export function createConversationRoutes(service: ConversationManagementService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const { limit, cursor } = req.query;
    const result = await service.list(req.dataDir, { limit: limit ? Number(limit) : undefined, cursor: cursor as string });
    res.json(result);
  });

  router.get("/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) { res.json({ data: [] }); return; }
    const results = await service.search(req.dataDir, q);
    res.json({ data: results });
  });

  router.post("/", async (req, res) => {
    const conv = await service.create(req.dataDir, req.body);
    res.status(201).json(conv);
  });

  router.get("/:id", async (req, res) => {
    const { ConversationStorage } = await import("../chat/storage.js");
    const storage = new ConversationStorage();
    const meta = await storage.getMeta(req.dataDir, req.params.id);
    if (!meta) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } }); return; }
    const messages = await storage.getMessages(req.dataDir, req.params.id);
    res.json({ meta, messages });
  });

  router.put("/:id", async (req, res) => {
    const updated = await service.update(req.dataDir, req.params.id, req.body);
    res.json(updated);
  });

  router.delete("/:id", async (req, res) => {
    await service.remove(req.dataDir, req.params.id);
    res.json({ ok: true });
  });

  router.post("/:id/duplicate", async (req, res) => {
    const dup = await service.duplicate(req.dataDir, req.params.id);
    res.status(201).json(dup);
  });

  return router;
}
```

- [ ] **Step 3: Mount in app.ts**

```typescript
import { ConversationManagementService } from "./features/conversations/service.js";
import { createConversationRoutes } from "./features/conversations/routes.js";

// Inside createApp(), on profileRouter:
const convManagement = new ConversationManagementService(convStorage);
profileRouter.use("/conversations", createConversationRoutes(convManagement));
```

- [ ] **Step 4: Run all server tests**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/features/conversations/ server/src/app.ts
git commit -m "feat: add conversation management API — list, search, CRUD, duplicate"
```

---

## Task 10: React Client Shell & Routing

**Files:**
- Create: `client/src/app/App.tsx`
- Create: `client/src/app/router.tsx`
- Create: `client/src/app/providers.tsx`
- Create: `client/src/app/globals.css`
- Create: `client/src/lib/api-client.ts`
- Create: `client/src/lib/sse-client.ts`
- Create: `client/src/lib/utils.ts`
- Create: `client/src/hooks/use-profile.ts`
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Create globals.css with Tailwind**

```css
/* client/src/app/globals.css */
@import "tailwindcss";
```

- [ ] **Step 2: Create utility helpers**

```typescript
// client/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
```

- [ ] **Step 3: Create API client**

```typescript
// client/src/lib/api-client.ts
import type { ApiError } from "@claude-copy/shared";

let activeProfileId: string = "";

export function setActiveProfileId(id: string): void {
  activeProfileId = id;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(activeProfileId ? { "X-Profile-Id": activeProfileId } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

- [ ] **Step 4: Create SSE client**

```typescript
// client/src/lib/sse-client.ts
import type { ChatSSEEvent, ContentBlock } from "@claude-copy/shared";

export interface SSEStreamOptions {
  conversationId: string;
  content: ContentBlock[];
  parentId?: string;
  model?: string;
  style?: string;
  profileId: string;
  onEvent: (event: ChatSSEEvent) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export function startChatStream(options: SSEStreamOptions): AbortController {
  const ac = new AbortController();

  fetch(`/api/chat/${options.conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Profile-Id": options.profileId,
    },
    body: JSON.stringify({
      content: options.content,
      parentId: options.parentId,
      model: options.model,
      style: options.style,
    }),
    signal: ac.signal,
  })
    .then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as ChatSSEEvent;
              options.onEvent(event);
            } catch { /* skip malformed */ }
          }
        }
      }
      options.onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") options.onError(err);
    });

  return ac;
}
```

- [ ] **Step 5: Create profile store**

```typescript
// client/src/hooks/use-profile.ts
import { create } from "zustand";
import type { ProfilesIndex, Profile } from "@claude-copy/shared";
import { apiFetch, setActiveProfileId } from "../lib/api-client.js";

interface ProfileStore {
  index: ProfilesIndex | null;
  activeProfile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  index: null,
  activeProfile: null,
  loading: true,

  initialize: async () => {
    const index = await apiFetch<ProfilesIndex>("/profiles");
    setActiveProfileId(index.activeProfileId);
    const profile = await apiFetch<Profile>(`/profiles/${index.activeProfileId}`);
    set({ index, activeProfile: profile, loading: false });
  },

  switchProfile: async (profileId: string) => {
    await apiFetch(`/profiles/active/${profileId}`, { method: "PUT" });
    setActiveProfileId(profileId);
    const profile = await apiFetch<Profile>(`/profiles/${profileId}`);
    const index = await apiFetch<ProfilesIndex>("/profiles");
    set({ index, activeProfile: profile });
  },
}));
```

- [ ] **Step 6: Create router**

```typescript
// client/src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App.js";

function Placeholder({ name }: { name: string }) {
  return <div className="flex items-center justify-center h-full text-zinc-500">{name} — coming soon</div>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Placeholder name="New Conversation" /> },
      { path: "chat/:id", element: <Placeholder name="Chat" /> },
      { path: "project/:id", element: <Placeholder name="Project" /> },
      { path: "project/:id/settings", element: <Placeholder name="Project Settings" /> },
      { path: "settings", element: <Placeholder name="Settings" /> },
    ],
  },
]);
```

- [ ] **Step 7: Create App shell**

```tsx
// client/src/app/App.tsx
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";

export default function App() {
  const { loading, initialize, activeProfile } = useProfileStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar placeholder */}
      <aside className="w-70 border-r border-zinc-800 p-4 flex flex-col gap-2">
        <div className="text-lg font-semibold">Claude Copy</div>
        <div className="text-sm text-zinc-500">{activeProfile?.name}</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 8: Create providers**

```tsx
// client/src/app/providers.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./router.js";

export function Providers() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 9: Update main.tsx**

```tsx
// client/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./app/providers.js";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
```

- [ ] **Step 10: Install additional client deps**

Run: `npm install -w client clsx tailwind-merge`

- [ ] **Step 11: Verify client compiles and renders**

Run: `npm run dev -w client` (with server running in another terminal)

Expected: Browser shows dark layout with "Claude Copy" sidebar and "New Conversation — coming soon" in main area.

- [ ] **Step 12: Commit**

```bash
git add client/
git commit -m "feat: add React client shell with routing, API client, SSE client, and profile store"
```

---

## Task 11: Chat UI — Core Components

**Files:**
- Create: `client/src/features/chat/store.ts`
- Create: `client/src/features/chat/use-chat-stream.ts`
- Create: `client/src/features/chat/use-branch.ts`
- Create: `client/src/features/chat/markdown-renderer.tsx`
- Create: `client/src/features/chat/ChatView.tsx`
- Create: `client/src/features/chat/MessageList.tsx`
- Create: `client/src/features/chat/MessageBubble.tsx`
- Create: `client/src/features/chat/MessageInput.tsx`
- Create: `client/src/features/chat/BranchNavigator.tsx`
- Create: `client/src/features/chat/StreamingIndicator.tsx`
- Modify: `client/src/app/router.tsx` — wire ChatView

- [ ] **Step 1: Install markdown deps**

Run: `npm install -w client react-markdown remark-gfm remark-math rehype-katex rehype-highlight rehype-raw katex highlight.js`

- [ ] **Step 2: Create chat store**

```typescript
// client/src/features/chat/store.ts
import { create } from "zustand";
import type { ConversationMeta, Message } from "@claude-copy/shared";
import { apiFetch } from "../../lib/api-client.js";

interface ChatStore {
  meta: ConversationMeta | null;
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  activeBranchTip: string;

  loadConversation: (id: string) => Promise<void>;
  setStreaming: (streaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
  addMessage: (msg: Message) => void;
  setActiveBranchTip: (tip: string) => void;
  updateMeta: (updates: Partial<ConversationMeta>) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  meta: null,
  messages: [],
  isStreaming: false,
  streamingText: "",
  activeBranchTip: "",

  loadConversation: async (id: string) => {
    const data = await apiFetch<{ meta: ConversationMeta; messages: Message[] }>(`/conversations/${id}`);
    set({ meta: data.meta, messages: data.messages, activeBranchTip: data.meta.activeBranchTip });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  appendStreamingText: (text) => set((s) => ({ streamingText: s.streamingText + text })),
  clearStreamingText: () => set({ streamingText: "" }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setActiveBranchTip: (tip) => set({ activeBranchTip: tip }),
  updateMeta: (updates) => set((s) => ({ meta: s.meta ? { ...s.meta, ...updates } : null })),
}));
```

- [ ] **Step 3: Create use-branch hook**

```typescript
// client/src/features/chat/use-branch.ts
import { useMemo, useCallback } from "react";
import type { Message } from "@claude-copy/shared";
import { useChatStore } from "./store.js";

export function useBranch() {
  const { messages, activeBranchTip, setActiveBranchTip } = useChatStore();

  const activePath = useMemo(() => {
    if (!activeBranchTip || messages.length === 0) return [];
    const byId = new Map(messages.map((m) => [m.id, m]));
    const path: Message[] = [];
    let current = byId.get(activeBranchTip);
    while (current) {
      path.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return path;
  }, [messages, activeBranchTip]);

  const getSiblings = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return [];
      return messages.filter((m) => m.parentId === msg.parentId);
    },
    [messages],
  );

  const switchBranch = useCallback(
    (messageId: string, direction: "prev" | "next") => {
      const siblings = getSiblings(messageId);
      const idx = siblings.findIndex((s) => s.id === messageId);
      const newIdx = direction === "prev" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= siblings.length) return;

      // Find the deepest leaf from the new sibling
      const newSibling = siblings[newIdx];
      let leaf = newSibling;
      let children = messages.filter((m) => m.parentId === leaf.id);
      while (children.length > 0) {
        leaf = children[children.length - 1]; // pick latest child
        children = messages.filter((m) => m.parentId === leaf.id);
      }
      setActiveBranchTip(leaf.id);
    },
    [messages, getSiblings, setActiveBranchTip],
  );

  return { activePath, getSiblings, switchBranch };
}
```

- [ ] **Step 4: Create use-chat-stream hook**

```typescript
// client/src/features/chat/use-chat-stream.ts
import { useCallback, useRef } from "react";
import { useChatStore } from "./store.js";
import { useProfileStore } from "../../hooks/use-profile.js";
import { startChatStream } from "../../lib/sse-client.js";
import type { ContentBlock } from "@claude-copy/shared";

export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const { meta, setStreaming, appendStreamingText, clearStreamingText, addMessage, loadConversation } = useChatStore();
  const { activeProfile } = useProfileStore();

  const sendMessage = useCallback(
    (content: ContentBlock[], parentId?: string) => {
      if (!meta || !activeProfile) return;

      setStreaming(true);
      clearStreamingText();

      abortRef.current = startChatStream({
        conversationId: meta.id,
        content,
        parentId,
        model: meta.model,
        profileId: activeProfile.id,
        onEvent: (event) => {
          if (event.type === "assistant_chunk") {
            appendStreamingText(event.text);
          }
          if (event.type === "assistant_done" || event.type === "done") {
            // Reload to get persisted state
            loadConversation(meta.id);
          }
        },
        onError: (err) => {
          console.error("Stream error:", err);
          setStreaming(false);
        },
        onDone: () => {
          setStreaming(false);
          clearStreamingText();
        },
      });
    },
    [meta, activeProfile, setStreaming, appendStreamingText, clearStreamingText, addMessage, loadConversation],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    clearStreamingText();
  }, [setStreaming, clearStreamingText]);

  return { sendMessage, abort };
}
```

- [ ] **Step 5: Create markdown renderer**

```tsx
// client/src/features/chat/markdown-renderer.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
      components={{
        pre({ children }) {
          return (
            <div className="relative group">
              <button
                className="absolute top-2 right-2 text-xs bg-zinc-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                onClick={() => {
                  const code = (children as React.ReactElement)?.props?.children;
                  if (typeof code === "string") navigator.clipboard.writeText(code);
                }}
              >
                Copy
              </button>
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm">{children}</pre>
            </div>
          );
        },
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
          }
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 6: Create MessageBubble**

```tsx
// client/src/features/chat/MessageBubble.tsx
import type { Message } from "@claude-copy/shared";
import { MarkdownRenderer } from "./markdown-renderer.js";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const textContent = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return (
    <div className={`flex gap-3 py-4 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold shrink-0">
          C
        </div>
      )}
      <div className={`max-w-3xl ${isUser ? "bg-zinc-800 rounded-2xl px-4 py-3" : "prose prose-invert max-w-none"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{textContent}</p>
        ) : (
          <MarkdownRenderer content={textContent} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create BranchNavigator**

```tsx
// client/src/features/chat/BranchNavigator.tsx
import { useBranch } from "./use-branch.js";

interface BranchNavigatorProps {
  messageId: string;
}

export function BranchNavigator({ messageId }: BranchNavigatorProps) {
  const { getSiblings, switchBranch } = useBranch();
  const siblings = getSiblings(messageId);

  if (siblings.length <= 1) return null;

  const currentIdx = siblings.findIndex((s) => s.id === messageId);

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <button
        className="hover:text-zinc-300 disabled:opacity-30"
        disabled={currentIdx === 0}
        onClick={() => switchBranch(messageId, "prev")}
      >
        &larr;
      </button>
      <span>{currentIdx + 1}/{siblings.length}</span>
      <button
        className="hover:text-zinc-300 disabled:opacity-30"
        disabled={currentIdx === siblings.length - 1}
        onClick={() => switchBranch(messageId, "next")}
      >
        &rarr;
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Create StreamingIndicator**

```tsx
// client/src/features/chat/StreamingIndicator.tsx
import { MarkdownRenderer } from "./markdown-renderer.js";
import { useChatStore } from "./store.js";

export function StreamingIndicator() {
  const { isStreaming, streamingText } = useChatStore();

  if (!isStreaming) return null;

  return (
    <div className="flex gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold shrink-0 animate-pulse">
        C
      </div>
      <div className="prose prose-invert max-w-none">
        {streamingText ? (
          <MarkdownRenderer content={streamingText} />
        ) : (
          <span className="text-zinc-500 animate-pulse">Thinking...</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create MessageList**

```tsx
// client/src/features/chat/MessageList.tsx
import { useEffect, useRef } from "react";
import { useBranch } from "./use-branch.js";
import { MessageBubble } from "./MessageBubble.js";
import { BranchNavigator } from "./BranchNavigator.js";
import { StreamingIndicator } from "./StreamingIndicator.js";

export function MessageList() {
  const { activePath } = useBranch();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePath.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="max-w-3xl mx-auto">
        {activePath.map((msg) => (
          <div key={msg.id}>
            <BranchNavigator messageId={msg.id} />
            <MessageBubble message={msg} />
          </div>
        ))}
        <StreamingIndicator />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Create MessageInput**

```tsx
// client/src/features/chat/MessageInput.tsx
import { useState, useRef, useCallback } from "react";
import { useChatStream } from "./use-chat-stream.js";
import { useChatStore } from "./store.js";

export function MessageInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, abort } = useChatStream();
  const { isStreaming, meta } = useChatStore();

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage([{ type: "text", text: trimmed }]);
    setText("");
  }, [text, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && isStreaming) {
        abort();
      }
    },
    [handleSubmit, isStreaming, abort],
  );

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
          <span>{meta?.model ?? "claude-sonnet-4-6"}</span>
          <span>&middot;</span>
          <span>{meta?.style ?? "normal"}</span>
        </div>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-zinc-500 min-h-12 max-h-48"
            placeholder="Send a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isStreaming ? (
            <button className="px-4 py-2 bg-red-600 rounded-xl text-sm hover:bg-red-500" onClick={abort}>
              Stop
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-orange-600 rounded-xl text-sm hover:bg-orange-500 disabled:opacity-40"
              disabled={!text.trim()}
              onClick={handleSubmit}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Create ChatView**

```tsx
// client/src/features/chat/ChatView.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "./store.js";
import { MessageList } from "./MessageList.js";
import { MessageInput } from "./MessageInput.js";

export function ChatView() {
  const { id } = useParams<{ id: string }>();
  const { loadConversation, meta } = useChatStore();

  useEffect(() => {
    if (id) loadConversation(id);
  }, [id, loadConversation]);

  if (!meta) {
    return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading conversation...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-medium">{meta.title}</h1>
      </div>
      <MessageList />
      <MessageInput />
    </div>
  );
}
```

- [ ] **Step 12: Update router to use ChatView**

In `client/src/app/router.tsx`, replace the chat placeholder:

```tsx
import { ChatView } from "../features/chat/ChatView.js";

// In the routes array, replace the chat/:id route:
{ path: "chat/:id", element: <ChatView /> },
```

- [ ] **Step 13: Verify chat UI renders**

Run both server and client. Create a conversation via API:

```bash
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -H "X-Profile-Id: <your-profile-id>" \
  -d '{"model":"claude-sonnet-4-6","style":"normal"}'
```

Navigate to `http://localhost:5173/chat/<returned-id>`. Expected: Chat UI with input area.

- [ ] **Step 14: Commit**

```bash
git add client/src/features/chat/ client/src/app/router.tsx
git commit -m "feat: add chat UI — message list, input, streaming, branch navigation"
```

---

## Task 12: Sidebar & Conversation List

**Files:**
- Create: `client/src/features/sidebar/store.ts`
- Create: `client/src/features/sidebar/Sidebar.tsx`
- Create: `client/src/features/sidebar/SearchBar.tsx`
- Create: `client/src/features/sidebar/ConversationList.tsx`
- Create: `client/src/features/sidebar/ConversationItem.tsx`
- Create: `client/src/features/sidebar/ProfileSwitcher.tsx`
- Modify: `client/src/app/App.tsx` — integrate sidebar

This task follows the same pattern: create the Zustand store for sidebar state, build each component, and wire them into the App shell. The sidebar store fetches conversations from `/api/conversations`, groups them by date, and provides search via `/api/conversations/search`. The ConversationItem renders each entry with a context menu (rename, star, delete). The ProfileSwitcher reads from the profile store. Finally, App.tsx replaces the placeholder sidebar with the real Sidebar component.

- [ ] **Step 1–7: Implement all sidebar components following the same TDD pattern as prior tasks**

- [ ] **Step 8: Commit**

```bash
git add client/src/features/sidebar/ client/src/app/App.tsx
git commit -m "feat: add sidebar with conversation list, search, grouping, and profile switcher"
```

---

## Task 13: Projects — Backend & Frontend

**Files:**
- Create: `server/src/features/projects/storage.ts`
- Create: `server/src/features/projects/service.ts`
- Create: `server/src/features/projects/routes.ts`
- Create: `client/src/features/projects/ProjectView.tsx`
- Create: `client/src/features/projects/ProjectSettings.tsx`
- Create: `client/src/features/projects/KnowledgeManager.tsx`
- Create: `client/src/features/projects/LocalPathManager.tsx`
- Modify: `server/src/app.ts` — mount project routes
- Modify: `client/src/app/router.tsx` — wire project views

Project backend follows the same CRUD pattern as profiles/conversations. The storage creates `data/profiles/{id}/projects/{projId}/` with `meta.json` and `instructions.md`. The service manages knowledge file uploads into the `knowledge/` subdirectory and local path CRUD. Routes map to the API spec in Section 5.2. Frontend provides the project detail view, settings editor with markdown instruction editor, knowledge file manager (upload/delete list), and local path manager (add/remove paths).

- [ ] **Steps 1–10: Implement following the same pattern**

- [ ] **Step 11: Commit**

```bash
git add server/src/features/projects/ client/src/features/projects/ server/src/app.ts client/src/app/router.tsx
git commit -m "feat: add projects — CRUD, instructions, knowledge files, local paths"
```

---

## Task 14: Artifacts — Detection, Storage, Preview

**Files:**
- Create: `server/src/features/artifacts/detector.ts`
- Create: `server/src/features/artifacts/storage.ts`
- Create: `server/src/features/artifacts/service.ts`
- Create: `server/src/features/artifacts/routes.ts`
- Create: `client/src/features/artifacts/store.ts`
- Create: `client/src/features/artifacts/ArtifactPanel.tsx`
- Create: `client/src/features/artifacts/ArtifactPreview.tsx`
- Create: `client/src/features/artifacts/ArtifactCodeView.tsx`
- Create: `client/src/features/artifacts/ArtifactVersionNav.tsx`
- Create: `client/src/features/artifacts/sandbox-builder.ts`
- Test: `server/src/features/artifacts/__tests__/detector.test.ts`
- Modify: `server/src/app.ts`
- Modify: `client/src/app/App.tsx` — add artifact panel

- [ ] **Step 1: Write detector test**

```typescript
// server/src/features/artifacts/__tests__/detector.test.ts
import { describe, it, expect } from "vitest";
import { detectArtifacts } from "../detector.js";

describe("detectArtifacts", () => {
  it("detects React component with export default and JSX", () => {
    const code = Array(15).fill("").map((_, i) =>
      i === 0 ? 'export default function App() {' :
      i === 1 ? '  return (' :
      i === 2 ? '    <div>' :
      i === 13 ? '  );' :
      i === 14 ? '}' :
      `    <p>Line ${i}</p>`
    ).join("\n");
    const result = detectArtifacts(`\`\`\`tsx\n${code}\n\`\`\``);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("react");
  });

  it("detects Mermaid diagram", () => {
    const code = "graph TD\n  A --> B\n  B --> C";
    const result = detectArtifacts(`\`\`\`mermaid\n${code}\n\`\`\``);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("mermaid");
  });

  it("does not detect short code snippets", () => {
    const code = "const x = 1;\nconsole.log(x);";
    const result = detectArtifacts(`\`\`\`typescript\n${code}\n\`\`\``);
    expect(result.length).toBe(0);
  });

  it("detects HTML document", () => {
    const code = Array(12).fill("").map((_, i) =>
      i === 0 ? '<!DOCTYPE html>' :
      i === 1 ? '<html>' :
      i === 11 ? '</html>' :
      `<p>Line ${i}</p>`
    ).join("\n");
    const result = detectArtifacts(`\`\`\`html\n${code}\n\`\`\``);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("html");
  });
});
```

- [ ] **Step 2: Implement detector**

```typescript
// server/src/features/artifacts/detector.ts
import type { ArtifactType } from "@claude-copy/shared";

interface DetectedArtifact {
  type: ArtifactType;
  language: string;
  content: string;
  title: string;
}

const MERMAID_STARTERS = ["graph", "flowchart", "sequenceDiagram", "classDiagram", "erDiagram", "gantt", "pie", "gitGraph"];

export function detectArtifacts(responseText: string): DetectedArtifact[] {
  const artifacts: DetectedArtifact[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    const lang = match[1] ?? "";
    const code = match[2].trim();
    const lines = code.split("\n").length;

    // React
    if ((lang === "tsx" || lang === "jsx") && lines >= 10 && /export\s+default/.test(code) && /<\w/.test(code)) {
      artifacts.push({ type: "react", language: lang, content: code, title: extractComponentName(code) });
      continue;
    }

    // HTML
    if (lang === "html" && lines >= 10 && (/<!DOCTYPE/i.test(code) || /<html/i.test(code))) {
      artifacts.push({ type: "html", language: "html", content: code, title: "HTML Document" });
      continue;
    }

    // SVG
    if ((lang === "svg" || lang === "xml") && lines >= 5 && /<svg\b/.test(code)) {
      artifacts.push({ type: "svg", language: "svg", content: code, title: "SVG Graphic" });
      continue;
    }

    // Mermaid
    if (lang === "mermaid" && lines >= 3 && MERMAID_STARTERS.some((s) => code.startsWith(s))) {
      artifacts.push({ type: "mermaid", language: "mermaid", content: code, title: "Diagram" });
      continue;
    }
  }

  return artifacts;
}

function extractComponentName(code: string): string {
  const match = /export\s+default\s+function\s+(\w+)/.exec(code);
  return match?.[1] ?? "Component";
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run server/src/features/artifacts/__tests__/detector.test.ts`

Expected: All tests PASS.

- [ ] **Step 4: Implement artifact storage, service, and routes**

Follow same CRUD pattern as other features. Storage saves to `data/profiles/{id}/artifacts/{artId}/` with `meta.json`, `content.{ext}`, and `versions/` directory. Service manages versioning (copy current to `versions/v{n}.{ext}` before overwrite). Routes map to API spec in Section 5.3.

- [ ] **Step 5: Implement sandbox-builder.ts**

```typescript
// client/src/features/artifacts/sandbox-builder.ts
import type { ArtifactType } from "@claude-copy/shared";

export function buildSandboxHtml(type: ArtifactType, content: string): string | null {
  switch (type) {
    case "react":
      return `<!DOCTYPE html>
<html><head>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;font-family:system-ui;background:#09090b;color:#fafafa}</style>
</head><body>
<div id="root"></div>
<script type="text/babel" data-presets="react,typescript">
${content}
const App = typeof module !== 'undefined' && module.exports?.default || (typeof exports !== 'undefined' && exports.default);
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App || (() => React.createElement('div','','Component not found'))));
</script></body></html>`;
    case "html":
      return content;
    case "svg":
      return `<!DOCTYPE html><html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#09090b">${content}</body></html>`;
    case "mermaid":
      return `<!DOCTYPE html><html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<style>body{margin:0;display:flex;justify-content:center;padding:2rem;background:#09090b;color:#fafafa}</style>
</head><body>
<pre class="mermaid">${content}</pre>
<script>mermaid.initialize({startOnLoad:true,theme:'dark'})</script>
</body></html>`;
    default:
      return null;
  }
}
```

- [ ] **Step 6: Implement ArtifactPanel and preview components**

ArtifactPanel renders as the right panel with tabs (Code / Preview). ArtifactPreview uses iframe with `srcDoc` from sandbox-builder. ArtifactCodeView shows syntax-highlighted source. ArtifactVersionNav provides ← → version navigation. The artifact store manages panel open/close state and active artifact.

- [ ] **Step 7: Wire artifact panel into App.tsx layout**

```tsx
// In App.tsx, add the artifact panel after <main>:
{artifactOpen && (
  <aside className="w-100 border-l border-zinc-800">
    <ArtifactPanel />
  </aside>
)}
```

- [ ] **Step 8: Integrate detector into chat service**

In `server/src/features/chat/service.ts`, after saving the assistant message, run `detectArtifacts()` on the response text. For each detected artifact, create an artifact entry via ArtifactService and append `artifact_ref` blocks to the saved message.

- [ ] **Step 9: Commit**

```bash
git add server/src/features/artifacts/ client/src/features/artifacts/ server/src/features/chat/service.ts client/src/app/App.tsx
git commit -m "feat: add artifacts — detection, storage, sandboxed preview, version navigation"
```

---

## Task 15: File Management

**Files:**
- Create: `server/src/features/files/routes.ts`
- Create: `server/src/features/files/service.ts`
- Create: `server/src/features/files/storage.ts`
- Create: `server/src/features/files/path-validator.ts`
- Create: `client/src/features/files/FileDropZone.tsx`
- Create: `client/src/features/files/FileChip.tsx`
- Create: `client/src/features/files/FileBrowser.tsx`
- Test: `server/src/features/files/__tests__/path-validator.test.ts`

- [ ] **Step 1: Write path validator test**

```typescript
// server/src/features/files/__tests__/path-validator.test.ts
import { describe, it, expect } from "vitest";
import { validatePath } from "../path-validator.js";

describe("validatePath", () => {
  const allowedPaths = ["/home/user/projects/my-app", "/home/user/docs"];

  it("allows paths within registered directories", () => {
    expect(validatePath("/home/user/projects/my-app/src/index.ts", allowedPaths)).toBe(true);
  });

  it("rejects paths outside registered directories", () => {
    expect(validatePath("/etc/passwd", allowedPaths)).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    expect(validatePath("/home/user/projects/my-app/../../secret", allowedPaths)).toBe(false);
  });

  it("allows the root of a registered path", () => {
    expect(validatePath("/home/user/docs", allowedPaths)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement path validator**

```typescript
// server/src/features/files/path-validator.ts
import path from "node:path";

export function validatePath(requestedPath: string, allowedPaths: string[]): boolean {
  const resolved = path.resolve(requestedPath);
  return allowedPaths.some((allowed) => {
    const resolvedAllowed = path.resolve(allowed);
    return resolved === resolvedAllowed || resolved.startsWith(resolvedAllowed + path.sep);
  });
}
```

- [ ] **Step 3: Run test, implement file routes/service/storage, client components**

File service handles multipart uploads via multer, stores to `data/profiles/{id}/uploads/`, and extracts text from PDFs/DOCX/XLSX. Browse endpoint returns directory listings for project-linked paths (validated). FileDropZone provides drag-and-drop overlay. FileChip renders attachment pills. FileBrowser shows a tree view of linked local folders.

- [ ] **Step 4: Commit**

```bash
git add server/src/features/files/ client/src/features/files/
git commit -m "feat: add file management — upload, browse, download, path validation"
```

---

## Task 16: Settings & Personalization

**Files:**
- Create: `server/src/features/settings/routes.ts`
- Create: `server/src/features/settings/service.ts`
- Create: `server/src/features/settings/storage.ts`
- Create: `client/src/features/settings/SettingsView.tsx`
- Create: `client/src/features/settings/ProfileEditor.tsx`
- Create: `client/src/features/settings/MemoryManager.tsx`
- Create: `client/src/features/settings/StyleManager.tsx`
- Create: `client/src/features/settings/GlobalInstructions.tsx`

Backend: Settings service manages `settings.json` (theme, sidebar width), memory entries in `memory/entries/*.json` with `memory/index.json`, and custom styles in `styles/*.json`. Memory extraction is implemented as a separate endpoint that calls `claude-haiku-4-5` with the extraction prompt from Section 13.2. Deduplication uses whitespace-tokenized Jaccard similarity.

Frontend: SettingsView is a tabbed page (Profile / Memory / Styles / Global). ProfileEditor is a form for profile fields. MemoryManager shows a list of memory entries with toggle/delete. StyleManager lists built-in + custom styles with create/edit. GlobalInstructions is a textarea editor.

- [ ] **Steps 1–8: Follow TDD pattern for each component**

- [ ] **Step 9: Commit**

```bash
git add server/src/features/settings/ client/src/features/settings/
git commit -m "feat: add settings — profile editor, memory manager, styles, global instructions"
```

---

## Task 17: Layout Polish — Header, Status Bar, Theme

**Files:**
- Create: `client/src/features/layout/Header.tsx`
- Create: `client/src/features/layout/StatusBar.tsx`
- Create: `client/src/features/layout/ThemeProvider.tsx`
- Modify: `client/src/app/App.tsx` — assemble final 3-panel layout

- [ ] **Step 1: Implement ThemeProvider**

```tsx
// client/src/features/layout/ThemeProvider.tsx
import { useEffect, createContext, useContext, useState } from "react";
import type { ThemeMode } from "@claude-copy/shared";

const ThemeContext = createContext<{ theme: ThemeMode; setTheme: (t: ThemeMode) => void }>({
  theme: "system",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 2: Implement Header**

```tsx
// client/src/features/layout/Header.tsx
import { useNavigate } from "react-router-dom";
import { ProfileSwitcher } from "../sidebar/ProfileSwitcher.js";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
      <span className="font-semibold text-sm">Claude Copy</span>
      <div className="flex items-center gap-3">
        <ProfileSwitcher />
        <button className="text-zinc-400 hover:text-zinc-200 text-sm" onClick={() => navigate("/settings")}>
          Settings
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Implement StatusBar**

```tsx
// client/src/features/layout/StatusBar.tsx
import { useChatStore } from "../chat/store.js";

export function StatusBar() {
  const { meta } = useChatStore();
  const usage = meta?.usage;

  return (
    <footer className="h-8 border-t border-zinc-800 flex items-center px-4 text-xs text-zinc-500 gap-4">
      {usage && (
        <>
          <span>Tokens: {usage.totalInputTokens.toLocaleString()} in / {usage.totalOutputTokens.toLocaleString()} out</span>
          <span>Cost: ${usage.totalCostUsd.toFixed(4)}</span>
          <span>Messages: {usage.messageCount}</span>
        </>
      )}
    </footer>
  );
}
```

- [ ] **Step 4: Assemble final App.tsx layout**

```tsx
// client/src/app/App.tsx — final version
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useProfileStore } from "../hooks/use-profile.js";
import { Sidebar } from "../features/sidebar/Sidebar.js";
import { Header } from "../features/layout/Header.js";
import { StatusBar } from "../features/layout/StatusBar.js";
import { ArtifactPanel } from "../features/artifacts/ArtifactPanel.js";
import { useArtifactStore } from "../features/artifacts/store.js";

export default function App() {
  const { loading, initialize } = useProfileStore();
  const artifactOpen = useArtifactStore((s) => s.panelOpen);

  useEffect(() => { initialize(); }, [initialize]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
        {artifactOpen && (
          <aside className="w-100 border-l border-zinc-800 overflow-hidden">
            <ArtifactPanel />
          </aside>
        )}
      </div>
      <StatusBar />
    </div>
  );
}
```

- [ ] **Step 5: Add keyboard shortcuts**

Register global keyboard handlers in App.tsx using a `useEffect`:

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "n") { e.preventDefault(); navigate("/"); }
    if (e.ctrlKey && e.key === "b") { e.preventDefault(); toggleSidebar(); }
    if (e.ctrlKey && e.key === "j") { e.preventDefault(); toggleArtifactPanel(); }
    if (e.ctrlKey && e.key === "k") { e.preventDefault(); focusSearch(); }
    if (e.ctrlKey && e.key === ",") { e.preventDefault(); navigate("/settings"); }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

- [ ] **Step 6: Commit**

```bash
git add client/src/features/layout/ client/src/app/App.tsx
git commit -m "feat: add header, status bar, theme support, and keyboard shortcuts"
```

---

## Task 18: Auto-Title Generation

**Files:**
- Create: `server/src/features/chat/title-generator.ts`
- Modify: `server/src/features/chat/service.ts` — trigger after first response

- [ ] **Step 1: Implement title generator**

```typescript
// server/src/features/chat/title-generator.ts
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function generateTitle(messages: Array<{ role: string; text: string }>): Promise<string> {
  const preview = messages.slice(0, 4).map((m) => `${m.role}: ${m.text.slice(0, 200)}`).join("\n");

  const q = query({
    prompt: `Generate a short conversation title (max 30 chars, no quotes) for:\n\n${preview}`,
    options: { model: "claude-haiku-4-5", maxTurns: 1 },
  });

  for await (const msg of q) {
    if (msg.type === "result") return msg.result.trim().slice(0, 50);
  }
  return "New Conversation";
}
```

- [ ] **Step 2: Trigger in chat service**

In `ChatService.sendMessage()`, after saving assistant message, check if `meta.usage.messageCount === 2` (first exchange). If so, call `generateTitle()` and update `meta.title`.

- [ ] **Step 3: Commit**

```bash
git add server/src/features/chat/title-generator.ts server/src/features/chat/service.ts
git commit -m "feat: add auto-title generation after first chat exchange"
```

---

## Task 19: Integration Wiring & Final Verification

**Files:**
- Modify: `server/src/app.ts` — ensure all routes mounted
- Modify: `server/src/features/chat/service.ts` — load full context (profile, memories, project, style) before SDK call

- [ ] **Step 1: Wire full context into chat service**

Update `ChatService.sendMessage()` and the chat routes to load the actual profile, active memories, project instructions/knowledge, and selected style — passing the real `ChatContext` to `buildSystemPrompt()` instead of the placeholder.

- [ ] **Step 2: Verify all server routes are mounted**

Ensure `server/src/app.ts` mounts:
- `/api/profiles` — profile routes (no auth)
- `/api/health` — health check (no auth)
- `/api/conversations` — conversation management (profile required)
- `/api/chat` — chat streaming (profile required)
- `/api/projects` — project CRUD (profile required)
- `/api/artifacts` — artifact CRUD (profile required)
- `/api/files` — file management (profile required)
- `/api/settings` — settings/memory/styles (profile required)

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 4: Manual smoke test**

1. Start server: `npm run dev -w server`
2. Start client: `npm run dev -w client`
3. Open http://localhost:5173
4. Profile should auto-initialize (Default profile)
5. Create a new conversation from sidebar
6. Send a message — verify streaming response
7. Check data/ directory for persisted JSON files

- [ ] **Step 5: Commit**

```bash
git add server/src/ client/src/
git commit -m "feat: wire full context into chat, mount all routes, integration verification"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Section 2 (Tech Stack) → Task 1
- [x] Section 3 (Architecture) → Tasks 1-4
- [x] Section 4 (Data Model) → Task 2 (types), Task 3 (storage), Task 7 (conversation storage)
- [x] Section 5.1 (Chat) → Tasks 6, 7, 8, 11, 18
- [x] Section 5.2 (Projects) → Task 13
- [x] Section 5.3 (Artifacts) → Task 14
- [x] Section 5.4 (File Management) → Task 15
- [x] Section 5.5 (Personalization) → Task 16
- [x] Section 5.6 (Multi-Profile) → Task 5
- [x] Section 5.7 (Sidebar) → Tasks 9, 12
- [x] Section 6 (UI Layout) → Task 17
- [x] Section 7 (Error Handling) → Tasks 3, 4
- [x] Section 8 (Session/Branch) → Tasks 6, 7
- [x] Section 9 (API Spec) → Tasks 4, 8, 9, 13, 14, 15, 16
- [x] Section 10 (Token Budget) → Task 6 (system-prompt-builder)
- [x] Section 11 (Artifact Detection) → Task 14
- [x] Section 12 (Security) → Task 15
- [x] Section 13 (Memory Extraction) → Task 16
- [x] Section 14 (Monorepo) → Task 1

**Placeholder scan:** No TBD/TODO found. Tasks 12-16 have abbreviated step details but include commit messages and file lists — implementation agents have enough context from the spec + earlier tasks to fill in.

**Type consistency:** `ContentBlock`, `ConversationMeta`, `Message`, `Profile`, `ChatSSEEvent` types are defined once in `shared/` and imported consistently across server and client. Method names (`sendMessage`, `loadConversation`, `atomicWrite`) are consistent throughout.
