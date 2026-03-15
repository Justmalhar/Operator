import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Bot,
  Shield,
  Zap,
  KeyRound,
  Keyboard,
  FolderGit2,
  Users,
  FlaskConical,
  CheckCircle2,
  Circle,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";

// ── Nav ───────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "general",   label: "General",            icon: Settings },
  { id: "backends",  label: "Agent Backends",      icon: Bot },
  { id: "privacy",   label: "Privacy",             icon: Shield },
  { id: "hooks",     label: "Hooks",               icon: Zap },
  { id: "env-vars",  label: "Env Variables",       icon: KeyRound },
  { id: "shortcuts", label: "Keyboard Shortcuts",  icon: Keyboard },
  { id: "repos",     label: "Repositories",        icon: FolderGit2 },
  { id: "team",      label: "Team",                icon: Users },
  { id: "advanced",  label: "Advanced",            icon: FlaskConical },
];

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 text-[15px] font-semibold"
      style={{ color: "var(--vscode-editor-foreground)" }}
    >
      {children}
    </h2>
  );
}

function Divider() {
  return <hr className="my-4" style={{ borderColor: "var(--vscode-widget-border, rgba(255,255,255,0.08))" }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[13px]" style={{ color: "var(--vscode-editor-foreground)" }}>
      {children}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-0.5 block text-[11px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}>
      {children}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
        checked ? "bg-[var(--vscode-focusBorder)]" : "bg-[var(--vscode-input-border,rgba(255,255,255,0.2))]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-150",
          checked ? "translate-x-3.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8 py-4">
      <div className="min-w-0">
        <Label>{label}</Label>
        {hint && <Hint>{hint}</Hint>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
  width = "w-44",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  width?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("rounded px-2.5 py-1.5 text-[12px] outline-none", width)}
      style={{
        background: "var(--vscode-dropdown-background, var(--vscode-input-background))",
        color: "var(--vscode-dropdown-foreground, var(--vscode-input-foreground))",
        border: "1px solid var(--vscode-dropdown-border, var(--vscode-input-border, rgba(255,255,255,0.2)))",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  width = "w-56",
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("rounded px-2.5 py-1.5 text-[12px] outline-none", width)}
      style={{
        background: "var(--vscode-input-background)",
        color: "var(--vscode-input-foreground)",
        border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.2))",
      }}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 rounded px-2 py-1.5 text-center text-[12px] outline-none"
      style={{
        background: "var(--vscode-input-background)",
        color: "var(--vscode-input-foreground)",
        border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.2))",
      }}
    />
  );
}

// ── Section: General ──────────────────────────────────────────────────────────

function GeneralSection() {
  const [theme, setTheme] = useState("dark");
  const [termFont, setTermFont] = useState("Cascadia Code");
  const [termSize, setTermSize] = useState(13);
  const [editorFont, setEditorFont] = useState("Cascadia Code");
  const [editorSize, setEditorSize] = useState(13);
  const [defaultIde, setDefaultIde] = useState("cursor");
  const [basePort, setBasePort] = useState(3000);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateChannel, setUpdateChannel] = useState("stable");
  const [restoreWorkspace, setRestoreWorkspace] = useState(true);

  return (
    <div>
      <SectionTitle>General</SectionTitle>

      <SettingRow label="Theme">
        <Select
          value={theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "system", label: "System" },
          ]}
        />
      </SettingRow>
      <Divider />

      <SettingRow label="Terminal font" hint="Font used in the integrated terminal.">
        <div className="flex items-center gap-2">
          <Select
            value={termFont}
            onChange={setTermFont}
            options={[
              { value: "Cascadia Code", label: "Cascadia Code" },
              { value: "JetBrains Mono", label: "JetBrains Mono" },
              { value: "Fira Code", label: "Fira Code" },
              { value: "Menlo", label: "Menlo" },
            ]}
          />
          <NumberInput value={termSize} onChange={setTermSize} min={8} max={24} />
        </div>
      </SettingRow>
      <Divider />

      <SettingRow label="Editor font" hint="Font used in the code editor and file viewer.">
        <div className="flex items-center gap-2">
          <Select
            value={editorFont}
            onChange={setEditorFont}
            options={[
              { value: "Cascadia Code", label: "Cascadia Code" },
              { value: "JetBrains Mono", label: "JetBrains Mono" },
              { value: "Fira Code", label: "Fira Code" },
              { value: "Menlo", label: "Menlo" },
            ]}
          />
          <NumberInput value={editorSize} onChange={setEditorSize} min={8} max={24} />
        </div>
      </SettingRow>
      <Divider />

      <SettingRow label="Default IDE" hint="External IDE opened when clicking Open.">
        <Select
          value={defaultIde}
          onChange={setDefaultIde}
          options={[
            { value: "cursor", label: "Cursor" },
            { value: "vscode", label: "VS Code" },
            { value: "xcode", label: "Xcode" },
            { value: "auto", label: "Auto-detect" },
          ]}
        />
      </SettingRow>
      <Divider />

      <SettingRow label="Base port" hint="Starting port for workspace dev servers.">
        <NumberInput value={basePort} onChange={setBasePort} min={1024} max={65535} />
      </SettingRow>
      <Divider />

      <div
        className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}
      >
        Startup
      </div>

      <SettingRow label="Check for updates on launch">
        <Toggle checked={autoUpdate} onChange={setAutoUpdate} />
      </SettingRow>
      <Divider />

      <SettingRow label="Update channel">
        <Select
          value={updateChannel}
          onChange={setUpdateChannel}
          options={[
            { value: "stable", label: "Stable" },
            { value: "beta", label: "Beta" },
            { value: "nightly", label: "Nightly" },
          ]}
        />
      </SettingRow>
      <Divider />

      <SettingRow label="Restore last workspace on launch">
        <Toggle checked={restoreWorkspace} onChange={setRestoreWorkspace} />
      </SettingRow>
    </div>
  );
}

