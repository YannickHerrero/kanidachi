import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer as ExpoAudioPlayer,
  type AudioSource,
} from "expo-audio"
import { Platform } from "react-native"

// Audio playback states
export type AudioState = "idle" | "loading" | "playing" | "paused" | "error"

// Audio player configuration
export interface AudioPlayerConfig {
  shouldPlayInBackground?: boolean
}

const DEFAULT_CONFIG: AudioPlayerConfig = {
  shouldPlayInBackground: false,
}

/**
 * Audio player service for WaniKani pronunciation audio
 * Uses expo-audio for cross-platform audio playback
 */
class AudioPlayer {
  private player: ExpoAudioPlayer | null = null
  private isInitialized = false
  private currentUrl: string | null = null
  private stateListeners: Set<(state: AudioState) => void> = new Set()
  private currentState: AudioState = "idle"
  private statusSubscription: { remove: () => void } | null = null

  /**
   * Initialize the audio session (call once on app startup)
   */
  async initialize(config: AudioPlayerConfig = DEFAULT_CONFIG): Promise<void> {
    if (this.isInitialized) return

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: config.shouldPlayInBackground ?? false,
        interruptionMode: "duckOthers",
      })
      this.isInitialized = true
    } catch (error) {
      console.error("Failed to initialize audio:", error)
    }
  }

  /**
   * Play audio from a URL or local file path
   */
  async play(source: string | AudioSource): Promise<void> {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Stop any currently playing audio
      await this.stop()

      this.setState("loading")

      // Create the source object
      const audioSource: AudioSource =
        typeof source === "string" ? { uri: source } : source

      // Create a new player with the source
      this.player = createAudioPlayer(audioSource)
      this.currentUrl = typeof source === "string" ? source : null

      // Subscribe to playback status updates
      this.statusSubscription = this.player.addListener(
        "playbackStatusUpdate",
        (status) => {
          if (status.playing) {
            this.setState("playing")
          } else if (status.currentTime >= status.duration && status.duration > 0) {
            // Playback finished
            this.stop()
          } else if (!status.playing && this.currentState === "playing") {
            this.setState("paused")
          }
        }
      )

      // Wait for the audio to be loaded
      // expo-audio loads asynchronously, we'll start playing once loaded
      const checkLoaded = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!this.player) {
              clearInterval(checkInterval)
              reject(new Error("Player was stopped"))
              return
            }
            if (this.player.isLoaded) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 50)

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval)
            reject(new Error("Audio loading timeout"))
          }, 10000)
        })
      }

      await checkLoaded()

      // Start playing
      this.player.play()
      this.setState("playing")
    } catch (error) {
      console.error("Failed to play audio:", error)
      this.setState("error")
      throw error
    }
  }

  /**
   * Pause the currently playing audio
   */
  async pause(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause()
        this.setState("paused")
      } catch (error) {
        console.error("Failed to pause audio:", error)
      }
    }
  }

  /**
   * Resume paused audio
   */
  async resume(): Promise<void> {
    if (this.player) {
      try {
        this.player.play()
        this.setState("playing")
      } catch (error) {
        console.error("Failed to resume audio:", error)
      }
    }
  }

  /**
   * Stop and unload the current audio
   */
  async stop(): Promise<void> {
    if (this.statusSubscription) {
      this.statusSubscription.remove()
      this.statusSubscription = null
    }

    if (this.player) {
      try {
        this.player.remove()
      } catch (error) {
        // Player might already be removed, ignore errors
      }
      this.player = null
      this.currentUrl = null
      this.setState("idle")
    }
  }

  /**
   * Get the current playback state
   */
  getState(): AudioState {
    return this.currentState
  }

  /**
   * Get the currently playing URL
   */
  getCurrentUrl(): string | null {
    return this.currentUrl
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: AudioState) => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Cleanup - call when the app is closing
   */
  async cleanup(): Promise<void> {
    await this.stop()
    this.stateListeners.clear()
    this.isInitialized = false
  }

  private setState(state: AudioState): void {
    this.currentState = state
    for (const listener of this.stateListeners) {
      listener(state)
    }
  }
}

// Export a singleton instance
export const audioPlayer = new AudioPlayer()

// Helper function to play pronunciation audio for a subject
export async function playPronunciation(
  url: string,
  onStateChange?: (state: AudioState) => void
): Promise<void> {
  // Subscribe to state changes if callback provided
  let unsubscribe: (() => void) | undefined
  if (onStateChange) {
    unsubscribe = audioPlayer.onStateChange(onStateChange)
  }

  try {
    await audioPlayer.play(url)
  } finally {
    // Note: We don't unsubscribe here because the caller might want to track the full lifecycle
    // The caller should handle unsubscription when appropriate
  }

  return
}
