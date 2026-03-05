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

const ocrSentenceSchema = z.object({
  sentenceJa: z.string().min(1),
})

const sentenceWordsSchema = z.object({
  words: z.array(z.string().min(1)).min(1),
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

function normalizeBase64(input: string): string {
  let cleaned = input.trim()
  if (cleaned.startsWith("data:")) {
    const commaIndex = cleaned.indexOf(",")
    if (commaIndex >= 0) {
      cleaned = cleaned.slice(commaIndex + 1)
    }
  }
  cleaned = cleaned.replace(/\s+/g, "")
  const remainder = cleaned.length % 4
  if (remainder !== 0) {
    cleaned = cleaned.padEnd(cleaned.length + (4 - remainder), "=")
  }
  return cleaned
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

export async function generateFlashcardContentFromSentence(
  word: string,
  definition: string,
  sentence: string
): Promise<FlashcardGeneration> {
  const trimmedWord = word.trim()
  if (!trimmedWord) {
    throw new Error("Please enter a Japanese word")
  }

  const trimmedDefinition = definition.trim()
  if (!trimmedDefinition) {
    throw new Error("Please select a definition")
  }

  const trimmedSentence = sentence.trim()
  if (!trimmedSentence) {
    throw new Error("Please provide a Japanese sentence")
  }

  const prompt = [
    "You are helping create Japanese flashcards for beginners.",
    "Return STRICT JSON only with these keys:",
    "wordReading, wordTranslation, sentenceJa, sentenceReading, sentenceTranslation.",
    "Constraints:",
    "- Use the provided sentence exactly as-is for sentenceJa.",
    "- Provide readings for the word and the sentence.",
    "- Translations must be concise and natural English.",
    "- Use the provided definition for the word meaning.",
    `Word: ${trimmedWord}`,
    `Definition: ${trimmedDefinition}`,
    `Sentence: ${trimmedSentence}`,
  ].join("\n")

  const response = await authorizedRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.4,
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

  const parsedResult = flashcardGenerationSchema.parse(parsed)
  return { ...parsedResult, sentenceJa: trimmedSentence }
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
    "- commonness is a 0-100 score for whether an intermediate learner should learn",
    "  the word with that meaning (100 = very useful/priority, 0 = niche/unnecessary).",
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

export async function extractSentenceFromImage(
  base64: string,
  mimeType = "image/png"
): Promise<string> {
  const normalized = normalizeBase64(base64)
  if (!normalized) {
    throw new Error("Missing image data")
  }

  const prompt = [
    "Extract the Japanese text from the provided image of a single manga speech bubble.",
    "Return STRICT JSON only with this key:",
    "sentenceJa.",
    "Constraints:",
    "- Return only the Japanese sentence with punctuation.",
    "- Remove line breaks and extra whitespace.",
    "- Do not add translations or commentary.",
  ].join("\n")

  const response = await authorizedRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You only return valid JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${normalized}`,
              },
            },
          ],
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
    throw new Error("Could not parse OCR output")
  }

  const result = ocrSentenceSchema.parse(parsed)
  return result.sentenceJa.trim()
}

export async function extractSentenceWords(sentence: string): Promise<string[]> {
  const trimmed = sentence.trim()
  if (!trimmed) {
    throw new Error("Missing sentence for word extraction")
  }

  const prompt = [
    "Given the Japanese sentence, list the main word candidates as they appear in the sentence.",
    "Return STRICT JSON only with this key:",
    "words (array of strings, ordered by appearance, no romaji).",
    "Constraints:",
    "- Use the surface forms as written in the sentence.",
    "- Include multi-character words; avoid single punctuation tokens.",
    "- Remove duplicates if a word appears multiple times.",
    `Sentence: ${trimmed}`,
  ].join("\n")

  const response = await authorizedRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.3,
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
    throw new Error("Could not parse word extraction output")
  }

  const result = sentenceWordsSchema.parse(parsed)
  return result.words
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
