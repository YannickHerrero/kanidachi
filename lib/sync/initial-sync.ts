import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"
import { wanikaniClient } from "@/lib/wanikani/client"
import { useSyncStore } from "@/stores/sync"
import { useAuthStore } from "@/stores/auth"
import {
  subjects,
  assignments,
  studyMaterials,
  voiceActors,
  reviewStatistics,
  levelProgressions,
  user,
  syncMetadata,
} from "@/db/schema"
import type {
  WKSubject,
  WKAssignment,
  WKStudyMaterial,
  WKVoiceActor,
  WKReviewStatistic,
  WKLevelProgression,
  WKUser,
} from "@/lib/wanikani/types"

type Database = SQLJsDatabase | ExpoSQLiteDatabase

/**
 * Convert ISO timestamp to Unix seconds
 */
function isoToUnix(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor(new Date(iso).getTime() / 1000)
}

/**
 * Transform WaniKani subject to database row
 */
function transformSubject(s: WKSubject) {
  return {
    id: s.id,
    type: s.data.characters === null && s.data.character_images ? "radical" : s.object,
    level: s.data.level,
    characters: s.data.characters,
    slug: s.data.slug,
    documentUrl: s.data.document_url,
    meanings: JSON.stringify(
      s.data.meanings.map((m) => ({
        meaning: m.meaning,
        primary: m.primary,
        acceptedAnswer: m.accepted_answer,
      }))
    ),
    readings: s.data.readings
      ? JSON.stringify(
          s.data.readings.map((r) => ({
            reading: r.reading,
            primary: r.primary,
            acceptedAnswer: r.accepted_answer,
            type: r.type,
          }))
        )
      : null,
    auxiliaryMeanings: s.data.auxiliary_meanings
      ? JSON.stringify(s.data.auxiliary_meanings)
      : null,
    componentSubjectIds: s.data.component_subject_ids
      ? JSON.stringify(s.data.component_subject_ids)
      : null,
    amalgamationSubjectIds: s.data.amalgamation_subject_ids
      ? JSON.stringify(s.data.amalgamation_subject_ids)
      : null,
    visuallySimilarSubjectIds: s.data.visually_similar_subject_ids
      ? JSON.stringify(s.data.visually_similar_subject_ids)
      : null,
    meaningMnemonic: s.data.meaning_mnemonic,
    meaningHint: s.data.meaning_hint ?? null,
    readingMnemonic: s.data.reading_mnemonic ?? null,
    readingHint: s.data.reading_hint ?? null,
    contextSentences: s.data.context_sentences
      ? JSON.stringify(s.data.context_sentences)
      : null,
    partsOfSpeech: s.data.parts_of_speech
      ? JSON.stringify(s.data.parts_of_speech)
      : null,
    pronunciationAudios: s.data.pronunciation_audios
      ? JSON.stringify(
          s.data.pronunciation_audios.map((a) => ({
            url: a.url,
            contentType: a.content_type,
            metadata: {
              gender: a.metadata.gender,
              sourceId: a.metadata.source_id,
              pronunciation: a.metadata.pronunciation,
              voiceActorId: a.metadata.voice_actor_id,
              voiceActorName: a.metadata.voice_actor_name,
              voiceDescription: a.metadata.voice_description,
            },
          }))
        )
      : null,
    characterImages: s.data.character_images
      ? JSON.stringify(
          s.data.character_images.map((i) => ({
            url: i.url,
            contentType: i.content_type,
            metadata: { inlineStyles: i.metadata.inline_styles },
          }))
        )
      : null,
    hiddenAt: isoToUnix(s.data.hidden_at),
    dataUpdatedAt: s.data_updated_at,
  }
}

/**
 * Transform WaniKani assignment to database row
 */
function transformAssignment(a: WKAssignment) {
  return {
    id: a.id,
    subjectId: a.data.subject_id,
    subjectType: a.data.subject_type,
    srsStage: a.data.srs_stage,
    level: 0, // We'll need to look this up from subjects
    unlockedAt: isoToUnix(a.data.unlocked_at),
    startedAt: isoToUnix(a.data.started_at),
    passedAt: isoToUnix(a.data.passed_at),
    burnedAt: isoToUnix(a.data.burned_at),
    availableAt: isoToUnix(a.data.available_at),
    resurrectedAt: isoToUnix(a.data.resurrected_at),
    dataUpdatedAt: a.data_updated_at,
  }
}

