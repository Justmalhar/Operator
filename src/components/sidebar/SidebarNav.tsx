import { useState, useEffect } from "react";
import {
  Cable,
  HelpCircle,
  Lightbulb,
  MessageSquarePlus,
  Settings,
  SlidersHorizontal,
  Puzzle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs, tooltipVariants } from "@/lib/animations";
import {
  applyTheme,
  getCurrentTheme,
  getTheme,
} from "@/styles/themes/themes";

const primaryItems = [
  { id: "new-chat", label: "New Chat", icon: MessageSquarePlus },
  { id: "automations", label: "Automations", icon: Zap },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "mcp", label: "MCP", icon: Cable },
] as const;

const footerItems = [
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help", icon: HelpCircle },
] as const;

export type SidebarNavItemId =
  | (typeof primaryItems)[number]["id"]
  | (typeof footerItems)[number]["id"];

function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(() => {
    const theme = getTheme(getCurrentTheme());
    return theme?.variant !== "light";
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = getTheme(getCurrentTheme());
      setIsDark(theme?.variant !== "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-vscode-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    applyTheme(isDark ? "light-default" : "dark-default");
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={springs.snappy}
        className="relative flex h-[40px] w-[40px] items-center justify-center rounded-lg text-[var(--vscode-activity-bar-inactive,var(--vscode-activity-bar-foreground))] opacity-50 hover:opacity-80"
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <Lightbulb className="relative z-10 h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-[52px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium shadow-lg"
            style={{
              backgroundColor: "var(--vscode-dropdown-background)",
              color: "var(--vscode-dropdown-foreground)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.1))",
            }}
          >
            {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            <span
              className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45"
              style={{ backgroundColor: "var(--vscode-dropdown-background)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SidebarNavProps {
  activeItem: SidebarNavItemId;
  onItemChange: (item: SidebarNavItemId) => void;
}

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> };
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <div className="relative flex w-[48px] items-center justify-center">
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className="activity-indicator"
          transition={springs.snappy}
        />
      )}
      <motion.button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={springs.snappy}
        className={cn(
          "relative flex h-[40px] w-[40px] items-center justify-center rounded-lg",
          isActive
            ? "text-[var(--vscode-activity-bar-foreground)]"
            : "text-[var(--vscode-activity-bar-inactive,var(--vscode-activity-bar-foreground))] opacity-50 hover:opacity-80",
        )}
        aria-label={item.label}
      >
        {isActive && (
          <motion.span
            layoutId="nav-glow"
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
            transition={springs.smooth}
          />
        )}
        <Icon className="relative z-10 h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-[52px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium shadow-lg"
            style={{
              backgroundColor: "var(--vscode-dropdown-background)",
              color: "var(--vscode-dropdown-foreground)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.1))",
            }}
          >
            {item.label}
            {/* Arrow */}
            <span
              className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45"
              style={{ backgroundColor: "var(--vscode-dropdown-background)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNav({ activeItem, onItemChange }: SidebarNavProps) {
  return (
    <nav className="vscode-activity-bar flex h-full w-[48px] shrink-0 flex-col items-center py-2">
      <motion.div
        className="flex flex-col items-center gap-0.5"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.smooth, delay: 0.05 }}
      >
        {primaryItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={() => onItemChange(item.id)}
          />
        ))}
      </motion.div>

      <motion.div
        className="mt-auto flex flex-col items-center gap-0.5"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.smooth, delay: 0.15 }}
      >
        <ThemeToggleButton />
        {footerItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={() => onItemChange(item.id)}
          />
        ))}
      </motion.div>
    </nav>
  );
}
