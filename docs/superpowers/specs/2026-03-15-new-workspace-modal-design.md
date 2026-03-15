# New Workspace Modal — Design Spec
**Date:** 2026-03-15
**Status:** Approved

---

## Overview

Wire the existing `+` button in the Workspaces section header to open a two-step modal for creating a new workspace from three sources: a local folder, a GitHub/GitLab repo clone, or a project template. The backend (Tauri Rust side) already has `add_repository`, `create_workspace`, and git worktree commands. This feature primarily adds a frontend modal and two new Rust commands: `clone_repository` and `copy_template`.

---

## Existing Backend Context (Do Not Re-implement)

- `tauri-plugin-dialog` is already installed, registered in `lib.rs`, and has `"dialog:default"` permission available. Add it to `capabilities/default.json`.
- `tauri-plugin-store` is already installed and registered — used for persisting custom templates.
- `git2 = "0.19"` is already in `Cargo.toml` — use it for clone operations and `git init`.
- Rust commands already registered: `add_repository`, `create_workspace`, `list_repositories`, `list_workspaces`.
- `db::repository::find_by_path()` exists — use it in Step 2A to check if a folder is already registered.
- `create_workspace` already calls `git::worktree::create()` internally.

### `add_repository` input shape (from `db::repository::CreateRepository`):
```rust
pub struct CreateRepository {
    pub name: String,        // short repo name
    pub full_name: String,   // e.g. "owner/repo" or same as name for local
    pub remote_url: String,  // "" for local folders
    pub local_path: String,  // absolute FS path
    pub platform: Option<String>,       // "local" | "github" | "gitlab"
    pub default_branch: Option<String>, // "main"
    pub icon_path: Option<String>,
    pub operator_json: Option<String>,
}
```

### `create_workspace` parameter list (all required):
```
repository_id: String   // ID from add_repository response
repo_path: String       // local_path of the repository (for git ops)
city_name: String       // display name / worktree dir name (use workspace name input)
branch_name: String     // new branch to create (use workspace name, slugified)
base_branch: String     // branch to fork from (use repo's default_branch, default "main")
agent_backend: Option<String>  // pass None → defaults to "claude"
model: Option<String>          // pass None
```

### `db::workspace::Workspace` DB fields (for store mapping):
```rust
pub id: String
pub repository_id: String
pub city_name: String       // → UI Workspace.name
pub branch_name: String     // → UI Workspace.branch
pub worktree_path: String   // → UI Workspace.localPath
pub status: String          // "idle" | "running" | etc → UI Workspace.status
pub total_cost_usd: f64     // → UI Workspace.cost
pub is_archived: i64        // filter out if 1
```

---

## Step 1 — Source Picker Modal

A centered shadcn `Dialog` (controlled by local `useState<boolean>` in `WorkspaceList`). Title: **"New Workspace"**. Contains a row of 3 equal-width clickable cards:

| Card | Icon | Title | Subtitle |
|------|------|-------|---------|
| Local | `FolderOpen` | Open Folder / Repo | Open an existing local folder or git repo |
| Clone | `Github` | Clone from URL | Clone a GitHub/GitLab repo |
| Template | `LayoutTemplate` | Start from Template | Use a starter or your own custom template |

Internal step state: `type Step = "pick" | "local" | "clone" | "template"` — managed via `useState<Step>` inside `NewWorkspaceModal`. Clicking a card transitions the step. Back button (← arrow) resets to `"pick"`.

---

## Step 2A — Local Folder

`LocalFolderStep` fires the native picker on mount (via `useEffect`). On card click, step transitions to `"local"` which mounts this component and immediately calls `open()`. If the picker is cancelled, step reverts to `"pick"` automatically.

**Operation sequence:**
1. `useEffect` on mount: call `open({ directory: true, multiple: false })`.
2. If `null` returned (cancelled): call `onBack()` to revert to `"pick"` step. No error shown.
3. Call `invoke("find_repository_by_path", { path: selectedPath })` (new thin Rust command, see below). If already registered, skip `add_repository` and use the existing repo record.
4. If not registered: call `invoke("add_repository", { input: { name: lastPathSegment, full_name: lastPathSegment, remote_url: "", local_path: selectedPath, platform: "local", default_branch: "main" } })`.
5. Call `invoke("create_workspace", { repositoryId, repoPath: selectedPath, cityName: lastPathSegment + "-ws", branchName: slugify(lastPathSegment + "-ws"), baseBranch: "main", agentBackend: null, model: null })`.
6. Dispatch result into `workspaceStore.addRepo()` and select new workspace via `onWorkspaceSelect`.
7. Close modal.
8. On error: revert to `"local"` step showing an inline red error message with a "Try again" button.

**New thin Rust command:**
```rust
#[tauri::command]
pub async fn find_repository_by_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<Option<db::repository::Repository>, AppError> {
    db::repository::find_by_path(&state.db, &path).await.map_err(Into::into)
}
```

