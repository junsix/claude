# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Copy is a local-first Claude.ai clone — a full-stack chat app with conversations, projects, artifacts, profiles, and memory. All data is stored as JSON/Markdown files on disk (no database).

## Commands

```bash
npm install              # install all workspace dependencies
npm run dev              # start client (Vite :5173) + server (Express :3001) concurrently
npm run dev -w server    # server only
npm run dev -w client    # client only
npm run test -w server   # run all server tests (vitest)
npm run build            # build shared → server → client (order matters)
```

Run a single test file: `npx vitest run path/to/file.test.ts` from the `server/` directory.

## Architecture

**Monorepo** with three npm workspaces:

- **`shared/`** — TypeScript types only (no runtime code). Both client and server import `@claude-copy/shared`. Types are organized by domain in `src/types/` (chat, content, artifact, project, profile, memory, style, settings, api).
- **`server/`** — Express 5 + TypeScript. Entry: `src/index.ts` → `src/app.ts`. Port 3001.
- **`client/`** — React 19 + Vite + Tailwind CSS 4 + Zustand. Vite proxies `/api` to the server.

### Server Feature Modules

Each feature in `server/src/features/` follows a consistent three-layer pattern:
```
features/{name}/
├── routes.ts    # Express Router endpoints
├── service.ts   # Business logic
└── storage.ts   # File I/O (uses atomic writes)
```

Features: `chat`, `conversations`, `projects`, `artifacts`, `files`, `settings`, `profiles`.

**Profile middleware** (`middleware/profile.ts`) reads `X-Profile-Id` header and sets `req.dataDir` to the profile's data directory. All `/api` routes except `/api/profiles` and `/api/health` require this header.

**LLM integration** lives in `server/src/llm/`:
- `claude-service.ts` — wraps `@anthropic-ai/claude-agent-sdk`, exposes `streamConversation()` async generator
- `system-prompt-builder.ts` — assembles system prompt from profile, memories, project context, style

### System Prompt Assembly (Target Architecture)

Real Claude.ai assembles its system prompt as XML-tagged modules, not a flat string. Current implementation (`system-prompt-builder.ts`) is a simplified Markdown concatenation. The target structure for parity:

```
<claude_behavior>     — 기본 성격, 톤, 포맷팅, 거절 정책, 안전 가이드라인, 지식 컷오프
<memory_system>       — 메모리 사용 규칙 + 금지 문구 (e.g. "Based on my memories"라고 말하지 말 것)
<userMemories>        — 축적된 유저 메모리 주입 (프로필, 선호, 컨텍스트)
<artifacts_info>      — Artifact 생성 규칙, 타입별 처리법, update vs rewrite 기준
<search_instructions> — 웹검색 정책, 저작권 규칙, 인용 방식
<tool_definitions>    — 활성화된 tool들의 JSON Schema (SDK가 자동 처리)
<past_chats_tools>    — 과거 대화 검색 도구 사용법, 트리거 패턴
```

Orchestration Layer가 유저 컨텍스트(위치, 시간, 플랫폼)에 따라 모듈을 선택적으로 조립. 현재 구현에서 `<claude_behavior>`, `<memory_system>`, `<artifacts_info>`가 미구현 상태.

### Client Structure

- `src/app/` — App shell, router, providers. Routes: `/`, `/chat/:id`, `/project/:id`, `/settings`
- `src/features/` — Feature modules (chat, sidebar, artifacts, projects, settings, layout), each with components and a Zustand `store.ts`
- `src/lib/api-client.ts` — `apiFetch()` wrapper that auto-injects `X-Profile-Id` header
- `src/hooks/` — Shared React hooks

### Key Design Patterns

- **Message tree**: Messages use `parentId` to form a tree, enabling branching (edit/retry creates sibling nodes). `activeBranchTip` tracks the current path.
- **SSE streaming**: Chat responses stream via Server-Sent Events. Event types defined in `shared/src/types/api.ts` (`ChatSSEEvent`).
- **Artifact detection**: After a response completes, `features/artifacts/detector.ts` pattern-matches code blocks to detect React/HTML/SVG/Mermaid artifacts.
- **File-based storage**: All data in `data/profiles/{profileId}/` with subdirectories per domain (conversations, projects, artifacts, memory, styles, uploads). Writes use atomic temp-file-then-rename via `storage/atomic-write.ts`.
- **Multi-profile isolation**: Each profile gets its own data directory; profile switching changes the `X-Profile-Id` header sent with every request.

## Data Directory Layout

```
data/profiles/{profileId}/
├── profile.json
├── conversations/{id}/meta.json, messages.json
├── projects/{id}/meta.json, instructions.md, knowledge/
├── artifacts/{id}/meta.json, content.{ext}, versions/
├── memory/, styles/, uploads/, generated/
└── usage.json
```
