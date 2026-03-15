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
  id: Exclude<Step, "pick">;
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
  /** Called with the newly-registered repo ID (no worktree created yet). */
  onRepoRegistered: (repoId: string) => void;
}

export function NewWorkspaceModal({
  open,
  onClose,
  onRepoRegistered,
}: NewWorkspaceModalProps) {
  const [step, setStep] = useState<Step>("pick");

  function handleClose() {
    setStep("pick");
    onClose();
  }

  function handleSuccess(repoId: string) {
    handleClose();
    onRepoRegistered(repoId);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="w-[520px] max-w-[95vw] overflow-hidden p-0"
        style={{
          background: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
        }}
      >
        <DialogHeader className="px-6 pb-0 pt-5">
          <div className="flex items-center gap-2">
            {step !== "pick" && (
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="flex h-6 w-6 items-center justify-center rounded transition-opacity hover:opacity-80"
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
                      <Icon
                        className="h-5 w-5"
                        style={{ color: "var(--vscode-button-foreground)" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{card.title}</div>
                      <div className="mt-0.5 text-[11px] opacity-60">{card.subtitle}</div>
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
