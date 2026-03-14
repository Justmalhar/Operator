/**
 * VSCode Theme Registry
 *
 * Provides type-safe theme IDs, metadata, and helpers for applying /
 * persisting themes at runtime.
 *
 * Usage:
 *   import { applyTheme, THEMES } from "@/styles/themes/themes";
 *   applyTheme("dracula");
 */

export type VscodeThemeId =
  | "dark-default"
  | "light-default"
  | "one-dark-pro"
  | "github-dark"
  | "dracula"
  | "monokai"
  | "nord"
  | "solarized-dark";

export type VscodeThemeVariant = "dark" | "light";

export interface VscodeTheme {
  id: VscodeThemeId;
  label: string;
  variant: VscodeThemeVariant;
  /** Accent hex color used for theme picker swatches */
  accent: string;
  /** Background hex for theme picker preview */
  background: string;
}

export const THEMES: VscodeTheme[] = [
  {
    id: "dark-default",
    label: "Dark+ (Default)",
    variant: "dark",
    accent: "#007acc",
    background: "#1e1e1e",
  },
  {
    id: "light-default",
    label: "Light+ (Default)",
    variant: "light",
    accent: "#007acc",
    background: "#ffffff",
  },
  {
    id: "one-dark-pro",
    label: "One Dark Pro",
    variant: "dark",
    accent: "#528bff",
    background: "#282c34",
  },
  {
    id: "github-dark",
    label: "GitHub Dark",
    variant: "dark",
    accent: "#388bfd",
    background: "#0d1117",
  },
  {
    id: "dracula",
    label: "Dracula",
    variant: "dark",
    accent: "#bd93f9",
    background: "#282a36",
  },
  {
    id: "monokai",
    label: "Monokai",
    variant: "dark",
    accent: "#a6e22e",
    background: "#272822",
  },
  {
    id: "nord",
    label: "Nord",
    variant: "dark",
    accent: "#5e81ac",
    background: "#2e3440",
  },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    variant: "dark",
    accent: "#268bd2",
    background: "#002b36",
  },
];

const STORAGE_KEY = "vscode-theme";
const DEFAULT_THEME: VscodeThemeId = "dark-default";

/** Apply a theme by setting data-vscode-theme on <html>. */
export function applyTheme(id: VscodeThemeId): void {
  document.documentElement.setAttribute("data-vscode-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
}

/** Read the persisted theme from localStorage, falling back to the default. */
export function getStoredTheme(): VscodeThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as VscodeThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // noop
  }
  return DEFAULT_THEME;
}

/** Restore the persisted theme (call once on app boot). */
export function restoreTheme(): void {
  applyTheme(getStoredTheme());
}

/** Get theme metadata by id. */
export function getTheme(id: VscodeThemeId): VscodeTheme | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Get the currently applied theme id from the DOM. */
export function getCurrentTheme(): VscodeThemeId {
  const attr = document.documentElement.getAttribute(
    "data-vscode-theme"
  ) as VscodeThemeId | null;
  return attr && THEMES.some((t) => t.id === attr) ? attr : DEFAULT_THEME;
}
