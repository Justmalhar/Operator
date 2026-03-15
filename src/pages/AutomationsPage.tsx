import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  GitMerge,
  Package,
  Play,
  Plus,
  Tag,
  TestTube2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { NewAutomationModal } from "@/components/automations/NewAutomationModal";

// ── Types ───────────────────────────────────────────────────────────────────

interface UserAutomation {
  id: string;
  title: string;
  schedule: string;
  project: string | null;
  enabled: boolean;
  lastRun: string | null;
}

interface AutomationExample {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  prompt: string;
}

interface AutomationCategory {
  id: string;
  title: string;
  accentColor: string;
  items: AutomationExample[];
}

// ── Mock user automations ───────────────────────────────────────────────────

const INITIAL_USER_AUTOMATIONS: UserAutomation[] = [
  {
    id: "ua-1",
    title: "Daily standup summary",
    schedule: "Daily at 9:00 AM",
    project: "my-app",
    enabled: true,
    lastRun: "2h ago",
  },
  {
    id: "ua-2",
    title: "Weekly PR digest",
    schedule: "Every Monday",
    project: "backend-api",
    enabled: true,
    lastRun: "3d ago",
  },
  {
    id: "ua-3",
    title: "CI failure triage",
    schedule: "Every hour",
    project: "data-pipeline",
    enabled: false,
    lastRun: "1w ago",
  },
];

// ── Automation example data ─────────────────────────────────────────────────

