// ============================================================================
// WaniKani API Response Types
// Based on https://docs.api.wanikani.com/20170710/
// ============================================================================

// Base response wrapper
export interface WKResponse<T> {
  object: string
  url: string
  data_updated_at: string | null
  data: T
}

// Paginated response
export interface WKCollection<T> extends WKResponse<T[]> {
  pages: {
    per_page: number
    next_url: string | null
    previous_url: string | null
  }
  total_count: number
}

// Resource wrapper
export interface WKResource<T> {
  id: number
  object: string
  url: string
  data_updated_at: string
  data: T
}

// ============================================================================
// USER
// ============================================================================

export interface WKUserData {
  id: string
  username: string
  level: number
  profile_url: string
  started_at: string | null
  current_vacation_started_at: string | null
  subscription: {
    active: boolean
    type: "free" | "recurring" | "lifetime"
    max_level_granted: number
    period_ends_at: string | null
  }
  preferences: {
    default_voice_actor_id: number
    lessons_autoplay_audio: boolean
    lessons_batch_size: number
    lessons_presentation_order: string
    reviews_autoplay_audio: boolean
    reviews_display_srs_indicator: boolean
  }
}

export type WKUser = WKResponse<WKUserData>

// ============================================================================
// SUBJECTS
// ============================================================================

export type SubjectType = "radical" | "kanji" | "vocabulary" | "kana_vocabulary"

export interface WKMeaning {
  meaning: string
  primary: boolean
  accepted_answer: boolean
}

export interface WKAuxiliaryMeaning {
  meaning: string
  type: "whitelist" | "blacklist"
}

export interface WKReading {
  reading: string
  primary: boolean
  accepted_answer: boolean
  type?: "onyomi" | "kunyomi" | "nanori" // kanji only
}

export interface WKContextSentence {
  en: string
  ja: string
}

export interface WKPronunciationAudio {
  url: string
  content_type: string
  metadata: {
    gender: "male" | "female"
    source_id: number
    pronunciation: string
    voice_actor_id: number
    voice_actor_name: string
    voice_description: string
  }
}

export interface WKCharacterImage {
  url: string
  content_type: string
  metadata: {
    inline_styles: boolean
  }
}

export interface WKSubjectData {
  auxiliary_meanings: WKAuxiliaryMeaning[]
  characters: string | null
  created_at: string
  document_url: string
  hidden_at: string | null
  lesson_position: number
  level: number
  meaning_mnemonic: string
  meanings: WKMeaning[]
  slug: string
  spaced_repetition_system_id: number

  // Radical-specific
  amalgamation_subject_ids?: number[]
  character_images?: WKCharacterImage[]

  // Kanji-specific
  meaning_hint?: string
  reading_hint?: string
  reading_mnemonic?: string
  readings?: WKReading[]
  component_subject_ids?: number[]
  visually_similar_subject_ids?: number[]

  // Vocabulary-specific
  context_sentences?: WKContextSentence[]
  parts_of_speech?: string[]
  pronunciation_audios?: WKPronunciationAudio[]
}

export type WKSubject = WKResource<WKSubjectData>
export type WKSubjectsCollection = WKCollection<WKSubject>

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export interface WKAssignmentData {
  available_at: string | null
  burned_at: string | null
  created_at: string
  hidden: boolean
  passed_at: string | null
  resurrected_at: string | null
  srs_stage: number
  started_at: string | null
  subject_id: number
  subject_type: SubjectType
  unlocked_at: string | null
}

export type WKAssignment = WKResource<WKAssignmentData>
export type WKAssignmentsCollection = WKCollection<WKAssignment>

// ============================================================================
// REVIEWS
// ============================================================================

export interface WKReviewData {
  assignment_id: number
  created_at: string
  ending_srs_stage: number
  incorrect_meaning_answers: number
  incorrect_reading_answers: number
  spaced_repetition_system_id: number
  starting_srs_stage: number
  subject_id: number
}

export type WKReview = WKResource<WKReviewData>

