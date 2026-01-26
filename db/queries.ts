import { and, eq, gte, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm"
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"
import {
  assignments,
  subjects,
  studyMaterials,
  pendingProgress,
  syncMetadata,
  user,
  voiceActors,
  audioCache,
  type Meaning,
  type Reading,
  type ContextSentence,
  type PronunciationAudio,
  type SubjectType,
} from "./schema"

// Use a union type for database
type Database = SQLJsDatabase | ExpoSQLiteDatabase | null

// SRS stage categories
const SRS_APPRENTICE = [1, 2, 3, 4]
const SRS_GURU = [5, 6]
const SRS_MASTER = [7]
const SRS_ENLIGHTENED = [8]
const SRS_BURNED = [9]

// ============================================================================
// SUBJECT QUERIES
// ============================================================================

export async function getSubjectById(db: Database, id: number) {
  if (!db) return null
  const result = await db.select().from(subjects).where(eq(subjects.id, id))
  return result[0] ?? null
}

export async function getSubjectsByIds(db: Database, ids: number[]) {
  if (!db || ids.length === 0) return []
  return db.select().from(subjects).where(inArray(subjects.id, ids))
}

export async function getSubjectsByLevel(db: Database, level: number) {
  if (!db) return []
  return db.select().from(subjects).where(eq(subjects.level, level))
}

export async function getSubjectsByType(db: Database, type: SubjectType) {
  if (!db) return []
  return db.select().from(subjects).where(eq(subjects.type, type))
}

export async function searchSubjects(db: Database, query: string, limit = 50) {
  if (!db) return []
  const searchTerm = `%${query.toLowerCase()}%`
  const result = await db
    .select()
    .from(subjects)
    .where(
      or(
        sql`lower(${subjects.characters}) LIKE ${searchTerm}`,
        sql`lower(${subjects.slug}) LIKE ${searchTerm}`,
        sql`lower(${subjects.meanings}) LIKE ${searchTerm}`
      )
    )
  return result.slice(0, limit)
}

export async function getAllSubjectsCount(db: Database): Promise<number> {
  if (!db) return 0
  const result = await (db as ExpoSQLiteDatabase)
    .select({ cnt: sql<number>`count(*)` })
    .from(subjects)
  return (result[0] as { cnt: number })?.cnt ?? 0
}

// ============================================================================
// ASSIGNMENT QUERIES
// ============================================================================

export async function getAssignmentBySubjectId(db: Database, subjectId: number) {
  if (!db) return null
  const result = await db
    .select()
    .from(assignments)
    .where(eq(assignments.subjectId, subjectId))
  return result[0] ?? null
}

export async function getAssignmentsBySubjectIds(db: Database, subjectIds: number[]) {
  if (!db || subjectIds.length === 0) return []
  return db.select().from(assignments).where(inArray(assignments.subjectId, subjectIds))
}

/**
 * Get assignments available for review (availableAt <= now)
 */
export async function getAvailableReviews(db: Database) {
  if (!db) return []
  const now = Math.floor(Date.now() / 1000)
  return db
    .select()
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.startedAt), // Lesson completed
        isNull(assignments.burnedAt), // Not burned
        lte(assignments.availableAt, now) // Available now
      )
    )
}

/**
 * Get count of available reviews
 */
export async function getAvailableReviewCount(db: Database): Promise<number> {
  if (!db) return 0
  const now = Math.floor(Date.now() / 1000)
  const result = await (db as ExpoSQLiteDatabase)
    .select({ cnt: sql<number>`count(*)` })
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.startedAt),
        isNull(assignments.burnedAt),
        lte(assignments.availableAt, now)
      )
    )
  return (result[0] as { cnt: number })?.cnt ?? 0
}

/**
 * Get assignments available for lessons (unlocked but not started)
 */
export async function getAvailableLessons(db: Database) {
  if (!db) return []
  return db
    .select()
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.unlockedAt), // Unlocked
        isNull(assignments.startedAt) // Not started
      )
    )
}

/**
 * Get count of available lessons
 */
