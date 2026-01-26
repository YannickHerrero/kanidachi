import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

// ============================================================================
// SUBJECTS - Radicals, Kanji, Vocabulary
// ============================================================================

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey(), // WaniKani subject ID
  type: text("type").notNull(), // 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'
  level: integer("level").notNull(),
  characters: text("characters"), // null for image-only radicals
  slug: text("slug").notNull(),
  documentUrl: text("document_url").notNull(),

  // JSON-encoded arrays
  meanings: text("meanings").notNull(), // JSON: Meaning[]
  readings: text("readings"), // JSON: Reading[] (null for radicals)
  auxiliaryMeanings: text("auxiliary_meanings"), // JSON: AuxiliaryMeaning[]
  componentSubjectIds: text("component_subject_ids"), // JSON: number[]
  amalgamationSubjectIds: text("amalgamation_subject_ids"), // JSON: number[]
  visuallySimilarSubjectIds: text("visually_similar_subject_ids"), // JSON: number[] (kanji only)

  // Mnemonics
  meaningMnemonic: text("meaning_mnemonic"),
  meaningHint: text("meaning_hint"), // kanji only
  readingMnemonic: text("reading_mnemonic"), // kanji/vocab
  readingHint: text("reading_hint"), // kanji only

  // Vocabulary-specific
  contextSentences: text("context_sentences"), // JSON: ContextSentence[]
  partsOfSpeech: text("parts_of_speech"), // JSON: string[]
  pronunciationAudios: text("pronunciation_audios"), // JSON: PronunciationAudio[]

  // Radical-specific
  characterImages: text("character_images"), // JSON: CharacterImage[]

  // Metadata
  hiddenAt: integer("hidden_at"), // Unix timestamp
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// ASSIGNMENTS - User's SRS progress for each subject
// ============================================================================

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey(), // WaniKani assignment ID
  subjectId: integer("subject_id").notNull(),
  subjectType: text("subject_type").notNull(),
  srsStage: integer("srs_stage").notNull(), // 0-9
  level: integer("level").notNull(),

  // Timestamps (Unix seconds)
  unlockedAt: integer("unlocked_at"),
  startedAt: integer("started_at"), // Lesson completed
  passedAt: integer("passed_at"), // Reached Guru
  burnedAt: integer("burned_at"),
  availableAt: integer("available_at"), // Next review time
  resurrectedAt: integer("resurrected_at"),

  // Metadata
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// STUDY MATERIALS - User notes and synonyms
// ============================================================================

