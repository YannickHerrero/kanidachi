import { z } from "zod"

import { getFlashcardApiKey } from "@/lib/flashcards/api-key"

const BASE_URL = "https://api.openai.com/v1"
const CHAT_MODEL = "gpt-4o-mini"
const TTS_MODEL = "gpt-4o-mini-tts"

const flashcardGenerationSchema = z.object({
  wordReading: z.string().optional().nullable(),
  wordTranslation: z.string().min(1),
  sentenceJa: z.string().min(1),
  sentenceReading: z.string().optional().nullable(),
  sentenceTranslation: z.string().min(1),
})

const flashcardDefinitionsSchema = z.object({
  definitions: z
    .array(
      z.object({
        definition: z.string().min(1),
        commonness: z.number().min(0).max(100),
      })
    )
    .min(1),
})

export type FlashcardGeneration = z.infer<typeof flashcardGenerationSchema>
export type FlashcardDefinitions = z.infer<typeof flashcardDefinitionsSchema>

function encodeBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let output = ""

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = bytes[i + 1] ?? 0
    const b3 = bytes[i + 2] ?? 0

    const triplet = (b1 << 16) | (b2 << 8) | b3

    output += chars[(triplet >> 18) & 63]
    output += chars[(triplet >> 12) & 63]
    output += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : "="
    output += i + 2 < bytes.length ? chars[triplet & 63] : "="
  }

  return output
}

async function authorizedRequest(path: string, init: RequestInit): Promise<Response> {
  const key = await getFlashcardApiKey()
  if (!key) {
    throw new Error("Missing flashcard API key. Set it in Settings > AI.")
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.error?.message) {
        message = body.error.message
      }
    } catch {
      // Keep fallback message
    }

    throw new Error(message)
  }

  return response
}

export async function generateFlashcardContent(
  word: string,
  definition: string
): Promise<FlashcardGeneration> {
  const trimmedWord = word.trim()
  if (!trimmedWord) {
    throw new Error("Please enter a Japanese word")
  }

  const trimmedDefinition = definition.trim()
  if (!trimmedDefinition) {
    throw new Error("Please select a definition")
  }

  const prompt = [
    "You are helping create Japanese flashcards for beginners.",
    "Return STRICT JSON only with these keys:",
    "wordReading, wordTranslation, sentenceJa, sentenceReading, sentenceTranslation.",
    "Constraints:",
    "- sentenceJa must be a short natural Japanese sentence using the given word exactly once.",
    "- Keep grammar simple and easy.",
    "- Translations must be concise and natural English.",
    "- Use the provided definition for the meaning/context.",
    `Word: ${trimmedWord}`,
    `Definition: ${trimmedDefinition}`,
  ].join("\n")

  const response = await authorizedRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You only return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  const json = await response.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== "string") {
    throw new Error("The model returned an invalid response")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Could not parse generation output")
  }

  return flashcardGenerationSchema.parse(parsed)
}

export async function generateFlashcardDefinitions(word: string): Promise<FlashcardDefinitions> {
  const trimmedWord = word.trim()
  if (!trimmedWord) {
    throw new Error("Please enter a Japanese word")
  }

  const prompt = [
    "You are helping create Japanese flashcards for beginners.",
    "Return STRICT JSON only with this key:",
    "definitions (an array of objects with: definition, commonness).",
    "Constraints:",
    "- If there are multiple common meanings, include each as a separate item.",
    "- Keep each definition short (3-8 words).",
    "- Do not include romaji.",
    "- commonness is a 0-100 score for how often the word is used with that meaning",
    "  in natural spoken Japanese (100 = extremely common, 0 = extremely rare).",
    `Word: ${trimmedWord}`,
  ].join("\n")

  const response = await authorizedRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You only return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  const json = await response.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== "string") {
    throw new Error("The model returned an invalid response")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Could not parse generation output")
  }

  return flashcardDefinitionsSchema.parse(parsed)
}

export async function generateSpeechAudio(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error("Missing text for speech generation")
  }

  const response = await authorizedRequest("/audio/speech", {
    method: "POST",
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: "alloy",
      format: "mp3",
      input: trimmed,
      instructions: "Speak naturally in standard Japanese.",
    }),
  })

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  return `data:audio/mpeg;base64,${encodeBase64(bytes)}`
}
