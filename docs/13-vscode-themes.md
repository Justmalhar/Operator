# Operator — VSCode Theme System

*Version 1.0 · March 2026*

---

## Overview

Operator ships a VSCode-faithful theme system located at `src/styles/themes/`.
Themes are pure CSS — zero runtime JS overhead — implemented via CSS custom
properties scoped to a `[data-vscode-theme="<id>"]` attribute on `<html>`.

Dark+ defaults are applied to `:root` so the app always has a valid theme
even before `restoreTheme()` runs.

---

## File Structure

```
src/styles/themes/
├── vscode-tokens.css     ← All --vscode-* token definitions + Dark+ defaults
├── index.css             ← Imports all themes + utility classes (.vscode-*)
├── themes.ts             ← TypeScript registry: THEMES[], applyTheme(), restoreTheme()
│
├── dark-default.css      ← VSCode Dark+
├── light-default.css     ← VSCode Light+
├── one-dark-pro.css      ← One Dark Pro (by binaryify)
├── github-dark.css       ← GitHub Dark (by GitHub/Primer)
├── dracula.css           ← Dracula Official
├── monokai.css           ← Monokai Classic
├── nord.css              ← Nord (by arcticicestudio)
└── solarized-dark.css    ← Solarized Dark (by Ethan Schoonover)
```

Both `index.css` and `themes.ts` are imported in `src/main.tsx`.
`restoreTheme()` is called before `ReactDOM.createRoot` so there is no
flash of wrong theme on startup.

---

## Adding a New Theme

1. Create `src/styles/themes/<theme-id>.css`.
2. Use the selector `[data-vscode-theme="<theme-id>"]`.
3. Override only the tokens that differ from the Dark+ defaults in
   `vscode-tokens.css`. Tokens not set fall through to the `:root` defaults.
4. Add a `@import "./<theme-id>.css";` line in `index.css`.
5. Add a `VscodeTheme` entry to the `THEMES` array in `themes.ts`
   (fill in `id`, `label`, `variant`, `accent`, `background`).

That's it — no build step, no plugin registration.

---

## Token Reference

All tokens are prefixed `--vscode-` and mirror the VSCode workbench color
contribution key names (dots replaced with hyphens, camelCase flattened).

### Base / Editor

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-editor-background` | `editor.background` | Main code area bg |
| `--vscode-editor-foreground` | `editor.foreground` | Default text color |
| `--vscode-editor-line-highlight` | `editor.lineHighlightBackground` | Current-line highlight |
| `--vscode-editor-selection` | `editor.selectionBackground` | Selected text bg |
| `--vscode-editor-cursor` | `editorCursor.foreground` | Caret color |

### Activity Bar

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-activity-bar-background` | `activityBar.background` | Leftmost icon strip |
| `--vscode-activity-bar-foreground` | `activityBar.foreground` | Active icon color |
| `--vscode-activity-bar-inactive` | `activityBar.inactiveForeground` | Inactive icon color |
| `--vscode-activity-bar-badge-background` | `activityBarBadge.background` | Notification dot |

### Sidebar

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-sidebar-background` | `sideBar.background` | Explorer / Search panel |
| `--vscode-sidebar-foreground` | `sideBar.foreground` | Item text |
| `--vscode-sidebar-title-foreground` | `sideBarTitle.foreground` | Panel heading (EXPLORER) |
| `--vscode-sidebar-section-header-background` | `sideBarSectionHeader.background` | Collapsible section row |
| `--vscode-sidebar-section-header-foreground` | `sideBarSectionHeader.foreground` | Section row text |

### Tab Bar / Tabs

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-tab-bar-background` | `editorGroupHeader.tabsBackground` | Row behind all tabs |
| `--vscode-tab-active-background` | `tab.activeBackground` | Selected tab bg |
| `--vscode-tab-active-foreground` | `tab.activeForeground` | Selected tab label |
| `--vscode-tab-inactive-background` | `tab.inactiveBackground` | Unselected tab bg |
| `--vscode-tab-inactive-foreground` | `tab.inactiveForeground` | Unselected tab label |
| `--vscode-tab-hover-background` | `tab.hoverBackground` | Hover state bg |
| `--vscode-tab-border` | `tab.border` | Divider between tabs |

### Panel (Terminal / Problems / Output)

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-panel-background` | `panel.background` | Bottom panel bg |
| `--vscode-panel-border` | `panel.border` | Top border of panel |
| `--vscode-panel-title-active-foreground` | `panelTitle.activeForeground` | Active tab label |
| `--vscode-panel-title-active-border` | `panelTitle.activeBorder` | Active tab underline |
| `--vscode-panel-title-inactive-foreground` | `panelTitle.inactiveForeground` | Inactive tab label |

### Title Bar

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-titlebar-background` | `titleBar.activeBackground` | Window chrome bg |
| `--vscode-titlebar-foreground` | `titleBar.activeForeground` | Window chrome text |
| `--vscode-titlebar-inactive-background` | `titleBar.inactiveBackground` | Unfocused window |

### Status Bar

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-statusbar-background` | `statusBar.background` | Bottom bar bg |
| `--vscode-statusbar-foreground` | `statusBar.foreground` | Bottom bar text |
| `--vscode-statusbar-hover-background` | `statusBar.itemHoverBackground` | Item hover |

### List / Tree

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-list-hover-background` | `list.hoverBackground` | Row hover |
| `--vscode-list-active-selection-background` | `list.activeSelectionBackground` | Focused row |
| `--vscode-list-active-selection-foreground` | `list.activeSelectionForeground` | Focused row text |
| `--vscode-list-inactive-selection-background` | `list.inactiveSelectionBackground` | Unfocused row |
| `--vscode-list-highlight-foreground` | `list.highlightForeground` | Search match highlight |

