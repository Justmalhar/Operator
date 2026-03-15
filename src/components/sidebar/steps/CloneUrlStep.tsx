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

export function CloneUrlStep({ onSuccess }: CloneUrlStepProps) {
  const addRepo = useWorkspaceStore((s) => s.addRepo);
  const [url, setUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleUrlChange(value: string) {
    setUrl(value);
    // Auto-fill name only if user hasn't manually edited it
    const derived = deriveNameFromUrl(url);
    if (!workspaceName || workspaceName === derived) {
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
        },
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
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {/* Repo URL */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}
        >
          Repository URL
        </label>
        <input
          type="text"
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
        <label
          className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}
        >
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
        <label
          className="text-[11px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: "var(--vscode-foreground)" }}
        >
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
            onClick={() => void handleBrowse()}
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
