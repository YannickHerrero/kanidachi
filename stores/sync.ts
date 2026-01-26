import { create } from "zustand"

export type SyncPhase =
  | "idle"
  | "user"
  | "subjects"
  | "assignments"
  | "study_materials"
  | "review_statistics"
  | "level_progressions"
  | "voice_actors"
  | "complete"
  | "error"

export interface SyncProgress {
  /** Current sync phase */
  phase: SyncPhase
  /** Current item count being synced */
  current: number
  /** Total items to sync in current phase */
  total: number
  /** Human-readable message */
  message: string
}

interface SyncState {
  /** Whether a sync is in progress */
  isSyncing: boolean
  /** Whether this is the first sync (initial data load) */
  isInitialSync: boolean
  /** Current sync progress */
  progress: SyncProgress
  /** Error message if sync failed */
  error: string | null
  /** Last successful sync timestamp */
  lastSyncAt: Date | null

  /** Start a sync operation */
  startSync: (isInitial: boolean) => void
  /** Update sync progress */
  updateProgress: (progress: Partial<SyncProgress>) => void
  /** Mark sync as complete */
  completeSync: () => void
  /** Mark sync as failed */
  failSync: (error: string) => void
  /** Reset sync state */
  reset: () => void
}

const initialProgress: SyncProgress = {
  phase: "idle",
  current: 0,
  total: 0,
  message: "",
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  isInitialSync: false,
  progress: initialProgress,
  error: null,
  lastSyncAt: null,

  startSync: (isInitial: boolean) => {
    set({
      isSyncing: true,
      isInitialSync: isInitial,
      progress: { ...initialProgress, phase: "user", message: "Starting sync..." },
      error: null,
    })
  },

  updateProgress: (progress: Partial<SyncProgress>) => {
    set((state) => ({
      progress: { ...state.progress, ...progress },
    }))
  },

  completeSync: () => {
    set({
      isSyncing: false,
      progress: { ...initialProgress, phase: "complete", message: "Sync complete!" },
      lastSyncAt: new Date(),
    })
  },

  failSync: (error: string) => {
    set({
      isSyncing: false,
      progress: { ...initialProgress, phase: "error", message: error },
      error,
    })
  },

  reset: () => {
    set({
      isSyncing: false,
      isInitialSync: false,
      progress: initialProgress,
      error: null,
    })
  },
}))

/**
 * Human-readable labels for sync phases
 */
export const SYNC_PHASE_LABELS: Record<SyncPhase, string> = {
  idle: "Ready",
  user: "Syncing user profile",
  subjects: "Syncing subjects",
  assignments: "Syncing assignments",
  study_materials: "Syncing study materials",
  review_statistics: "Syncing review statistics",
  level_progressions: "Syncing level progressions",
  voice_actors: "Syncing voice actors",
  complete: "Complete",
  error: "Error",
}
