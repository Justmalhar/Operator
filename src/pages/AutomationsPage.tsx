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
  RefreshCw,
  Search,
  Tag,
  TestTube2,
  ToggleLeft,
  ToggleRight,
  X,
  Zap,
} from "lucide-react";
import { NewAutomationModal } from "@/components/automations/NewAutomationModal";

// ── Types ───────────────────────────────────────────────────────────────────

interface UserAutomation {
  id: string;
  title: string;
  description: string;
  schedule: string;
  project: string | null;
  enabled: boolean;
  lastRun: string | null;
  iconColor: string;
  iconBg: string;
  icon: React.ElementType;
}

interface AutomationTemplate {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  prompt: string;
}

// ── Mock user automations ───────────────────────────────────────────────────

const INITIAL_USER_AUTOMATIONS: UserAutomation[] = [
  {
    id: "ua-1",
    title: "Daily standup summary",
    description: "Daily at 9:00 AM · my-app · Last run 2h ago",
    schedule: "Daily at 9:00 AM",
    project: "my-app",
    enabled: true,
    lastRun: "2h ago",
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #3794ff, #1a6bd4)",
    icon: GitBranch,
  },
  {
    id: "ua-2",
    title: "Weekly PR digest",
    description: "Every Monday · backend-api · Last run 3d ago",
    schedule: "Every Monday",
    project: "backend-api",
    enabled: true,
    lastRun: "3d ago",
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #b267e6, #8e44ad)",
    icon: GitMerge,
  },
  {
    id: "ua-3",
    title: "CI failure triage",
    description: "Every hour · data-pipeline · Last run 1w ago",
    schedule: "Every hour",
    project: "data-pipeline",
    enabled: false,
    lastRun: "1w ago",
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #f48771, #e74c3c)",
    icon: TestTube2,
  },
];

// ── Automation templates ────────────────────────────────────────────────────

const TEMPLATES: AutomationTemplate[] = [
  {
    id: "git-standup",
    icon: GitBranch,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #3794ff, #1a6bd4)",
    title: "Git Standup Summary",
    description: "Pull recent commits, PRs, and reviews then draft a concise standup update",
    prompt: "Summarize all git activity from the last 24 hours across my repositories. Include commits, merged PRs, and open PR reviews. Format it as a brief standup update.",
  },
  {
    id: "weekly-update",
    icon: BarChart3,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #b267e6, #8e44ad)",
    title: "Weekly Status Report",
    description: "Synthesize PRs, rollouts, incidents, and reviews into a weekly update",
    prompt: "Generate a weekly status report covering: merged PRs, production rollouts, any incidents or outages, and pending code reviews. Highlight blockers and key wins.",
  },
  {
    id: "pr-summary",
    icon: GitMerge,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #4ec994, #27ae60)",
    title: "PR Risk Summary",
    description: "Summarize last week's PRs by teammate and theme, highlight risks",
    prompt: "Analyze all PRs merged in the last 7 days. Group by author and theme (e.g. infra, auth, UI). Flag any large diffs, missing tests, or changes to critical paths.",
  },
  {
    id: "release-notes",
    icon: FileText,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #cca700, #b8960a)",
    title: "Release Notes",
    description: "Draft weekly release notes from merged PRs with links",
    prompt: "Create release notes for this week's release. Pull from merged PR titles and descriptions. Format with sections: Features, Bug Fixes, Performance, and Breaking Changes. Include PR links.",
  },
  {
    id: "release-checklist",
    icon: CheckCircle2,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #2ecc71, #1e8449)",
    title: "Release Checklist",
    description: "Verify changelog, migrations, feature flags, and tests before shipping",
    prompt: "Run a pre-release verification: check that CHANGELOG is updated, database migrations are present and reviewed, feature flags are configured for gradual rollout, and all CI tests are passing.",
  },
  {
    id: "changelog",
    icon: Tag,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #45b7d1, #2980b9)",
    title: "Update Changelog",
    description: "Update the changelog with this week's highlights and key PR links",
    prompt: "Update CHANGELOG.md with a new section for this week. Include the top highlights from merged PRs, formatted as bullet points with PR numbers linked. Follow the existing changelog format.",
  },
  {
    id: "ci-failures",
    icon: TestTube2,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #f48771, #e74c3c)",
    title: "CI Failure Triage",
    description: "Summarize CI failures and flaky tests, suggest top fixes",
    prompt: "Analyze CI run results from the last 24 hours. Identify failing tests, flaky tests (>2 failures), and broken builds. Group by root cause and suggest the top 3 fixes to prioritize.",
  },
  {
    id: "error-grouping",
    icon: Package,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #d18616, #e67e22)",
    title: "Error Root Cause Grouping",
    description: "Group CI failures by likely root cause and suggest minimal fixes",
    prompt: "Review all CI failures in the current branch. Cluster errors by likely root cause (e.g. env config, import errors, race conditions). For each cluster suggest the minimal code change to fix it.",
  },
  {
    id: "dep-audit",
    icon: GitBranch,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #9b59b6, #6c3483)",
    title: "Dependency Audit",
    description: "Audit outdated dependencies and open a PR with safe upgrades",
    prompt: "Check all dependencies for available updates. Identify packages more than one major version behind. Create a PR that applies safe patch and minor upgrades, and lists breaking major upgrades for manual review.",
  },
  {
    id: "dead-code",
    icon: Zap,
    iconColor: "#fff",
    iconBg: "linear-gradient(135deg, #f39c12, #e67e22)",
    title: "Dead Code Cleanup",
    description: "Find and remove dead code, then open a cleanup PR",
    prompt: "Scan the codebase for dead code: unused exports, unreferenced variables, unreachable branches, and large commented-out blocks. Remove them, run tests to confirm nothing breaks, then open a cleanup PR.",
  },
];