### Input / Dropdown

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-input-background` | `input.background` | Text field bg |
| `--vscode-input-foreground` | `input.foreground` | Text field text |
| `--vscode-input-border` | `input.border` | Text field border |
| `--vscode-input-placeholder-foreground` | `input.placeholderForeground` | Placeholder text |
| `--vscode-dropdown-background` | `dropdown.background` | Select bg |
| `--vscode-dropdown-foreground` | `dropdown.foreground` | Select text |

### Scrollbar

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-scrollbar-slider-background` | `scrollbarSlider.background` | Default thumb |
| `--vscode-scrollbar-slider-hover` | `scrollbarSlider.hoverBackground` | Hovered thumb |
| `--vscode-scrollbar-slider-active` | `scrollbarSlider.activeBackground` | Dragging thumb |

### Badge / Button / Focus

| Token | VSCode key | Description |
|---|---|---|
| `--vscode-badge-background` | `badge.background` | Notification dot bg |
| `--vscode-badge-foreground` | `badge.foreground` | Notification dot text |
| `--vscode-button-background` | `button.background` | Primary button |
| `--vscode-button-hover-background` | `button.hoverBackground` | Primary button hover |
| `--vscode-focus-border` | `focusBorder` | Keyboard focus ring |

### Terminal (ANSI)

All 16 ANSI colors are exposed: `--vscode-terminal-ansi-{black,red,green,
yellow,blue,magenta,cyan,white}` and the bright variants
`--vscode-terminal-ansi-bright-{…}`.

---

## Utility Classes

`index.css` ships ready-to-use semantic classes that apply the tokens:

| Class | Tokens applied | Use on |
|---|---|---|
| `.vscode-activity-bar` | activity-bar bg/fg | Icon strip container |
| `.vscode-sidebar` | sidebar bg/fg | Explorer panel |
| `.vscode-sidebar-title` | sidebar-title-fg + typography | Section headings |
| `.vscode-sidebar-section-header` | section-header bg/fg | Collapsible rows |
| `.vscode-tab-bar` | tab-bar bg + border | Tab row container |
| `.vscode-tab` | inactive tab bg/fg | Individual tab |
| `.vscode-tab.active` | active tab bg/fg | Selected tab |
| `.vscode-editor` | editor bg/fg | Code / content area |
| `.vscode-panel` | panel bg/fg + border | Bottom panel |
| `.vscode-panel-title` | panel-title inactive | Panel tab label |
| `.vscode-panel-title.active` | panel-title active + border | Active panel tab |
| `.vscode-titlebar` | titlebar bg/fg | Window chrome |
| `.vscode-statusbar` | statusbar bg/fg | Bottom status bar |
| `.vscode-statusbar-item:hover` | statusbar-hover | Status bar item |
| `.vscode-list-item` | list fg | Tree / list row |
| `.vscode-list-item:hover` | list-hover | Hovered row |
| `.vscode-list-item.selected` | list-active-selection | Active selection |
| `.vscode-input` | input bg/fg/border | Text inputs |
| `.vscode-dropdown` | dropdown bg/fg/border | Select elements |
| `.vscode-badge` | badge bg/fg | Notification dots |
| `.vscode-button` | button bg/fg/hover | Primary buttons |
| `.vscode-button-secondary` | secondary button | Secondary buttons |
| `.vscode-focusable:focus-visible` | focus-border | Any focusable element |
| `.vscode-scrollable` | scrollbar tokens | Scrollable containers |

---

## TypeScript API (`themes.ts`)

```typescript
import {
  THEMES,           // VscodeTheme[]  — full metadata for all 8 themes
  applyTheme,       // (id: VscodeThemeId) => void  — sets attr + persists
  restoreTheme,     // () => void  — call once on app boot
  getStoredTheme,   // () => VscodeThemeId  — reads localStorage
  getCurrentTheme,  // () => VscodeThemeId  — reads DOM attribute
  getTheme,         // (id) => VscodeTheme | undefined
} from "@/styles/themes/themes";

// THEMES entry shape
interface VscodeTheme {
  id:         VscodeThemeId;
  label:      string;               // display name for UI
  variant:    "dark" | "light";
  accent:     string;               // hex, for swatches
  background: string;               // hex, for preview tiles
}
```

### Available theme IDs (`VscodeThemeId`)

| id | Label | Variant |
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

## Persistence

`applyTheme()` writes the theme ID to `localStorage` under the key
`"vscode-theme"`. `restoreTheme()` reads it back on boot.
If no value is stored, `"dark-default"` is used as the fallback.

For settings UI wiring, read the current value with `getStoredTheme()` and
write with `applyTheme(id)` — no additional persistence logic needed.

---

## Integration with Zustand

The `useAppStore` slice tracks `theme` for components that need to react to
theme changes (e.g., dynamically loading a CodeMirror theme extension):

```typescript
// In useAppStore
theme: getCurrentTheme(),
setTheme: (id: VscodeThemeId) => {
  applyTheme(id);
  set({ theme: id });
},
```

---

## Relationship to shadcn / Tailwind tokens

The `--vscode-*` tokens are **additive** — they coexist with the shadcn
`--background`, `--foreground`, `--primary` etc. tokens in `tailwind.css`.

- shadcn tokens drive `shadcn/ui` component internals
- `--vscode-*` tokens drive the IDE chrome (sidebar, tabs, panels, status bar)

Do not merge the two namespaces. Keep `--vscode-*` strictly for IDE-chrome
surfaces and use shadcn tokens for generic UI widgets (dialogs, dropdowns,
buttons within the app shell).