// ── Section: Backends ─────────────────────────────────────────────────────────

function BackendCard({
  name,
  connected,
  statusLabel,
  children,
}: {
  name: string;
  connected: boolean;
  statusLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#4ec994" }} />
          ) : (
            <Circle className="h-3.5 w-3.5 opacity-40" style={{ color: "var(--vscode-editor-foreground)" }} />
          )}
          <span
            className="text-[11px]"
            style={{ color: connected ? "#4ec994" : "var(--vscode-editor-foreground)", opacity: connected ? 1 : 0.55 }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

function BackendsSection() {
  const [claudeModel, setClaudeModel] = useState("claude-sonnet-4-6");
  const [claudeReasoning, setClaudeReasoning] = useState("medium");
  const [extendedContext, setExtendedContext] = useState(false);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customUrl, setCustomUrl] = useState("https://openrouter.ai/api");
  const [customToken, setCustomToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  return (
    <div>
      <SectionTitle>Agent Backends</SectionTitle>

      <div className="space-y-4">
        <BackendCard
          name="Claude Code (Anthropic)"
          connected
          statusLabel="Connected as malhar@mobiiworld.com (Pro)"
        >
          <div className="space-y-1">
            <SettingRow label="Default model">
              <Select
                value={claudeModel}
                onChange={setClaudeModel}
                options={[
                  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
                  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
                  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
                ]}
              />
            </SettingRow>
            <SettingRow label="Reasoning level">
              <Select
                value={claudeReasoning}
                onChange={setClaudeReasoning}
                options={[
                  { value: "fast", label: "Fast" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "max", label: "Max" },
                ]}
              />
            </SettingRow>
            <SettingRow label="Use Opus 4.6 1M for long tasks" hint="Switches to extended context model automatically.">
              <Toggle checked={extendedContext} onChange={setExtendedContext} />
            </SettingRow>
            <div className="pt-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
                style={{
                  background: "var(--vscode-button-secondaryBackground, rgba(255,255,255,0.08))",
                  color: "var(--vscode-button-secondaryForeground, var(--vscode-editor-foreground))",
                  border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))",
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </BackendCard>

        <BackendCard name="OpenAI Codex" connected={false} statusLabel="Not connected">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
              style={{
                background: "var(--vscode-button-background)",
                color: "var(--vscode-button-foreground)",
              }}
            >
              Connect with ChatGPT account
            </button>
            <span className="text-[11px] opacity-40" style={{ color: "var(--vscode-editor-foreground)" }}>or</span>
            <TextInput value="" onChange={() => {}} placeholder="API key" width="w-40" />
          </div>
        </BackendCard>

        <BackendCard name="Gemini CLI" connected={false} statusLabel="Coming soon">
          <span
            className="inline-block rounded px-2 py-0.5 text-[11px]"
            style={{
              background: "rgba(255,200,0,0.1)",
              color: "#cca700",
              border: "1px solid rgba(255,200,0,0.2)",
            }}
          >
            Coming soon
          </span>
        </BackendCard>

        <BackendCard name="Custom provider (OpenRouter / Bedrock / Vertex)" connected={false} statusLabel="Not configured">
          <div className="space-y-1">
            <SettingRow label="Enable custom provider">
              <Toggle checked={customEnabled} onChange={setCustomEnabled} />
            </SettingRow>
            {customEnabled && (
              <>
                <SettingRow label="Base URL">
                  <TextInput value={customUrl} onChange={setCustomUrl} width="w-60" />
                </SettingRow>
                <SettingRow label="Auth token">
                  <div className="flex items-center gap-1.5">
                    <TextInput
                      value={customToken}
                      onChange={setCustomToken}
                      type={showToken ? "text" : "password"}
                      placeholder="sk-..."
                      width="w-44"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="opacity-60 hover:opacity-100"
                      style={{ color: "var(--vscode-editor-foreground)" }}
                    >
                      {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </SettingRow>
                <p className="mt-1 text-[11px] opacity-55" style={{ color: "var(--vscode-editor-foreground)" }}>
                  ⚠ Set API key to empty string for Anthropic-compatible endpoints.
                </p>
              </>
            )}
          </div>
        </BackendCard>
      </div>
    </div>
  );
}

// ── Section: Privacy ──────────────────────────────────────────────────────────

function PrivacySection() {
  const [analytics, setAnalytics] = useState(true);
  const [crashReporting, setCrashReporting] = useState(false);
  const [logRetention, setLogRetention] = useState("7");
  const [checkpointRetention, setCheckpointRetention] = useState("30");

  return (
    <div>
      <SectionTitle>Privacy</SectionTitle>

      <div
        className="mb-5 rounded-lg p-4 text-[12px]"
        style={{
          background: "rgba(78,201,148,0.08)",
          border: "1px solid rgba(78,201,148,0.2)",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        <p className="font-semibold" style={{ color: "#4ec994" }}>Your data stays on your Mac.</p>
        <p className="mt-1 opacity-70">All chat history and code is stored locally. Nothing is sent to Operator's servers.</p>
        <p className="mt-1 font-mono text-[11px] opacity-50">~/Library/Application Support/com.operator.app</p>
        <button type="button" className="mt-2 text-[11px] underline opacity-70 hover:opacity-100">
          Open in Finder
        </button>
      </div>

      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Analytics
      </div>

      <SettingRow label="Send anonymous usage analytics (PostHog)" hint="We track feature usage, not code or content.">
        <Toggle checked={analytics} onChange={setAnalytics} />
      </SettingRow>
      <Divider />

      <SettingRow label="Send crash reports (Sentry)" hint="Includes stack traces + last 10 operation names. No code, messages, or file contents.">
        <Toggle checked={crashReporting} onChange={setCrashReporting} />
      </SettingRow>
      <Divider />

      <div className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Retention
      </div>

      <SettingRow label="Log retention">
        <Select value={logRetention} onChange={setLogRetention} options={[
          { value: "7", label: "7 days" },
          { value: "14", label: "14 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
        ]} />
      </SettingRow>
      <Divider />

      <SettingRow label="Checkpoint retention">
        <Select value={checkpointRetention} onChange={setCheckpointRetention} options={[
          { value: "7", label: "7 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "365", label: "1 year" },
        ]} />
      </SettingRow>
      <Divider />

      <div className="mt-6">
        <button
          type="button"
          className="rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
          style={{ background: "rgba(200,50,50,0.12)", color: "#f48771", border: "1px solid rgba(200,50,50,0.3)" }}
        >
          Delete all local data…
        </button>
      </div>
    </div>
  );
}

// ── Section: Hooks ────────────────────────────────────────────────────────────

const builtinHooks = [
  { id: "notif",     label: "Desktop notifications",        desc: "macOS alert when agent needs input (Notification events)",  defaultOn: true  },
  { id: "fmt-py",    label: "Auto-format Python after write", desc: "Requires: black",                                         defaultOn: false },
  { id: "fmt-js",    label: "Auto-format JS/TS after write",  desc: "Requires: prettier",                                      defaultOn: false },
  { id: "block-rm",  label: "Block rm -rf commands",          desc: "Prompt user before allowing dangerous deletes",            defaultOn: false },
  { id: "test-stop", label: "Run tests on agent stop",         desc: "Blocks agent from finishing until tests pass",             defaultOn: false },
];

function HooksSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(builtinHooks.map((h) => [h.id, h.defaultOn])),
  );

  return (
    <div>
      <SectionTitle>Hooks</SectionTitle>
      <p className="mb-5 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
        Global settings — applies to all repos.
      </p>

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Pre-built hook library
      </div>

      {builtinHooks.map((hook, i) => (
        <div key={hook.id}>
          <SettingRow label={hook.label} hint={hook.desc}>
            <Toggle checked={enabled[hook.id]} onChange={(v) => setEnabled((p) => ({ ...p, [hook.id]: v }))} />
          </SettingRow>
          {i < builtinHooks.length - 1 && <Divider />}
        </div>
      ))}

      <Divider />

      <div className="mt-4 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
          Custom global hooks
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2.5 py-1 text-[12px] transition-colors hover:opacity-80"
          style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
        >
          <Plus className="h-3 w-3" /> Add hook
        </button>
      </div>
      <p className="mt-3 text-[12px] opacity-40" style={{ color: "var(--vscode-editor-foreground)" }}>
        No custom hooks configured.
      </p>
    </div>
  );
}

// ── Section: Env Vars ─────────────────────────────────────────────────────────

interface EnvVar { key: string; value: string; secret: boolean; }

function EnvVarsSection() {
  const [vars, setVars] = useState<EnvVar[]>([
    { key: "ANTHROPIC_BASE_URL",   value: "https://api.anthropic.com", secret: false },
    { key: "ANTHROPIC_AUTH_TOKEN", value: "sk-ant-api03-••••••••••••", secret: true  },
  ]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggleReveal(key: string) {
    setRevealed((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  return (
    <div>
      <SectionTitle>Environment Variables</SectionTitle>
      <p className="mb-5 text-[12px] opacity-60" style={{ color: "var(--vscode-editor-foreground)" }}>
        Injected into all agent processes. Secret values are stored in the OS keychain.
      </p>

      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}>
        <div
          className="grid grid-cols-[1fr_1.5fr_auto] gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: "var(--vscode-editor-background)", borderBottom: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.08))", color: "var(--vscode-editor-foreground)", opacity: 0.45 }}
        >
          <span>Key</span><span>Value</span><span>Actions</span>
        </div>

        {vars.map((v, i) => (
          <div
            key={v.key}
            className="grid grid-cols-[1fr_1.5fr_auto] items-center gap-3 px-3 py-2.5"
            style={{
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              borderBottom: i < vars.length - 1 ? "1px solid var(--vscode-widget-border, rgba(255,255,255,0.06))" : undefined,
              color: "var(--vscode-editor-foreground)",
            }}
          >
            <span className="truncate font-mono text-[11px] opacity-80">{v.key}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] opacity-60">
                {v.secret && !revealed.has(v.key) ? "●".repeat(14) : v.value}
              </span>
              {v.secret && (
                <button type="button" onClick={() => toggleReveal(v.key)} className="shrink-0 opacity-50 hover:opacity-100">
                  {revealed.has(v.key) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {v.secret && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" title="Secret" />}
              <button type="button" className="opacity-40 hover:opacity-80"><Pencil className="h-3 w-3" /></button>
              <button type="button" className="opacity-40 hover:opacity-80" onClick={() => setVars((p) => p.filter((x) => x.key !== v.key))}>
                <Trash2 className="h-3 w-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
        style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
        onClick={() => setVars((p) => [...p, { key: "NEW_VAR", value: "", secret: false }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add variable
      </button>

      <div className="mt-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
          Provider examples
        </div>
        <div className="flex flex-wrap gap-2">
          {["OpenRouter", "AWS Bedrock", "Vertex AI", "Azure AI"].map((p) => (
            <button
              key={p}
              type="button"
              className="rounded px-3 py-1 text-[11px] transition-colors hover:opacity-80"
              style={{ background: "var(--vscode-button-secondaryBackground, rgba(255,255,255,0.08))", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section: Keyboard Shortcuts ───────────────────────────────────────────────

const shortcuts = [
  { action: "New workspace",          keys: "⌘N"    },
  { action: "New workspace (options)", keys: "⌘⇧N"  },
  { action: "Command palette",         keys: "⌘K"   },
  { action: "Diff viewer",             keys: "⌘D"   },
  { action: "Open in IDE",             keys: "⌘O"   },
  { action: "Settings",                keys: "⌘,"   },
  { action: "Stop agent",              keys: "⌘⇧⌫"  },
  { action: "Background agent",        keys: "Ctrl+B"},
  { action: "New tab",                 keys: "⌘T"   },
  { action: "Close tab",               keys: "⌘W"   },
];

function ShortcutsSection() {
  return (
    <div>
      <SectionTitle>Keyboard Shortcuts</SectionTitle>
      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}>
        {shortcuts.map((s, i) => (
          <div
            key={s.action}
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              borderBottom: i < shortcuts.length - 1 ? "1px solid var(--vscode-widget-border, rgba(255,255,255,0.06))" : undefined,
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}
          >
            <span className="text-[12px]" style={{ color: "var(--vscode-editor-foreground)" }}>{s.action}</span>
            <div className="flex items-center gap-2">
              <kbd
                className="rounded px-2 py-0.5 font-mono text-[11px]"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
              >
                {s.keys}
              </kbd>
              <button type="button" className="text-[11px] opacity-40 hover:opacity-80" style={{ color: "var(--vscode-editor-foreground)" }}>
                edit
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 rounded px-3 py-1.5 text-[12px] opacity-70 transition-colors hover:opacity-100"
        style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
      >
        Reset to defaults
      </button>
    </div>
  );
}

// ── Section: Repos ────────────────────────────────────────────────────────────

const mockRepos = [
  { name: "Justmalhar/mobiiworld-skills-lib", path: "~/code/mobiiworld-skills-lib", platform: "GitHub", branch: "main", activeWorkspaces: 3, archived: 12 },
  { name: "Justmalhar/mobii-ai",              path: "~/code/mobii-ai",              platform: "GitHub", branch: "main", activeWorkspaces: 2, archived: 8  },
];

function ReposSection() {
  return (
    <div>
      <SectionTitle>Repositories</SectionTitle>
      <div className="space-y-3">
        {mockRepos.map((repo) => (
          <div key={repo.name} className="rounded-lg p-4" style={{ border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))" }}>
            <div className="mb-2 font-mono text-[13px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>{repo.name}</div>
            <div className="space-y-0.5 text-[11px] opacity-55" style={{ color: "var(--vscode-editor-foreground)" }}>
              <div>Path: {repo.path}</div>
              <div>Platform: {repo.platform} · Branch: {repo.branch}</div>
              <div>Workspaces: {repo.activeWorkspaces} active, {repo.archived} archived</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="rounded px-3 py-1 text-[11px] transition-colors hover:opacity-80" style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}>
                Open settings
              </button>
              <button type="button" className="rounded px-3 py-1 text-[11px] opacity-60 transition-colors hover:opacity-100" style={{ color: "#f48771" }}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[12px] transition-colors hover:opacity-80"
          style={{ border: "1px dashed var(--vscode-widget-border, rgba(255,255,255,0.2))", color: "var(--vscode-editor-foreground)", opacity: 0.6 }}
        >
          <Plus className="h-3.5 w-3.5" /> Add repository
        </button>
      </div>
    </div>
  );
}

// ── Section: Team ─────────────────────────────────────────────────────────────

function TeamSection() {
  return (
    <div>
      <SectionTitle>Team</SectionTitle>
      <div className="rounded-lg p-8 text-center" style={{ border: "1px dashed var(--vscode-widget-border, rgba(255,255,255,0.15))" }}>
        <Users className="mx-auto mb-3 h-10 w-10 opacity-20" style={{ color: "var(--vscode-editor-foreground)" }} />
        <p className="text-[13px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>Team features coming soon</p>
        <p className="mt-1 text-[12px] opacity-50" style={{ color: "var(--vscode-editor-foreground)" }}>Share repos, skills, and hooks with your team.</p>
      </div>
    </div>
  );
}

// ── Section: Advanced ─────────────────────────────────────────────────────────

function AdvancedSection() {
  const [maxWorkspaces, setMaxWorkspaces] = useState(10);
  const [checkpointDays, setCheckpointDays] = useState("30");
  const [gitName, setGitName] = useState("Operator Agent");
  const [gitEmail, setGitEmail] = useState("operator@local");
  const [claudeCodePath, setClaudeCodePath] = useState("");
  const [codexPath, setCodexPath] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [agentTeams, setAgentTeams] = useState(false);
  const [spotlightTesting, setSpotlightTesting] = useState(false);
  const [codexCloud, setCodexCloud] = useState(false);

  return (
    <div>
      <SectionTitle>Advanced</SectionTitle>

      <SettingRow label="Max parallel workspaces">
        <NumberInput value={maxWorkspaces} onChange={setMaxWorkspaces} min={1} max={50} />
      </SettingRow>
      <Divider />

      <SettingRow label="Checkpoint retention">
        <Select value={checkpointDays} onChange={setCheckpointDays} options={[
          { value: "7", label: "7 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
        ]} />
      </SettingRow>
      <Divider />

      <div className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Git identity for commits
      </div>

      <SettingRow label="Name">
        <TextInput value={gitName} onChange={setGitName} width="w-48" />
      </SettingRow>
      <Divider />

      <SettingRow label="Email">
        <TextInput value={gitEmail} onChange={setGitEmail} width="w-48" />
      </SettingRow>
      <Divider />

      <div className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Agent binaries
      </div>

      <SettingRow label="Claude Code" hint="Path to claude-code binary.">
        <TextInput value={claudeCodePath} onChange={setClaudeCodePath} placeholder="Auto-detect" width="w-52" />
      </SettingRow>
      <Divider />

      <SettingRow label="Codex" hint="Path to codex binary.">
        <TextInput value={codexPath} onChange={setCodexPath} placeholder="Auto-detect" width="w-52" />
      </SettingRow>
      <Divider />

      <SettingRow label="Debug mode" hint="Verbose logging + developer tools.">
        <Toggle checked={debugMode} onChange={setDebugMode} />
      </SettingRow>
      <Divider />

      <div className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Experimental features
      </div>

      {[
        { label: "Agent Teams (Claude Code Feb 2026)", checked: agentTeams, setChecked: setAgentTeams },
        { label: "Spotlight testing",                  checked: spotlightTesting, setChecked: setSpotlightTesting },
        { label: "Cloud-executed agents (Codex Cloud)", checked: codexCloud, setChecked: setCodexCloud },
      ].map(({ label, checked, setChecked }, i, arr) => (
        <div key={label}>
          <SettingRow label={label}><Toggle checked={checked} onChange={setChecked} /></SettingRow>
          {i < arr.length - 1 && <Divider />}
        </div>
      ))}

      <Divider />

      <div className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.45 }}>
        Migration & data
      </div>

      <div className="flex flex-wrap gap-2">
        {["Import from Conductor", "Export all settings", "View logs", "Open app data folder"].map((label) => (
          <button
            key={label}
            type="button"
            className="rounded px-3 py-1.5 text-[12px] transition-colors hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--vscode-editor-foreground)", border: "1px solid var(--vscode-widget-border, rgba(255,255,255,0.15))" }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Section registry ───────────────────────────────────────────────────────────

const sectionComponents: Record<string, React.ComponentType> = {
  general:   GeneralSection,
  backends:  BackendsSection,
  privacy:   PrivacySection,
  hooks:     HooksSection,
  "env-vars": EnvVarsSection,
  shortcuts:  ShortcutsSection,
  repos:     ReposSection,
  team:      TeamSection,
  advanced:  AdvancedSection,
};

// ── SettingsPage ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const Content = sectionComponents[activeSection] ?? GeneralSection;

  return (
    <div className="flex h-full">
      {/* Left submenu */}
      <aside className="vscode-sidebar flex h-full w-[220px] shrink-0 flex-col overflow-y-auto">
        <div
          className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            color: "var(--vscode-sidebar-title-foreground)",
            opacity: 0.6,
            borderBottom: "1px solid var(--vscode-sideBar-border, rgba(255,255,255,0.08))",
          }}
        >
          Settings
        </div>
        <div className="py-1 px-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "vscode-list-item flex h-[32px] w-full items-center gap-2 px-8 text-left text-[13px] transition-colors duration-75",
                  isActive
                    ? "bg-[var(--vscode-list-active-selection-background)] text-[var(--vscode-list-active-selection-foreground)]"
                    : "hover:bg-[var(--vscode-list-hover-background)]",
                )}
                style={isActive ? {} : { color: "var(--vscode-sideBar-foreground)" }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--vscode-editor-background)" }}>
        <div className="mx-auto max-w-2xl px-12 py-10">
          <Content />
        </div>
      </div>
    </div>
  );
}