export const studyMaterials = sqliteTable("study_materials", {
  id: integer("id").primaryKey(), // WaniKani study material ID
  subjectId: integer("subject_id").notNull().unique(),
  subjectType: text("subject_type").notNull(),
  meaningNote: text("meaning_note"),
  readingNote: text("reading_note"),
  meaningSynonyms: text("meaning_synonyms"), // JSON: string[]
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// VOICE ACTORS - Audio voice actor metadata
// ============================================================================

export const voiceActors = sqliteTable("voice_actors", {
  id: integer("id").primaryKey(), // WaniKani voice actor ID
  name: text("name").notNull(),
  gender: text("gender").notNull(), // 'male' | 'female'
  description: text("description"),
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// REVIEW STATISTICS - Accuracy statistics per subject
// ============================================================================

export const reviewStatistics = sqliteTable("review_statistics", {
  id: integer("id").primaryKey(), // WaniKani review statistic ID
  subjectId: integer("subject_id").notNull().unique(),
  subjectType: text("subject_type").notNull(),
  meaningCorrect: integer("meaning_correct").notNull().default(0),
  meaningIncorrect: integer("meaning_incorrect").notNull().default(0),
  meaningMaxStreak: integer("meaning_max_streak").notNull().default(0),
  meaningCurrentStreak: integer("meaning_current_streak").notNull().default(0),
  readingCorrect: integer("reading_correct").notNull().default(0),
  readingIncorrect: integer("reading_incorrect").notNull().default(0),
  readingMaxStreak: integer("reading_max_streak").notNull().default(0),
  readingCurrentStreak: integer("reading_current_streak").notNull().default(0),
  percentageCorrect: integer("percentage_correct").notNull().default(0),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at"),
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// LEVEL PROGRESSIONS - Level unlock history
// ============================================================================

export const levelProgressions = sqliteTable("level_progressions", {
  id: integer("id").primaryKey(), // WaniKani level progression ID
  level: integer("level").notNull(),
  createdAt: integer("created_at"),
  unlockedAt: integer("unlocked_at"),
  startedAt: integer("started_at"),
  passedAt: integer("passed_at"),
  completedAt: integer("completed_at"),
  abandonedAt: integer("abandoned_at"),
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// USER - Cached user profile
// ============================================================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => "current"), // Always 'current'
  username: text("username").notNull(),
  level: integer("level").notNull(),
  profileUrl: text("profile_url"),
  maxLevelGrantedBySubscription: integer("max_level_granted_by_subscription").notNull(),
  subscribed: integer("subscribed", { mode: "boolean" }).notNull(),
  subscriptionEndsAt: integer("subscription_ends_at"),
  startedAt: integer("started_at"),
  vacationStartedAt: integer("vacation_started_at"),
  dataUpdatedAt: text("data_updated_at"),
})

// ============================================================================
// PENDING PROGRESS - Offline queue for reviews/lessons
// ============================================================================

export const pendingProgress = sqliteTable("pending_progress", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assignmentId: integer("assignment_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  isLesson: integer("is_lesson", { mode: "boolean" }).notNull(),
  meaningWrongCount: integer("meaning_wrong_count").notNull().default(0),
  readingWrongCount: integer("reading_wrong_count").notNull().default(0),
  createdAt: integer("created_at").notNull(), // Unix timestamp
  // Retry tracking
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: integer("last_attempt_at"),
  lastError: text("last_error"),
})

// ============================================================================
// SYNC METADATA - Track last sync timestamps
// ============================================================================

export const syncMetadata = sqliteTable("sync_metadata", {
  id: text("id").primaryKey(), // Entity type: 'subjects', 'assignments', etc.
  lastSyncAt: text("last_sync_at"), // ISO timestamp for updated_after param
  lastFullSyncAt: integer("last_full_sync_at"), // Unix timestamp
  itemCount: integer("item_count"),
})

// ============================================================================
// AUDIO CACHE - Track cached audio files
// ============================================================================

export const audioCache = sqliteTable("audio_cache", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  subjectId: integer("subject_id").notNull(),
  voiceActorId: integer("voice_actor_id").notNull(),
  url: text("url").notNull(),
  localPath: text("local_path").notNull(),
  fileSize: integer("file_size"),
  cachedAt: integer("cached_at").notNull(),
})

// ============================================================================
// TYPE DEFINITIONS (for JSON fields)
// ============================================================================

export interface Meaning {
  meaning: string
  primary: boolean
  acceptedAnswer: boolean
}

export interface AuxiliaryMeaning {
  meaning: string
  type: "whitelist" | "blacklist"
}

export interface Reading {
  reading: string
  primary: boolean
  acceptedAnswer: boolean
  type?: "onyomi" | "kunyomi" | "nanori" // kanji only
}

export interface ContextSentence {
  en: string
  ja: string
}

export interface PronunciationAudio {
  url: string
  contentType: string
  metadata: {
    gender: "male" | "female"
    sourceId: number
    pronunciation: string
    voiceActorId: number
    voiceActorName: string
    voiceDescription: string
  }
}

export interface CharacterImage {
  url: string
  contentType: string
  metadata: {
    inlineStyles: boolean
  }
}

// Subject type enum
export type SubjectType = "radical" | "kanji" | "vocabulary" | "kana_vocabulary"

// SRS stage names
export const SRS_STAGES = {
  0: "Initiate",
  1: "Apprentice I",
  2: "Apprentice II",
  3: "Apprentice III",
  4: "Apprentice IV",
  5: "Guru I",
  6: "Guru II",
  7: "Master",
  8: "Enlightened",
  9: "Burned",
} as const

export type SrsStage = keyof typeof SRS_STAGES

// SRS stage categories
export const SRS_CATEGORIES = {
  apprentice: [1, 2, 3, 4],
  guru: [5, 6],
  master: [7],
  enlightened: [8],
  burned: [9],
} as const

// ============================================================================
// ERROR LOG - For debugging sync issues
// ============================================================================

export const errorLog = sqliteTable("error_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  type: text("type").notNull(), // 'sync' | 'network' | 'api' | 'unknown'
  code: integer("code"), // HTTP status code if applicable
  message: text("message").notNull(),
  details: text("details"), // JSON-encoded additional info
  requestUrl: text("request_url"),
  responseData: text("response_data"),
  createdAt: integer("created_at").notNull(), // Unix timestamp
})
