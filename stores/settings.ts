import { create } from "zustand"
import { storage, getItem, setItem } from "@/lib/storage"

// Storage key for settings
const SETTINGS_KEY = "app_settings"

// Review ordering options
export type ReviewOrdering = "random" | "srs_stage" | "level"

// Lesson ordering options
export type LessonOrdering = "ascending_level" | "shuffled" | "current_level_first"

interface Settings {
  // Audio settings
  preferredVoiceActorId: number | null
  autoPlayAudioLessons: boolean
  autoPlayAudioReviews: boolean

  // Lesson settings
  lessonBatchSize: number
  lessonOrdering: LessonOrdering
  hideKanaVocabulary: boolean

  // Review settings
  reviewOrdering: ReviewOrdering
  wrapUpBatchSize: number
  minimizeReviewPenalty: boolean // Reduce wrong count to 1 if multiple mistakes
  reviewItemLimit: number | null // Max items per session (null = unlimited)

  // Notification settings
  notificationsEnabled: boolean
  notificationTime: string // HH:mm format
}

interface SettingsState extends Settings {
  // Actions
  setPreferredVoiceActorId: (id: number | null) => void
  setAutoPlayAudioLessons: (enabled: boolean) => void
  setAutoPlayAudioReviews: (enabled: boolean) => void
  setLessonBatchSize: (size: number) => void
  setLessonOrdering: (ordering: LessonOrdering) => void
  setHideKanaVocabulary: (enabled: boolean) => void
  setReviewOrdering: (ordering: ReviewOrdering) => void
  setWrapUpBatchSize: (size: number) => void
  setMinimizeReviewPenalty: (enabled: boolean) => void
  setReviewItemLimit: (limit: number | null) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setNotificationTime: (time: string) => void

  // Persistence
  loadSettings: () => void
  resetSettings: () => void
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  preferredVoiceActorId: null,
  autoPlayAudioLessons: true,
  autoPlayAudioReviews: false,
  lessonBatchSize: 5,
  lessonOrdering: "ascending_level",
  hideKanaVocabulary: false,
  reviewOrdering: "random",
  wrapUpBatchSize: 10,
  minimizeReviewPenalty: true, // Default to minimizing penalty
  reviewItemLimit: null, // Unlimited by default
  notificationsEnabled: false,
  notificationTime: "09:00",
}

// Helper to persist settings
function persistSettings(settings: Partial<Settings>) {
  const current = getItem<Settings>(SETTINGS_KEY) ?? DEFAULT_SETTINGS
  const updated = { ...current, ...settings }
  setItem(SETTINGS_KEY, updated)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default values
  ...DEFAULT_SETTINGS,

  // Audio settings
  setPreferredVoiceActorId: (id) => {
    set({ preferredVoiceActorId: id })
    persistSettings({ preferredVoiceActorId: id })
  },

  setAutoPlayAudioLessons: (enabled) => {
    set({ autoPlayAudioLessons: enabled })
    persistSettings({ autoPlayAudioLessons: enabled })
  },

  setAutoPlayAudioReviews: (enabled) => {
    set({ autoPlayAudioReviews: enabled })
    persistSettings({ autoPlayAudioReviews: enabled })
  },

  // Lesson settings
  setLessonBatchSize: (size) => {
    set({ lessonBatchSize: size })
    persistSettings({ lessonBatchSize: size })
  },

  setLessonOrdering: (ordering) => {
    set({ lessonOrdering: ordering })
    persistSettings({ lessonOrdering: ordering })
  },

  setHideKanaVocabulary: (enabled) => {
    set({ hideKanaVocabulary: enabled })
    persistSettings({ hideKanaVocabulary: enabled })
  },

  // Review settings
  setReviewOrdering: (ordering) => {
    set({ reviewOrdering: ordering })
    persistSettings({ reviewOrdering: ordering })
  },

  setWrapUpBatchSize: (size) => {
    set({ wrapUpBatchSize: size })
    persistSettings({ wrapUpBatchSize: size })
  },

  setMinimizeReviewPenalty: (enabled) => {
    set({ minimizeReviewPenalty: enabled })
    persistSettings({ minimizeReviewPenalty: enabled })
  },

  setReviewItemLimit: (limit) => {
    set({ reviewItemLimit: limit })
    persistSettings({ reviewItemLimit: limit })
  },

  // Notifications
  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled })
    persistSettings({ notificationsEnabled: enabled })
  },

  setNotificationTime: (time) => {
    set({ notificationTime: time })
    persistSettings({ notificationTime: time })
  },

  // Load settings from storage
  loadSettings: () => {
    const stored = getItem<Settings>(SETTINGS_KEY)
    if (stored) {
      set({
        ...DEFAULT_SETTINGS,
        ...stored,
      })
    }
  },

  // Reset to defaults
  resetSettings: () => {
    set(DEFAULT_SETTINGS)
    setItem(SETTINGS_KEY, DEFAULT_SETTINGS)
  },
}))

// Initialize settings on import
// Note: This runs when the store is first imported
if (typeof window !== "undefined" || typeof global !== "undefined") {
  try {
    const stored = getItem<Settings>(SETTINGS_KEY)
    if (stored) {
      useSettingsStore.setState({
        ...DEFAULT_SETTINGS,
        ...stored,
      })
    }
  } catch (error) {
    console.warn("Failed to load settings:", error)
  }
}