export async function getAvailableLessonCount(db: Database): Promise<number> {
  if (!db) return 0
  const result = await (db as ExpoSQLiteDatabase)
    .select({ cnt: sql<number>`count(*)` })
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.unlockedAt),
        isNull(assignments.startedAt)
      )
    )
  return (result[0] as { cnt: number })?.cnt ?? 0
}

/**
 * Get review forecast - count of reviews becoming available in each hour
 */
export async function getReviewForecast(db: Database, hours = 24) {
  if (!db) return []
  const now = Math.floor(Date.now() / 1000)
  const endTime = now + hours * 3600

  const result = await (db as ExpoSQLiteDatabase)
    .select({
      hour: sql<number>`cast((${assignments.availableAt} - ${now}) / 3600 as integer)`,
      cnt: sql<number>`count(*)`,
    })
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.startedAt),
        isNull(assignments.burnedAt),
        gte(assignments.availableAt, now),
        lte(assignments.availableAt, endTime)
      )
    )
    .groupBy(sql`cast((${assignments.availableAt} - ${now}) / 3600 as integer)`)
    .orderBy(sql`cast((${assignments.availableAt} - ${now}) / 3600 as integer)`)

  return (result as Array<{ hour: number; cnt: number }>).map(r => ({ hour: r.hour, count: r.cnt }))
}

/**
 * Get SRS stage breakdown
 */
export async function getSrsBreakdown(db: Database) {
  if (!db) return { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 }
  
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      srsStage: assignments.srsStage,
      cnt: sql<number>`count(*)`,
    })
    .from(assignments)
    .where(isNotNull(assignments.startedAt))
    .groupBy(assignments.srsStage)

  const breakdown = {
    apprentice: 0,
    guru: 0,
    master: 0,
    enlightened: 0,
    burned: 0,
  }

  for (const row of result as Array<{ srsStage: number; cnt: number }>) {
    const stage = row.srsStage
    const count = row.cnt
    if (SRS_APPRENTICE.includes(stage)) {
      breakdown.apprentice += count
    } else if (SRS_GURU.includes(stage)) {
      breakdown.guru += count
    } else if (SRS_MASTER.includes(stage)) {
      breakdown.master += count
    } else if (SRS_ENLIGHTENED.includes(stage)) {
      breakdown.enlightened += count
    } else if (SRS_BURNED.includes(stage)) {
      breakdown.burned += count
    }
  }

  return breakdown
}

// ============================================================================
// STUDY MATERIAL QUERIES
// ============================================================================

