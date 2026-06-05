# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

EasyAgent is a multi-feature AI Agent frontend built with React 19 + TypeScript + Vite. Core features: AI streaming chat (SSE), knowledge base document management (RAG), file attachment upload, PPT presentation generation, tool calling (web search, weather, etc.), friend real-time messaging (WebSocket), and theme switching.

## Commands

```bash
npm run dev      # Dev server (host: 0.0.0.0, accessible on LAN)
npm run build    # tsc -b type check + vite production build (type errors break the build)
npm run preview  # Preview production build
npm run lint     # ESLint 9 flat config
```

No test suite. No Prettier config.

## TypeScript Constraints

- **Strict mode**: `strict: true` with `noUnusedLocals`, `noUnusedParameters`
- **`verbatimModuleSyntax: true`**: Type-only imports must use `import type { X }` syntax
- **`erasableSyntaxOnly: true`**: `enum` is forbidden — use `const enum` or object constants instead
- **Path alias**: `@/*` maps to `src/*` (configured in both tsconfig and vite.config)
- **JSX**: `react-jsx` automatic runtime, no `import React` needed

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | React 19, TypeScript ~5.8 |
| Build | Vite 7, vite-plugin-svgr (SVG as React components) |
| Routing | react-router-dom v7 |
| State | Zustand 5 (single flat store, no slices) |
| Styling | Tailwind CSS v4, daisyUI 5, Sass |
| UI | Ant Design 6, @ant-design/x (AI components), lucide-react |
| Markdown | react-markdown, remark-gfm, react-syntax-highlighter |
| Network | Axios, native fetch (streaming), WebSocket |

## Architecture

**State management**: Single flat Zustand store (`src/store/store.ts`). State is modified via exported standalone functions (`addMessage`, `updateMessage`, `setUser`, etc.) that call `useStore.setState()` / `useStore.getState()` directly. `user` and `theme` are persisted to `localStorage` manually (not via Zustand's persist middleware).

**Streaming**: `useStreamAIMessage` and `useStreamPpt` hooks (`src/utils/stream.ts`) use a buffer pool + 16ms throttle for streaming rendering. `flush()` resets the buffer to a new object (not mutation) to avoid stale closures. `AbortError` is silently caught (expected for user-initiated stops).

**SSE parsing**: `readSSEStream` in `src/utils/chat.ts` is an async generator that parses `data:` lines and handles `event: error` / `event: done` control events.

**Backend endpoints**:
- HTTP API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000/user_chat/ws/chat/{user_id}`
- SSE: `POST /chat/stream`, `/chat/ppt_outline`, `/chat/update_outline`, `/chat/ppt_generate`
- Auth: `Authorization: Bearer <token>`
- Vite proxy: `/static` → `http://localhost:8000` (PPT vendor resources)

**SSE chunk types**: `think`, `text`, `tool_name`, `tool_content`, `outline`, `outline_chunk`, `slide_start`, `slide_chunk`, `slide_end`, `references`

**PPT generation flow**: User request → `streamOutline` generates outline (`outline_chunk` streamed → `outline` complete JSON) → user confirms → `confirmAndGenerate` generates slides page by page. Outline states: `streaming` → `pending` → `generating` → `confirmed`.

## Routing

| Path | Page | Description |
|------|------|-------------|
| `/login` | pages/login | Login / Register / Forgot password |
| `/` | pages/layout | Main chat page (auth required) |

## Conventions

- All business components are prefixed with `EA` (EasyAgent abbreviation)
- Theme system uses CSS variables + `data-theme` attribute, supporting light / dark / system modes
- All SVG icons are managed in `src/assets/icons/` and exported via `index.ts`
