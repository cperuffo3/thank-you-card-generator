# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start          # Run app in development mode

# Testing
npm run test           # Run unit tests (Vitest)
npm run test:watch     # Run unit tests in watch mode
npm run test:e2e       # Run E2E tests (Playwright)
npm run test:all       # Run all tests

# Code Quality
npm run lint           # Run ESLint
npm run format         # Check formatting (Prettier)
npm run format:write   # Fix formatting

# Build & Package
npm run package        # Package app for current platform
npm run make           # Create distributable
npm run publish        # Publish to GitHub Releases (draft)
```

## Architecture

This is an Electron app using Electron Forge with Vite. It uses React, Tailwind CSS 4, and shadcn/ui components.

### Process Model

- **Main process** (`src/main.ts`): Electron main process, creates BrowserWindow, sets up IPC via oRPC
- **Preload** (`src/preload.ts`): Bridge between main and renderer, forwards MessagePort for oRPC
- **Renderer** (`src/App.tsx`): React app entry point, uses TanStack Router

### IPC with oRPC

Communication between renderer and main processes uses oRPC over MessagePort:

- `src/ipc/router.ts` - Aggregates all IPC handlers (theme, window, app, shell)
- `src/ipc/manager.ts` - `IPCManager` class creates MessageChannel and oRPC client, exported as `ipc`
- `src/ipc/handler.ts` - Main process RPC handler
- `src/ipc/<domain>/handlers.ts` - Individual handler implementations using `os.handler()`
- `src/ipc/<domain>/schemas.ts` - Zod schemas for inputs

Renderer calls: `ipc.client.theme.toggleThemeMode()` → main process handler

### Routing

TanStack Router with file-based routing:

- Routes in `src/routes/` (e.g., `index.tsx`, `second.tsx`)
- Root layout in `src/routes/__root.tsx`
- Route tree auto-generated to `src/routeTree.gen.ts`

### Actions

`src/actions/` contains renderer-side functions that call IPC methods (theme, window, language, etc.)

### UI Components

- `src/components/ui/` - shadcn components (Button, Toggle, NavigationMenu)
- `src/components/` - App components (DragWindowRegion, ThemeToggle, LangToggle)
- Styling: Tailwind CSS 4, styles in `src/styles/global.css`

### Testing

- Unit tests: `src/tests/unit/` (Vitest + React Testing Library + jsdom)
- E2E tests: `src/tests/e2e/` (Playwright)
- Setup file: `src/tests/unit/setup.ts`

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json and vite configs)