export async function getStudyMaterialBySubjectId(db: Database, subjectId: number) {
  if (!db) return null
  const result = await db
    .select()
    .from(studyMaterials)
    .where(eq(studyMaterials.subjectId, subjectId))
  return result[0] ?? null
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function getCurrentUser(db: Database) {
  if (!db) return null
  const result = await db.select().from(user).where(eq(user.id, "current"))
  return result[0] ?? null
}

// ============================================================================
// PENDING PROGRESS QUERIES
// ============================================================================

export async function getPendingProgress(db: Database) {
  if (!db) return []
  return db.select().from(pendingProgress).orderBy(pendingProgress.createdAt)
}

export async function getPendingProgressCount(db: Database): Promise<number> {
  if (!db) return 0
  const result = await (db as ExpoSQLiteDatabase)
    .select({ cnt: sql<number>`count(*)` })
    .from(pendingProgress)
  return (result[0] as { cnt: number })?.cnt ?? 0
}

export async function addPendingProgress(
  db: Database,
  data: {
    assignmentId: number
    subjectId: number
    isLesson: boolean
    meaningWrongCount?: number
    readingWrongCount?: number
  }
) {
  if (!db) return
  return db.insert(pendingProgress).values({
    assignmentId: data.assignmentId,
    subjectId: data.subjectId,
    isLesson: data.isLesson,
    meaningWrongCount: data.meaningWrongCount ?? 0,
    readingWrongCount: data.readingWrongCount ?? 0,
    createdAt: Math.floor(Date.now() / 1000),
  })
}

export async function removePendingProgress(db: Database, id: string) {
  if (!db) return
  return db.delete(pendingProgress).where(eq(pendingProgress.id, id))
}

export async function updatePendingProgressAttempt(
  db: Database,
  id: string,
  error?: string
) {
  if (!db) return
  return db
    .update(pendingProgress)
    .set({
      attempts: sql`${pendingProgress.attempts} + 1`,
      lastAttemptAt: Math.floor(Date.now() / 1000),
      lastError: error,
    })
    .where(eq(pendingProgress.id, id))
}

// ============================================================================
// SYNC METADATA QUERIES
// ============================================================================

export async function getSyncMetadata(db: Database, entityType: string) {
  if (!db) return null
  const result = await db
    .select()
    .from(syncMetadata)
    .where(eq(syncMetadata.id, entityType))
  return result[0] ?? null
}

export async function updateSyncMetadata(
  db: Database,
  entityType: string,
  data: {
    lastSyncAt?: string
    lastFullSyncAt?: number
    itemCount?: number
  }
) {
  if (!db) return
  const existing = await getSyncMetadata(db, entityType)
  if (existing) {
    return db
      .update(syncMetadata)
      .set(data)
      .where(eq(syncMetadata.id, entityType))
  }
  return db.insert(syncMetadata).values({
    id: entityType,
    ...data,
  })
}

// ============================================================================
// VOICE ACTOR QUERIES
// ============================================================================

export async function getAllVoiceActors(db: Database) {
  if (!db) return []
  return db.select().from(voiceActors)
}

export async function getVoiceActorById(db: Database, id: number) {
  if (!db) return null
  const result = await db.select().from(voiceActors).where(eq(voiceActors.id, id))
  return result[0] ?? null
}

// ============================================================================
// LEVEL PROGRESS QUERIES
// ============================================================================

/**
 * Get current level progress (percentage of kanji passed at current level)
 */
export async function getLevelProgress(db: Database, level: number) {
  if (!db) return { total: 0, passed: 0, percentage: 0 }
  
  // Get all kanji at this level
  const kanjiAtLevel = await (db as ExpoSQLiteDatabase)
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.level, level), eq(subjects.type, "kanji")))

  if (kanjiAtLevel.length === 0) return { total: 0, passed: 0, percentage: 0 }

  const kanjiIds = kanjiAtLevel.map((k) => k.id)

  // Get passed kanji (passedAt is set)
  const passedKanji = await (db as ExpoSQLiteDatabase)
    .select({ cnt: sql<number>`count(*)` })
    .from(assignments)
    .where(
      and(
        inArray(assignments.subjectId, kanjiIds),
        isNotNull(assignments.passedAt)
      )
    )

  const total = kanjiAtLevel.length
  const passed = (passedKanji[0] as { cnt: number })?.cnt ?? 0
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0

  return { total, passed, percentage }
}

// ============================================================================
// AUDIO CACHE QUERIES
// ============================================================================

export async function getCachedAudio(
  db: Database,
  subjectId: number,
  voiceActorId: number
) {
  if (!db) return null
  const result = await db
    .select()
    .from(audioCache)
    .where(
      and(
        eq(audioCache.subjectId, subjectId),
        eq(audioCache.voiceActorId, voiceActorId)
      )
    )
  return result[0] ?? null
}

export async function addCachedAudio(
  db: Database,
  data: {
    subjectId: number
    voiceActorId: number
    url: string
    localPath: string
    fileSize?: number
  }
) {
  if (!db) return
  return db.insert(audioCache).values({
    subjectId: data.subjectId,
    voiceActorId: data.voiceActorId,
    url: data.url,
    localPath: data.localPath,
    fileSize: data.fileSize,
    cachedAt: Math.floor(Date.now() / 1000),
  })
}

// ============================================================================
// HELPER FUNCTIONS - Parse JSON fields from subjects
// ============================================================================

export function parseMeanings(meaningsJson: string): Meaning[] {
  try {
    return JSON.parse(meaningsJson)
  } catch {
    return []
  }
}

export function parseReadings(readingsJson: string | null): Reading[] {
  if (!readingsJson) return []
  try {
    return JSON.parse(readingsJson)
  } catch {
    return []
  }
}

export function parseContextSentences(sentencesJson: string | null): ContextSentence[] {
  if (!sentencesJson) return []
  try {
    return JSON.parse(sentencesJson)
  } catch {
    return []
  }
}

