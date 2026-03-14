import { History, MessageSquarePlus, Zap, Puzzle, Cable } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  activeSection: "activity" | "workspaces";
  onSectionChange: (section: "activity" | "workspaces") => void;
}

const navItems = [
  { id: "activity", label: "Activity", icon: History },
  { id: "new-chat", label: "New Chat", icon: MessageSquarePlus },
  { id: "automations", label: "Automations", icon: Zap },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "mcp", label: "MCP", icon: Cable },
] as const;

export function SidebarNav({ activeSection, onSectionChange }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id as "activity" | "workspaces")}
            className={cn(
              "vscode-list-item flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] transition-colors duration-75",
              isActive && "selected",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
            <span className={cn("font-medium", !isActive && "opacity-80")}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
