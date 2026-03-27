# Claude Copy - Design Specification

> Claude 웹(claude.ai) 주요 기능을 로컬 파일 기반으로 재현하는 웹앱

## 1. Overview

### 목표
- Claude 웹의 핵심 기능(채팅, 프로젝트, 아티팩트, 파일관리)을 로컬 웹앱으로 구현
- 모든 데이터를 로컬 파일시스템에 JSON/Markdown으로 저장
- 로컬 파일/폴더를 Claude 컨텍스트로 직접 활용
- Claude Code SDK(`@anthropic-ai/claude-agent-sdk`)를 LLM 인터페이스로 사용

### 핵심 차별점 (vs Claude 웹)
- 데이터 완전 로컬 저장 (클라우드 의존 없음)
- 로컬 파일시스템 직접 연결 (프로젝트 폴더 → SDK cwd)
- 멀티 프로필 지원 (프로필별 격리된 컨텍스트)
- 파일 기반 저장소 (직접 편집 가능, 투명한 구조)

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite + TypeScript | Fast HMR, lightweight bundling |
| UI | Tailwind CSS + shadcn/ui | Clean UI similar to Claude web |
| State | Zustand | Lightweight, intuitive |
| Markdown | react-markdown + rehype/remark plugins | Code highlighting, LaTeX, tables |
| Backend | Express + TypeScript | Stable, rich ecosystem |
| LLM | @anthropic-ai/claude-agent-sdk | Claude Code SDK (`query()` API) |
| Realtime | Server-Sent Events (SSE) | Simpler than WebSocket for streaming |
| Storage | File-based (JSON + Markdown) | Transparent, user-editable |

---

## 3. Architecture

### Directory Structure

```
claude-copy/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── app/               # App shell, routing, providers
│   │   ├── components/        # Shared UI components
│   │   ├── features/
│   │   │   ├── chat/          # Chat UI, message rendering, streaming
│   │   │   ├── projects/      # Project management UI
│   │   │   ├── artifacts/     # Artifact preview panel
│   │   │   ├── files/         # File upload/browse UI
│   │   │   ├── sidebar/       # Sidebar, conversation list, search
│   │   │   └── settings/      # Settings, profile, memory, styles
│   │   ├── hooks/             # Shared React hooks
│   │   ├── lib/               # API client, utilities
│   │   └── types/             # Frontend-only types
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── app.ts             # Express app setup
│   │   ├── features/
│   │   │   ├── chat/          # routes, service, storage
│   │   │   ├── projects/      # routes, service, storage
│   │   │   ├── artifacts/     # routes, service, storage
│   │   │   ├── files/         # routes, service, storage
│   │   │   └── settings/      # routes, service, storage
│   │   ├── llm/               # Claude Code SDK wrapper service
│   │   ├── storage/           # File-based storage utilities
│   │   └── middleware/        # CORS, error handling, profile
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                    # Shared types & interfaces
│   ├── types/
│   │   ├── chat.ts
│   │   ├── project.ts
│   │   ├── artifact.ts
│   │   └── file.ts
│   └── package.json
│
├── data/                      # Local data store (per-profile)
│   ├── profiles/
│   │   ├── profiles.json
│   │   └── {profile-id}/
│   │       ├── profile.json
│   │       ├── conversations/
│   │       ├── projects/
│   │       ├── artifacts/
│   │       ├── memory/
│   │       ├── styles/
│   │       ├── uploads/
│   │       ├── generated/
│   │       └── usage.json         # Daily usage rollup
│   └── settings.json
│
├── package.json               # Root (workspaces)
└── tsconfig.base.json
```

### Data Flow

```
[React Client]
    ↕ REST API + SSE (streaming)
[Express Server]
    ↕ query() / resume()
[Claude Code SDK]
    ↕
[Claude API]

[Express Server] ↔ [data/ filesystem] (JSON/MD read/write)
```

---

## 4. Data Model

### 4.1 Conversation

```
data/profiles/{profile-id}/conversations/{conversation-id}/
├── meta.json
├── messages.json
└── attachments/
```

