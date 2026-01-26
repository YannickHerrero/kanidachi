import { create } from "zustand"

interface BackgroundSyncState {
  /** Whether background sync is currently running */
  isSyncing: boolean
  /** Number of items pending sync */
  pendingCount: number

  /** Set syncing state */
  setIsSyncing: (isSyncing: boolean) => void
  /** Set pending count */
  setPendingCount: (count: number) => void
}

export const useBackgroundSyncStore = create<BackgroundSyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,

  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
}))
