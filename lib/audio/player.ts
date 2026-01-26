import { Audio, type AVPlaybackStatus, type AVPlaybackSource } from "expo-av"
import { Platform } from "react-native"

// Audio playback states
export type AudioState = "idle" | "loading" | "playing" | "paused" | "error"

// Audio player configuration
export interface AudioPlayerConfig {
  shouldDuckAndroid?: boolean
  staysActiveInBackground?: boolean
}

const DEFAULT_CONFIG: AudioPlayerConfig = {
  shouldDuckAndroid: true,
  staysActiveInBackground: false,
}

/**
 * Audio player service for WaniKani pronunciation audio
 * Uses expo-av for cross-platform audio playback
 */
class AudioPlayer {
  private sound: Audio.Sound | null = null
  private isInitialized = false
  private currentUrl: string | null = null
  private stateListeners: Set<(state: AudioState) => void> = new Set()
  private currentState: AudioState = "idle"

  /**
   * Initialize the audio session (call once on app startup)
   */
  async initialize(config: AudioPlayerConfig = DEFAULT_CONFIG): Promise<void> {
    if (this.isInitialized) return

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: config.staysActiveInBackground ?? false,
        shouldDuckAndroid: config.shouldDuckAndroid ?? true,
      })
      this.isInitialized = true
    } catch (error) {
      console.error("Failed to initialize audio:", error)
    }
  }

  /**
   * Play audio from a URL or local file path
   */
  async play(source: string | AVPlaybackSource): Promise<void> {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Stop any currently playing audio
      await this.stop()

      this.setState("loading")

      // Create the source object
      const audioSource: AVPlaybackSource =
        typeof source === "string" ? { uri: source } : source

      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      )

      this.sound = sound
      this.currentUrl = typeof source === "string" ? source : null
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
    if (this.sound) {
      try {
        await this.sound.pauseAsync()
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
    if (this.sound) {
      try {
        await this.sound.playAsync()
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
    if (this.sound) {
      try {
        await this.sound.stopAsync()
        await this.sound.unloadAsync()
      } catch (error) {
        // Sound might already be unloaded, ignore errors
      }
      this.sound = null
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

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      // Handle error state
      if (status.error) {
        console.error("Playback error:", status.error)
        this.setState("error")
      }
      return
    }

    // Handle playback finished
    if (status.didJustFinish && !status.isLooping) {
      this.stop()
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
