import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, RefreshCw, Search, Puzzle, X, FolderOpen, Zap } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  examplePrompt: string;
  iconBg: string;
  iconText: string;
  installed: boolean;
  disabled: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const SKILLS: Skill[] = [
  {
    id: "figma",
    name: "Figma",
    description: "Use MCP for design-to-code work",
    longDescription:
      "Use the Figma MCP server for Figma-driven implementation. For setup and debugging details (env vars, config, verification), see references/figma-mcp-config.md.\n\nThese rules define how to translate Figma inputs into code for this project and must be followed for every Figma-driven change.\n\nRequired flow (do not skip):\n1. Run get_design_context first to fetch the structured representation for the exact node(s).\n2. If the response is too large or truncated, run get_metadata to get the high-level node map and then re-fetch only the required node(s) with get_design_context.\n3. Run get_screenshot for a visual reference of the node variant being implemented.\n4. Only after you have both get_design_context and get_screenshot, download any assets needed and start implementation.\n5. Translate the output. Reuse the project's color tokens, components, and typography wherever possible.\n6. Validate against Figma for 1:1 look and behavior before marking complete.",
    examplePrompt: "Use Figma MCP to inspect the target design and translate it into implementable UI decisions...",
    iconBg: "linear-gradient(135deg,#a259ff,#1abcfe)",
    iconText: "F",
    installed: true,
    disabled: false,
  },
  {
    id: "figma-implement",
    name: "Figma Implement Design",
    description: "Turn Figma designs into production-ready code",
    longDescription: "Translates Figma designs into production-ready code with 1:1 visual fidelity. Connects design tokens, spacing, and typography directly to your codebase.",
    examplePrompt: "Implement the hero section from the Figma file at this URL into the landing page...",
    iconBg: "linear-gradient(135deg,#a259ff,#f24e1e)",
    iconText: "Fi",
    installed: true,
    disabled: false,
  },
  {
    id: "openai-docs",
    name: "OpenAI Docs",
    description: "Reference official OpenAI docs, including models and APIs",
    longDescription: "Provides up-to-date access to OpenAI's official documentation including API references, model cards, rate limits, and best practices.",
    examplePrompt: "What are the current context window limits for GPT-4o and how does it compare to o1?",
    iconBg: "linear-gradient(135deg,#10a37f,#1a7f64)",
    iconText: "AI",
    installed: true,
    disabled: false,
  },
  {
    id: "pdf-skill",
    name: "PDF Skill",
    description: "Create, edit, and review PDF files",
    longDescription: "Create, read, and manipulate PDF documents. Supports extraction, annotation, merging, and generation from HTML or Markdown.",
    examplePrompt: "Extract all tables from this PDF and convert them to CSV format...",
    iconBg: "linear-gradient(135deg,#e8453c,#c0392b)",
    iconText: "PDF",
    installed: true,
    disabled: false,
  },
  {
    id: "playwright-cli",
    name: "Playwright CLI Skill",
    description: "Automate browser tasks from the terminal",
    longDescription: "Run Playwright browser automation scripts from the command line. Supports headless and headed modes, screenshots, and DOM interaction.",
    examplePrompt: "Automate the login flow on staging and take a screenshot of the dashboard...",
    iconBg: "linear-gradient(135deg,#45b7d1,#2980b9)",
    iconText: "PW",
    installed: true,
    disabled: false,
  },
  {
    id: "playwright-interactive",
    name: "Playwright Interactive",
    description: "Headless browser testing and Playwright QA workflows",
    longDescription: "Interactive Playwright session for QA workflows. Supports live inspection, element selectors, network interception, and test generation.",
    examplePrompt: "Run a full regression test on the checkout flow and report any broken selectors...",
    iconBg: "linear-gradient(135deg,#2ecc71,#27ae60)",
    iconText: "QA",
    installed: true,
    disabled: false,
  },
  {
    id: "screenshot-capture",
    name: "Screenshot Capture",
    description: "Capture screenshots from any page",
    longDescription: "Capture full-page or element-level screenshots from any URL. Supports viewport configuration, device emulation, and delay for dynamic content.",
    examplePrompt: "Take a screenshot of the homepage on mobile and desktop viewports...",
    iconBg: "linear-gradient(135deg,#f39c12,#e67e22)",
    iconText: "SC",
    installed: true,
    disabled: false,
  },
  {
    id: "skill-creator",
    name: "Skill Creator",
    description: "Create or update a custom skill",
    longDescription: "Scaffold, edit, and validate SKILL.md files following the Agent Skills Open Standard. Compatible with Claude Code, Codex, and Operator.",
    examplePrompt: "Create a new skill that helps me write commit messages in conventional commit format...",
    iconBg: "linear-gradient(135deg,#9b59b6,#8e44ad)",
    iconText: "✦",
    installed: true,
    disabled: false,
  },
  {
    id: "skill-installer",
    name: "Skill Installer",
    description: "Install curated skills from openai.com/skills",
    longDescription: "Browse and install skills from the community registry. Supports global and repo-scoped installation with dependency resolution.",
    examplePrompt: "Search for skills related to data analysis and install the top result...",
    iconBg: "linear-gradient(135deg,#3498db,#2980b9)",
    iconText: "↓",
    installed: true,
    disabled: false,
  },
  {
    id: "slides",
    name: "Slides",
    description: "Create and edit PPTX slide decks with AI",
    longDescription: "Generate and edit PowerPoint slide decks from outlines, markdown, or data. Supports templates, charts, and branded layouts.",
    examplePrompt: "Create a 10-slide deck summarizing this quarter's engineering progress...",
    iconBg: "linear-gradient(135deg,#e74c3c,#c0392b)",
    iconText: "PPT",
    installed: true,
    disabled: false,
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet Skill",
    description: "Create, edit, and analyse spreadsheet data",
    longDescription: "Work with Excel and CSV files. Supports formulas, pivot tables, charts, and data transformations via natural language.",
    examplePrompt: "Analyse the sales data in this spreadsheet and create a monthly trend chart...",
    iconBg: "linear-gradient(135deg,#27ae60,#1e8449)",
    iconText: "XLS",
    installed: true,
    disabled: false,
  },
  {
    id: "audio-transcribe",
    name: "Audio Transcribe",
    description: "Transcribe audio using OpenAI Whisper, with optional translation",
    longDescription: "Transcribe audio files using OpenAI Whisper. Supports 50+ languages, speaker diarization, and optional translation to English.",
    examplePrompt: "Transcribe this meeting recording and summarize the action items...",
    iconBg: "linear-gradient(135deg,#1abc9c,#16a085)",
    iconText: "♪",
    installed: true,
    disabled: false,
  },
  {
    id: "vercel-deploy",
    name: "Vercel Deploy",
    description: "Deploy apps and agents to Vercel with zero config",
    longDescription: "Deploy Next.js, React, and other frameworks to Vercel. Handles environment variables, preview deployments, and production promotions.",
    examplePrompt: "Deploy the current branch to a Vercel preview environment and return the URL...",
    iconBg: "#111",
    iconText: "▲",
    installed: true,
    disabled: false,
  },
  // Recommended
  {
    id: "aspnet-core",
    name: "ASP.NET Core",
    description: "Browse and review ASP.NET Core documentation",
    longDescription: "Provides access to ASP.NET Core documentation including controllers, middleware, authentication, and deployment guides.",
    examplePrompt: "How do I add JWT authentication to an ASP.NET Core 8 minimal API?",
    iconBg: "linear-gradient(135deg,#512bd4,#6a3dbf)",
    iconText: ".NET",
    installed: false,
    disabled: false,
  },
  {
    id: "chatgpt-apps",
    name: "ChatGPT Apps",
    description: "Build and scaffold ChatGPT-powered applications",
    longDescription: "Scaffold full-stack applications powered by ChatGPT. Includes conversation UI, streaming responses, and function calling patterns.",
    examplePrompt: "Scaffold a Next.js app with a ChatGPT-style conversation interface...",
    iconBg: "linear-gradient(135deg,#10a37f,#0d8a6c)",
    iconText: "GPT",
    installed: false,
    disabled: false,
  },
  {
    id: "cloudflare-deploy",
    name: "Cloudflare Deploy",
    description: "Deploy Workers, Pages, and platform services to Cloudflare",
    longDescription: "Deploy Cloudflare Workers, Pages, and D1 databases. Handles wrangler configuration, secrets, and production deployments.",
    examplePrompt: "Deploy this edge function to Cloudflare Workers and set the production route...",
    iconBg: "linear-gradient(135deg,#f6821f,#faad3f)",
    iconText: "CF",
    installed: false,
    disabled: false,
  },
  {
    id: "develop-web-game",
    name: "Develop Web Game",
    description: "Web game dev with Playwright test loop integration",
    longDescription: "Build browser-based games with an automated Playwright test loop. Supports canvas, WebGL, and game state validation.",
    examplePrompt: "Build a Flappy Bird clone in vanilla JS and write Playwright tests for the score counter...",
    iconBg: "linear-gradient(135deg,#e74c3c,#f39c12)",
    iconText: "⬡",
    installed: false,
    disabled: false,
  },
  {
    id: "stripe-integration",
    name: "Stripe Integration",
    description: "Add payments to your app using Stripe APIs",
    longDescription: "Integrate Stripe payments including checkout sessions, subscriptions, webhooks, and the Customer Portal.",
    examplePrompt: "Add a Stripe checkout flow to the pricing page with monthly and annual plans...",
    iconBg: "linear-gradient(135deg,#635bff,#4f46e5)",
    iconText: "S",
    installed: false,
    disabled: false,
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Build with Supabase database, auth, and storage",
    longDescription: "Use Supabase for Postgres, authentication, file storage, and realtime subscriptions. Includes RLS policy generation.",
    examplePrompt: "Set up Supabase auth with GitHub OAuth and protect the dashboard routes...",
    iconBg: "linear-gradient(135deg,#3ecf8e,#1a9e6b)",
    iconText: "SB",
    installed: false,
    disabled: false,
  },
];

