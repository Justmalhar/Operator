import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface LocalFolderStepProps {
  onSuccess: (workspaceId: string) => void;
  onBack: () => void;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LocalFolderStep({ onSuccess, onBack }: LocalFolderStepProps) {
  const { addRepo, createWorkspace } = useWorkspaceStore();
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
        const existing = await invoke<{ id: string } | null>(
          "find_repository_by_path",
          { path: selectedPath },
        );

        let repoId: string;
        if (existing) {
          repoId = existing.id;
        } else {
          const repo = await addRepo({
            name,
            full_name: name,
            remote_url: "",
            local_path: selectedPath,
            platform: "github",
            default_branch: "main",
          });
          repoId = repo.id;
        }

        const ws = await createWorkspace({
          repositoryId: repoId,
          repoPath: selectedPath,
          cityName,
          branchName,
          baseBranch: "main",
        });

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
      <div
        className="flex items-center justify-center gap-2 py-8"
        style={{ color: "var(--vscode-foreground)" }}
      >
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
          onClick={onBack}
          className="text-left text-[12px] underline"
          style={{ color: "var(--vscode-foreground)", opacity: 0.7 }}
        >
          Try again
        </button>
      </div>
    );
  }

  return null; // native picker is open — nothing to render behind it
}
