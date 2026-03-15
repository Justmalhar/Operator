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

export function TemplateStep({ onSuccess }: TemplateStepProps) {
  const addRepo = useWorkspaceStore((s) => s.addRepo);
  const { customTemplates, isLoaded, addCustomTemplate } = useSettingsStore();

  const [view, setView] = useState<InnerView>("grid");
  const [selected, setSelected] = useState<SelectedTemplate | null>(null);
  const [pendingCustomPath, setPendingCustomPath] = useState("");
  const [customName, setCustomName] = useState("");

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
    setWorkspaceName(sel.template.name.toLowerCase().replace(/\s+/g, "-"));
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
      if (selected.kind === "custom") {
        await invoke("copy_template", {
          sourcePath: selected.template.sourcePath,
          destinationPath,
        });
      }
      // For all templates (hardcoded or custom), ensure git is initialized
      await invoke("init_git_repo", { path: destinationPath });

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

  // ── Add-name view ─────────────────────────────────────────────────────────

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
            className="h-8 flex-1 rounded text-[13px] font-medium"
            style={{
              background: "var(--vscode-button-background)",
              color: "var(--vscode-button-foreground)",
            }}
          >
            Save Template
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ background: "var(--vscode-input-background)", color: "var(--vscode-foreground)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Use-form view ─────────────────────────────────────────────────────────

  if (view === "use-form") {
    const templateName =
      selected?.kind === "hardcoded"
        ? selected.template.name
        : (selected?.template.name ?? "");

    return (
      <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-4">
        <p className="text-[12px] opacity-60" style={{ color: "var(--vscode-foreground)" }}>
          Creating from{" "}
          <span className="font-medium opacity-100">{templateName}</span>
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-medium uppercase tracking-wider opacity-60"
            style={{ color: "var(--vscode-foreground)" }}
          >
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
          <label
            className="text-[11px] font-medium uppercase tracking-wider opacity-60"
            style={{ color: "var(--vscode-foreground)" }}
          >
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
            <span className="w-full truncate text-[11px] font-medium">{t.name}</span>
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
