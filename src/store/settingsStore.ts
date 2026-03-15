import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

export interface CustomTemplate {
  id: string;
  name: string;
  sourcePath: string;
}

export type IdeId = "vscode" | "cursor" | "zed" | "windsurf" | "webstorm" | "xcode" | "antigravity";

export interface IdeOption {
  id: IdeId;
  label: string;
  command: string;
}

export const IDE_OPTIONS: IdeOption[] = [
  { id: "vscode",    label: "VS Code",   command: "code" },
  { id: "cursor",    label: "Cursor",    command: "cursor" },
  { id: "antigravity", label: "Antigravity", command: "ag" },
  { id: "zed",       label: "Zed",       command: "zed" },
  { id: "windsurf",  label: "Windsurf",  command: "windsurf" },
  { id: "webstorm",  label: "WebStorm",  command: "webstorm" },
  { id: "xcode",     label: "Xcode",     command: "xed" },
];

interface SettingsStore {
  customTemplates: CustomTemplate[];
  defaultIde: IdeId;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  addCustomTemplate: (t: CustomTemplate) => void;
  removeCustomTemplate: (id: string) => void;
  setDefaultIde: (ide: IdeId) => Promise<void>;
}

async function getStore() {
  return load("settings.json", { defaults: {} });
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  customTemplates: [],
  defaultIde: "vscode",
  isLoaded: false,

  loadSettings: async () => {
    const store = await getStore();
    const templates = (await store.get<CustomTemplate[]>("customTemplates")) ?? [];
    const defaultIde = (await store.get<IdeId>("defaultIde")) ?? "vscode";
    set({ customTemplates: templates, defaultIde, isLoaded: true });
  },

  addCustomTemplate: async (t) => {
    set((state) => ({ customTemplates: [...state.customTemplates, t] }));
    const store = await getStore();
    await store.set("customTemplates", get().customTemplates);
  },

  removeCustomTemplate: async (id) => {
    set((state) => ({
      customTemplates: state.customTemplates.filter((t) => t.id !== id),
    }));
    const store = await getStore();
    await store.set("customTemplates", get().customTemplates);
  },

  setDefaultIde: async (ide) => {
    set({ defaultIde: ide });
    const store = await getStore();
    await store.set("defaultIde", ide);
  },
}));
