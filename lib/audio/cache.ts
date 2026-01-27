import { File, Directory, Paths } from "expo-file-system"
import { Platform } from "react-native"

import type { PronunciationAudio } from "@/db/schema"

// Audio cache directory
const AUDIO_CACHE_DIR_NAME = "audio"

/**
 * Get the audio cache directory
 */
function getAudioCacheDir(): Directory {
  return new Directory(Paths.cache, AUDIO_CACHE_DIR_NAME)
}

/**
 * Ensure the cache directory exists
 */
function ensureCacheDir(): void {
  if (Platform.OS === "web") return

  const cacheDir = getAudioCacheDir()
  if (!cacheDir.exists) {
    cacheDir.create()
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
  const cacheDir = getAudioCacheDir()
  const filename = getCacheFilename(subjectId, voiceActorId)
  return `${cacheDir.uri}/${filename}`
}

/**
 * Check if an audio file is cached locally
 */
export function isAudioCached(
  subjectId: number,
  voiceActorId: number
): boolean {
  if (Platform.OS === "web") return false

  const cacheDir = getAudioCacheDir()
  const filename = getCacheFilename(subjectId, voiceActorId)
  const file = new File(cacheDir, filename)
  return file.exists
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
  if (Platform.OS === "web") return null

  try {
    ensureCacheDir()

    const cacheDir = getAudioCacheDir()
    const filename = getCacheFilename(subjectId, voiceActorId)
    const file = new File(cacheDir, filename)

    // Check if already cached
    if (file.exists) {
      return file.uri
    }

    // Download the file
    const downloadedFile = await File.downloadFileAsync(url, file, {
      idempotent: true,
    })

    return downloadedFile.uri
  } catch (error) {
    console.error("Failed to cache audio:", error)
    return null
  }
}

/**
 * Get the audio source (local path if cached, otherwise URL)
 * This implements "stream and cache" - plays from URL and caches in background
 */
export function getAudioSource(
  subjectId: number,
  voiceActorId: number,
  url: string
): { uri: string; shouldCache: boolean } {
  if (Platform.OS === "web") {
    return { uri: url, shouldCache: false }
  }

  // Check if already cached
  const cacheDir = getAudioCacheDir()
  const filename = getCacheFilename(subjectId, voiceActorId)
  const file = new File(cacheDir, filename)

  if (file.exists) {
    return { uri: file.uri, shouldCache: false }
  }

  // Not cached - return URL and indicate we should cache
  return { uri: url, shouldCache: true }
}

/**
 * Select the best audio for playback based on voice actor preference
 * Prioritizes MP3 format (audio/mpeg) for iOS compatibility
 */
export function selectAudio(
  audios: PronunciationAudio[],
  preferredVoiceActorId?: number
): PronunciationAudio | null {
  if (audios.length === 0) return null

  // Filter to only MP3 format for iOS compatibility
  // iOS doesn't support OGG format natively
  const mp3Audios = audios.filter((a) => a.contentType === "audio/mpeg")

  // Use MP3 audios if available, otherwise fall back to all audios
  const availableAudios = mp3Audios.length > 0 ? mp3Audios : audios

  // If a preferred voice actor is set, try to find their audio
  if (preferredVoiceActorId) {
    const preferred = availableAudios.find(
      (a) => a.metadata.voiceActorId === preferredVoiceActorId
    )
    if (preferred) return preferred
  }

  // Otherwise return the first audio (WaniKani returns them in order of preference)
  return availableAudios[0]
}

/**
 * Clear all cached audio files
 */
export async function clearAudioCache(): Promise<void> {
  if (Platform.OS === "web") return

  try {
    const cacheDir = getAudioCacheDir()
    if (cacheDir.exists) {
      cacheDir.delete()
    }
  } catch (error) {
    console.error("Failed to clear audio cache:", error)
  }
}

/**
 * Get the total size of the audio cache in bytes
 */
export function getAudioCacheSize(): number {
  if (Platform.OS === "web") return 0

  try {
    const cacheDir = getAudioCacheDir()
    if (!cacheDir.exists) return 0

    return cacheDir.size ?? 0
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
  if (Platform.OS === "web") return

  ensureCacheDir()

  // Process items up to the limit, in background (don't await all)
  const itemsToPreload = items.slice(0, limit)

  for (const item of itemsToPreload) {
    const audio = selectAudio(item.audios, preferredVoiceActorId)
    if (!audio) continue

    const voiceActorId = audio.metadata.voiceActorId

    // Check if already cached
    const isCached = isAudioCached(item.subjectId, voiceActorId)
    if (isCached) continue

    // Start caching in background (don't await)
    cacheAudio(item.subjectId, voiceActorId, audio.url).catch((err) => {
      console.log("[Audio Preload] Failed to cache:", item.subjectId, err)
    })
  }
}