**meta.json**
```json
{
  "id": "conv_abc123",
  "title": "React 컴포넌트 리팩토링",
  "projectId": "proj_xyz | null",
  "model": "claude-opus-4-6",
  "style": "concise",
  "starred": false,
  "createdAt": "2026-03-27T10:00:00Z",
  "updatedAt": "2026-03-27T10:30:00Z",
  "sessions": {
    "session_A": { "branchTip": "msg_002", "createdAt": "2026-03-27T10:00:00Z" }
  },
  "activeBranchTip": "msg_002",
  "usage": {
    "totalInputTokens": 0,
    "totalOutputTokens": 0,
    "totalCostUsd": 0,
    "messageCount": 0
  }
}
```

**messages.json** — Tree structure for branching via `parentId`:
```json
[
  {
    "id": "msg_001",
    "parentId": null,
    "role": "user",
    "content": [{ "type": "text", "text": "Hello" }],
    "attachments": [],
    "createdAt": "2026-03-27T10:00:00Z"
  },
  {
    "id": "msg_002",
    "parentId": "msg_001",
    "role": "assistant",
    "content": [
      { "type": "text", "text": "안녕하세요!" },
      { "type": "artifact_ref", "artifactId": "art_001" }
    ],
    "model": "claude-opus-4-6",
    "usage": { "inputTokens": 50, "outputTokens": 120 },
    "createdAt": "2026-03-27T10:00:05Z"
  },
  {
    "id": "msg_003",
    "parentId": "msg_001",
    "role": "assistant",
    "content": [{ "type": "text", "text": "Retry branch response" }],
    "createdAt": "2026-03-27T10:01:00Z"
  }
]
```

### 4.2 Project

```
data/profiles/{profile-id}/projects/{project-id}/
├── meta.json
├── instructions.md
└── knowledge/
```

**meta.json**
```json
{
  "id": "proj_xyz",
  "name": "웹앱 개발",
  "description": "Claude Copy 프로젝트",
  "conversationIds": ["conv_abc123"],
  "knowledgeFiles": [
    { "id": "kf_001", "name": "api-spec.pdf", "size": 204800, "addedAt": "..." }
  ],
  "localPaths": ["/home/user/projects/my-app"],
  "defaultModel": "claude-opus-4-6",
  "createdAt": "2026-03-27T09:00:00Z",
  "updatedAt": "2026-03-27T10:30:00Z"
}
```

### 4.3 Artifact

```
data/profiles/{profile-id}/artifacts/{artifact-id}/
├── meta.json
├── content.{ext}
└── versions/
```

**meta.json**
```json
{
  "id": "art_001",
  "title": "Dashboard 컴포넌트",
  "type": "react",
  "language": "tsx",
  "conversationId": "conv_abc123",
  "messageId": "msg_002",
  "currentVersion": 2,
  "createdAt": "2026-03-27T10:00:05Z",
  "updatedAt": "2026-03-27T10:15:00Z"
}
```

Supported types: `react` | `html` | `svg` | `mermaid` | `markdown` | `code`

### 4.4 Profile

**profiles.json**
```json
{
  "activeProfileId": "prof_dev",
  "profiles": [
    { "id": "prof_dev", "name": "개발자 모드", "avatar": "dev", "createdAt": "..." },
    { "id": "prof_writer", "name": "글쓰기 모드", "avatar": "writer", "createdAt": "..." }
  ]
}
```

**profile.json**
```json
{
  "id": "prof_dev",
  "name": "개발자 모드",
  "avatar": "dev",
  "role": "풀스택 개발자",
  "expertise": ["TypeScript", "React", "Node.js"],
  "language": "ko",
  "globalInstructions": "항상 한국어로 응답. 코드 위주로 설명.",
  "defaults": { "model": "claude-opus-4-6", "style": "concise" },
  "auth": null
}
```

### 4.5 Memory

```json
{
  "id": "mem_001",
  "content": "사용자는 TypeScript를 선호하고, 한국어로 응답받길 원함",
  "category": "preference",
  "source": { "conversationId": "conv_abc", "extractedAt": "..." },
  "active": true
}
```

### 4.6 Custom Style

