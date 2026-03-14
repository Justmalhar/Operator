# Operator — Agent Instructions

Critical context for AI agents working on this repo. Things the code alone
doesn't make obvious.

---

## VSCode Theme System

**Location:** `src/styles/themes/`
**Full doc:** `docs/13-vscode-themes.md`

### Rules

1. **Never hardcode colors** in component CSS or Tailwind classes for IDE chrome
   surfaces. Use `--vscode-*` tokens instead.

   ```css
   /* ✗ wrong */
   background-color: #252526;

   /* ✓ correct */
   background-color: var(--vscode-sidebar-background);
   ```

2. **Use the utility classes** from `index.css` for standard chrome surfaces:
   `.vscode-sidebar`, `.vscode-tab`, `.vscode-panel`, `.vscode-statusbar`, etc.

3. **Two token namespaces — keep them separate:**
   - `--vscode-*` for IDE chrome (sidebar, tabs, panels, activity bar, status bar)
   - shadcn `--background / --foreground / --primary / …` for generic UI widgets
     (dialogs, popovers, dropdowns, buttons in the app shell)

4. **Adding a theme** (3-file change):
   - Create `src/styles/themes/<id>.css` with `[data-vscode-theme="<id>"] { … }`
   - Add `@import "./<id>.css";` in `index.css`
   - Add entry to `THEMES` array in `themes.ts`

5. **Switching themes at runtime:**
   ```typescript
   import { applyTheme } from "@/styles/themes/themes";
   applyTheme("dracula");  // sets attr on <html> + persists to localStorage
   ```

6. **Reading the current theme:**
   ```typescript
   import { getCurrentTheme, getStoredTheme } from "@/styles/themes/themes";
   ```

7. **Zustand** — use `useAppStore`'s `setTheme` action, not `applyTheme`
   directly, so React components re-render on theme change.

### Available Themes

| ID | Label | Dark/Light |
|---|---|---|
| `dark-default` | Dark+ (Default) | dark |
| `light-default` | Light+ (Default) | light |
| `one-dark-pro` | One Dark Pro | dark |
| `github-dark` | GitHub Dark | dark |
| `dracula` | Dracula | dark |
| `monokai` | Monokai | dark |
| `nord` | Nord | dark |
| `solarized-dark` | Solarized Dark | dark |

---

## Styling Conventions

- Tailwind utility classes for layout and spacing.
- shadcn/ui components for generic widgets (Button, Input, Select, Dialog, etc.).
- `--vscode-*` CSS variables for IDE chrome surfaces.
- No inline styles except for dynamic values that can't be expressed as classes.

---

## File Organization

- Page-level components → `src/pages/`
- Reusable components → `src/components/<feature>/`
- Global hooks → `src/hooks/`
- Utility functions → `src/lib/`
- CSS themes → `src/styles/themes/`
- Tauri IPC commands → `src-tauri/src/commands/`

---

## Key Architectural Notes

- **State management:** Zustand with Immer. Slices: `useAppStore`,
  `useWorkspaceStore`, `useChatStore`, `useSkillStore`, `useSettingsStore`,
  `useCheckpointStore`, `useTodoStore`, `useHookStore`.
- **Tauri IPC:** all backend calls go through `invoke()` from `@tauri-apps/api/core`.
  Never call Node.js APIs or use fetch for local data.
- **Terminal:** xterm.js + WebGL addon. One PTY instance per workspace,
  managed by Rust. Do not render xterm.js outside `<TerminalTab />`.
- **Diff viewer:** CodeMirror 6 MergeView. Language packs loaded dynamically
  by file extension.
- **File tree:** react-arborist with virtualization. Never render an unvirtualized
  list of files.

---

## Docs Index

All architecture and design docs are in `docs/`. Read the relevant doc before
making non-trivial changes to a subsystem.

| Doc | When to read |
|---|---|
| `docs/01-system-design.md` | Changing the Rust/Tauri layer |
| `docs/02-ui-layout-screens.md` | Adding/changing screens or panels |
| `docs/03-component-design.md` | Adding/changing React components |
| `docs/04-database-schema.md` | Changing SQLite schema |
| `docs/05-api-design.md` | Adding Tauri IPC commands |
| `docs/06-git-operations.md` | Git worktree or checkpoint changes |
| `docs/07-logging.md` | Adding log events or analytics |
| `docs/08-react-packages.md` | Adding new npm packages |
| `docs/12-dir-structure.md` | Understanding repo layout |
| `docs/13-vscode-themes.md` | Theme tokens, adding themes, styling chrome |
