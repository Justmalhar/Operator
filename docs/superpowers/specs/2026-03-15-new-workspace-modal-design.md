# New Workspace Modal — Design Spec
**Date:** 2026-03-15
**Status:** Approved

---

## Overview

Add a functional `+` button to the Workspaces section header in the sidebar. Clicking it opens a two-step modal for creating a new workspace from three sources: a local folder, a GitHub/GitLab repo URL, or a project template.

---

## Step 1 — Source Picker Modal

A centered shadcn `Dialog` with title **"New Workspace"** and a row of 3 clickable cards:

| Card | Icon | Title | Subtitle |
|------|------|-------|---------|
| Local | `FolderOpen` | Open Folder / Repo | Open an existing local folder or git repo |
| Clone | `Github` | Clone from URL | Clone a GitHub/GitLab repo |
| Template | `LayoutTemplate` | Start from Template | Use a starter or your own custom template |

Clicking a card navigates to the corresponding Step 2 view within the same dialog (no page navigation).

---

## Step 2A — Local Folder

- Clicking "Open Folder / Repo" immediately triggers Tauri's native `open()` dialog in directory-selection mode.
- On folder selection: creates a new `Workspace` entry under the matching `Repo` group (or a new repo group if the folder is not already tracked), closes the modal, and selects the new workspace.
- No form fields required.

---

## Step 2B — Clone from URL

Fields:
1. **Repo URL** — text input, placeholder `https://github.com/owner/repo`; workspace name auto-derived from URL slug.
2. **Clone destination** — text input with a "Browse…" button that opens the native folder picker for selecting the parent directory.
3. **Workspace name** — text input, pre-filled from URL slug, user-editable.

Action button: **"Clone & Open"** — triggers the clone operation, shows a loading state, then opens the workspace on success.

---

## Step 2C — Templates

### Template grid
- Hardcoded defaults: `Next.js`, `Python`, `Gradio`, `FastAPI`, `Blank`
- Each card shows icon + name
- User-added custom templates appear after the defaults

### Adding a custom template
- **"+ Add Custom Template"** button at the bottom of the grid
- Opens native folder picker → prompts for a template name → saves the folder path + name to settings store (persisted)

### Using a template
Clicking a template card shows a mini-form:
1. **Workspace name** — text input
2. **Destination folder** — text input with "Browse…" button

Action button: **"Create Workspace"**
- Copies the template folder to the chosen destination
- Initializes a git repo if none exists (`git init`)
- Creates a git worktree from the new repo
- Opens the workspace

---

## Architecture

### New files
- `src/components/sidebar/NewWorkspaceModal.tsx` — full modal with step routing (source picker → step 2A/B/C)
- `src/components/sidebar/steps/LocalFolderStep.tsx` — immediate native picker trigger
- `src/components/sidebar/steps/CloneUrlStep.tsx` — clone form
- `src/components/sidebar/steps/TemplateStep.tsx` — template grid + add-custom flow

### Modified files
- `src/store/workspaceStore.ts` — add `repos` state, `addWorkspace()`, `addCustomTemplate()`, hydrate from `mockRepos` as initial state
- `src/components/sidebar/WorkspaceList.tsx` — wire `+` button `onClick` to open modal; read repos from store instead of `mockRepos`
- `src/store/settingsStore.ts` — add `customTemplates: CustomTemplate[]` field (persisted)

### Types
```ts
interface CustomTemplate {
  id: string;
  name: string;
  sourcePath: string;
}
```

---

## State Flow

```
WorkspaceList
  └─ + button onClick → opens NewWorkspaceModal (isOpen: true)
       └─ Step 1: source picker cards
            ├─ Local → trigger Tauri open() → addWorkspace() → close
            ├─ Clone → CloneUrlStep → clone → addWorkspace() → close
            └─ Template → TemplateStep
                 ├─ pick template → mini-form → copy + git init → addWorkspace() → close
                 └─ + Add Custom → native picker → addCustomTemplate() → persist
```

---

## Error Handling

- Clone step: show inline error if URL is invalid or git clone fails
- Template copy: show inline error if destination is not writable
- All async operations show a loading spinner on the action button; button is disabled during the operation

---

## Out of Scope

- SSH key management for private repos (clone uses HTTPS only for now)
- Template versioning or remote template registry
- Workspace deletion from this modal
