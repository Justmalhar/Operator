import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Keyboard,
  Sparkles,
  Bug,
  Info,
  ExternalLink,
  MessageSquare,
  Zap,
  GitBranch,
  FileCode2,
  Terminal,
  Search,
} from "lucide-react";

// ── Nav ───────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "getting-started", label: "Getting Started",    icon: Sparkles  },
  { id: "documentation",   label: "Documentation",      icon: BookOpen  },
  { id: "shortcuts",       label: "Keyboard Shortcuts", icon: Keyboard  },
  { id: "whats-new",       label: "What's New",         icon: Zap       },
  { id: "report-issue",    label: "Report Issue",       icon: Bug       },
  { id: "about",           label: "About",              icon: Info      },
];

// ── Section: Getting Started ──────────────────────────────────────────────────

const gettingStartedSteps = [
  {
    icon: GitBranch,
    title: "Add a repository",
    description: "Click the + button in the sidebar or go to Settings → Repositories to add your first git repo.",
  },
  {
    icon: MessageSquare,
    title: "Start a workspace",
    description: "Select a repo and click New Workspace. Give the agent a task and it'll start coding autonomously.",
  },
  {
    icon: FileCode2,
    title: "Review the diff",
    description: "When the agent finishes, review its changes in the Changes tab. Comment inline, approve, or discard.",
  },
  {
    icon: GitBranch,
    title: "Create a PR",
    description: "Happy with the result? Click Create PR to push the branch and open a pull request.",
  },
  {
    icon: Terminal,
    title: "Use the terminal",
    description: "The bottom panel gives you a full terminal inside the workspace directory.",
  },
];