/**
 * Transform WaniKani study material to database row
 */
function transformStudyMaterial(sm: WKStudyMaterial) {
  return {
    id: sm.id,
    subjectId: sm.data.subject_id,
    subjectType: sm.data.subject_type,
    meaningNote: sm.data.meaning_note,
    readingNote: sm.data.reading_note,
    meaningSynonyms: sm.data.meaning_synonyms
      ? JSON.stringify(sm.data.meaning_synonyms)
      : null,
    dataUpdatedAt: sm.data_updated_at,
  }
}

/**
 * Transform WaniKani voice actor to database row
 */
function transformVoiceActor(va: WKVoiceActor) {
  return {
    id: va.id,
    name: va.data.name,
    gender: va.data.gender,
    description: va.data.description,
    dataUpdatedAt: va.data_updated_at,
  }
}

/**
 * Transform WaniKani review statistic to database row
 */
function transformReviewStatistic(rs: WKReviewStatistic) {
  return {
    id: rs.id,
    subjectId: rs.data.subject_id,
    subjectType: rs.data.subject_type,
    meaningCorrect: rs.data.meaning_correct,
    meaningIncorrect: rs.data.meaning_incorrect,
    meaningMaxStreak: rs.data.meaning_max_streak,
    meaningCurrentStreak: rs.data.meaning_current_streak,
    readingCorrect: rs.data.reading_correct,
    readingIncorrect: rs.data.reading_incorrect,
    readingMaxStreak: rs.data.reading_max_streak,
    readingCurrentStreak: rs.data.reading_current_streak,
    percentageCorrect: rs.data.percentage_correct,
    hidden: rs.data.hidden,
    createdAt: isoToUnix(rs.data.created_at),
    dataUpdatedAt: rs.data_updated_at,
  }
}

/**
 * Transform WaniKani level progression to database row
 */
function transformLevelProgression(lp: WKLevelProgression) {
  return {
    id: lp.id,
    level: lp.data.level,
    createdAt: isoToUnix(lp.data.created_at),
    unlockedAt: isoToUnix(lp.data.unlocked_at),
    startedAt: isoToUnix(lp.data.started_at),
    passedAt: isoToUnix(lp.data.passed_at),
    completedAt: isoToUnix(lp.data.completed_at),
    abandonedAt: isoToUnix(lp.data.abandoned_at),
    dataUpdatedAt: lp.data_updated_at,
  }
}

/**
 * Transform WaniKani user to database row
 */
function transformUser(u: WKUser) {
  return {
    id: "current" as const,
    username: u.data.username,
    level: u.data.level,
    profileUrl: u.data.profile_url,
    maxLevelGrantedBySubscription: u.data.subscription.max_level_granted,
    subscribed: u.data.subscription.active,
    subscriptionEndsAt: isoToUnix(u.data.subscription.period_ends_at),
    startedAt: isoToUnix(u.data.started_at),
    vacationStartedAt: isoToUnix(u.data.current_vacation_started_at),
    dataUpdatedAt: new Date().toISOString(),
  }
}

/**
 * Perform initial sync - downloads all data from WaniKani
 */