// ── AutomationDetailModal ───────────────────────────────────────────────────

function AutomationDetailModal({
  automation,
  onClose,
  onDelete,
  onToggle,
}: {
  automation: UserAutomation;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const Icon = automation.icon;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex w-full max-w-[520px] flex-col rounded-[8px] shadow-2xl overflow-hidden"
          style={{
            background: "var(--vscode-editor-background)",
            border: "1px solid var(--vscode-panel-border)",
          }}
        >
          {/* Modal header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white select-none"
              style={{ background: automation.iconBg }}
            >
              <Icon className="h-4 w-4" style={{ color: automation.iconColor }} />
            </div>
            <span
              className="flex-1 text-[13px] font-semibold"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              {automation.title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-[3px] opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: "var(--vscode-icon-foreground)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="vscode-scrollable flex-1 overflow-y-auto px-4 py-4 max-h-[420px]">
            {/* Schedule info */}
            <div className="mb-4">
              <p
                className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: "var(--vscode-descriptionForeground)", opacity: 0.7 }}
              >
                Schedule
              </p>
              <div
                className="rounded-[4px] px-3 py-2.5 text-[12px] leading-[1.5]"
                style={{
                  background: "var(--vscode-toolbar-hover-background)",
                  color: "var(--vscode-descriptionForeground)",
                  border: "1px solid var(--vscode-panel-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 opacity-50" />
                  <span>{automation.schedule}</span>
                </div>
                {automation.project && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] opacity-60">
                    <span>Project: {automation.project}</span>
                  </div>
                )}
                {automation.lastRun && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] opacity-60">
                    <span>Last run: {automation.lastRun}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div
              className="text-[12px] leading-[1.65]"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              <span className="flex items-center gap-1.5">
                Status:{" "}
                <span style={{ color: automation.enabled ? "#4ec994" : "var(--vscode-descriptionForeground)" }}>
                  {automation.enabled ? "Enabled" : "Disabled"}
                </span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between gap-2 px-4 py-3"
            style={{ borderTop: "1px solid var(--vscode-panel-border)" }}
          >
            <div className="flex items-center gap-2">
              {/* Delete */}
              <button
                type="button"
                onClick={() => { onDelete(automation.id); onClose(); }}
                className="vscode-btn vscode-btn-sm vscode-btn-danger"
              >
                Delete
              </button>

              {/* Enable / Disable */}
              <button
                type="button"
                onClick={() => { onToggle(automation.id); onClose(); }}
                className="vscode-btn vscode-btn-sm vscode-btn-secondary"
              >
                {automation.enabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* Run */}
            <button
              type="button"
              onClick={onClose}
              className="vscode-btn vscode-btn-sm vscode-btn-primary flex items-center gap-1.5"
            >
              <Play className="h-3 w-3" />
              Run now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── AutomationCard (list-style, matching SkillCard) ─────────────────────────

