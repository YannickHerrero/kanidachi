import { create } from "zustand"

interface BackgroundSyncState {
  /** Whether background sync is currently running */
  isSyncing: boolean
  /** Number of items pending sync */
  pendingCount: number
  /** Sync progress percentage (0-100) */
  progress: number
  /** Whether this is a full refresh sync (pull-to-refresh) */
  isFullRefresh: boolean

  /** Set syncing state */
  setIsSyncing: (isSyncing: boolean) => void
  /** Set pending count */
  setPendingCount: (count: number) => void
  /** Set sync progress (0-100) */
  setProgress: (progress: number) => void
  /** Set full refresh mode */
  setIsFullRefresh: (isFullRefresh: boolean) => void
  /** Start a sync operation */
  startSync: (isFullRefresh?: boolean) => void
  /** Complete a sync operation */
  completeSync: () => void
}

export const useBackgroundSyncStore = create<BackgroundSyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  progress: 0,
  isFullRefresh: false,

  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setProgress: (progress) => set({ progress: Math.min(100, Math.max(0, progress)) }),
  setIsFullRefresh: (isFullRefresh) => set({ isFullRefresh }),
  
  startSync: (isFullRefresh = false) => set({ 
    isSyncing: true, 
    progress: 0, 
    isFullRefresh 
  }),
  
  completeSync: () => set({ 
    isSyncing: false, 
    progress: 100,
    isFullRefresh: false,
  }),
}))
