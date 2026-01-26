import * as React from "react"

import { audioPlayer, type AudioState } from "@/lib/audio/player"
import {
  selectAudio,
  getAudioSource,
  cacheAudio,
} from "@/lib/audio/cache"
import { parsePronunciationAudios } from "@/db/queries"
import type { PronunciationAudio } from "@/db/schema"
import { useSettingsStore } from "@/stores/settings"

interface UseAudioOptions {
  /** Subject ID for caching */
  subjectId: number
  /** JSON-encoded pronunciation audios from the subject */
  pronunciationAudiosJson: string | null
  /** Auto-play on mount */
  autoPlay?: boolean
}

interface UseAudioResult {
  /** Current playback state */
  state: AudioState
  /** Whether audio is available for this subject */
  hasAudio: boolean
  /** The selected audio (based on voice actor preference) */
  selectedAudio: PronunciationAudio | null
  /** All available audios */
  allAudios: PronunciationAudio[]
  /** Play the audio */
  play: () => Promise<void>
  /** Stop the audio */
  stop: () => Promise<void>
  /** Toggle play/stop */
  toggle: () => Promise<void>
}

/**
 * Hook for playing subject pronunciation audio
 * Supports voice actor preference and caching
 */
export function useAudio(options: UseAudioOptions): UseAudioResult {
  const { subjectId, pronunciationAudiosJson, autoPlay = false } = options

  const preferredVoiceActorId = useSettingsStore((s) => s.preferredVoiceActorId)
  const [state, setState] = React.useState<AudioState>("idle")
  const mountedRef = React.useRef(true)
  const hasAutoPlayedRef = React.useRef(false)

  // Parse available audios
  const allAudios = React.useMemo(
    () => parsePronunciationAudios(pronunciationAudiosJson),
    [pronunciationAudiosJson]
  )

  // Select the best audio based on preference
  const selectedAudio = React.useMemo(
    () => selectAudio(allAudios, preferredVoiceActorId ?? undefined),
    [allAudios, preferredVoiceActorId]
  )

  const hasAudio = selectedAudio !== null

  // Subscribe to audio state changes
  React.useEffect(() => {
    const unsubscribe = audioPlayer.onStateChange((newState) => {
      if (mountedRef.current) {
        setState(newState)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Play function
  const play = React.useCallback(async () => {
    if (!selectedAudio) return

    try {
      const voiceActorId = selectedAudio.metadata.voiceActorId
      const url = selectedAudio.url

      // Get source (cached or remote)
      const { uri, shouldCache } = await getAudioSource(subjectId, voiceActorId, url)

      // Play the audio
      await audioPlayer.play(uri)

      // Cache in background if needed
      if (shouldCache) {
        cacheAudio(subjectId, voiceActorId, url).catch((err) => {
          console.warn("Failed to cache audio:", err)
        })
      }
    } catch (error) {
      console.error("Failed to play audio:", error)
    }
  }, [selectedAudio, subjectId])

  // Stop function
  const stop = React.useCallback(async () => {
    await audioPlayer.stop()
  }, [])

  // Toggle function
  const toggle = React.useCallback(async () => {
    if (state === "playing") {
      await stop()
    } else {
      await play()
    }
  }, [state, play, stop])

  // Auto-play on mount if enabled
  React.useEffect(() => {
    if (autoPlay && hasAudio && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true
      play()
    }
  }, [autoPlay, hasAudio, play])

  // Reset auto-play ref when subject changes
  React.useEffect(() => {
    hasAutoPlayedRef.current = false
  }, [subjectId])

  return {
    state,
    hasAudio,
    selectedAudio,
    allAudios,
    play,
    stop,
    toggle,
  }
}

/**
 * Simplified hook for components that just need a play button
 */
export function usePlayAudio() {
  const preferredVoiceActorId = useSettingsStore((s) => s.preferredVoiceActorId)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const playAudio = React.useCallback(
    async (
      subjectId: number,
      pronunciationAudiosJson: string | null
    ) => {
      const audios = parsePronunciationAudios(pronunciationAudiosJson)
      const selectedAudio = selectAudio(audios, preferredVoiceActorId ?? undefined)

      if (!selectedAudio) return

      try {
        setIsPlaying(true)
        const voiceActorId = selectedAudio.metadata.voiceActorId
        const url = selectedAudio.url

        const { uri, shouldCache } = await getAudioSource(subjectId, voiceActorId, url)
        await audioPlayer.play(uri)

        if (shouldCache) {
          cacheAudio(subjectId, voiceActorId, url).catch((err) => {
            console.warn("Failed to cache audio:", err)
          })
        }
      } catch (error) {
        console.error("Failed to play audio:", error)
      } finally {
        setIsPlaying(false)
      }
    },
    [preferredVoiceActorId]
  )

  const stopAudio = React.useCallback(async () => {
    await audioPlayer.stop()
    setIsPlaying(false)
  }, [])

  return { playAudio, stopAudio, isPlaying }
}