function AutomationCard({
  item,
  isUserAutomation,
  enabled,
  onAction,
  index,
}: {
  item: { id: string; icon: React.ElementType; iconColor: string; iconBg: string; title: string; description: string };
  isUserAutomation: boolean;
  enabled?: boolean;
  onAction: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: index * 0.02, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex cursor-pointer items-center gap-3 rounded-[4px] px-3 py-3"
      style={{
        background: hovered ? "var(--vscode-list-hover-background)" : "transparent",
        transition: "background 80ms ease",
        opacity: isUserAutomation && enabled === false ? 0.45 : 1,
      }}
      onClick={onAction}
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-white select-none"
        style={{ background: item.iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: item.iconColor }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[12px] font-medium leading-[1.3]"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {item.title}
          {isUserAutomation && enabled === false && (
            <span
              className="ml-1.5 text-[10px] font-normal"
              style={{ color: "var(--vscode-descriptionForeground)" }}
            >
              disabled
            </span>
          )}
        </div>
        <div
          className="mt-[2px] truncate text-[11px] leading-[1.4]"
          style={{ color: "var(--vscode-descriptionForeground)" }}
        >
          {item.description}
        </div>
      </div>

      {/* Trailing indicator */}
      <div className="flex shrink-0 items-center pl-1">
        {isUserAutomation ? (
          enabled ? (
            <ToggleRight
              className="h-3.5 w-3.5"
              style={{
                color: "#4ec994",
                opacity: hovered ? 0.9 : 0.4,
                transition: "opacity 80ms",
              }}
            />
          ) : (
            <ToggleLeft
              className="h-3.5 w-3.5"
              style={{
                color: "var(--vscode-descriptionForeground)",
                opacity: hovered ? 0.9 : 0.4,
                transition: "opacity 80ms",
              }}
            />
          )
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            title="Use template"
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[3px]"
            style={{
              background: hovered ? "var(--vscode-toolbar-hover-background)" : "transparent",
              color: "var(--vscode-icon-foreground)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 80ms, background 80ms",
            }}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── SectionLabel ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em]"
      style={{ color: "var(--vscode-sideBarSectionHeader-foreground)", opacity: 0.6 }}
    >
      {label}
    </p>
  );
}

// ── AutomationsPage ─────────────────────────────────────────────────────────

export function AutomationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [userAutomations, setUserAutomations] = useState<UserAutomation[]>(INITIAL_USER_AUTOMATIONS);
  const [activeAutomation, setActiveAutomation] = useState<UserAutomation | null>(null);
  const [query, setQuery] = useState("");

  function openNew() {
    setSelectedPrompt("");
    setModalOpen(true);
  }

  function useTemplate(item: AutomationTemplate) {
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
  }

  // Filter based on search
  const filteredUserAutomations = query.trim()
    ? userAutomations.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description.toLowerCase().includes(query.toLowerCase()),
      )
    : userAutomations;

  const filteredTemplates = query.trim()
    ? TEMPLATES.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()),
      )
    : TEMPLATES;

  // Keep activeAutomation in sync
  const syncedActive = activeAutomation
    ? (userAutomations.find((a) => a.id === activeAutomation.id) ?? null)
    : null;

  return (
    <div
      className="vscode-scrollable mx-auto h-full overflow-y-auto"
      style={{ background: "var(--vscode-editor-background)" }}
    >
      <div className="mx-auto w-full max-w-[780px] px-6 py-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          <div>
            <h1
              className="text-[22px] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              Automations
            </h1>
            <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-descriptionForeground)" }}>
              Schedule recurring tasks.{" "}
              <span
                className="cursor-pointer hover:underline"
                style={{ color: "var(--vscode-textLink-foreground)" }}
              >
                Learn more
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div
              className="flex items-center gap-1.5 rounded-[4px] border px-2.5 py-[5px]"
              style={{
                background: "var(--vscode-input-background)",
                borderColor: query
                  ? "var(--vscode-focusBorder, #0078d4)"
                  : "var(--vscode-input-border, var(--vscode-panel-border))",
                transition: "border-color 80ms",
              }}
            >
              <Search className="h-[11px] w-[11px] shrink-0 opacity-35" style={{ color: "var(--vscode-input-foreground)" }} />
              <input
                type="text"
                placeholder="Search automations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-[140px] bg-transparent text-[11px] outline-none placeholder:opacity-35"
                style={{ color: "var(--vscode-input-foreground)" }}
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    type="button"
                    onClick={() => setQuery("")}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-40 hover:opacity-70"
                    style={{ color: "var(--vscode-input-foreground)" }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Refresh */}
            <button
              type="button"
              title="Refresh"
              className="vscode-btn vscode-btn-ghost h-[30px] w-[30px] p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {/* New automation */}
            <button
              type="button"
              onClick={openNew}
              className="vscode-btn vscode-btn-primary flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New automation
            </button>
          </div>
        </motion.div>

        {/* ── My Automations ─────────────────────────────────────────── */}
        <AnimatePresence>
          {filteredUserAutomations.length > 0 && (
            <motion.section
              key="my-automations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <SectionLabel label="My Automations" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {filteredUserAutomations.map((automation, i) => (
                  <AutomationCard
                    key={automation.id}
                    item={automation}
                    isUserAutomation
                    enabled={automation.enabled}
                    onAction={() => setActiveAutomation(automation)}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Templates ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {filteredTemplates.length > 0 && (
            <motion.section
              key="templates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SectionLabel label="Templates" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {filteredTemplates.map((template, i) => (
                  <AutomationCard
                    key={template.id}
                    item={template}
                    isUserAutomation={false}
                    onAction={() => useTemplate(template)}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Empty state ────────────────────────────────────────────── */}
        <AnimatePresence>
          {filteredUserAutomations.length === 0 && filteredTemplates.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2.5 pt-20 text-center"
            >
              <Zap className="h-8 w-8 opacity-15" style={{ color: "var(--vscode-descriptionForeground)" }} />
              <p className="text-[12px]" style={{ color: "var(--vscode-descriptionForeground)" }}>
                No results for <strong>"{query}"</strong>
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="vscode-btn vscode-btn-sm vscode-btn-secondary"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Automation detail modal ──────────────────────────────────── */}
      {syncedActive && (
        <AutomationDetailModal
          automation={syncedActive}
          onClose={() => setActiveAutomation(null)}
          onDelete={deleteAutomation}
          onToggle={toggleAutomation}
        />
      )}

      <NewAutomationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPrompt={selectedPrompt}
      />
    </div>
  );
}
