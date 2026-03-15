# New Workspace Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `+` button in the Workspaces sidebar to open a 3-card modal for creating workspaces from a local folder, GitHub clone, or project template.

**Architecture:** Frontend-first modal (React + shadcn Dialog) with step routing, backed by 4 new Rust Tauri commands. State lives in two Zustand stores: `workspaceStore` (repos loaded from SQLite on mount) and `settingsStore` (custom templates persisted via `tauri-plugin-store`).

**Tech Stack:** React 19, TypeScript, Zustand 5, shadcn/ui Dialog, Tauri 2, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-store`, `git2` (Rust), `std::fs` (Rust)

**Spec:** `docs/superpowers/specs/2026-03-15-new-workspace-modal-design.md`

---

## Chunk 1: Types, Data, and Store Foundations

### Task 1: Extend workspace types and add template data

**Files:**
- Modify: `src/types/workspace.ts`
- Create: `src/data/templates.ts`

- [ ] **Step 1.1: Add `localPath` to Workspace interface**

Open `src/types/workspace.ts` and add `localPath` to the `Workspace` interface:

```ts
export interface Workspace {
  id: string;
  name: string;
  branch: string;
  status: WorkspaceStatus;
  agentCount: number;
  cost?: number;
  todoCount?: number;
  localPath?: string;   // ← add this
}
```

- [ ] **Step 1.2: Create hardcoded templates data file**

Create `src/data/templates.ts`:

```ts
import {
  Globe,
  Code2,
  BarChart2,
  Zap,
  FileCode2,
  type LucideIcon,
} from "lucide-react";

export interface HardcodedTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Not needed for hardcoded templates — sourcePath comes from user selection for custom ones */
  sourcePath?: never;
}

export const HARDCODED_TEMPLATES: HardcodedTemplate[] = [
  { id: "nextjs",   name: "Next.js",  description: "App Router, TypeScript, Tailwind", icon: Globe },
  { id: "python",   name: "Python",   description: "uv, Flask, .env setup",            icon: Code2 },
  { id: "gradio",   name: "Gradio",   description: "ML demo UI with Python backend",   icon: BarChart2 },
  { id: "fastapi",  name: "FastAPI",  description: "Async REST API with Pydantic",     icon: Zap },
  { id: "blank",    name: "Blank",    description: "Empty folder with git init",       icon: FileCode2 },
];
```

- [ ] **Step 1.3: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.4: Commit**

```bash
git add src/types/workspace.ts src/data/templates.ts
git commit -m "feat: extend Workspace type with localPath, add hardcoded template data"
```

---

### Task 2: Create `workspaceStore.ts`

**Files:**
- Create: `src/store/workspaceStore.ts`

- [ ] **Step 2.1: Write the store**

Create `src/store/workspaceStore.ts`:

```ts
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Repo, Workspace, WorkspaceStatus } from "@/types/workspace";

// ── Tauri DB types (snake_case from Rust) ────────────────────────────────────

interface TauriRepository {
  id: string;
  name: string;
  full_name: string;
  remote_url: string;
  local_path: string;
  default_branch: string;
}

interface TauriWorkspace {
  id: string;
  repository_id: string;
  city_name: string;
  branch_name: string;
  worktree_path: string;
  status: string;
  total_cost_usd: number;
  is_archived: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface WorkspaceStore {
  repos: Repo[];
  isLoading: boolean;
  loadRepos: () => Promise<void>;
  addRepo: (repo: Repo) => void;
}

function mapWorkspace(ws: TauriWorkspace): Workspace {
  return {
    id: ws.id,
    name: ws.city_name,
    branch: ws.branch_name,
    status: (ws.status as WorkspaceStatus) ?? "idle",
    agentCount: 0,
    cost: ws.total_cost_usd > 0 ? ws.total_cost_usd : undefined,
    localPath: ws.worktree_path,
  };
}

function mapRepo(repo: TauriRepository, workspaces: TauriWorkspace[]): Repo {
  const repoWorkspaces = workspaces
    .filter((ws) => ws.repository_id === repo.id && ws.is_archived === 0)
    .map(mapWorkspace);

  return {
    id: repo.id,
    name: repo.name,
    avatarLetter: repo.name.charAt(0).toUpperCase(),
    workspaces: repoWorkspaces,
    isExpanded: repoWorkspaces.length > 0,
  };
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  repos: [],
  isLoading: false,

  loadRepos: async () => {
    set({ isLoading: true });
    try {
      const tauriRepos = await invoke<TauriRepository[]>("list_repositories");
      const allWorkspaces: TauriWorkspace[] = [];

      for (const repo of tauriRepos) {
        const ws = await invoke<TauriWorkspace[]>("list_workspaces", {
          repositoryId: repo.id,
        });
        allWorkspaces.push(...ws);
      }

      const repos = tauriRepos.map((r) => mapRepo(r, allWorkspaces));
      set({ repos, isLoading: false });
    } catch (err) {
      console.error("Failed to load repos:", err);
      set({ isLoading: false });
    }
  },

  addRepo: (repo) => {
    set((state) => ({ repos: [...state.repos, repo] }));
  },
}));
```

- [ ] **Step 2.2: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/store/workspaceStore.ts
git commit -m "feat: add workspaceStore with Tauri-backed repo/workspace loading"
```