const AUTOMATION_CATEGORIES: AutomationCategory[] = [
  {
    id: "status-reports",
    title: "Status Reports",
    accentColor: "#3794ff",
    items: [
      {
        id: "git-standup",
        icon: GitBranch,
        iconColor: "#3794ff",
        iconBg: "rgba(55,148,255,0.12)",
        title: "Summarize yesterday's git activity for standup",
        description: "Pull recent commits, PRs, and reviews then draft a concise standup update.",
        prompt: "Summarize all git activity from the last 24 hours across my repositories. Include commits, merged PRs, and open PR reviews. Format it as a brief standup update.",
      },
      {
        id: "weekly-update",
        icon: BarChart3,
        iconColor: "#b267e6",
        iconBg: "rgba(178,103,230,0.12)",
        title: "Synthesize this week's PRs, rollouts, incidents, and reviews into a weekly update",
        description: "Generate a weekly digest covering code shipped, incidents resolved, and ongoing reviews.",
        prompt: "Generate a weekly status report covering: merged PRs, production rollouts, any incidents or outages, and pending code reviews. Highlight blockers and key wins.",
      },
      {
        id: "pr-summary",
        icon: GitMerge,
        iconColor: "#4ec994",
        iconBg: "rgba(78,201,148,0.12)",
        title: "Summarize last week's PRs by teammate and theme; highlight risks",
        description: "Analyze merged PRs grouped by author and topic, flagging high-risk changes.",
        prompt: "Analyze all PRs merged in the last 7 days. Group by author and theme (e.g. infra, auth, UI). Flag any large diffs, missing tests, or changes to critical paths.",
      },
    ],
  },
  {
    id: "release-prep",
    title: "Release Prep",
    accentColor: "#cca700",
    items: [
      {
        id: "release-notes",
        icon: FileText,
        iconColor: "#cca700",
        iconBg: "rgba(204,167,0,0.12)",
        title: "Draft weekly release notes from merged PRs (include links when available)",
        description: "Compile user-facing release notes from PR titles and descriptions.",
        prompt: "Create release notes for this week's release. Pull from merged PR titles and descriptions. Format with sections: Features, Bug Fixes, Performance, and Breaking Changes. Include PR links.",
      },
      {
        id: "release-checklist",
        icon: CheckCircle2,
        iconColor: "#4ec994",
        iconBg: "rgba(78,201,148,0.12)",
        title: "Before logging, verify changelog, migrations, feature flags, and tests",
        description: "Run a pre-release checklist verifying all deployment gates are cleared.",
        prompt: "Run a pre-release verification: check that CHANGELOG is updated, database migrations are present and reviewed, feature flags are configured for gradual rollout, and all CI tests are passing.",
      },
      {
        id: "changelog",
        icon: Tag,
        iconColor: "#3794ff",
        iconBg: "rgba(55,148,255,0.12)",
        title: "Update the changelog with this week's highlights and key PR links",
        description: "Append a new section to CHANGELOG.md with this week's notable changes.",
        prompt: "Update CHANGELOG.md with a new section for this week. Include the top highlights from merged PRs, formatted as bullet points with PR numbers linked. Follow the existing changelog format.",
      },
    ],
  },
  {
    id: "incidents-triage",
    title: "Incidents & Triage",
    accentColor: "#f48771",
    items: [
      {
        id: "ci-failures",
        icon: TestTube2,
        iconColor: "#f48771",
        iconBg: "rgba(244,135,113,0.12)",
        title: "Summarize CI failures and flaky tests from the last CI window; suggest top fixes",
        description: "Identify recurring test failures and flaky tests, ranked by impact.",
        prompt: "Analyze CI run results from the last 24 hours. Identify failing tests, flaky tests (>2 failures), and broken builds. Group by root cause and suggest the top 3 fixes to prioritize.",
      },
      {
        id: "error-grouping",
        icon: Package,
        iconColor: "#d18616",
        iconBg: "rgba(209,134,22,0.12)",
        title: "Check CI failures; group by likely root cause and suggest minimal fixes",
        description: "Cluster CI errors by shared root causes and propose targeted remediation steps.",
        prompt: "Review all CI failures in the current branch. Cluster errors by likely root cause (e.g. env config, import errors, race conditions). For each cluster suggest the minimal code change to fix it.",
      },
    ],
  },
  {
    id: "code-quality",
    title: "Code Quality",
    accentColor: "#4ec994",
    items: [
      {
        id: "dep-audit",
        icon: GitBranch,
        iconColor: "#3794ff",
        iconBg: "rgba(55,148,255,0.12)",
        title: "Audit outdated dependencies and open a PR with safe upgrades",
        description: "Scan package.json / pyproject.toml for stale deps and batch patch-level upgrades.",
        prompt: "Check all dependencies for available updates. Identify packages more than one major version behind. Create a PR that applies safe patch and minor upgrades, and lists breaking major upgrades for manual review.",
      },
      {
        id: "dead-code",
        icon: Zap,
        iconColor: "#cca700",
        iconBg: "rgba(204,167,0,0.12)",
        title: "Find and remove dead code, then open a cleanup PR",
        description: "Identify unused exports, unreachable code, and commented-out blocks.",
        prompt: "Scan the codebase for dead code: unused exports, unreferenced variables, unreachable branches, and large commented-out blocks. Remove them, run tests to confirm nothing breaks, then open a cleanup PR.",
      },
    ],
  },
];

// ── UserAutomationItem ──────────────────────────────────────────────────────