export async function performInitialSync(db: Database): Promise<void> {
  const { startSync, updateProgress, completeSync, failSync } = useSyncStore.getState()
  const { setUser } = useAuthStore.getState()

  startSync(true)

  try {
    // Phase 1: User
    updateProgress({ phase: "user", message: "Syncing user profile...", current: 0, total: 1 })
    const userData = await wanikaniClient.getUser()
    setUser(userData)
    
    // Insert user into database
    const userRow = transformUser(userData)
    await db.insert(user).values(userRow).onConflictDoNothing()
    updateProgress({ current: 1 })

    // Phase 2: Subjects (largest dataset - ~9000 items)
    updateProgress({ phase: "subjects", message: "Syncing subjects...", current: 0, total: 0 })
    const allSubjects = await wanikaniClient.getAllSubjects({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing subjects (${loaded}/${total})...` })
    })

    // Transform and insert subjects
    const subjectRows = allSubjects.map(transformSubject)
    for (let i = 0; i < subjectRows.length; i += 100) {
      const batch = subjectRows.slice(i, i + 100)
      await db.insert(subjects).values(batch).onConflictDoNothing()
    }
    
    // Update sync metadata
    await db.insert(syncMetadata).values({
      id: "subjects",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allSubjects.length,
    }).onConflictDoNothing()

    // Phase 3: Assignments
    updateProgress({ phase: "assignments", message: "Syncing assignments...", current: 0, total: 0 })
    const allAssignments = await wanikaniClient.getAllAssignments({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing assignments (${loaded}/${total})...` })
    })

    const assignmentRows = allAssignments.map(transformAssignment)
    for (let i = 0; i < assignmentRows.length; i += 100) {
      const batch = assignmentRows.slice(i, i + 100)
      await db.insert(assignments).values(batch).onConflictDoNothing()
    }

    await db.insert(syncMetadata).values({
      id: "assignments",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allAssignments.length,
    }).onConflictDoNothing()

    // Phase 4: Study Materials
    updateProgress({ phase: "study_materials", message: "Syncing study materials...", current: 0, total: 0 })
    const allStudyMaterials = await wanikaniClient.getAllStudyMaterials({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing study materials (${loaded}/${total})...` })
    })

    if (allStudyMaterials.length > 0) {
      const studyMaterialRows = allStudyMaterials.map(transformStudyMaterial)
      for (let i = 0; i < studyMaterialRows.length; i += 100) {
        const batch = studyMaterialRows.slice(i, i + 100)
        await db.insert(studyMaterials).values(batch).onConflictDoNothing()
      }
    }

    await db.insert(syncMetadata).values({
      id: "study_materials",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allStudyMaterials.length,
    }).onConflictDoNothing()

    // Phase 5: Review Statistics
    updateProgress({ phase: "review_statistics", message: "Syncing review statistics...", current: 0, total: 0 })
    const allReviewStats = await wanikaniClient.getAllReviewStatistics({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing review statistics (${loaded}/${total})...` })
    })

    if (allReviewStats.length > 0) {
      const reviewStatRows = allReviewStats.map(transformReviewStatistic)
      for (let i = 0; i < reviewStatRows.length; i += 100) {
        const batch = reviewStatRows.slice(i, i + 100)
        await db.insert(reviewStatistics).values(batch).onConflictDoNothing()
      }
    }

    await db.insert(syncMetadata).values({
      id: "review_statistics",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allReviewStats.length,
    }).onConflictDoNothing()

    // Phase 6: Level Progressions
    updateProgress({ phase: "level_progressions", message: "Syncing level progressions...", current: 0, total: 0 })
    const allLevelProgressions = await wanikaniClient.getAllLevelProgressions({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing level progressions (${loaded}/${total})...` })
    })

    if (allLevelProgressions.length > 0) {
      const levelProgressionRows = allLevelProgressions.map(transformLevelProgression)
      for (let i = 0; i < levelProgressionRows.length; i += 100) {
        const batch = levelProgressionRows.slice(i, i + 100)
        await db.insert(levelProgressions).values(batch).onConflictDoNothing()
      }
    }

    await db.insert(syncMetadata).values({
      id: "level_progressions",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allLevelProgressions.length,
    }).onConflictDoNothing()

    // Phase 7: Voice Actors
    updateProgress({ phase: "voice_actors", message: "Syncing voice actors...", current: 0, total: 0 })
    const allVoiceActors = await wanikaniClient.getAllVoiceActors({}, (loaded, total) => {
      updateProgress({ current: loaded, total, message: `Syncing voice actors (${loaded}/${total})...` })
    })

    if (allVoiceActors.length > 0) {
      const voiceActorRows = allVoiceActors.map(transformVoiceActor)
      for (let i = 0; i < voiceActorRows.length; i += 100) {
        const batch = voiceActorRows.slice(i, i + 100)
        await db.insert(voiceActors).values(batch).onConflictDoNothing()
      }
    }

    await db.insert(syncMetadata).values({
      id: "voice_actors",
      lastSyncAt: new Date().toISOString(),
      lastFullSyncAt: Math.floor(Date.now() / 1000),
      itemCount: allVoiceActors.length,
    }).onConflictDoNothing()

    // Done!
    completeSync()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed"
    console.error("[sync] Initial sync failed:", error)
    failSync(message)
    throw error
  }
}

/**
 * Check if initial sync is needed (no subjects in database)
 */
export async function needsInitialSync(db: Database): Promise<boolean> {
  try {
    const result = await db.select().from(subjects).limit(1)
    return result.length === 0
  } catch {
    return true
  }
}
