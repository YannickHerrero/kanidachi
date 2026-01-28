import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { storage } from "@/lib/storage"
import type { StateStorage } from "zustand/middleware"

export type ThemePreference = "light" | "dark" | "system"

// MMKV adapter for Zustand persist
const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}

type ThemeStore = {
  mode: ThemePreference
  setMode: (mode: ThemePreference) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