---

### Task 3: Create `settingsStore.ts`

**Files:**
- Create: `src/store/settingsStore.ts`

- [ ] **Step 3.1: Write the store**

Create `src/store/settingsStore.ts`:

```ts
import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

export interface CustomTemplate {
  id: string;
  name: string;
  sourcePath: string;
}

interface SettingsStore {
  customTemplates: CustomTemplate[];
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  addCustomTemplate: (t: CustomTemplate) => void;
  removeCustomTemplate: (id: string) => void;
}

async function getStore() {
  return load("settings.json", { autoSave: true });
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  customTemplates: [],
  isLoaded: false,

  loadSettings: async () => {
    const store = await getStore();
    const templates = (await store.get<CustomTemplate[]>("customTemplates")) ?? [];
    set({ customTemplates: templates, isLoaded: true });
  },

  addCustomTemplate: async (t) => {
    set((state) => ({ customTemplates: [...state.customTemplates, t] }));
    const store = await getStore();
    await store.set("customTemplates", get().customTemplates);
  },

  removeCustomTemplate: async (id) => {
    set((state) => ({
      customTemplates: state.customTemplates.filter((t) => t.id !== id),
    }));
    const store = await getStore();
    await store.set("customTemplates", get().customTemplates);
  },
}));
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/store/settingsStore.ts
git commit -m "feat: add settingsStore with custom template persistence via tauri-plugin-store"
```

---

## Chunk 2: Rust Backend Commands

### Task 4: Add new Rust commands to `commands/workspace.rs`

**Files:**
- Modify: `src-tauri/src/commands/workspace.rs`

- [ ] **Step 4.1: Add `find_repository_by_path` command**

Open `src-tauri/src/commands/workspace.rs`. After the existing `remove_repository` function (around line 50), add:

```rust
/// Look up a repository by its filesystem path. Returns None if not registered.
#[tauri::command]
pub async fn find_repository_by_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<Option<db::repository::Repository>, AppError> {
    db::repository::find_by_path(&state.db, &path)
        .await
        .map_err(Into::into)
}
```

- [ ] **Step 4.2: Add `clone_repository` command**

After `find_repository_by_path`, add:

```rust
/// Clone a remote git repository to destination_path using libgit2.
#[tauri::command]
pub async fn clone_repository(
    url: String,
    destination_path: String,
) -> Result<(), AppError> {
    let dest = PathBuf::from(&destination_path);
    git2::Repository::clone(&url, &dest).map_err(AppError::Git)?;
    Ok(())
}
```

- [ ] **Step 4.3: Add `copy_template` command**

After `clone_repository`, add:

```rust
/// Recursively copies a directory tree from source_path to destination_path.
#[tauri::command]
pub async fn copy_template(
    source_path: String,
    destination_path: String,
) -> Result<(), AppError> {
    fn copy_dir(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
        std::fs::create_dir_all(dst)?;
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let ty = entry.file_type()?;
            let dst_path = dst.join(entry.file_name());
            if ty.is_dir() {
                copy_dir(&entry.path(), &dst_path)?;
            } else if ty.is_file() {
                std::fs::copy(entry.path(), &dst_path)?;
            }
        }
        Ok(())
    }
    copy_dir(
        std::path::Path::new(&source_path),
        std::path::Path::new(&destination_path),
    )
    .map_err(AppError::Io)
}
```

- [ ] **Step 4.4: Add `init_git_repo` command**

After `copy_template`, add:

```rust
/// Initializes a git repository at path if .git does not already exist.
#[tauri::command]
pub async fn init_git_repo(path: String) -> Result<(), AppError> {
    let p = std::path::Path::new(&path);
    if !p.join(".git").exists() {
        git2::Repository::init(p).map_err(AppError::Git)?;
    }
    Ok(())
}
```

- [ ] **Step 4.5: Verify Rust compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento/src-tauri
cargo check 2>&1
```

Expected: `Finished` with no errors. If `AppError::Io` variant is missing, check `src/error.rs` — it already has `Io(std::io::Error)`.

- [ ] **Step 4.6: Commit**

```bash
git add src-tauri/src/commands/workspace.rs
git commit -m "feat(rust): add find_repository_by_path, clone_repository, copy_template, init_git_repo commands"
```

---

### Task 5: Register new commands and update capabilities

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 5.1: Register commands in `lib.rs`**

Open `src-tauri/src/lib.rs`. Find the `invoke_handler![]` block. Add the 4 new commands:

```rust
commands::workspace::find_repository_by_path,
commands::workspace::clone_repository,
commands::workspace::copy_template,
commands::workspace::init_git_repo,
```

Place them after the existing `commands::workspace::set_workspace_status` entry.

- [ ] **Step 5.2: Update capabilities**

Open `src-tauri/capabilities/default.json`. Replace contents with:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default",
    "store:default"
  ]
}
```

- [ ] **Step 5.3: Verify Rust compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento/src-tauri
cargo check 2>&1
```

Expected: `Finished` with no errors.

- [ ] **Step 5.4: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "feat(rust): register new workspace commands and add dialog/store permissions"
```

---

## Chunk 3: Modal UI — Shell and Steps

### Task 6: Create `NewWorkspaceModal.tsx` (dialog shell + step router)

**Files:**
- Create: `src/components/sidebar/NewWorkspaceModal.tsx`

- [ ] **Step 6.1: Write the modal shell**

Create `src/components/sidebar/NewWorkspaceModal.tsx`:

```tsx
import { useState } from "react";
import { ArrowLeft, FolderOpen, Github, LayoutTemplate } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LocalFolderStep } from "./steps/LocalFolderStep";
import { CloneUrlStep } from "./steps/CloneUrlStep";
import { TemplateStep } from "./steps/TemplateStep";

export type Step = "pick" | "local" | "clone" | "template";

interface SourceCard {
  id: Step;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

const SOURCE_CARDS: SourceCard[] = [
  {
    id: "local",
    icon: FolderOpen,
    title: "Open Folder / Repo",
    subtitle: "Open an existing local folder or git repo",
  },
  {
    id: "clone",
    icon: Github,
    title: "Clone from URL",
    subtitle: "Clone a GitHub/GitLab repo",
  },
  {
    id: "template",
    icon: LayoutTemplate,
    title: "Start from Template",
    subtitle: "Use a starter or your own custom template",
  },
];

interface NewWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onWorkspaceSelect: (workspaceId: string) => void;
}

export function NewWorkspaceModal({
  open,
  onClose,
  onWorkspaceSelect,
}: NewWorkspaceModalProps) {
  const [step, setStep] = useState<Step>("pick");

  function handleClose() {
    setStep("pick");
    onClose();
  }

  function handleSuccess(workspaceId: string) {
    handleClose();
    onWorkspaceSelect(workspaceId);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[520px] max-w-[95vw] p-0 overflow-hidden"
        style={{ background: "var(--vscode-editor-background)", border: "1px solid var(--vscode-panel-border)" }}>
        <DialogHeader className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            {step !== "pick" && (
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="flex h-6 w-6 items-center justify-center rounded hover:opacity-80 transition-opacity"
                style={{ color: "var(--vscode-foreground)" }}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle
              className="text-[13px] font-semibold"
              style={{ color: "var(--vscode-foreground)" }}
            >
              New Workspace
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">
          {step === "pick" && (
            <div className="flex flex-col gap-3">
              {SOURCE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setStep(card.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 text-left transition-all duration-100 hover:opacity-90",
                    )}
                    style={{
                      background: "var(--vscode-input-background)",
                      borderColor: "var(--vscode-panel-border)",
                      color: "var(--vscode-foreground)",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                      style={{ background: "var(--vscode-button-background)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "var(--vscode-button-foreground)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{card.title}</div>
                      <div className="text-[11px] mt-0.5 opacity-60">{card.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === "local" && (
            <LocalFolderStep
              onSuccess={handleSuccess}
              onBack={() => setStep("pick")}
            />
          )}

          {step === "clone" && (
            <CloneUrlStep onSuccess={handleSuccess} onBack={() => setStep("pick")} />
          )}

          {step === "template" && (
            <TemplateStep onSuccess={handleSuccess} onBack={() => setStep("pick")} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6.2: Create steps directory**

```bash
mkdir -p /Users/malharujawane/conductor/workspaces/Operator/sacramento/src/components/sidebar/steps
```

- [ ] **Step 6.3: Verify TypeScript compiles (will fail on missing step files — expected)**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1 | grep -v "Cannot find module" | head -20
```