function UserAutomationItem({
  automation,
  isActive,
  onSelect,
  onToggle,
  onDelete,
}: {
  automation: UserAutomation;
  isActive: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "vscode-list-item group relative flex w-full cursor-pointer flex-col gap-[3px] px-3 py-[7px] text-left",
        isActive
          ? "bg-[var(--vscode-list-active-selection-background)]"
          : hovered && "bg-[var(--vscode-list-hover-background)]",
      )}
      style={{
        color: isActive
          ? "var(--vscode-list-active-selection-foreground)"
          : "var(--vscode-sideBar-foreground)",
      }}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status bar — left edge */}
      <span
        className="absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-r-sm transition-all duration-150"
        style={{
          height: automation.enabled ? "60%" : "0%",
          background: automation.enabled ? "#4ec994" : "transparent",
          opacity: isActive ? 1 : 0.7,
        }}
      />

      <div className="flex min-w-0 items-center justify-between gap-1">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[12px] font-medium",
            !automation.enabled && "opacity-45",
          )}
        >
          {automation.title}
        </span>

        {/* Hover actions */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.1 }}
              className="flex shrink-0 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onToggle}
                title={automation.enabled ? "Disable" : "Enable"}
                className="flex h-[18px] w-[18px] items-center justify-center rounded theme-hover-bg"
              >
                {automation.enabled
                  ? <ToggleRight className="h-3 w-3" style={{ color: "#4ec994" }} />
                  : <ToggleLeft className="h-3 w-3 opacity-40" />
                }
              </button>
              <button
                type="button"
                title="Run now"
                className="flex h-[18px] w-[18px] items-center justify-center rounded theme-hover-bg"
                style={{ color: "var(--vscode-icon-foreground)" }}
              >
                <Play className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete"
                className="flex h-[18px] w-[18px] items-center justify-center rounded theme-hover-bg"
                style={{ color: "var(--vscode-errorForeground)" }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex min-w-0 items-center gap-1" style={{ color: "var(--vscode-descriptionForeground)" }}>
        <Clock className="h-[10px] w-[10px] shrink-0 opacity-50" />
        <span className="truncate text-[10px] opacity-60">{automation.schedule}</span>
        {automation.project && (
          <>
            <span className="opacity-30 text-[10px]">·</span>
            <span className="truncate text-[10px] opacity-60">{automation.project}</span>
          </>
        )}
        {automation.lastRun && (
          <>
            <span className="opacity-30 text-[10px]">·</span>
            <span className="shrink-0 text-[10px] opacity-40">{automation.lastRun}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── AutomationCard ──────────────────────────────────────────────────────────

function AutomationCard({
  item,
  onUse,
}: {
  item: AutomationExample;
  onUse: (item: AutomationExample) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onUse(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.08 }}
      className="group relative flex w-full items-start gap-3 rounded-[4px] border p-3 text-left"
      style={{
        background: hovered
          ? "var(--vscode-list-hover-background)"
          : "var(--vscode-editor-background)",
        borderColor: hovered
          ? "var(--vscode-focusBorder, rgba(0,127,212,0.4))"
          : "var(--vscode-panel-border)",
        color: "var(--vscode-editor-foreground)",
        transition: "background 80ms ease, border-color 80ms ease",
      }}
    >
      {/* Accent left border on hover */}
      <span
        className="absolute left-0 top-0 h-full w-[2px] rounded-l-[4px] transition-opacity duration-100"
        style={{
          background: item.iconColor,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Icon badge */}
      <div
        className="mt-[1px] flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] transition-all duration-100"
        style={{
          background: hovered ? item.iconBg : "var(--vscode-toolbar-hover-background)",
        }}
      >
        <Icon className="h-3.5 w-3.5 transition-transform duration-100" style={{ color: item.iconColor }} />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="text-[12px] font-medium leading-[1.4]"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {item.title}
        </div>
        <div
          className="mt-[3px] text-[11px] leading-[1.5]"
          style={{ color: "var(--vscode-descriptionForeground)" }}
        >
          {item.description}
        </div>
      </div>

      {/* Arrow on hover */}
      <ArrowRight
        className="mt-[3px] h-3.5 w-3.5 shrink-0 transition-all duration-100"
        style={{
          color: item.iconColor,
          opacity: hovered ? 0.8 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-4px)",
        }}
      />
    </motion.button>
  );
}

// ── CategorySection ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  onUse,
  index,
}: {
  category: AutomationCategory;
  onUse: (item: AutomationExample) => void;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: 0.06 + index * 0.04, ease: "easeOut" }}
    >
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-[10px] w-[2px] rounded-full"
          style={{ background: category.accentColor }}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.07em]"
          style={{ color: "var(--vscode-sideBarSectionHeader-foreground)", opacity: 0.7 }}
        >
          {category.title}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-[6px]">
        {category.items.map((item) => (
          <AutomationCard key={item.id} item={item} onUse={onUse} />
        ))}
      </div>
    </motion.section>
  );
}

// ── AutomationsPage ─────────────────────────────────────────────────────────

