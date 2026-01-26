import { eq } from "drizzle-orm"
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
import { getSyncMetadata } from "@/db/queries"
import type {
  WKSubject,
  WKAssignment,
  WKStudyMaterial,
  WKVoiceActor,
  WKReviewStatistic,
  WKLevelProgression,
  WKUser,
} from "@/lib/wanikani/types"
import { WaniKaniError } from "@/lib/wanikani/errors"

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
    level: 0,
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
 * Perform incremental sync - only downloads changed data since last sync
 */
export async function performIncrementalSync(db: Database): Promise<void> {
  const { startSync, updateProgress, completeSync, failSync } = useSyncStore.getState()
  const { setUser } = useAuthStore.getState()

  startSync(false)

  try {
    // Phase 1: User (always fetch)
    updateProgress({ phase: "user", message: "Syncing user profile...", current: 0, total: 1 })
    const userData = await wanikaniClient.getUser()
    setUser(userData)
    
    const userRow = transformUser(userData)
    await db
      .insert(user)
      .values(userRow)
      .onConflictDoUpdate({
        target: user.id,
        set: userRow,
      })
    updateProgress({ current: 1 })

    // Phase 2: Subjects (use updated_after)
    const subjectsMeta = await getSyncMetadata(db, "subjects")
    const subjectsUpdatedAfter = subjectsMeta?.lastSyncAt

    if (subjectsUpdatedAfter) {
      updateProgress({ phase: "subjects", message: "Checking for subject updates...", current: 0, total: 0 })
      const updatedSubjects = await wanikaniClient.getAllSubjects(
        { updated_after: subjectsUpdatedAfter },
        (loaded, total) => {
          updateProgress({ current: loaded, total, message: `Syncing subjects (${loaded}/${total})...` })
        }
      )

      if (updatedSubjects.length > 0) {
        for (const subject of updatedSubjects) {
          const row = transformSubject(subject)
          await db
            .insert(subjects)
            .values(row)
            .onConflictDoUpdate({
              target: subjects.id,
              set: row,
            })
        }
      }

      await db.update(syncMetadata)
        .set({ lastSyncAt: new Date().toISOString() })
        .where(eq(syncMetadata.id, "subjects"))
    }

    // Phase 3: Assignments (use updated_after)
    const assignmentsMeta = await getSyncMetadata(db, "assignments")
    const assignmentsUpdatedAfter = assignmentsMeta?.lastSyncAt

    if (assignmentsUpdatedAfter) {
      updateProgress({ phase: "assignments", message: "Checking for assignment updates...", current: 0, total: 0 })
      const updatedAssignments = await wanikaniClient.getAllAssignments(
        { updated_after: assignmentsUpdatedAfter },
        (loaded, total) => {
          updateProgress({ current: loaded, total, message: `Syncing assignments (${loaded}/${total})...` })
        }
      )

      if (updatedAssignments.length > 0) {
        for (const assignment of updatedAssignments) {
          const row = transformAssignment(assignment)
          await db
            .insert(assignments)
            .values(row)
            .onConflictDoUpdate({
              target: assignments.id,
              set: row,
            })
        }
      }

      await db.update(syncMetadata)
        .set({ lastSyncAt: new Date().toISOString() })
        .where(eq(syncMetadata.id, "assignments"))
    }

    // Phase 4: Study Materials (use updated_after)
    const studyMaterialsMeta = await getSyncMetadata(db, "study_materials")
    const studyMaterialsUpdatedAfter = studyMaterialsMeta?.lastSyncAt

    if (studyMaterialsUpdatedAfter) {
      updateProgress({ phase: "study_materials", message: "Checking for study material updates...", current: 0, total: 0 })
      const updatedStudyMaterials = await wanikaniClient.getAllStudyMaterials(
        { updated_after: studyMaterialsUpdatedAfter },
        (loaded, total) => {
          updateProgress({ current: loaded, total, message: `Syncing study materials (${loaded}/${total})...` })
        }
      )

      if (updatedStudyMaterials.length > 0) {
        for (const material of updatedStudyMaterials) {
          const row = transformStudyMaterial(material)
          await db
            .insert(studyMaterials)
            .values(row)
            .onConflictDoUpdate({
              target: studyMaterials.id,
              set: row,
            })
        }
      }

      await db.update(syncMetadata)
        .set({ lastSyncAt: new Date().toISOString() })
        .where(eq(syncMetadata.id, "study_materials"))
    }

    // Phase 5: Review Statistics (use updated_after)
    const reviewStatsMeta = await getSyncMetadata(db, "review_statistics")
    const reviewStatsUpdatedAfter = reviewStatsMeta?.lastSyncAt

    if (reviewStatsUpdatedAfter) {
      updateProgress({ phase: "review_statistics", message: "Checking for review statistic updates...", current: 0, total: 0 })
      const updatedReviewStats = await wanikaniClient.getAllReviewStatistics(
        { updated_after: reviewStatsUpdatedAfter },
        (loaded, total) => {
          updateProgress({ current: loaded, total, message: `Syncing review statistics (${loaded}/${total})...` })
        }
      )

      if (updatedReviewStats.length > 0) {
        for (const stat of updatedReviewStats) {
          const row = transformReviewStatistic(stat)
          await db
            .insert(reviewStatistics)
            .values(row)
            .onConflictDoUpdate({
              target: reviewStatistics.id,
              set: row,
            })
        }
      }

      await db.update(syncMetadata)
        .set({ lastSyncAt: new Date().toISOString() })
        .where(eq(syncMetadata.id, "review_statistics"))
    }

    // Phase 6: Level Progressions (use updated_after)
    const levelProgressionsMeta = await getSyncMetadata(db, "level_progressions")
    const levelProgressionsUpdatedAfter = levelProgressionsMeta?.lastSyncAt

    if (levelProgressionsUpdatedAfter) {
      updateProgress({ phase: "level_progressions", message: "Checking for level progression updates...", current: 0, total: 0 })
      const updatedLevelProgressions = await wanikaniClient.getAllLevelProgressions(
        { updated_after: levelProgressionsUpdatedAfter },
        (loaded, total) => {
          updateProgress({ current: loaded, total, message: `Syncing level progressions (${loaded}/${total})...` })
        }
      )

      if (updatedLevelProgressions.length > 0) {
        for (const progression of updatedLevelProgressions) {
          const row = transformLevelProgression(progression)
          await db
            .insert(levelProgressions)
            .values(row)
            .onConflictDoUpdate({
              target: levelProgressions.id,
              set: row,
            })
        }
      }

      await db.update(syncMetadata)
        .set({ lastSyncAt: new Date().toISOString() })
        .where(eq(syncMetadata.id, "level_progressions"))
    }

    // Phase 7: Voice Actors (rarely changes, skip incremental for now)
    updateProgress({ phase: "voice_actors", message: "Voice actors up to date", current: 1, total: 1 })

    // Done!
    completeSync()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed"
    console.error("[sync] Incremental sync failed:", error)
    failSync(message)
    throw error
  }
}

