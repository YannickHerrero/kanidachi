import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const FLASHCARD_API_KEY = "flashcard_api_key"

export async function getFlashcardApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(FLASHCARD_API_KEY)
    }
    return await SecureStore.getItemAsync(FLASHCARD_API_KEY)
  } catch (error) {
    console.error("[flashcards] Failed to read API key:", error)
    return null
  }
}

export async function setFlashcardApiKey(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(FLASHCARD_API_KEY, key)
      return
    }
    await SecureStore.setItemAsync(FLASHCARD_API_KEY, key)
  } catch (error) {
    console.error("[flashcards] Failed to store API key:", error)
    throw new Error("Failed to save flashcard API key")
  }
}

export async function clearFlashcardApiKey(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(FLASHCARD_API_KEY)
      return
    }
    await SecureStore.deleteItemAsync(FLASHCARD_API_KEY)
  } catch (error) {
    console.error("[flashcards] Failed to clear API key:", error)
  }
}