// ── SkillDetailModal ──────────────────────────────────────────────────────────

function SkillDetailModal({
  skill,
  onClose,
  onUninstall,
  onToggleDisable,
}: {
  skill: Skill;
  onClose: () => void;
  onUninstall: (id: string) => void;
  onToggleDisable: (id: string) => void;
}) {
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
          {/* ── Modal header ─────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold text-white leading-none select-none"
              style={{ background: skill.iconBg }}
            >
              {skill.iconText}
            </div>
            <span
              className="flex-1 text-[13px] font-semibold"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              {skill.name}
            </span>
            <button
              type="button"
              className="flex items-center gap-1 rounded-[3px] px-2 py-1 text-[11px] opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: "var(--vscode-descriptionForeground)" }}
            >
              <FolderOpen className="h-3 w-3" />
              Open folder
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-[3px] opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: "var(--vscode-icon-foreground)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <div className="vscode-scrollable flex-1 overflow-y-auto px-4 py-4 max-h-[420px]">
            {/* Example prompt */}
            <div className="mb-4">
              <p
                className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: "var(--vscode-descriptionForeground)", opacity: 0.7 }}
              >
                Example prompt
              </p>
              <div
                className="rounded-[4px] px-3 py-2.5 text-[12px] leading-[1.5] italic"
                style={{
                  background: "var(--vscode-toolbar-hover-background)",
                  color: "var(--vscode-descriptionForeground)",
                  border: "1px solid var(--vscode-panel-border)",
                }}
              >
                {skill.examplePrompt}
              </div>
            </div>

            {/* Description */}
            <div
              className="text-[12px] leading-[1.65] whitespace-pre-wrap"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              {skill.longDescription}
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between gap-2 px-4 py-3"
            style={{ borderTop: "1px solid var(--vscode-panel-border)" }}
          >
            <div className="flex items-center gap-2">
              {/* Uninstall */}
              <button
                type="button"
                onClick={() => { onUninstall(skill.id); onClose(); }}
                className="rounded-[3px] px-3 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "transparent",
                  color: "var(--vscode-errorForeground, #f44747)",
                  border: "1px solid var(--vscode-errorForeground, #f44747)",
                }}
              >
                Uninstall
              </button>

              {/* Disable / Enable */}
              <button
                type="button"
                onClick={() => { onToggleDisable(skill.id); onClose(); }}
                className="rounded-[3px] px-3 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "var(--vscode-toolbar-hover-background)",
                  color: "var(--vscode-editor-foreground)",
                  border: "1px solid var(--vscode-panel-border)",
                }}
              >
                {skill.disabled ? "Enable" : "Disable"}
              </button>
            </div>

            {/* Try */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-[3px] px-4 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-90"
              style={{
                background: "var(--vscode-button-background)",
                color: "var(--vscode-button-foreground)",
              }}
            >
              <Zap className="h-3 w-3" />
              Try
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── SkillCard ─────────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  onInstall,
  onOpenDetail,
  index,
}: {
  skill: Skill;
  onInstall: (id: string) => void;
  onOpenDetail: (skill: Skill) => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

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
        opacity: skill.disabled ? 0.45 : 1,
      }}
      onClick={() => skill.installed ? onOpenDetail(skill) : onInstall(skill.id)}
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold text-white leading-none select-none"
        style={{ background: skill.iconBg }}
      >
        {skill.iconText}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[12px] font-medium leading-[1.3]"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {skill.name}
          {skill.disabled && (
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
          {skill.description}
        </div>
      </div>

      {/* Check / Plus */}
      <div className="flex shrink-0 items-center pl-1">
        {skill.installed ? (
          <Check
            className="h-3.5 w-3.5"
            style={{
              color: "var(--vscode-descriptionForeground)",
              opacity: hovered ? 0.9 : 0.4,
              transition: "opacity 80ms",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInstall(skill.id); }}
            title="Install"
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

// ── SectionLabel ──────────────────────────────────────────────────────────────

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

// ── SkillsPage ────────────────────────────────────────────────────────────────

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(SKILLS);
  const [query, setQuery] = useState("");
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const filtered = query.trim()
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase()),
      )
    : skills;

  const installed = filtered.filter((s) => s.installed);
  const recommended = filtered.filter((s) => !s.installed);

  function installSkill(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, installed: true } : s)));
  }

  function uninstallSkill(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, installed: false, disabled: false } : s)));
  }

  function toggleDisableSkill(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, disabled: !s.disabled } : s)));
  }

  // Keep activeSkill in sync with skills state
  const syncedActiveSkill = activeSkill
    ? (skills.find((s) => s.id === activeSkill.id) ?? null)
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
              Skills
            </h1>
            <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-descriptionForeground)" }}>
              Give Operator superpowers.{" "}
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
                placeholder="Search skills"
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
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] opacity-50 transition-opacity hover:opacity-80"
              style={{ color: "var(--vscode-icon-foreground)" }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {/* New skill */}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-[12px] font-medium transition-opacity hover:opacity-90"
              style={{
                background: "var(--vscode-button-background)",
                color: "var(--vscode-button-foreground)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New skill
            </button>
          </div>
        </motion.div>

        {/* ── Installed ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {installed.length > 0 && (
            <motion.section
              key="installed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <SectionLabel label="Installed" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {installed.map((skill, i) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onInstall={installSkill}
                    onOpenDetail={setActiveSkill}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Recommended ────────────────────────────────────────────── */}
        <AnimatePresence>
          {recommended.length > 0 && (
            <motion.section
              key="recommended"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SectionLabel label="Recommended" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {recommended.map((skill, i) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onInstall={installSkill}
                    onOpenDetail={setActiveSkill}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Empty ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2.5 pt-20 text-center"
            >
              <Puzzle className="h-8 w-8 opacity-15" style={{ color: "var(--vscode-descriptionForeground)" }} />
              <p className="text-[12px]" style={{ color: "var(--vscode-descriptionForeground)" }}>
                No results for <strong>"{query}"</strong>
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-[3px] px-3 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "var(--vscode-toolbar-hover-background)",
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Skill detail modal ──────────────────────────────────────── */}
      {syncedActiveSkill && (
        <SkillDetailModal
          skill={syncedActiveSkill}
          onClose={() => setActiveSkill(null)}
          onUninstall={uninstallSkill}
          onToggleDisable={toggleDisableSkill}
        />
      )}
    </div>
  );
}
