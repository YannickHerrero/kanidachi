import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"
import { eq } from "drizzle-orm"

import {
  pendingProgress,
  assignments,
} from "@/db/schema"
import { wanikaniClient } from "@/lib/wanikani/client"
import { WaniKaniError } from "@/lib/wanikani/errors"

type Database = SQLJsDatabase | ExpoSQLiteDatabase | null

export interface QueueProcessResult {
  processed: number
  failed: number
  remaining: number
}

/**
 * Process a single pending progress item
 * Returns true if successfully processed (should be removed from queue)
 * Returns false if should be retried later
 * Throws if there's a permanent failure
 */
async function processPendingItem(
  db: Database,
  item: typeof pendingProgress.$inferSelect
): Promise<boolean> {
  if (!db) return false

  try {
    if (item.isLesson) {
      // Mark lesson as started
      const createdAt = new Date(item.createdAt * 1000)
      const response = await wanikaniClient.startAssignment(item.assignmentId, createdAt)

      // Update local assignment with response data
      if (response.data) {
        await db
          .update(assignments)
          .set({
            srsStage: response.data.srs_stage,
            startedAt: response.data.started_at
              ? Math.floor(new Date(response.data.started_at).getTime() / 1000)
              : null,
            availableAt: response.data.available_at
              ? Math.floor(new Date(response.data.available_at).getTime() / 1000)
              : null,
            dataUpdatedAt: response.data_updated_at,
          })
          .where(eq(assignments.id, item.assignmentId))
      }
    } else {
      // Submit review
      const createdAt = new Date(item.createdAt * 1000)
      const response = await wanikaniClient.createReview(
        item.assignmentId,
        item.meaningWrongCount,
        item.readingWrongCount,
        createdAt
      )

      // Update local assignment with response data
      if (response.resources_updated?.assignment) {
        const updatedAssignment = response.resources_updated.assignment
        await db
          .update(assignments)
          .set({
            srsStage: updatedAssignment.data.srs_stage,
            availableAt: updatedAssignment.data.available_at
              ? Math.floor(new Date(updatedAssignment.data.available_at).getTime() / 1000)
              : null,
            burnedAt: updatedAssignment.data.burned_at
              ? Math.floor(new Date(updatedAssignment.data.burned_at).getTime() / 1000)
              : null,
            passedAt: updatedAssignment.data.passed_at
              ? Math.floor(new Date(updatedAssignment.data.passed_at).getTime() / 1000)
              : null,
            dataUpdatedAt: updatedAssignment.data_updated_at,
          })
          .where(eq(assignments.id, item.assignmentId))
      }
    }

    return true
  } catch (error) {
    if (error instanceof WaniKaniError) {
      // 422 errors mean the resource is in an invalid state (already started, etc.)
      // Don't retry these - just remove from queue
      if (error.code === 422) {
        console.warn(
          `[PendingQueue] Removing invalid item ${item.id}: ${error.message}`
        )
        return true // Remove from queue
      }

      // 404 means the assignment doesn't exist anymore
      if (error.code === 404) {
        console.warn(
          `[PendingQueue] Removing missing item ${item.id}: ${error.message}`
        )
        return true // Remove from queue
      }

      // Rate limit or server errors - retry later
      if (error.isRateLimitError || error.isServerError) {
        return false
      }

      // Auth errors - stop processing entirely
      if (error.code === 401) {
        throw error
      }
    }

    // Unknown error - log and retry later
    console.error(`[PendingQueue] Error processing item ${item.id}:`, error)
    return false
  }
}

/**
 * Process all pending progress items in the queue
 */
export async function processQueue(db: Database): Promise<QueueProcessResult> {
  if (!db) {
    return { processed: 0, failed: 0, remaining: 0 }
  }

  // Get all pending items, oldest first
  const items = await db
    .select()
    .from(pendingProgress)
    .orderBy(pendingProgress.createdAt)

  if (items.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 }
  }

  let processed = 0
  let failed = 0

  for (const item of items) {
    // Check if we should skip this item (too many recent attempts)
    if (item.attempts > 0 && item.lastAttemptAt) {
      const timeSinceLastAttempt = Date.now() / 1000 - item.lastAttemptAt
      const backoffSeconds = Math.min(300, Math.pow(2, item.attempts) * 10) // Max 5 minutes

      if (timeSinceLastAttempt < backoffSeconds) {
        failed++
        continue
      }
    }

    // Skip items with too many attempts (max 10 retries)
    if (item.attempts >= 10) {
      console.warn(`[PendingQueue] Skipping item ${item.id} - too many attempts`)
      failed++
      continue
    }

    try {
      const success = await processPendingItem(db, item)

      if (success) {
        // Remove from queue
        await db.delete(pendingProgress).where(eq(pendingProgress.id, item.id))
        processed++
      } else {
        // Update attempt count
        await db
          .update(pendingProgress)
          .set({
            attempts: item.attempts + 1,
            lastAttemptAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(pendingProgress.id, item.id))
        failed++
      }
    } catch (error) {
      // Fatal error (e.g., auth failure) - stop processing
      console.error("[PendingQueue] Fatal error, stopping:", error)
      break
    }
  }

  // Get remaining count
  const remaining = await db
    .select()
    .from(pendingProgress)

  return {
    processed,
    failed,
    remaining: remaining.length,
  }
}

/**
 * Get the count of pending items
 */
export async function getPendingCount(db: Database): Promise<number> {
  if (!db) return 0

  const result = await db.select().from(pendingProgress)
  return result.length
}

/**
 * Clear all pending items (use with caution)
 */
export async function clearQueue(db: Database): Promise<void> {
  if (!db) return
  await db.delete(pendingProgress)
}