/**
 * Quick sync - lightweight sync that only fetches user + assignments
 * Use this for:
 * - App foreground sync (to catch reviews done elsewhere)
 * - After pending queue processing
 * 
 * This is silent (no UI state updates) and optimized for frequent calls.
 * Returns true if sync completed successfully, false otherwise.
 */
export async function performQuickSync(db: Database): Promise<boolean> {
  const { setUser } = useAuthStore.getState()

  try {
    console.log("[sync] Starting quick sync...")

    // 1. Fetch user (always, to check level/vacation status)
    const userData = await wanikaniClient.getUser()
    setUser(userData)

    const userRow = transformUser(userData)
    await db
      .insert(user)
      .values(userRow)
      .onConflictDoUpdate({
        target: user.id,
        set: userRow,
      })

    // 2. Fetch assignments (most critical for review availability)
    const assignmentsMeta = await getSyncMetadata(db, "assignments")
    let updatedAfter = assignmentsMeta?.lastSyncAt

    // If no sync metadata, use last hour as fallback to avoid full download
    if (!updatedAfter) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      updatedAfter = oneHourAgo.toISOString()
    }

    const updatedAssignments = await wanikaniClient.getAllAssignments(
      { updated_after: updatedAfter }
    )

    if (updatedAssignments.length > 0) {
      console.log(`[sync] Quick sync: ${updatedAssignments.length} assignments updated`)
      for (const assignment of updatedAssignments) {
        const row = transformAssignment(assignment)
        await db
          .insert(assignments)
          .values(row)
          .onConflictDoUpdate({
            target: assignments.id,
            set: row,
          })
      }
    }

    // Update sync metadata
    await db.update(syncMetadata)
      .set({ lastSyncAt: new Date().toISOString() })
      .where(eq(syncMetadata.id, "assignments"))

    console.log("[sync] Quick sync completed successfully")
    return true
  } catch (error) {
    // Handle auth errors specially
    if (error instanceof WaniKaniError && error.isAuthError) {
      console.error("[sync] Quick sync auth error:", error.message)
      throw error // Re-throw auth errors so caller can handle logout
    }

    // Log other errors but don't throw - quick sync is best-effort
    console.error("[sync] Quick sync failed:", error)
    return false
  }
}