export function AutomationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [activeAutomationId, setActiveAutomationId] = useState<string | null>(null);
  const [userAutomations, setUserAutomations] = useState<UserAutomation[]>(INITIAL_USER_AUTOMATIONS);

  function openNew() {
    setSelectedPrompt("");
    setModalOpen(true);
  }

  function useTemplate(item: AutomationExample) {
    setSelectedPrompt(item.prompt);
    setModalOpen(true);
  }

  function toggleAutomation(id: string) {
    setUserAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  }

  function deleteAutomation(id: string) {
    setUserAutomations((prev) => prev.filter((a) => a.id !== id));
    if (activeAutomationId === id) setActiveAutomationId(null);
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--vscode-editor-background)" }}>

      {/* ── Automations sidebar ──────────────────────────────────────── */}
      <aside className="vscode-sidebar flex h-full w-[200px] shrink-0 flex-col overflow-hidden">

        {/* Sidebar header */}
        <div className="flex h-[35px] shrink-0 items-center justify-between px-3"
          style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.07em]"
            style={{ color: "var(--vscode-sideBarTitle-foreground)", opacity: 0.7 }}
          >
            My Automations
          </span>
          <button
            type="button"
            onClick={openNew}
            title="New automation"
            className="flex h-[20px] w-[20px] items-center justify-center rounded theme-hover-bg"
            style={{ color: "var(--vscode-icon-foreground)" }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Worktree callout */}
        <div
          className="mx-2 mt-2 mb-1 flex items-start gap-1.5 rounded-[3px] px-2 py-1.5"
          style={{
            background: "var(--vscode-toolbar-hover-background)",
            borderLeft: "2px solid var(--vscode-focus-border, #007fd4)",
          }}
        >
          <GitBranch className="mt-[1px] h-[10px] w-[10px] shrink-0 opacity-50" style={{ color: "var(--vscode-focus-border)" }} />
          <span className="text-[10px] leading-[1.4]" style={{ color: "var(--vscode-descriptionForeground)" }}>
            Runs in independent worktrees by default
          </span>
        </div>

        {/* Automation list */}
        <div className="vscode-scrollable flex-1 overflow-y-auto pt-1">
          <AnimatePresence mode="popLayout">
            {userAutomations.length === 0 ? (
              <motion.button
                key="empty"
                type="button"
                onClick={openNew}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-2 mt-2 flex w-[calc(100%-16px)] flex-col items-center gap-2 rounded-[3px] border border-dashed py-6 text-center theme-hover-bg"
                style={{
                  borderColor: "var(--vscode-panel-border)",
                  color: "var(--vscode-descriptionForeground)",
                }}
              >
                <Zap className="h-4 w-4 opacity-30" />
                <span className="text-[11px]">No automations yet</span>
              </motion.button>
            ) : (
              <motion.div
                key="list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {userAutomations.map((automation) => (
                  <motion.div key={automation.id} variants={staggerItem} layout>
                    <UserAutomationItem
                      automation={automation}
                      isActive={activeAutomationId === automation.id}
                      onSelect={() => setActiveAutomationId(automation.id)}
                      onToggle={() => toggleAutomation(automation.id)}
                      onDelete={() => deleteAutomation(automation.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="vscode-scrollable flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex h-full flex-col px-6 py-5">

          {/* Page header */}
          <motion.div
            className="mb-5 flex items-center justify-between"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div>
              <h1
                className="text-[16px] font-semibold tracking-[-0.01em]"
                style={{ color: "var(--vscode-editor-foreground)" }}
              >
                Automations
              </h1>
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: "var(--vscode-descriptionForeground)" }}
              >
                Schedule recurring threads to run automatically.{" "}
                <span
                  className="cursor-pointer hover:underline"
                  style={{ color: "var(--vscode-textLink-foreground)" }}
                >
                  Learn more
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={openNew}
              className="flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium transition-opacity duration-75 hover:opacity-90"
              style={{
                background: "var(--vscode-button-background)",
                color: "var(--vscode-button-foreground)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New automation
            </button>
          </motion.div>

          {/* Category sections — fill all width, spaced evenly */}
          <div className="flex flex-col gap-6">
            {AUTOMATION_CATEGORIES.map((category, i) => (
              <CategorySection
                key={category.id}
                category={category}
                onUse={useTemplate}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>

      <NewAutomationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPrompt={selectedPrompt}
      />
    </div>
  );
}