function GettingStartedSection() {
  return (
    <div>
      <h2 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        Getting Started with Operator
      </h2>
      <p className="mb-6 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
        Operator runs AI coding agents (Claude Code, Codex) across multiple git workspaces simultaneously.
      </p>

      <div className="space-y-4">
        {gettingStartedSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="flex gap-4 rounded-lg p-4"
              style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: "var(--vscode-focusBorder)", color: "#fff" }}
              >
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 opacity-60" style={{ color: "var(--vscode-editor-foreground)" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
                    {step.title}
                  </span>
                </div>
                <p className="mt-1 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-6 rounded-lg p-4"
        style={{ background: "rgba(78,201,148,0.07)", border: "1px solid rgba(78,201,148,0.2)" }}
      >
        <p className="text-[12px]" style={{ color: "#4ec994" }}>
          <strong>Pro tip:</strong>{" "}
          <span className="opacity-80">
            Use <kbd className="rounded px-1 py-0.5 font-mono text-[10px]" style={{ background: "rgba(255,255,255,0.1)" }}>⌘K</kbd> to open the slash command palette from anywhere. Try <code className="font-mono text-[11px]">/code-review</code> or <code className="font-mono text-[11px]">/write-tests</code>.
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Section: Documentation ────────────────────────────────────────────────────

const docLinks = [
  { title: "Core Concepts",          desc: "Workspaces, repos, agents, and how they relate",          icon: BookOpen   },
  { title: "Skills & Slash Commands", desc: "Create and use skills to extend agent behaviour",         icon: Zap        },
  { title: "Hooks Engine",           desc: "Pre/PostToolUse hooks for custom automation",             icon: Terminal   },
  { title: "Instruction Files",      desc: "OPERATOR.md, CLAUDE.md, and AGENTS.md guide",            icon: FileCode2  },
  { title: "Diff Viewer",            desc: "Review, comment, and approve agent code changes",         icon: GitBranch  },
  { title: "Agent Teams",            desc: "Run planner + coder + QA agents in parallel (beta)",     icon: MessageSquare },
  { title: "API Contract",           desc: "REST API and WebSocket spec for integrations",            icon: Search     },
];

function DocumentationSection() {
  return (
    <div>
      <h2 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        Documentation
      </h2>
      <p className="mb-5 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
        Full reference documentation for all Operator features.
      </p>

      <div className="space-y-2">
        {docLinks.map((doc) => {
          const Icon = doc.icon;
          return (
            <button
              key={doc.title}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-75 hover:bg-[var(--vscode-list-hover-background)]"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-50" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{doc.title}</div>
                <div className="text-[11px] opacity-55">{doc.desc}</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-30" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section: Keyboard Shortcuts ───────────────────────────────────────────────

const shortcutGroups = [
  {
    title: "Navigation",
    items: [
      { action: "Open slash command palette", keys: "⌘K" },
      { action: "New workspace",              keys: "⌘N" },
      { action: "New workspace (options)",    keys: "⌘⇧N" },
      { action: "Open in external IDE",       keys: "⌘O" },
      { action: "Open Settings",              keys: "⌘," },
    ],
  },
  {
    title: "Workspace",
    items: [
      { action: "New tab",              keys: "⌘T"   },
      { action: "Close tab",            keys: "⌘W"   },
      { action: "Open diff viewer",     keys: "⌘D"   },
      { action: "Stop agent",           keys: "⌘⇧⌫"  },
      { action: "Send agent to bg",     keys: "Ctrl+B" },
      { action: "Copy last AI message", keys: "⌘⌥C"  },
    ],
  },
  {
    title: "Diff Viewer",
    items: [
      { action: "Previous file", keys: "[" },
      { action: "Next file",     keys: "]" },
      { action: "Previous hunk", keys: "p" },
      { action: "Next hunk",     keys: "n" },
    ],
  },
];

function ShortcutsSection() {
  return (
    <div>
      <h2 className="mb-5 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        Keyboard Shortcuts
      </h2>

      <div className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.title}>
            <div
              className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.4 }}
            >
              {group.title}
            </div>
            <div
              className="overflow-hidden rounded-lg"
              style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}
            >
              {group.items.map((s, i) => (
                <div
                  key={s.action}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    borderBottom: i < group.items.length - 1 ? "1px solid var(--vscode-widget-border, rgba(255,255,255,0.06))" : undefined,
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="text-[12px]" style={{ color: "var(--vscode-editor-foreground)" }}>
                    {s.action}
                  </span>
                  <kbd
                    className="rounded px-2 py-0.5 font-mono text-[11px]"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "var(--vscode-editor-foreground)",
                      border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))",
                    }}
                  >
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: What's New ───────────────────────────────────────────────────────

const releaseNotes = [
  {
    version: "v0.1.0",
    date: "March 2026",
    tag: "Current",
    tagColor: "#4ec994",
    notes: [
      "Initial release with multi-workspace agent orchestration",
      "Claude Code & Codex backend support",
      "VSCode-grade diff viewer with inline commenting",
      "Skills library with slash command palette",
      "Hooks engine (PreToolUse / PostToolUse / Notification)",
      "File viewer with code, markdown, PDF, CSV, image support",
      "Integrated terminal per workspace",
    ],
  },
  {
    version: "v0.2.0",
    date: "Coming soon",
    tag: "Upcoming",
    tagColor: "#cca700",
    notes: [
      "Agent Teams — planner + coder + QA topology",
      "Gemini CLI backend",
      "Checkpoint browser & time-travel restore",
      "Spotlight-style universal search",
      "Voice input in composer",
    ],
  },
];

function WhatsNewSection() {
  return (
    <div>
      <h2 className="mb-5 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        What's New
      </h2>

      <div className="space-y-6">
        {releaseNotes.map((release) => (
          <div
            key={release.version}
            className="rounded-lg p-5"
            style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[14px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
                {release.version}
              </span>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: `${release.tagColor}20`, color: release.tagColor, border: `1px solid ${release.tagColor}40` }}
              >
                {release.tag}
              </span>
              <span className="text-[11px] opacity-45" style={{ color: "var(--vscode-editor-foreground)" }}>
                {release.date}
              </span>
            </div>
            <ul className="space-y-1.5">
              {release.notes.map((note) => (
                <li key={note} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--vscode-editor-foreground)" }}>
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full opacity-50" style={{ background: "var(--vscode-editor-foreground)" }} />
                  <span className="opacity-75">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Report Issue ─────────────────────────────────────────────────────

function ReportIssueSection() {
  const [type, setType] = useState("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div>
        <h2 className="mb-5 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Report Issue
        </h2>
        <div
          className="rounded-lg p-6 text-center"
          style={{ background: "rgba(78,201,148,0.07)", border: "1px solid rgba(78,201,148,0.2)" }}
        >
          <p className="text-[14px] font-semibold" style={{ color: "#4ec994" }}>Thank you for your report!</p>
          <p className="mt-1 text-[12px] opacity-70" style={{ color: "var(--vscode-editor-foreground)" }}>
            We'll review it and follow up if needed.
          </p>
          <button
            type="button"
            className="mt-4 rounded px-3 py-1.5 text-[12px]"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
            onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        Report Issue
      </h2>
      <p className="mb-5 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
        Found a bug or have a suggestion? Let us know.
      </p>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="mb-1.5 block text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.7 }}>
            Type
          </label>
          <div className="flex gap-2">
            {[
              { value: "bug", label: "Bug report" },
              { value: "feature", label: "Feature request" },
              { value: "other", label: "Other" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  "rounded px-3 py-1.5 text-[12px] transition-colors",
                  type === opt.value
                    ? "bg-[var(--vscode-focusBorder)] text-white"
                    : "hover:bg-[var(--vscode-list-hover-background)]",
                )}
                style={type !== opt.value ? { color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.7 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the issue"
            className="w-full rounded px-3 py-2 text-[12px] outline-none"
            style={{ background: "var(--vscode-input-background)", color: "var(--vscode-input-foreground)", border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.2))" }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.7 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, expected vs actual behavior, screenshots…"
            rows={5}
            className="w-full resize-none rounded px-3 py-2 text-[12px] outline-none"
            style={{ background: "var(--vscode-input-background)", color: "var(--vscode-input-foreground)", border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.2))" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => title && description && setSubmitted(true)}
            className="rounded px-4 py-2 text-[12px] font-medium transition-colors hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
            disabled={!title || !description}
          >
            Submit report
          </button>
          <a
            href="#"
            className="flex items-center gap-1 text-[12px] opacity-60 hover:opacity-100"
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            <ExternalLink className="h-3 w-3" />
            Open on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Section: About ────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div>
      <h2 className="mb-5 text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
        About Operator
      </h2>

      <div
        className="mb-5 flex items-center gap-4 rounded-lg p-5"
        style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[22px] font-bold"
          style={{ background: "var(--vscode-focusBorder)", color: "#fff" }}
        >
          ⚙
        </div>
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
            Operator
          </div>
          <div className="text-[12px] opacity-55" style={{ color: "var(--vscode-editor-foreground)" }}>
            Version 0.1.0 · March 2026
          </div>
          <div className="mt-1 text-[11px] opacity-40" style={{ color: "var(--vscode-editor-foreground)" }}>
            Built on Tauri · React 19 · TypeScript
          </div>
        </div>
      </div>

      <div className="space-y-3 text-[12px]" style={{ color: "var(--vscode-editor-foreground)" }}>
        {[
          { label: "Website",  value: "operator.build" },
          { label: "Feedback", value: "humans@conductor.build" },
          { label: "License",  value: "Proprietary — All rights reserved" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 opacity-45">{label}</span>
            <span className="opacity-70">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
        >
          <ExternalLink className="h-3 w-3" /> Changelog
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
          style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
        >
          Check for updates
        </button>
      </div>
    </div>
  );
}

// ── Section registry ───────────────────────────────────────────────────────────

const sectionComponents: Record<string, React.ComponentType> = {
  "getting-started": GettingStartedSection,
  documentation:     DocumentationSection,
  shortcuts:         ShortcutsSection,
  "whats-new":       WhatsNewSection,
  "report-issue":    ReportIssueSection,
  about:             AboutSection,
};

// ── HelpPage ──────────────────────────────────────────────────────────────────

export function HelpPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const Content = sectionComponents[activeSection] ?? GettingStartedSection;

  return (
    <div className="flex h-full">
      {/* Left submenu */}
      <aside className="vscode-sidebar flex h-full w-[220px] shrink-0 flex-col overflow-y-auto">
        <div
          className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--vscode-sidebar-title-foreground)", opacity: 0.6 }}
        >
          Help
        </div>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12px] transition-colors duration-75",
                isActive
                  ? "bg-[var(--vscode-list-active-selection-background)] text-[var(--vscode-list-active-selection-foreground)]"
                  : "hover:bg-[var(--vscode-list-hover-background)]",
              )}
              style={isActive ? {} : { color: "var(--vscode-sidebar-foreground)" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {item.label}
            </button>
          );
        })}
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--vscode-editor-background)" }}>
        <div className="mx-auto max-w-2xl px-10 py-8">
          <Content />
        </div>
      </div>
    </div>
  );
}