Expected: only "Cannot find module" errors for the 3 step files (not yet created). No other errors.

- [ ] **Step 6.4: Commit**

```bash
git add src/components/sidebar/NewWorkspaceModal.tsx
git commit -m "feat: add NewWorkspaceModal shell with 3-card source picker"
```

---

### Task 7: Create `LocalFolderStep.tsx`

**Files:**
- Create: `src/components/sidebar/steps/LocalFolderStep.tsx`

- [ ] **Step 7.1: Write the step**

Create `src/components/sidebar/steps/LocalFolderStep.tsx`:

```tsx
import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Repo } from "@/types/workspace";

interface LocalFolderStepProps {
  onSuccess: (workspaceId: string) => void;
  onBack: () => void;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LocalFolderStep({ onSuccess, onBack }: LocalFolderStepProps) {
  const addRepo = useWorkspaceStore((s) => s.addRepo);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const selectedPath = await open({ directory: true, multiple: false });
      if (!selectedPath || typeof selectedPath !== "string") {
        onBack();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const name = selectedPath.split("/").pop() ?? "workspace";
        const cityName = `${name}-ws`;
        const branchName = slugify(cityName);

        // Check if already registered
        const existing = await invoke<{ id: string; local_path: string } | null>(
          "find_repository_by_path",
          { path: selectedPath }
        );

        let repoId: string;
        if (existing) {
          repoId = existing.id;
        } else {
          const repo = await invoke<{ id: string; name: string; local_path: string }>(
            "add_repository",
            {
              input: {
                name,
                full_name: name,
                remote_url: "",
                local_path: selectedPath,
                platform: "local",
                default_branch: "main",
              },
            }
          );
          repoId = repo.id;

          // Add to UI store
          const newRepo: Repo = {
            id: repo.id,
            name: repo.name,
            avatarLetter: repo.name.charAt(0).toUpperCase(),
            workspaces: [],
            isExpanded: true,
          };
          addRepo(newRepo);
        }

        const ws = await invoke<{ id: string; city_name: string; branch_name: string }>(
          "create_workspace",
          {
            repositoryId: repoId,
            repoPath: selectedPath,
            cityName,
            branchName,
            baseBranch: "main",
            agentBackend: null,
            model: null,
          }
        );

        onSuccess(ws.id);
      } catch (err) {
        setError(String(err));
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2"
        style={{ color: "var(--vscode-foreground)" }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Setting up workspace…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px]" style={{ color: "#f48771" }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsLoading(false);
            // Re-trigger picker by going back and forward
            onBack();
          }}
          className="text-[12px] underline text-left"
          style={{ color: "var(--vscode-foreground)", opacity: 0.7 }}
        >
          Try again
        </button>
      </div>
    );
  }

  return null; // picker is open — nothing to render
}
```

- [ ] **Step 7.2: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1 | head -30
```

Expected: only "Cannot find module" errors for the 2 remaining step files. No other errors.

- [ ] **Step 7.3: Commit**

```bash
git add src/components/sidebar/steps/LocalFolderStep.tsx
git commit -m "feat: add LocalFolderStep with native picker and repo registration"
```

---

### Task 8: Create `CloneUrlStep.tsx`

**Files:**
- Create: `src/components/sidebar/steps/CloneUrlStep.tsx`

- [ ] **Step 8.1: Write the step**

Create `src/components/sidebar/steps/CloneUrlStep.tsx`:

```tsx
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Folder, Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Repo } from "@/types/workspace";