```json
{
  "id": "style_001",
  "name": "코드 리뷰어",
  "description": "간결하고 기술적, 코드 예시 중심",
  "prompt": "응답은 짧고 기술적으로 작성. 가능하면 코드로 설명.",
  "sampleText": null,
  "createdAt": "..."
}
```

Built-in styles: `normal`, `concise`, `explanatory`, `formal`

---

## 5. Features

### 5.1 Chat

**Claude Code SDK Integration:**
- New conversation: `query({ prompt, options: { model, systemPrompt, cwd, maxTurns: 1 } })`
- Resume conversation: `query({ prompt, options: { resume: sessionId } })`
- Streaming: SSE endpoint, async generator iteration
- Abort: `AbortController` passed to SDK + SSE

**Message Branching:**
- `parentId`-based tree structure
- Edit message → new branch from same parent
- Retry → new assistant sibling under same parent
- Branch navigation: `← 1/3 →` controls on sibling messages
- Client tracks `activePath` (root → leaf) for current view

**Message Rendering Stack:**
- `react-markdown` with plugins: `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`, `rehype-raw`
- Code blocks: syntax highlighting + copy button + language label
- Artifact references: clickable → opens artifact panel

**Auto Title Generation:**
- After first assistant response, generate title via `claude-haiku-4-5` (lightweight model)

**Key Features:**
| Feature | Implementation |
|---------|---------------|
| Streaming | SSE + chunked rendering |
| Edit message | New branch via parentId, new SDK session with history replay (see Section 8) |
| Retry | New assistant sibling under same parent |
| Branch navigation | ← → controls to switch siblings |
| Stop generation | AbortController → SDK + SSE |
| Copy | Full response / code block level |
| Model switching | Per-message model change |

### 5.2 Projects

**Core Concept:** Project = conversation group + knowledge files + custom instructions + local folder links

**SDK Integration:**
- `instructions.md` → `systemPrompt`
- Knowledge files → appended to `systemPrompt`
- `localPaths[0]` → SDK `cwd`
- `localPaths[1..]` → SDK `additionalDirectories`
- Claude can use `Read`, `Glob`, `Grep` tools on linked folders

**Local Folder Linking (unique to this app):**
- Register filesystem paths to a project
- SDK receives them as working directories
- No file upload needed — Claude browses local codebase directly
- Security: only paths registered in project's `localPaths` are accessible