export interface WKCreateReviewRequest {
  review: {
    assignment_id: number
    incorrect_meaning_answers: number
    incorrect_reading_answers: number
    created_at?: string
  }
}

export interface WKCreateReviewResponse extends WKResponse<WKReviewData> {
  resources_updated: {
    assignment: WKAssignment
    review_statistic?: WKReviewStatistic
  }
}

// ============================================================================
// STUDY MATERIALS
// ============================================================================

export interface WKStudyMaterialData {
  created_at: string
  hidden: boolean
  meaning_note: string | null
  meaning_synonyms: string[]
  reading_note: string | null
  subject_id: number
  subject_type: SubjectType
}

export type WKStudyMaterial = WKResource<WKStudyMaterialData>
export type WKStudyMaterialsCollection = WKCollection<WKStudyMaterial>

export interface WKStudyMaterialRequest {
  study_material: {
    subject_id?: number // required for create
    meaning_note?: string | null
    reading_note?: string | null
    meaning_synonyms?: string[]
  }
}

// ============================================================================
// VOICE ACTORS
// ============================================================================

export interface WKVoiceActorData {
  created_at: string
  description: string
  gender: "male" | "female"
  name: string
}

export type WKVoiceActor = WKResource<WKVoiceActorData>
export type WKVoiceActorsCollection = WKCollection<WKVoiceActor>

// ============================================================================
// REVIEW STATISTICS
// ============================================================================

export interface WKReviewStatisticData {
  created_at: string
  hidden: boolean
  meaning_correct: number
  meaning_current_streak: number
  meaning_incorrect: number
  meaning_max_streak: number
  percentage_correct: number
  reading_correct: number
  reading_current_streak: number
  reading_incorrect: number
  reading_max_streak: number
  subject_id: number
  subject_type: SubjectType
}

export type WKReviewStatistic = WKResource<WKReviewStatisticData>
export type WKReviewStatisticsCollection = WKCollection<WKReviewStatistic>

// ============================================================================
// LEVEL PROGRESSIONS
// ============================================================================

export interface WKLevelProgressionData {
  abandoned_at: string | null
  completed_at: string | null
  created_at: string
  level: number
  passed_at: string | null
  started_at: string | null
  unlocked_at: string | null
}

export type WKLevelProgression = WKResource<WKLevelProgressionData>
export type WKLevelProgressionsCollection = WKCollection<WKLevelProgression>

// ============================================================================
// ERROR RESPONSE
// ============================================================================

export interface WKErrorResponse {
  error: string
  code: number
}

// ============================================================================
// API REQUEST PARAMETERS
// ============================================================================

export interface WKSubjectsParams {
  ids?: number[]
  types?: SubjectType[]
  slugs?: string[]
  levels?: number[]
  hidden?: boolean
  updated_after?: string
  page_after_id?: number
}

export interface WKAssignmentsParams {
  ids?: number[]
  subject_ids?: number[]
  subject_types?: SubjectType[]
  levels?: number[]
  available_before?: string
  available_after?: string
  srs_stages?: number[]
  unlocked?: boolean
  started?: boolean
  passed?: boolean
  burned?: boolean
  hidden?: boolean
  updated_after?: string
  page_after_id?: number
  immediately_available_for_review?: boolean
  immediately_available_for_lessons?: boolean
  in_review?: boolean
}

export interface WKStudyMaterialsParams {
  ids?: number[]
  subject_ids?: number[]
  subject_types?: SubjectType[]
  hidden?: boolean
  updated_after?: string
  page_after_id?: number
}

export interface WKReviewStatisticsParams {
  ids?: number[]
  subject_ids?: number[]
  subject_types?: SubjectType[]
  hidden?: boolean
  updated_after?: string
  page_after_id?: number
  percentages_greater_than?: number
  percentages_less_than?: number
}

export interface WKLevelProgressionsParams {
  ids?: number[]
  updated_after?: string
  page_after_id?: number
}

export interface WKVoiceActorsParams {
  ids?: number[]
  updated_after?: string
  page_after_id?: number
}
