// Using the legacy FileSystem API for compatibility
import {
  cacheDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  downloadAsync,
  deleteAsync,
  readDirectoryAsync,
} from "expo-file-system/legacy"
import { Platform } from "react-native"

import type { PronunciationAudio } from "@/db/schema"

// Audio cache directory
const AUDIO_CACHE_DIR = `${cacheDirectory ?? ""}audio/`

// Ensure the cache directory exists
async function ensureCacheDir(): Promise<void> {
  if (Platform.OS === "web" || !cacheDirectory) return

  const dirInfo = await getInfoAsync(AUDIO_CACHE_DIR)
  if (!dirInfo.exists) {
    await makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true })
  }
}

/**
 * Generate a unique filename for cached audio
 */
function getCacheFilename(subjectId: number, voiceActorId: number): string {
  return `${subjectId}_${voiceActorId}.mp3`
}

/**
 * Get the local cache path for an audio file
 */
export function getLocalCachePath(subjectId: number, voiceActorId: number): string {
  return `${AUDIO_CACHE_DIR}${getCacheFilename(subjectId, voiceActorId)}`
}

/**
 * Check if an audio file is cached locally
 */
export async function isAudioCached(
  subjectId: number,
  voiceActorId: number
): Promise<boolean> {
  if (Platform.OS === "web" || !cacheDirectory) return false

  const localPath = getLocalCachePath(subjectId, voiceActorId)
  const fileInfo = await getInfoAsync(localPath)
  return fileInfo.exists
}

/**
 * Download and cache an audio file
 * Returns the local file path on success
 */
export async function cacheAudio(
  subjectId: number,
  voiceActorId: number,
  url: string
): Promise<string | null> {
  if (Platform.OS === "web" || !cacheDirectory) return null

  try {
    await ensureCacheDir()

    const localPath = getLocalCachePath(subjectId, voiceActorId)

    // Check if already cached
    const fileInfo = await getInfoAsync(localPath)
    if (fileInfo.exists) {
      return localPath
    }

    // Download the file
    const downloadResult = await downloadAsync(url, localPath)

    if (downloadResult.status !== 200) {
      console.error("Failed to download audio:", downloadResult.status)
      return null
    }

    return localPath
  } catch (error) {
    console.error("Failed to cache audio:", error)
    return null
  }
}

/**
 * Get the audio source (local path if cached, otherwise URL)
 * This implements "stream and cache" - plays from URL and caches in background
 */
export async function getAudioSource(
  subjectId: number,
  voiceActorId: number,
  url: string
): Promise<{ uri: string; shouldCache: boolean }> {
  if (Platform.OS === "web" || !cacheDirectory) {
    return { uri: url, shouldCache: false }
  }

  // Check if already cached
  const localPath = getLocalCachePath(subjectId, voiceActorId)
  const fileInfo = await getInfoAsync(localPath)

  if (fileInfo.exists) {
    return { uri: localPath, shouldCache: false }
  }

  // Not cached - return URL and indicate we should cache
  return { uri: url, shouldCache: true }
}

/**
 * Select the best audio for playback based on voice actor preference
 */
export function selectAudio(
  audios: PronunciationAudio[],
  preferredVoiceActorId?: number
): PronunciationAudio | null {
  if (audios.length === 0) return null

  // If a preferred voice actor is set, try to find their audio
  if (preferredVoiceActorId) {
    const preferred = audios.find(
      (a) => a.metadata.voiceActorId === preferredVoiceActorId
    )
    if (preferred) return preferred
  }

  // Otherwise return the first audio (WaniKani returns them in order of preference)
  return audios[0]
}

/**
 * Clear all cached audio files
 */
export async function clearAudioCache(): Promise<void> {
  if (Platform.OS === "web" || !cacheDirectory) return

  try {
    const dirInfo = await getInfoAsync(AUDIO_CACHE_DIR)
    if (dirInfo.exists) {
      await deleteAsync(AUDIO_CACHE_DIR, { idempotent: true })
    }
  } catch (error) {
    console.error("Failed to clear audio cache:", error)
  }
}

/**
 * Get the total size of the audio cache in bytes
 */
export async function getAudioCacheSize(): Promise<number> {
  if (Platform.OS === "web" || !cacheDirectory) return 0

  try {
    const dirInfo = await getInfoAsync(AUDIO_CACHE_DIR)
    if (!dirInfo.exists) return 0

    const files = await readDirectoryAsync(AUDIO_CACHE_DIR)
    let totalSize = 0

    for (const file of files) {
      const fileInfo = await getInfoAsync(`${AUDIO_CACHE_DIR}${file}`)
      if (fileInfo.exists && "size" in fileInfo) {
        totalSize += fileInfo.size ?? 0
      }
    }

    return totalSize
  } catch (error) {
    console.error("Failed to get audio cache size:", error)
    return 0
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

/**
 * Preload audio for a list of items
 * Downloads audio files in the background without blocking
 * @param items Array of items with subjectId and audios
 * @param preferredVoiceActorId Optional voice actor preference
 * @param limit Maximum number of items to preload
 */
export async function preloadAudio(
  items: Array<{
    subjectId: number
    audios: PronunciationAudio[]
  }>,
  preferredVoiceActorId?: number,
  limit = 5
): Promise<void> {
  if (Platform.OS === "web" || !cacheDirectory) return

  await ensureCacheDir()

  // Process items up to the limit, in background (don't await all)
  const itemsToPreload = items.slice(0, limit)

  for (const item of itemsToPreload) {
    const audio = selectAudio(item.audios, preferredVoiceActorId)
    if (!audio) continue

    const voiceActorId = audio.metadata.voiceActorId

    // Check if already cached
    const isCached = await isAudioCached(item.subjectId, voiceActorId)
    if (isCached) continue

    // Start caching in background (don't await)
    cacheAudio(item.subjectId, voiceActorId, audio.url).catch((err) => {
      console.log("[Audio Preload] Failed to cache:", item.subjectId, err)
    })
  }
}