**API:**
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
PUT    /api/projects/:id/instructions
POST   /api/projects/:id/knowledge
DELETE /api/projects/:id/knowledge/:fid
POST   /api/projects/:id/local-paths
DELETE /api/projects/:id/local-paths
GET    /api/projects/:id/conversations
```

### 5.3 Artifacts

**Supported Types:**

| Type | Extension | Rendering |
|------|-----------|-----------|
| React (JSX/TSX) | `.tsx` | Sandboxed iframe + Babel transpile |
| HTML/CSS/JS | `.html` | Sandboxed iframe direct render |
| SVG | `.svg` | iframe render |
| Mermaid | `.mmd` | mermaid.js diagram render |
| Markdown | `.md` | react-markdown render |
| Code snippet | `.{lang}` | Syntax highlight only (non-executable) |

**Artifact Detection:**
- Parse Claude response for self-contained code blocks
- Patterns: `export default` React components, `<!DOCTYPE` HTML, `<svg>` roots, Mermaid keywords
- Extract to artifact, replace in message with `artifact_ref`

**React Sandbox:**
- iframe with `sandbox="allow-scripts"`
- Injected libraries: React 18, ReactDOM, Babel standalone, Tailwind CSS, Recharts, Lucide React

**Version Management:**
- Each update creates a new version in `versions/`
- Version navigation: `[v1] ← → [v2] ← → [v3]`
- Current version in `content.{ext}`, history in `versions/`

**API:**
```
GET    /api/artifacts/:id
GET    /api/artifacts/:id/versions
GET    /api/artifacts/:id/versions/:v
PUT    /api/artifacts/:id
DELETE /api/artifacts/:id
GET    /api/artifacts/:id/download
```

### 5.4 File Management

**Inbound (Upload):**
- Methods: drag-and-drop, clipboard paste (Ctrl+V), file picker button
- Supported: PDF, DOCX, TXT, CSV, JSON, HTML, XLSX, JPEG, PNG, GIF, WebP, code files
- Processing: text extraction (pdf-parse, mammoth, xlsx) for SDK context
- Images: passed as base64 image content blocks to SDK

**Outbound (Generation):**
- Claude generates files → saved to `data/profiles/{id}/generated/{convId}/`
- Download via API endpoint

**Local File Browsing:**
- Browse project-linked local folders via API
- Security: path validation against project's registered `localPaths`

**API:**
```
POST   /api/files/upload
GET    /api/files/:id
GET    /api/files/:id/download
DELETE /api/files/:id
GET    /api/files/browse?path=...
GET    /api/files/read?path=...
```

### 5.5 Personalization

**Three Axes:**

**1) Memory:**
- Auto-extracted from conversations (via SDK query after conversation)
- Categories: `preference`, `fact`, `context`
- Injected into systemPrompt for new conversations
- User can view, edit, delete, deactivate individual memories

**2) Custom Styles:**
- 4 built-in: normal, concise, explanatory, formal
- Custom creation: direct text description or writing sample analysis
- Style `prompt` appended to systemPrompt

**3) User Profile:**
- Name, role, expertise, language, global instructions
- Global instructions apply to ALL conversations (above project instructions)

**systemPrompt Assembly Order:**
```
1. User profile & global instructions
2. Active memories
3. Project instructions (if in a project)
4. Project knowledge files (if in a project)
5. Style prompt
```

### 5.6 Multi-Profile

- Profile-level data isolation: each profile has its own conversations, projects, artifacts, memory, styles
- Profile switching via header dropdown
- Backend middleware resolves active profile → sets `req.dataDir`
- Phase 2 extension: auth provider linking (OAuth), account migration, optional remote sync

### 5.7 Sidebar & Conversation Management

**Sections:** Starred → Projects (with nested conversations) → Recent (grouped by date)

**Features:**
- Search: title matching + full-text message search (in-memory title index)
- Context menu: rename, star/unstar, move to project, duplicate, delete
- Auto-grouping: today, yesterday, last 7 days, last 30 days, older
- Auto-title: generated via `claude-haiku-4-5` after first response

**API:**
```
GET    /api/conversations
GET    /api/conversations/search?q=...
POST   /api/conversations
PUT    /api/conversations/:id
DELETE /api/conversations/:id
POST   /api/conversations/:id/duplicate
```

---

## 6. UI Layout

### 3-Panel Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [App Name]  [Profile Switcher]  [Settings]          │
├──────────┬─────────────────────────────┬─────────────────────┤
│ Sidebar  │  Chat Area                  │  Artifact Panel     │
│ (280px)  │  (flex: 1)                  │  (400px)            │
│          │                             │                     │
│ Search   │  Message list               │  Tab: Code/Preview  │
│ Starred  │  (branch nav)               │  iframe sandbox     │
│ Projects │                             │  Version nav        │
│ Recent   │  Input area                 │  Actions            │
│          │  [attach][model][style]     │                     │
├──────────┴─────────────────────────────┴─────────────────────┤
│  Status: Memory | Tokens | Cost | Duration                   │
└──────────────────────────────────────────────────────────────┘
```

**Panel Behavior:**
- Sidebar: collapsible (toggle button), drag-resizable
- Chat area: always visible, takes remaining space
- Artifact panel: hidden by default, auto-opens on artifact creation, toggle + drag-resize

**Responsive:**
- Desktop (>=1200px): all 3 panels
- Tablet (768-1199px): sidebar overlay, chat + artifact
- Mobile (<768px): single panel, tab switching

**Theme:** light / dark / system (Tailwind CSS class-based)

### Routes

| Route | View |
|-------|------|
| `/` | New conversation |
| `/chat/:id` | Conversation |
| `/project/:id` | Project detail + conversation list |
| `/project/:id/settings` | Project settings |
| `/settings` | Profile, memory, styles, global settings |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+N` | New conversation |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+J` | Toggle artifact panel |
| `Ctrl+K` | Focus search |
| `Ctrl+,` | Open settings |
| `Escape` | Stop generation |

---

## 7. Error Handling & Reliability

### 7.1 File Write Safety

