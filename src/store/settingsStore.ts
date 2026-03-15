import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

export interface CustomTemplate {
  id: string;
  name: string;
  sourcePath: string;
}

interface SettingsStore {
  customTemplates: CustomTemplate[];
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  addCustomTemplate: (t: CustomTemplate) => void;
  removeCustomTemplate: (id: string) => void;
}

async function getStore() {
  return load("settings.json", { defaults: {} });
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  customTemplates: [],
  isLoaded: false,

  loadSettings: async () => {
    const store = await getStore();
    const templates = (await store.get<CustomTemplate[]>("customTemplates")) ?? [];
    set({ customTemplates: templates, isLoaded: true });
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
}));