interface CloneUrlStepProps {
  onSuccess: (workspaceId: string) => void;
  onBack: () => void;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function deriveNameFromUrl(url: string): string {
  try {
    const last = url.split("/").pop()?.replace(/\.git$/, "") ?? "";
    return last || "workspace";
  } catch {
    return "workspace";
  }
}

export function CloneUrlStep({ onSuccess, onBack: _onBack }: CloneUrlStepProps) {
  const addRepo = useWorkspaceStore((s) => s.addRepo);
  const [url, setUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleUrlChange(value: string) {
    setUrl(value);
    if (!workspaceName || workspaceName === deriveNameFromUrl(url)) {
      setWorkspaceName(deriveNameFromUrl(value));
    }
  }

  async function handleBrowse() {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") setDestination(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !destination.trim() || !workspaceName.trim()) return;

    setIsLoading(true);
    setError(null);

    const destinationPath = `${destination}/${workspaceName}`;

    try {
      await invoke("clone_repository", { url: url.trim(), destinationPath });

      const repo = await invoke<{ id: string; name: string; local_path: string }>(
        "add_repository",
        {
          input: {
            name: workspaceName,
            full_name: workspaceName,
            remote_url: url.trim(),
            local_path: destinationPath,
            platform: "github",
            default_branch: "main",
          },
        }
      );

      const newRepo: Repo = {
        id: repo.id,
        name: repo.name,
        avatarLetter: repo.name.charAt(0).toUpperCase(),
        workspaces: [],
        isExpanded: true,
      };
      addRepo(newRepo);

      const ws = await invoke<{ id: string }>("create_workspace", {
        repositoryId: repo.id,
        repoPath: destinationPath,
        cityName: workspaceName,
        branchName: slugify(workspaceName),
        baseBranch: "main",
        agentBackend: null,
        model: null,
      });

      onSuccess(ws.id);
    } catch (err) {
      setError(String(err));
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Repo URL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}>
          Repository URL
        </label>
        <input
          type="url"
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="h-8 rounded px-3 text-[13px] outline-none"
          style={{
            background: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border)",
            color: "var(--vscode-input-foreground)",
          }}
          required
          disabled={isLoading}
        />
        {error && (
          <p className="text-[11px]" style={{ color: "#f48771" }}>
            Clone failed: {error}
          </p>
        )}
      </div>

      {/* Workspace name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}>
          Workspace Name
        </label>
        <input
          type="text"
          placeholder="my-project"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="h-8 rounded px-3 text-[13px] outline-none"
          style={{
            background: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border)",
            color: "var(--vscode-input-foreground)",
          }}
          required
          disabled={isLoading}
        />
      </div>

      {/* Clone destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}>
          Clone Into
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="/Users/you/projects"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="h-8 flex-1 rounded px-3 text-[13px] outline-none"
            style={{
              background: "var(--vscode-input-background)",
              border: "1px solid var(--vscode-input-border)",
              color: "var(--vscode-input-foreground)",
            }}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleBrowse}
            disabled={isLoading}
            className="flex h-8 items-center gap-1.5 rounded px-3 text-[12px] transition-opacity hover:opacity-80"
            style={{
              background: "var(--vscode-input-background)",
              border: "1px solid var(--vscode-input-border)",
              color: "var(--vscode-foreground)",
            }}
          >
            <Folder className="h-3.5 w-3.5" />
            Browse
          </button>
        </div>
        {destination && workspaceName && (
          <p className="text-[11px] opacity-50" style={{ color: "var(--vscode-foreground)" }}>
            Will clone into: {destination}/{workspaceName}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !url || !destination || !workspaceName}
        className="mt-1 flex h-8 items-center justify-center gap-2 rounded text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{
          background: "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
        }}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isLoading ? "Cloning…" : "Clone & Open"}
      </button>
    </form>
  );
}
```

- [ ] **Step 8.2: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1 | head -30
```

Expected: only "Cannot find module" for `TemplateStep`. No other errors.

- [ ] **Step 8.3: Commit**

```bash
git add src/components/sidebar/steps/CloneUrlStep.tsx
git commit -m "feat: add CloneUrlStep with URL input, destination picker, and clone invocation"
```

---

### Task 9: Create `TemplateStep.tsx`

**Files:**
- Create: `src/components/sidebar/steps/TemplateStep.tsx`

- [ ] **Step 9.1: Write the step**

Create `src/components/sidebar/steps/TemplateStep.tsx`:

```tsx
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Folder, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSettingsStore, type CustomTemplate } from "@/store/settingsStore";
import { HARDCODED_TEMPLATES, type HardcodedTemplate } from "@/data/templates";
import type { Repo } from "@/types/workspace";

interface TemplateStepProps {
  onSuccess: (workspaceId: string) => void;
  onBack: () => void;
}

type SelectedTemplate =
  | { kind: "hardcoded"; template: HardcodedTemplate }
  | { kind: "custom"; template: CustomTemplate };

type InnerView = "grid" | "add-name" | "use-form";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function TemplateStep({ onSuccess, onBack: _onBack }: TemplateStepProps) {
  const addRepo = useWorkspaceStore((s) => s.addRepo);
  const { customTemplates, isLoaded, addCustomTemplate } = useSettingsStore();

  const [view, setView] = useState<InnerView>("grid");
  const [selected, setSelected] = useState<SelectedTemplate | null>(null);
  const [pendingCustomPath, setPendingCustomPath] = useState<string>("");
  const [customName, setCustomName] = useState("");

  // use-form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddCustom() {
    const path = await open({ directory: true, multiple: false });
    if (!path || typeof path !== "string") return;
    setPendingCustomPath(path);
    setCustomName(path.split("/").pop() ?? "");
    setView("add-name");
  }

  async function handleSaveCustom() {
    if (!customName.trim() || !pendingCustomPath) return;
    const t: CustomTemplate = {
      id: crypto.randomUUID(),
      name: customName.trim(),
      sourcePath: pendingCustomPath,
    };
    await addCustomTemplate(t);
    setPendingCustomPath("");
    setCustomName("");
    setView("grid");
  }

  function handleSelectTemplate(sel: SelectedTemplate) {
    setSelected(sel);
    setWorkspaceName(
      sel.kind === "hardcoded" ? sel.template.name.toLowerCase() : sel.template.name.toLowerCase()
    );
    setView("use-form");
  }

  async function handleBrowseDestination() {
    const path = await open({ directory: true, multiple: false });
    if (path && typeof path === "string") setDestination(path);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !workspaceName.trim() || !destination.trim()) return;

    setIsLoading(true);
    setError(null);

    const destinationPath = `${destination}/${workspaceName}`;

    try {
      // For hardcoded templates (no source path), just init an empty dir
      if (selected.kind === "hardcoded" && selected.template.id !== "blank") {
        // Hardcoded templates: create empty dir + git init (user populates via CLI/agent)
        await invoke("init_git_repo", { path: destinationPath });
      } else if (selected.kind === "custom") {
        await invoke("copy_template", {
          sourcePath: selected.template.sourcePath,
          destinationPath,
        });
        await invoke("init_git_repo", { path: destinationPath });
      } else {
        // "blank" or any hardcoded
        await invoke("init_git_repo", { path: destinationPath });
      }

      const repo = await invoke<{ id: string; name: string }>("add_repository", {
        input: {
          name: workspaceName,
          full_name: workspaceName,
          remote_url: "",
          local_path: destinationPath,
          platform: "local",
          default_branch: "main",
        },
      });

      const newRepo: Repo = {
        id: repo.id,
        name: repo.name,
        avatarLetter: repo.name.charAt(0).toUpperCase(),
        workspaces: [],
        isExpanded: true,
      };
      addRepo(newRepo);

      const ws = await invoke<{ id: string }>("create_workspace", {
        repositoryId: repo.id,
        repoPath: destinationPath,
        cityName: workspaceName,
        branchName: slugify(workspaceName),
        baseBranch: "main",
        agentBackend: null,
        model: null,
      });

      onSuccess(ws.id);
    } catch (err) {
      setError(String(err));
      setIsLoading(false);
    }
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "add-name") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[12px] opacity-60" style={{ color: "var(--vscode-foreground)" }}>
          Name your custom template:
        </p>
        <input
          autoFocus
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="My Template"
          className="h-8 rounded px-3 text-[13px] outline-none"
          style={{
            background: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border)",
            color: "var(--vscode-input-foreground)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSaveCustom();
            if (e.key === "Escape") setView("grid");
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSaveCustom()}
            className="flex-1 h-8 rounded text-[13px] font-medium"
            style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
          >
            Save Template
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className="h-8 w-8 flex items-center justify-center rounded"
            style={{ background: "var(--vscode-input-background)", color: "var(--vscode-foreground)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (view === "use-form") {
    const templateName =
      selected?.kind === "hardcoded"
        ? selected.template.name
        : selected?.template.name ?? "";

    return (
      <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-4">
        <p className="text-[12px] opacity-60" style={{ color: "var(--vscode-foreground)" }}>
          Creating from <span className="font-medium opacity-100">{templateName}</span>
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider opacity-60"
            style={{ color: "var(--vscode-foreground)" }}>
            Workspace Name
          </label>
          <input
            autoFocus
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="h-8 rounded px-3 text-[13px] outline-none"
            style={{
              background: "var(--vscode-input-background)",
              border: "1px solid var(--vscode-input-border)",
              color: "var(--vscode-input-foreground)",
            }}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider opacity-60"
            style={{ color: "var(--vscode-foreground)" }}>
            Destination Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="/Users/you/projects"
              className="h-8 flex-1 rounded px-3 text-[13px] outline-none"
              style={{
                background: "var(--vscode-input-background)",
                border: "1px solid var(--vscode-input-border)",
                color: "var(--vscode-input-foreground)",
              }}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => void handleBrowseDestination()}
              disabled={isLoading}
              className="flex h-8 items-center gap-1.5 rounded px-3 text-[12px] transition-opacity hover:opacity-80"
              style={{
                background: "var(--vscode-input-background)",
                border: "1px solid var(--vscode-input-border)",
                color: "var(--vscode-foreground)",
              }}
            >
              <Folder className="h-3.5 w-3.5" />
              Browse
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[11px]" style={{ color: "#f48771" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !workspaceName || !destination}
          className="mt-1 flex h-8 items-center justify-center gap-2 rounded text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
          }}
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isLoading ? "Creating…" : "Create Workspace"}
        </button>
      </form>
    );
  }

  // ── Template grid ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {!isLoaded && (
        <p className="text-[12px] opacity-50" style={{ color: "var(--vscode-foreground)" }}>
          Loading…
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {HARDCODED_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTemplate({ kind: "hardcoded", template: t })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all hover:opacity-80",
              )}
              style={{
                background: "var(--vscode-input-background)",
                borderColor: "var(--vscode-panel-border)",
                color: "var(--vscode-foreground)",
              }}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-medium">{t.name}</span>
            </button>
          );
        })}

        {customTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelectTemplate({ kind: "custom", template: t })}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all hover:opacity-80",
            )}
            style={{
              background: "var(--vscode-input-background)",
              borderColor: "var(--vscode-panel-border)",
              color: "var(--vscode-foreground)",
            }}
          >
            <Folder className="h-6 w-6" />
            <span className="text-[11px] font-medium truncate w-full">{t.name}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => void handleAddCustom()}
          className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-3 text-center transition-all hover:opacity-80"
          style={{
            borderColor: "var(--vscode-panel-border)",
            color: "var(--vscode-foreground)",
          }}
        >
          <Plus className="h-6 w-6" />
          <span className="text-[11px]">Add Custom</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Verify TypeScript compiles cleanly**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add src/components/sidebar/steps/TemplateStep.tsx
git commit -m "feat: add TemplateStep with hardcoded/custom template grid, add-custom flow, and workspace creation"
```

---

## Chunk 4: Wire Everything Together

### Task 10: Update `WorkspaceList.tsx` to use store and open modal

**Files:**
- Modify: `src/components/sidebar/WorkspaceList.tsx`

- [ ] **Step 10.1: Rewrite `WorkspaceList.tsx`**

Replace the entire contents of `src/components/sidebar/WorkspaceList.tsx` with:

```tsx
import { useState } from "react";
import { ChevronRight, ListFilter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { WorkspaceItem } from "./WorkspaceItem";
import { NewWorkspaceModal } from "./NewWorkspaceModal";
import type { Repo } from "@/types/workspace";

interface WorkspaceListProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

function RepoGroup({
  repo,
  activeWorkspaceId,
  onWorkspaceSelect,
}: {
  repo: Repo;
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(repo.isExpanded ?? true);
  const hasWorkspaces = repo.workspaces.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasWorkspaces && setIsExpanded((e) => !e)}
        className={cn(
          "vscode-list-item flex h-[22px] w-full items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors duration-75",
          !hasWorkspaces && "cursor-default",
        )}
        style={{ paddingLeft: 12, color: "var(--vscode-sidebar-section-header-foreground)" }}
      >
        {hasWorkspaces && (
          <ChevronRight
            className={cn("h-3 w-3 shrink-0 transition-transform duration-150", isExpanded && "rotate-90")}
            style={{ opacity: 0.7 }}
          />
        )}
        {!hasWorkspaces && <div className="w-3 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{repo.name}</span>
        {hasWorkspaces && (
          <span className="mr-2 text-[10px] font-normal opacity-50">
            {repo.workspaces.length}
          </span>
        )}
      </button>

      {isExpanded && hasWorkspaces && (
        <div className="mt-px">
          {repo.workspaces.map((ws) => (
            <WorkspaceItem
              key={ws.id}
              workspace={ws}
              isActive={ws.id === activeWorkspaceId}
              onClick={() => onWorkspaceSelect(ws.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceList({ activeWorkspaceId, onWorkspaceSelect }: WorkspaceListProps) {
  const repos = useWorkspaceStore((s) => s.repos);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className="flex h-[28px] items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border, transparent)" }}
      >
        <span className="vscode-sidebar-title">Workspaces</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="Filter workspaces"
          >
            <ListFilter className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="New workspace"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-1 space-y-2">
        {repos.map((repo) => (
          <RepoGroup
            key={repo.id}
            repo={repo}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        ))}
      </div>

      <NewWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onWorkspaceSelect={onWorkspaceSelect}
      />
    </div>
  );
}
```

- [ ] **Step 10.2: Verify TypeScript compiles**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 10.3: Commit**

```bash
git add src/components/sidebar/WorkspaceList.tsx
git commit -m "feat: wire WorkspaceList to workspaceStore and NewWorkspaceModal"
```

---

### Task 11: Boot stores from `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 11.1: Add store hydration to App.tsx**

Open `src/App.tsx`. Add imports at the top (after existing imports):

```ts
import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSettingsStore } from "@/store/settingsStore";
```

Note: `useRef` and `useState` are already imported — do not duplicate.

Inside the `App` function body, before the `return` statement, add:

```ts
  // Hydrate stores on mount
  useEffect(() => {
    void useWorkspaceStore.getState().loadRepos();
    void useSettingsStore.getState().loadSettings();
  }, []);
```

- [ ] **Step 11.2: Remove `useRef` if already imported, ensure no duplicate imports**

Run:

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bunx tsc --noEmit 2>&1
```

Fix any duplicate import errors. The existing `import { useRef, useState } from "react"` should become `import { useEffect, useRef, useState } from "react"`.

- [ ] **Step 11.3: Full TypeScript check**

```bash
bunx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 11.4: Full Rust check**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento/src-tauri
cargo check 2>&1 | tail -5
```

Expected: `Finished` with no errors.

- [ ] **Step 11.5: Commit**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
git add src/App.tsx
git commit -m "feat: hydrate workspaceStore and settingsStore on app mount"
```

---

### Task 12: Final build verification

- [ ] **Step 12.1: Run frontend build**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
bun run build 2>&1 | tail -20
```

Expected: `✓ built in` with no errors.

- [ ] **Step 12.2: Run Rust release check**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento/src-tauri
cargo check --release 2>&1 | tail -10
```

Expected: `Finished` with no errors or warnings blocking compilation.

- [ ] **Step 12.3: Final commit**

```bash
cd /Users/malharujawane/conductor/workspaces/Operator/sacramento
git add -A
git commit -m "feat: new workspace modal — complete implementation" --allow-empty
```

---

## Summary of All Files Changed

| File | Action |
|------|--------|
| `src/types/workspace.ts` | Add `localPath?: string` |
| `src/data/templates.ts` | Create — hardcoded template list |
| `src/store/workspaceStore.ts` | Create — Zustand store, loads repos from Tauri |
| `src/store/settingsStore.ts` | Create — Zustand store, persists custom templates |
| `src/components/sidebar/NewWorkspaceModal.tsx` | Create — dialog shell + step router |
| `src/components/sidebar/steps/LocalFolderStep.tsx` | Create — native picker + repo registration |
| `src/components/sidebar/steps/CloneUrlStep.tsx` | Create — clone form |
| `src/components/sidebar/steps/TemplateStep.tsx` | Create — template grid + add-custom + use-form |
| `src/components/sidebar/WorkspaceList.tsx` | Modify — use store, wire `+` button |
| `src/App.tsx` | Modify — add store hydration |
| `src-tauri/src/commands/workspace.rs` | Add 4 new commands |
| `src-tauri/src/lib.rs` | Register new commands |
| `src-tauri/capabilities/default.json` | Add `dialog:default`, `store:default` |
