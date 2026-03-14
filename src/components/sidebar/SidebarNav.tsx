import {
  Cable,
  HelpCircle,
  Inbox,
  MessageSquarePlus,
  Settings,
  SlidersHorizontal,
  Puzzle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryItems = [
  { id: "activity", label: "Inbox", icon: Inbox },
  { id: "new-chat", label: "New Chat", icon: MessageSquarePlus },
  { id: "automations", label: "Automations", icon: Zap },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "mcp", label: "MCP", icon: Cable },
] as const;

const footerItems = [
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "help", label: "Help", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type SidebarNavItemId =
  | (typeof primaryItems)[number]["id"]
  | (typeof footerItems)[number]["id"];

interface SidebarNavProps {
  activeItem: SidebarNavItemId;
  onItemChange: (item: SidebarNavItemId) => void;
}

export function SidebarNav({ activeItem, onItemChange }: SidebarNavProps) {
  return (
    <nav className="vscode-activity-bar flex h-full w-[48px] shrink-0 flex-col items-center py-2">
      <div className="flex flex-col items-center gap-0.5">
        {primaryItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemChange(item.id)}
              className={cn(
                "relative flex h-[40px] w-[40px] items-center justify-center rounded-lg transition-all duration-100",
                isActive
                  ? "text-[var(--vscode-activity-bar-foreground)]"
                  : "text-[var(--vscode-activity-bar-inactive,var(--vscode-activity-bar-foreground))] opacity-50 hover:opacity-80",
              )}
              aria-label={item.label}
              title={item.label}
            >
              {isActive && <span className="activity-indicator" />}
              <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-0.5">
        {footerItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemChange(item.id)}
              className={cn(
                "relative flex h-[40px] w-[40px] items-center justify-center rounded-lg transition-all duration-100",
                isActive
                  ? "text-[var(--vscode-activity-bar-foreground)]"
                  : "text-[var(--vscode-activity-bar-inactive,var(--vscode-activity-bar-foreground))] opacity-50 hover:opacity-80",
              )}
              aria-label={item.label}
              title={item.label}
            >
              {isActive && <span className="activity-indicator" />}
              <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