---

## Step 2B — Clone from URL

**Form fields:**
1. **Repo URL** — text input, placeholder `https://github.com/owner/repo`. On blur/change, auto-derive workspace name from last URL path segment (strip `.git`).
2. **Clone destination** — text input (shows resolved path), with "Browse…" button that calls `open({ directory: true })`. This is the **parent** directory; the repo folder is created inside it as `<workspace-name>`.
3. **Workspace name** — text input, pre-filled from URL slug, editable.

**Action button:** "Clone & Open" — disabled during operation; shows `Loader2` spinner when loading.

**Operation sequence:**
1. Derive `destination_path` = `<clone_destination>/<workspace_name>`.
2. Call `invoke("clone_repository", { url, destinationPath: destination_path })`.
3. On success: call `invoke("add_repository", { input: { name: workspaceName, full_name: workspaceName, remote_url: url, local_path: destination_path, platform: "github", default_branch: "main" } })`.
4. Call `invoke("create_workspace", { repositoryId: repo.id, repoPath: destination_path, cityName: workspaceName, branchName: slugify(workspaceName), baseBranch: "main", agentBackend: null, model: null })`.
5. Append to `workspaceStore`, close modal, select workspace.
6. On error: show inline error message below the URL field.

**New Rust command to add to `commands/workspace.rs`:**
```rust
#[tauri::command]
pub async fn clone_repository(url: String, destination_path: String) -> Result<(), AppError> {
    // uses git2::Repository::clone()
}
```
Register in `lib.rs` invoke_handler.

---

## Step 2C — Templates

### Template grid
Two rows of cards (icon + name):
- **Hardcoded defaults** (in `src/data/templates.ts`): `Next.js`, `Python`, `Gradio`, `FastAPI`, `Blank`
- **User custom templates** — appended after defaults, loaded from `settingsStore.customTemplates`
- **"+ Add Custom Template"** — a dashed-border card at the end of the grid

### Adding a custom template
1. "Add Custom Template" card click → call `open({ directory: true })`.
2. After folder picker returns, show an inline **name input** within the modal (replace the grid temporarily with "Name your template: [input] [Save]").
3. On save: call `settingsStore.addCustomTemplate({ id: uuid, name, sourcePath })`. Template appears in grid.

### Using a template
Clicking a template card shows a mini-form within the same modal:
1. **Workspace name** — text input
2. **Destination folder** — text input with "Browse…" button (`open({ directory: true })`)

**Action button:** "Create Workspace"

**Operation sequence:**
1. Derive `destination_path` = `<destination_folder>/<workspace_name>`.
2. Call `invoke("copy_template", { sourcePath: template.sourcePath, destinationPath: destination_path })`.
3. Call `invoke("init_git_repo", { path: destination_path })` — always safe to call even if `.git` already exists (command checks first).
4. Call `invoke("add_repository", { input: { name: workspaceName, full_name: workspaceName, remote_url: "", local_path: destination_path, platform: "local", default_branch: "main" } })`.
5. Call `invoke("create_workspace", { repositoryId: repo.id, repoPath: destination_path, cityName: workspaceName, branchName: slugify(workspaceName), baseBranch: "main", agentBackend: null, model: null })`.
6. Append to `workspaceStore`, close modal, select workspace.

**New Rust commands to add to `commands/workspace.rs`:**
```rust
/// Recursively copies a directory tree from source_path to destination_path.
/// Uses std::fs::read_dir recursively — no extra crate needed.
#[tauri::command]
pub async fn copy_template(source_path: String, destination_path: String) -> Result<(), AppError> {
    fn copy_dir(src: &Path, dst: &Path) -> std::io::Result<()> {
        std::fs::create_dir_all(dst)?;
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let ty = entry.file_type()?;
            if ty.is_dir() {
                copy_dir(&entry.path(), &dst.join(entry.file_name()))?;
            } else {
                std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
            }
        }
        Ok(())
    }
    copy_dir(Path::new(&source_path), Path::new(&destination_path))
        .map_err(|e| AppError::msg(e.to_string()))
}

/// Initializes a git repo at path if .git does not already exist.
#[tauri::command]
pub async fn init_git_repo(path: String) -> Result<(), AppError> {
    let p = Path::new(&path);
    if !p.join(".git").exists() {
        git2::Repository::init(p).map_err(|e| AppError::msg(e.message().to_string()))?;
    }
    Ok(())
}
```

---

## Frontend Architecture

### New files
- `src/components/sidebar/NewWorkspaceModal.tsx` — dialog shell, step routing, back button
- `src/components/sidebar/steps/LocalFolderStep.tsx` — fires picker immediately on mount
- `src/components/sidebar/steps/CloneUrlStep.tsx` — clone form
- `src/components/sidebar/steps/TemplateStep.tsx` — template grid + add-custom inline flow
- `src/data/templates.ts` — hardcoded template list: `{ id, name, icon, description }[]`

