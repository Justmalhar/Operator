import { useState } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Type, Keyboard, LayoutTemplate, Code2, TerminalSquare } from "lucide-react";

interface NavSection {
  title: string;
  items: { id: string; label: string; icon?: React.ElementType }[];
}

const navSections: NavSection[] = [
  {
    title: "Appearance",
    items: [
      { id: "theme", label: "Theme", icon: Monitor },
      { id: "font", label: "Font", icon: Type },
      { id: "layout", label: "Layout", icon: LayoutTemplate },
    ],
  },
  {
    title: "Editor",
    items: [
      { id: "editor-general", label: "General", icon: Code2 },
      { id: "editor-formatting", label: "Formatting" },
      { id: "editor-minimap", label: "Minimap" },
    ],
  },
  {
    title: "Terminal",
    items: [
      { id: "terminal-general", label: "General", icon: TerminalSquare },
      { id: "terminal-font", label: "Font" },
    ],
  },
  {
    title: "Keybindings",
    items: [{ id: "keybindings", label: "Keyboard Shortcuts", icon: Keyboard }],
  },
];

// ── Section content ────────────────────────────────────────────────────────────

function ThemeSection() {
  const [selectedTheme, setSelectedTheme] = useState("dark-default");
  const themes = [
    { id: "dark-default", label: "Dark+ (Default)" },
    { id: "one-dark-pro", label: "One Dark Pro" },
    { id: "github-dark", label: "GitHub Dark" },
    { id: "dracula", label: "Dracula" },
    { id: "monokai", label: "Monokai" },
    { id: "nord", label: "Nord" },
    { id: "solarized-dark", label: "Solarized Dark" },
    { id: "light-default", label: "Light+ (Default)" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Color Theme
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.6 }}>
          Select the color theme for the editor.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 max-w-sm">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTheme(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[12px] transition-colors duration-75",
              selectedTheme === t.id
                ? "border-[var(--vscode-focusBorder)] bg-[var(--vscode-list-active-selection-background)]"
                : "border-[var(--vscode-widget-border,transparent)] hover:bg-[var(--vscode-list-hover-background)]",
            )}
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: selectedTheme === t.id ? "var(--vscode-focusBorder)" : "var(--vscode-editor-foreground)", opacity: selectedTheme === t.id ? 1 : 0.3 }}
            />
            {t.label}
          </button>
        ))}
      </div>
      <SettingsDivider />
      <SettingsToggle
        label="Auto-detect color scheme"
        description="Follow the OS light/dark mode preference."
        defaultChecked={false}
      />
    </div>
  );
}

function FontSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Font
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.6 }}>
          Configure the editor and terminal fonts.
        </p>
      </div>
      <SettingsInput label="Font Family" description="Controls the font family." defaultValue="'JetBrains Mono', 'Fira Code', Menlo, monospace" />
      <SettingsDivider />
      <SettingsNumberInput label="Font Size" description="Controls the font size in pixels." defaultValue={13} min={8} max={32} />
      <SettingsDivider />
      <SettingsNumberInput label="Line Height" description="Controls the line height. 0 uses font-size × 1.5." defaultValue={0} min={0} max={100} />
      <SettingsDivider />
      <SettingsToggle label="Font Ligatures" description="Enable font ligatures in the editor." defaultChecked={true} />
    </div>
  );
}

function LayoutSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Layout
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.6 }}>
          Configure panel layout and sidebar behavior.
        </p>
      </div>
      <SettingsToggle label="Show Activity Bar" description="Show the activity bar on the left." defaultChecked={true} />
      <SettingsDivider />
      <SettingsToggle label="Show Status Bar" description="Show the status bar at the bottom." defaultChecked={true} />
      <SettingsDivider />
      <SettingsToggle label="Show Right Panel by Default" description="Show the right panel when the app starts." defaultChecked={true} />
    </div>
  );
}

function EditorGeneralSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Editor — General
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.6 }}>
          Basic editor settings.
        </p>
      </div>
      <SettingsToggle label="Word Wrap" description="Controls how lines should wrap in the editor." defaultChecked={false} />
      <SettingsDivider />
      <SettingsNumberInput label="Tab Size" description="The number of spaces a tab is equal to." defaultValue={2} min={1} max={16} />
      <SettingsDivider />
      <SettingsToggle label="Insert Spaces" description="Insert spaces when pressing Tab." defaultChecked={true} />
      <SettingsDivider />
      <SettingsToggle label="Detect Indentation" description="Auto-detect indentation from file content." defaultChecked={true} />
    </div>
  );
}

function EditorFormattingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Editor — Formatting
        </h2>
      </div>
      <SettingsToggle label="Format on Save" description="Format a file on save." defaultChecked={true} />
      <SettingsDivider />
      <SettingsToggle label="Format on Paste" description="Format the pasted content." defaultChecked={false} />
      <SettingsDivider />
      <SettingsToggle label="Trim Trailing Whitespace" description="Remove trailing whitespace on save." defaultChecked={true} />
    </div>
  );
}

function EditorMinimapSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Editor — Minimap
        </h2>
      </div>
      <SettingsToggle label="Enabled" description="Show the minimap on the right side of the editor." defaultChecked={true} />
      <SettingsDivider />
      <SettingsNumberInput label="Max Column" description="Limit the width of the minimap to render at most a certain number of columns." defaultValue={120} min={1} max={500} />
    </div>
  );
}

function TerminalGeneralSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Terminal — General
        </h2>
      </div>
      <SettingsInput label="Shell" description="The shell to use on the current platform." defaultValue="/bin/zsh" />
      <SettingsDivider />
      <SettingsNumberInput label="Scrollback" description="Controls the maximum number of lines the terminal keeps in its buffer." defaultValue={1000} min={1} max={100000} />
      <SettingsDivider />
      <SettingsToggle label="Cursor Blink" description="Controls whether the terminal cursor blinks." defaultChecked={true} />
    </div>
  );
}

function TerminalFontSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Terminal — Font
        </h2>
      </div>
      <SettingsInput label="Font Family" description="The font family used by the terminal." defaultValue="" placeholder="Inherit from editor" />
      <SettingsDivider />
      <SettingsNumberInput label="Font Size" description="The font size used by the terminal." defaultValue={13} min={6} max={100} />
    </div>
  );
}

function KeybindingsSection() {
  const bindings = [
    { action: "Open New Chat", keys: ["⌘", "N"] },
    { action: "Toggle Right Panel", keys: ["⌘", "B"] },
    { action: "Toggle Bottom Panel", keys: ["⌘", "J"] },
    { action: "Open Preferences", keys: ["⌘", ","] },
    { action: "Focus Activity Bar", keys: ["⌘", "⇧", "E"] },
    { action: "Close Tab", keys: ["⌘", "W"] },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--vscode-editor-foreground)" }}>
          Keyboard Shortcuts
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.6 }}>
          View and customize keyboard shortcuts.
        </p>
      </div>
      <div className="max-w-lg space-y-1">
        {bindings.map((b) => (
          <div
            key={b.action}
            className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--vscode-list-hover-background)]"
          >
            <span className="text-[12px]" style={{ color: "var(--vscode-editor-foreground)" }}>
              {b.action}
            </span>
            <div className="flex items-center gap-1">
              {b.keys.map((k, i) => (
                <kbd
                  key={i}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                  style={{
                    background: "var(--vscode-keybindingLabel-background)",
                    color: "var(--vscode-keybindingLabel-foreground, var(--vscode-editor-foreground))",
                    border: "1px solid var(--vscode-keybindingLabel-border, var(--vscode-widget-border))",
                  }}
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared controls ────────────────────────────────────────────────────────────

function SettingsDivider() {
  return <hr style={{ borderColor: "var(--vscode-widget-border, rgba(255,255,255,0.08))" }} />;
}

function SettingsToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-start justify-between gap-8">
      <div>
        <div className="text-[13px]" style={{ color: "var(--vscode-editor-foreground)" }}>{label}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={cn(
          "relative mt-0.5 h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-[var(--vscode-focusBorder)]" : "bg-[var(--vscode-input-border,rgba(255,255,255,0.15))]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SettingsInput({ label, description, defaultValue, placeholder }: { label: string; description: string; defaultValue: string; placeholder?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-1.5">
      <div className="text-[13px]" style={{ color: "var(--vscode-editor-foreground)" }}>{label}</div>
      <div className="text-[11px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}>{description}</div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className="w-full max-w-md rounded px-2.5 py-1.5 text-[12px] font-mono outline-none"
        style={{
          background: "var(--vscode-input-background)",
          color: "var(--vscode-input-foreground)",
          border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.15))",
        }}
      />
    </div>
  );
}

function SettingsNumberInput({ label, description, defaultValue, min, max }: { label: string; description: string; defaultValue: number; min: number; max: number }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-start justify-between gap-8">
      <div>
        <div className="text-[13px]" style={{ color: "var(--vscode-editor-foreground)" }}>{label}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}>{description}</div>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-20 shrink-0 rounded px-2 py-1 text-center text-[12px] outline-none"
        style={{
          background: "var(--vscode-input-background)",
          color: "var(--vscode-input-foreground)",
          border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.15))",
        }}
      />
    </div>
  );
}

// ── Section registry ───────────────────────────────────────────────────────────

const sectionComponents: Record<string, React.ComponentType> = {
  theme: ThemeSection,
  font: FontSection,
  layout: LayoutSection,
  "editor-general": EditorGeneralSection,
  "editor-formatting": EditorFormattingSection,
  "editor-minimap": EditorMinimapSection,
  "terminal-general": TerminalGeneralSection,
  "terminal-font": TerminalFontSection,
  keybindings: KeybindingsSection,
};

// ── PreferencesPage ────────────────────────────────────────────────────────────

export function PreferencesPage() {
  const [activeSection, setActiveSection] = useState("theme");
  const Content = sectionComponents[activeSection] ?? ThemeSection;

  return (
    <div className="flex h-full">
      {/* Left submenu */}
      <aside
        className="vscode-sidebar flex h-full w-[220px] shrink-0 flex-col overflow-y-auto"
      >
        <div
          className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--vscode-sidebar-title-foreground)", opacity: 0.6 }}
        >
          Preferences
        </div>
        {navSections.map((section) => (
          <div key={section.title} className="mb-2">
            <div
              className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--vscode-sidebar-foreground)", opacity: 0.45 }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-[12px] transition-colors duration-75",
                    isActive
                      ? "bg-[var(--vscode-list-active-selection-background)] text-[var(--vscode-list-active-selection-foreground)]"
                      : "hover:bg-[var(--vscode-list-hover-background)]",
                  )}
                  style={isActive ? {} : { color: "var(--vscode-sidebar-foreground)" }}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Content area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--vscode-editor-background)" }}
      >
        <div className="mx-auto max-w-2xl px-10 py-8">
          <Content />
        </div>
      </div>
    </div>
  );
}