/**
 * Full refresh sync - fetches all data types with updated_after
 * Use this for pull-to-refresh when user explicitly wants latest data
 * 
 * Similar to performQuickSync but includes review_statistics and level_progressions
 * Still silent (no UI state updates).
 */
export async function performFullRefreshSync(db: Database): Promise<boolean> {
  const { setUser } = useAuthStore.getState()

  try {
    console.log("[sync] Starting full refresh sync...")

    // 1. User
    const userData = await wanikaniClient.getUser()
    setUser(userData)
    const userRow = transformUser(userData)
    await db.insert(user).values(userRow).onConflictDoUpdate({ target: user.id, set: userRow })

    // Helper to get updated_after with 1 hour fallback
    const getUpdatedAfter = async (key: string) => {
      const meta = await getSyncMetadata(db, key)
      if (meta?.lastSyncAt) return meta.lastSyncAt
      return new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }

    // 2. Assignments
    const assignmentsUpdatedAfter = await getUpdatedAfter("assignments")
    const updatedAssignments = await wanikaniClient.getAllAssignments({ updated_after: assignmentsUpdatedAfter })
    if (updatedAssignments.length > 0) {
      console.log(`[sync] Full refresh: ${updatedAssignments.length} assignments`)
      for (const assignment of updatedAssignments) {
        const row = transformAssignment(assignment)
        await db.insert(assignments).values(row).onConflictDoUpdate({ target: assignments.id, set: row })
      }
    }
    await db.update(syncMetadata).set({ lastSyncAt: new Date().toISOString() }).where(eq(syncMetadata.id, "assignments"))

    // 3. Review Statistics (for accuracy updates)
    const reviewStatsUpdatedAfter = await getUpdatedAfter("review_statistics")
    const updatedReviewStats = await wanikaniClient.getAllReviewStatistics({ updated_after: reviewStatsUpdatedAfter })
    if (updatedReviewStats.length > 0) {
      console.log(`[sync] Full refresh: ${updatedReviewStats.length} review statistics`)
      for (const stat of updatedReviewStats) {
        const row = transformReviewStatistic(stat)
        await db.insert(reviewStatistics).values(row).onConflictDoUpdate({ target: reviewStatistics.id, set: row })
      }
    }
    await db.update(syncMetadata).set({ lastSyncAt: new Date().toISOString() }).where(eq(syncMetadata.id, "review_statistics"))

    // 4. Level Progressions (for level-up detection)
    const levelProgressionsUpdatedAfter = await getUpdatedAfter("level_progressions")
    const updatedLevelProgressions = await wanikaniClient.getAllLevelProgressions({ updated_after: levelProgressionsUpdatedAfter })
    if (updatedLevelProgressions.length > 0) {
      console.log(`[sync] Full refresh: ${updatedLevelProgressions.length} level progressions`)
      for (const progression of updatedLevelProgressions) {
        const row = transformLevelProgression(progression)
        await db.insert(levelProgressions).values(row).onConflictDoUpdate({ target: levelProgressions.id, set: row })
      }
    }
    await db.update(syncMetadata).set({ lastSyncAt: new Date().toISOString() }).where(eq(syncMetadata.id, "level_progressions"))

    console.log("[sync] Full refresh sync completed successfully")
    return true
  } catch (error) {
    if (error instanceof WaniKaniError && error.isAuthError) {
      console.error("[sync] Full refresh sync auth error:", error.message)
      throw error
    }
    console.error("[sync] Full refresh sync failed:", error)
    return false
  }
}