All JSON file writes use **atomic write** pattern (write-to-temp-then-rename) to prevent corruption on crash:

```typescript
async function atomicWrite(filePath: string, data: unknown): Promise<void> {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, filePath);  // atomic on same filesystem
}
```

### 7.2 Concurrency Control

Single-writer architecture:
- All write operations for a given profile go through a per-profile write queue
- Reads are lock-free (read stale data is acceptable for UI)
- Enforced in middleware: `ProfileWriteQueue` serializes writes per `profileId`

```typescript
class ProfileWriteQueue {
  private queues = new Map<string, Promise<void>>();

  async enqueue(profileId: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.queues.get(profileId) ?? Promise.resolve();
    const next = prev.then(fn, fn);  // run even if previous failed
    this.queues.set(profileId, next);
    return next;
  }
}
```

Multi-tab warning: app detects other active tabs via `BroadcastChannel` and warns user.

### 7.3 SDK Error Handling

| Error Type | Handling |
|-----------|----------|
| Network/API error | SSE sends `{ type: "error", code: "sdk_error", message }` → client shows retry button |
| Rate limit (429) | SSE sends `{ type: "error", code: "rate_limit", retryAfter }` → client shows countdown |
| Max turns reached | SSE sends `{ type: "done", reason: "max_turns" }` → client shows "Continue" button |
| Max budget exceeded | SSE sends `{ type: "done", reason: "max_budget" }` → client shows cost warning |
| Abort by user | `AbortController.abort()` → SDK + SSE both terminate cleanly |

### 7.4 SSE Reconnection

- Client uses `EventSource` with auto-reconnect
- Server assigns `eventId` to each SSE message for resume tracking
- On reconnect, client sends `Last-Event-ID` header → server replays missed events from in-memory buffer

### 7.5 Data Integrity

- On app startup, validate `profiles.json` and active profile's directory structure
- Missing/corrupt files: log warning, recreate with defaults, never crash

---

## 8. Session & Branch Model

### 8.1 SDK Session Mapping

Each **branch path** (root → leaf) maps to one SDK session. When the user edits a message or retries, a new branch is created with a new session.

```
messages.json (tree):
  msg_001 (user)
    ├── msg_002 (assistant) ── sessionId: "session_A"
    │     └── msg_004 (user)
    │           └── msg_005 (assistant) ── sessionId: "session_A" (resumed)
    └── msg_003 (assistant) ── sessionId: "session_B" (new session, retry)
```

**meta.json** stores a session map, not a single session ID:

```json
{
  "id": "conv_abc123",
  "sessions": {
    "session_A": { "branchTip": "msg_005", "createdAt": "..." },
    "session_B": { "branchTip": "msg_003", "createdAt": "..." }
  },
  "activeBranchTip": "msg_005"
}
```

### 8.2 Branch Operations

| Operation | How it works |
|-----------|-------------|
| **New message** | Resume active session via `query({ options: { resume: sessionId } })` |
| **Edit user message** | Create new user message with same `parentId` → start new SDK session from scratch, replaying messages along the new branch path |
| **Retry** | Create new assistant message with same `parentId` → new SDK session, replay up to the parent |
| **Switch branch** | Update `activeBranchTip` → UI re-renders the selected path, no SDK call needed |

### 8.3 Session Replay

When creating a new branch, the server uses the SDK's `resume` with `resumeSessionAt` to fork from the parent message's point in the session, avoiding full replay:

```typescript
async function createBranchSession(
  conversation: Conversation,
  parentMessageId: string,
  newPrompt: string
) {
  // Find which session the parent message belongs to
  const parentSession = findSessionForMessage(conversation, parentMessageId);

  // Option A (preferred): Fork from parent session at the branch point
  // SDK's resume + fork creates a new session with context up to that point
  const q = query({
    prompt: newPrompt,
    options: {
      resume: parentSession.id,
      resumeSessionAt: parentMessageId,  // resume at this message UUID
      forkSession: true,                  // create new session, don't modify original
      model: conversation.model,
      systemPrompt: buildSystemPrompt(conversation),
    }
  });

  let newSessionId: string;
  for await (const msg of q) {
    newSessionId = msg.session_id;  // capture new forked session ID
    yield msg;
  }

  // Store new session in conversation meta
  conversation.sessions[newSessionId] = {
    branchTip: "new_msg_id",
    createdAt: new Date().toISOString(),
  };
}

// Option B (fallback if session expired): Start fresh session with full history
async function replayBranchSession(
  conversation: Conversation,
  branchPath: Message[],
  newPrompt: string
) {
  // Reconstruct multi-turn history as a single prompt with role markers
  const historyText = branchPath.map(m => {
    const text = m.content.filter(c => c.type === "text").map(c => c.text).join("");
    return `[${m.role}]: ${text}`;
  }).join("\n\n");

  const q = query({
    prompt: `${historyText}\n\n[user]: ${newPrompt}`,
    options: {
      model: conversation.model,
      systemPrompt: buildSystemPrompt(conversation),
    }
  });
  // ... capture new sessionId
}
```

**Strategy:** Prefer Option A (`resume` + `forkSession`) as it preserves full SDK context including tool use history. Fall back to Option B only if the original session is expired or unavailable.

---

## 9. API Specification

### 9.1 Common Conventions

**Profile Context:** All API requests include `X-Profile-Id` header. Middleware resolves to `req.dataDir`.

**Error Response Format:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Conversation not found",
    "details": {}
  }
}
```

**Status Codes:** `200` success, `201` created, `400` bad request, `404` not found, `409` conflict, `500` internal error

**Pagination:** List endpoints support `?limit=20&cursor={lastId}` (cursor-based). Response includes `{ data: [...], nextCursor: "..." | null }`.

### 9.2 Chat / Streaming Endpoints

```
POST   /api/chat/:conversationId/messages        # SSE — send message, stream response
POST   /api/chat/:conversationId/retry/:messageId # SSE — retry from a message
POST   /api/chat/:conversationId/edit/:messageId  # SSE — edit & re-send, creates branch
POST   /api/chat/:conversationId/abort              # Abort current generation for this conversation
```

### 9.3 Request Body Schemas

**POST /api/chat/:conversationId/messages** (SSE)
```typescript
{
  content: ContentBlock[];         // User message content
  parentId?: string;               // Parent message ID (for explicit branch target)
  model?: string;                  // Override model for this message
  style?: string;                  // Override style for this message
  attachments?: string[];          // File IDs from prior uploads
}
```

**POST /api/chat/:conversationId/retry/:messageId** (SSE)
```typescript
{
  model?: string;                  // Optionally retry with different model
}
```

**POST /api/chat/:conversationId/edit/:messageId** (SSE)
```typescript
{
  content: ContentBlock[];         // New message content replacing the original
  model?: string;
  style?: string;
}
```

**POST /api/chat/:conversationId/abort**
```typescript
{}  // No body required. Server looks up active AbortController for this conversation.
```

### 9.4 Shared Type: ContentBlock

```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "artifact_ref"; artifactId: string }
  | { type: "file_ref"; fileId: string; name: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };
```

### 9.5 Health Check

```
GET    /api/health    # Returns { status: "ok", version: "...", uptime: ... }
```

---

## 10. Token Budget & Knowledge Strategy

### 10.1 Context Window Budget (200K tokens)

```
┌─────────────────────────────────────────┐
│ System Prompt Budget: max 30K tokens    │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Profile + Global Instructions    │ │  ~1K
│ │ 2. Active Memories                  │ │  ~2K (max 50 entries)
│ │ 3. Project Instructions             │ │  ~2K
│ │ 4. Knowledge Files (truncated)      │ │  ~20K (max)
│ │ 5. Style Prompt                     │ │  ~500
│ └─────────────────────────────────────┘ │
│ Conversation History: ~150K tokens      │
│ Current Message + Response: ~20K tokens │
└─────────────────────────────────────────┘
```

### 10.2 Knowledge File Handling

- Small files (<5K tokens): inject full content into systemPrompt
- Medium files (5K-20K tokens): summarize via `claude-haiku-4-5`, inject summary
- Large files (>20K tokens): store full text, inject first 1K + summary, let Claude use `Read` tool to access full content on demand
- Total knowledge budget: capped at 20K tokens across all files

### 10.3 Usage Tracking

```json
// Per-conversation usage stored in meta.json
{
  "usage": {
    "totalInputTokens": 5200,
    "totalOutputTokens": 3100,
    "totalCostUsd": 0.15,
    "messageCount": 12
  }
}
```

Aggregate usage per profile tracked in `data/profiles/{id}/usage.json` (daily rollup).

---

## 11. Artifact Detection

### 11.1 Detection Rules

Detection runs **after stream completion** (not mid-stream). Original content is preserved in `messages.json`; `artifact_ref` is added alongside, not replacing.

**Detection criteria (all must be met):**

| Type | Required Pattern | Min Lines |
|------|-----------------|-----------|
| React | `export default` + JSX return | 10 |
| HTML | `<!DOCTYPE` or `<html` | 10 |
| SVG | `<svg` root element | 5 |
| Mermaid | starts with `graph\|flowchart\|sequenceDiagram\|classDiagram\|erDiagram\|gantt\|pie\|gitGraph` | 3 |
| Markdown doc | code block with >50 lines of markdown | 50 |

**Not detected as artifacts:** code snippets (short, illustrative), inline code, partial fragments.

### 11.2 Message Storage with Artifacts

```json
{
  "id": "msg_002",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Here is the dashboard component:" },
    { "type": "text", "text": "```tsx\nexport default function Dashboard() { ... }\n```" },
    { "type": "artifact_ref", "artifactId": "art_001" }
  ]
}
```

Original code block is preserved in `content` for SDK context replay. `artifact_ref` is appended for the client to render the artifact panel link.

---

## 12. Security

### 12.1 Local Path Access Control

All file browse/read endpoints require `projectId` parameter:

```
GET /api/files/browse?projectId=proj_xyz&path=src/components
GET /api/files/read?projectId=proj_xyz&path=src/index.ts
```

Validation:
1. Resolve requested path to absolute form
2. Verify it is a descendant of one of the project's registered `localPaths`
3. Reject paths containing `..` after resolution
4. Do not follow symlinks that escape registered boundaries
5. Reject if file size exceeds 10MB (for read endpoint)

### 12.2 Upload Safety

- Max file size: 30MB per file, 100MB total per conversation
- File type whitelist validation (check magic bytes, not just extension)
- Uploaded files stored in profile-scoped directory (no cross-profile access)

---

## 13. Memory Extraction

### 13.1 Trigger

Memory extraction runs when:
- User explicitly closes a conversation (click "end conversation")
- Conversation has been idle for 10+ minutes with 6+ messages
- Never mid-conversation (to avoid cost overhead)

### 13.2 Extraction Prompt

```typescript
const extractionPrompt = `
Analyze this conversation and extract key facts about the user that would be useful
in future conversations. Focus on:
- Preferences (language, tools, coding style)
- Facts (role, expertise, project context)
- Recurring patterns

Return JSON array: [{ "content": "...", "category": "preference|fact|context" }]
Only include genuinely new information not already in existing memories.
Existing memories: ${existingMemories}

Conversation: ${conversationText}
`;
```

Uses `claude-haiku-4-5` with `maxTurns: 1` for cost efficiency.

### 13.3 Deduplication

Before saving, compare each extracted memory against existing memories:
- Exact match: skip
- Semantic overlap (>80% keyword match): merge by updating existing entry
- New information: create new entry

---

## 14. Monorepo Tooling

- **npm workspaces** for package management (`client`, `server`, `shared`)
- Root scripts: `npm run dev` (starts both client + server), `npm run build`, `npm run lint`
- `shared` package referenced via workspace protocol: `"@claude-copy/shared": "workspace:*"`
- TypeScript project references for cross-package type checking

---

## 15. Future Extensions (Phase 2)

- **Authentication:** OAuth (Google, GitHub) or email login
- **Account linking:** Migrate local profiles to authenticated accounts
- **Remote sync:** Optional cloud backup/sync across devices
- **Web search:** Tool-use pattern for real-time information retrieval
- **Deep research:** Multi-step research with web searches
- **File creation:** Generate DOCX, XLSX, PPTX, PDF downloads
- **Plugin system:** MCP connector integrations (GitHub, Notion, Slack)