### Modified files
| File | Change |
|------|--------|
| `src/components/sidebar/WorkspaceList.tsx` | Add `const [open, setOpen] = useState(false)` local state; wire `+` button `onClick={() => setOpen(true)}`; render `<NewWorkspaceModal open={open} onClose={() => setOpen(false)} onWorkspaceSelect={onWorkspaceSelect} />`; read repos from `workspaceStore` instead of `mockRepos` |
| `src/store/workspaceStore.ts` | Create Zustand store (see Store Shape section) |
| `src/store/settingsStore.ts` | Add `customTemplates` field (see Store Shape section) |
| `src/types/workspace.ts` | Add `localPath?: string` to `Workspace` interface |
| `src-tauri/src/commands/workspace.rs` | Add `clone_repository`, `copy_template`, `init_git_repo`, `find_repository_by_path` |
| `src-tauri/src/lib.rs` | Register new commands in `invoke_handler![]` |
| `src-tauri/capabilities/default.json` | Add `"dialog:default"` and `"store:default"` permissions |

---

## Store Shapes

### `workspaceStore.ts` (new — Zustand, no persistence needed, loaded from Tauri on mount)
```ts
interface WorkspaceStore {
  repos: Repo[];                         // UI Repo[] type from types/workspace.ts
  isLoading: boolean;
  loadRepos: () => Promise<void>;        // calls invoke("list_repositories") + invoke("list_workspaces") for each
  addRepo: (repo: Repo) => void;         // optimistic append
}
```
`loadRepos` maps Tauri `Repository[]` → `Repo[]` using:
- `id`, `name`, `avatarLetter` (first char of name)
- `workspaces`: mapped from `db::Workspace[]` → `Workspace[]` with status `"idle"`, `agentCount: 0`

### `settingsStore.ts` (extend existing empty file — Zustand + `tauri-plugin-store` for persistence)
```ts
import { load } from "@tauri-apps/plugin-store";

interface CustomTemplate {
  id: string;
  name: string;
  sourcePath: string;
}

interface SettingsStore {
  customTemplates: CustomTemplate[];
  isLoaded: boolean;
  loadSettings: () => Promise<void>;   // call once from App.tsx useEffect on mount
  addCustomTemplate: (t: CustomTemplate) => void;
  removeCustomTemplate: (id: string) => void;
}
```

**Hydration pattern** — call `loadSettings()` in `App.tsx` via `useEffect(() => { useSettingsStore.getState().loadSettings(); }, [])`:
```ts
loadSettings: async () => {
  const store = await load("settings.json", { autoSave: true });
  const templates = await store.get<CustomTemplate[]>("customTemplates") ?? [];
  set({ customTemplates: templates, isLoaded: true });
}
```

**Persist on mutation** — each `addCustomTemplate` / `removeCustomTemplate` call also writes to the store:
```ts
addCustomTemplate: async (t) => {
  set(state => ({ customTemplates: [...state.customTemplates, t] }));
  const store = await load("settings.json", { autoSave: true });
  await store.set("customTemplates", get().customTemplates);
}
```

---

## Defaults for New Workspaces

When constructing a `Workspace` UI object after creation:
- `status`: `"idle"`
- `agentCount`: `0`
- `branch`: the `branch_name` returned by `create_workspace` (or `"main"` for templates/local)
- `cost`: `undefined`
- `todoCount`: `undefined`

---

## Modal State Machine

```
isOpen=false
  │ + button click
  ▼
Step: "pick"  (3 cards)
  ├─ click Local  → Step: "local"  → native picker → invoke → close
  ├─ click Clone  → Step: "clone"  → form → submit → invoke → close
  └─ click Template → Step: "template"
       ├─ click hardcoded/custom template → show mini-form → submit → invoke → close
       └─ click "Add Custom" → picker → inline name input → save → back to grid
```

---

## Error Handling

- All async operations: button shows `<Loader2 className="animate-spin" />`, disabled during loading.
- Errors: displayed as a red inline message below the relevant input, never as toast or alert dialogs.
- Clone failures (bad URL, network, auth): "Clone failed: <error message from Rust AppError>".
- Template copy failures: "Could not copy template: <error>".

---

## Capabilities / Permissions to Add

Add to `src-tauri/capabilities/default.json`:
```json
"dialog:default",
"store:default"
```

No new npm packages required. No new Cargo dependencies required (`git2` and `std::fs::read_dir` cover all operations — no `fs_extra` needed).

---

## Out of Scope

- SSH key management for private repos (clone uses HTTPS only)
- Remote template registry
- Workspace deletion from this modal
- Progress streaming for large clones (clone is synchronous via `git2`, blocking the Tauri thread — acceptable for v1)