export function parsePronunciationAudios(audiosJson: string | null): PronunciationAudio[] {
  if (!audiosJson) return []
  try {
    return JSON.parse(audiosJson)
  } catch {
    return []
  }
}

export function parseNumberArray(json: string | null): number[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

export function parseStringArray(json: string | null): string[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

// ============================================================================
// BROWSE QUERIES
// ============================================================================

/**
 * Get all subjects for a level with their assignments
 */
export async function getSubjectsWithAssignmentsByLevel(db: Database, level: number) {
  if (!db) return []
  
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      subject: subjects,
      assignment: assignments,
    })
    .from(subjects)
    .leftJoin(assignments, eq(subjects.id, assignments.subjectId))
    .where(eq(subjects.level, level))
    .orderBy(subjects.type, subjects.id)
  
  return result
}

/**
 * Get subject counts per level (for level grid)
 */
export async function getSubjectCountsByLevel(db: Database) {
  if (!db) return []
  
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      level: subjects.level,
      cnt: sql<number>`count(*)`,
    })
    .from(subjects)
    .groupBy(subjects.level)
    .orderBy(subjects.level)
  
  return result as Array<{ level: number; cnt: number }>
}

/**
 * Get passed subject counts per level (for level grid progress)
 */
export async function getPassedCountsByLevel(db: Database) {
  if (!db) return []
  
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      level: assignments.level,
      cnt: sql<number>`count(*)`,
    })
    .from(assignments)
    .where(isNotNull(assignments.passedAt))
    .groupBy(assignments.level)
    .orderBy(assignments.level)
  
  return result as Array<{ level: number; cnt: number }>
}

/**
 * Enhanced search with better matching
 * Searches by characters (exact prefix), meanings, and readings
 */
export async function searchSubjectsEnhanced(
  db: Database,
  query: string,
  limit = 50
) {
  if (!db || !query.trim()) return []
  
  const searchTerm = query.toLowerCase().trim()
  const likeTerm = `%${searchTerm}%`
  
  // Search subjects
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      subject: subjects,
      assignment: assignments,
    })
    .from(subjects)
    .leftJoin(assignments, eq(subjects.id, assignments.subjectId))
    .where(
      or(
        // Exact character match (highest priority)
        eq(sql`lower(${subjects.characters})`, searchTerm),
        // Character prefix match
        sql`lower(${subjects.characters}) LIKE ${searchTerm + '%'}`,
        // Slug match
        sql`lower(${subjects.slug}) LIKE ${likeTerm}`,
        // Meaning match
        sql`lower(${subjects.meanings}) LIKE ${likeTerm}`,
        // Reading match
        sql`lower(${subjects.readings}) LIKE ${likeTerm}`
      )
    )
  
  // Sort results: exact character matches first, then by level
  const sorted = result.sort((a, b) => {
    const aChar = a.subject.characters?.toLowerCase() ?? ""
    const bChar = b.subject.characters?.toLowerCase() ?? ""
    
    // Exact character match gets highest priority
    const aExact = aChar === searchTerm ? 0 : 1
    const bExact = bChar === searchTerm ? 0 : 1
    if (aExact !== bExact) return aExact - bExact
    
    // Then character prefix match
    const aPrefix = aChar.startsWith(searchTerm) ? 0 : 1
    const bPrefix = bChar.startsWith(searchTerm) ? 0 : 1
    if (aPrefix !== bPrefix) return aPrefix - bPrefix
    
    // Then by level
    return a.subject.level - b.subject.level
  })
  
  return sorted.slice(0, limit)
}

/**
 * Get a single subject with its assignment
 */
export async function getSubjectWithAssignment(db: Database, id: number) {
  if (!db) return null
  
  const result = await (db as ExpoSQLiteDatabase)
    .select({
      subject: subjects,
      assignment: assignments,
    })
    .from(subjects)
    .leftJoin(assignments, eq(subjects.id, assignments.subjectId))
    .where(eq(subjects.id, id))
  
  return result[0] ?? null
}

/**
 * Get study material for a subject
 */
export async function getStudyMaterialForSubject(db: Database, subjectId: number) {
  if (!db) return null
  const result = await db
    .select()
    .from(studyMaterials)
    .where(eq(studyMaterials.subjectId, subjectId))
  return result[0] ?? null
}
