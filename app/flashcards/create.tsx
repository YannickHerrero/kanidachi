import * as React from "react"
import * as Clipboard from "expo-clipboard"
import * as FileSystem from "expo-file-system"
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ChevronLeft, RefreshCw, Volume2 } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { Textarea } from "@/components/ui/textarea"
import { useDatabase } from "@/db/provider"
import { createFlashcard, getKanjiSubjectsByCharacters } from "@/db/queries"
import { useThemeColors } from "@/hooks/useThemeColors"
import {
  extractSentenceFromImage,
  extractSentenceWords,
  generateFlashcardContent,
  generateFlashcardContentFromSentence,
  generateFlashcardDefinitions,
  generateSpeechAudio,
  type FlashcardGeneration,
  type FlashcardDefinitions,
} from "@/lib/flashcards/ai-client"
import { audioPlayer } from "@/lib/audio/player"
import { useSettingsStore } from "@/stores/settings"

export default function FlashcardCreateScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { db } = useDatabase()
  const refreshFlashcardApiKeyStatus = useSettingsStore((s) => s.refreshFlashcardApiKeyStatus)
  const hasFlashcardApiKey = useSettingsStore((s) => s.hasFlashcardApiKey)

  const [inputMode, setInputMode] = React.useState<"word" | "image">("word")
  const [word, setWord] = React.useState("")
  const [content, setContent] = React.useState<FlashcardGeneration | null>(null)
  const [definitions, setDefinitions] = React.useState<FlashcardDefinitions["definitions"]>([])
  const [selectedDefinitionIndex, setSelectedDefinitionIndex] = React.useState<number | null>(
    null
  )
  const [manualSentence, setManualSentence] = React.useState("")
  const [sentenceCandidates, setSentenceCandidates] = React.useState<string[]>([])
  const [isSentenceConfirmed, setIsSentenceConfirmed] = React.useState(false)
  const [wordAudioUri, setWordAudioUri] = React.useState<string | null>(null)
  const [sentenceAudioUri, setSentenceAudioUri] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isFetchingDefinitions, setIsFetchingDefinitions] = React.useState(false)
  const [isExtractingSentence, setIsExtractingSentence] = React.useState(false)
  const [isExtractingWords, setIsExtractingWords] = React.useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    refreshFlashcardApiKeyStatus()
  }, [refreshFlashcardApiKeyStatus])

  const handleBack = React.useCallback(() => {
    router.back()
  }, [router])

  const handleOpenSettings = React.useCallback(() => {
    router.push("/settings")
  }, [router])

  const resolveClipboardImage = React.useCallback(async () => {
    console.log("[Flashcard OCR] Checking clipboard for image")
    const image = await Clipboard.getImageAsync({ format: "png" })
    if (!image) {
      console.warn("[Flashcard OCR] No image found in clipboard")
      throw new Error("No image found in clipboard")
    }

    const base64 = (image as { data?: string; base64?: string }).data
      ?? (image as { data?: string; base64?: string }).base64
    const uri = (image as { uri?: string }).uri

    console.log("[Flashcard OCR] Clipboard image fields", {
      hasBase64: Boolean(base64),
      uri,
    })

    if (base64) {
      return { base64, uri }
    }

    if (!uri) {
      console.warn("[Flashcard OCR] Clipboard image missing base64 and uri")
      throw new Error("Clipboard image is missing data")
    }

    console.log("[Flashcard OCR] Reading clipboard image from uri")
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    console.log("[Flashcard OCR] Read clipboard image from uri", {
      base64Length: fileBase64.length,
      uri,
    })

    return { base64: fileBase64, uri }
  }, [])

  const getMimeTypeFromUri = React.useCallback((uri?: string) => {
    if (!uri) return "image/png"
    const lower = uri.toLowerCase()
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".png")) return "image/png"
    return "image/png"
  }, [])

  const handleModeChange = React.useCallback((mode: "word" | "image") => {
    setInputMode(mode)
    setWord("")
    setContent(null)
    setDefinitions([])
    setSelectedDefinitionIndex(null)
    setManualSentence("")
    setSentenceCandidates([])
    setIsSentenceConfirmed(false)
    setWordAudioUri(null)
    setSentenceAudioUri(null)
    setError(null)
  }, [])

  const handleExtractSentence = React.useCallback(async () => {
    setIsExtractingSentence(true)
    setError(null)

    let extractedSentence = ""
    try {
      const { base64, uri } = await resolveClipboardImage()
      console.log("[Flashcard OCR] Starting OCR request", {
        base64Length: base64.length,
        mimeType: getMimeTypeFromUri(uri),
      })
      extractedSentence = await extractSentenceFromImage(base64, getMimeTypeFromUri(uri))
      setManualSentence(extractedSentence)
      setSentenceCandidates([])
      setWord("")
      setDefinitions([])
      setSelectedDefinitionIndex(null)
      setContent(null)
      setIsSentenceConfirmed(false)
      setWordAudioUri(null)
      setSentenceAudioUri(null)
    } catch (err) {
      console.error("[Flashcard OCR] Extraction failed", err)
      setError(err instanceof Error ? err.message : "Failed to extract sentence")
    } finally {
      setIsExtractingSentence(false)
    }

    if (!extractedSentence) {
      return
    }

    setIsExtractingWords(true)
    try {
      console.log("[Flashcard OCR] Extracting word candidates")
      const candidates = await extractSentenceWords(extractedSentence)
      setSentenceCandidates(candidates)
    } catch (err) {
      console.error("[Flashcard OCR] Word candidate extraction failed", err)
      setError(err instanceof Error ? err.message : "Failed to extract word candidates")
    } finally {
      setIsExtractingWords(false)
    }
  }, [getMimeTypeFromUri, resolveClipboardImage])

  const handleFetchDefinitions = React.useCallback(async () => {
    const trimmedWord = word.trim()
    if (!trimmedWord) {
      setError("Please enter a Japanese word")
      return
    }

    setIsFetchingDefinitions(true)
    setError(null)
    try {
      const generated = await generateFlashcardDefinitions(trimmedWord)
      setDefinitions(generated.definitions)
      setSelectedDefinitionIndex(generated.definitions.length > 0 ? 0 : null)
      setContent(null)
      if (inputMode === "word") {
        setManualSentence("")
      }
      setIsSentenceConfirmed(false)
      setWordAudioUri(null)
      setSentenceAudioUri(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch definitions")
    } finally {
      setIsFetchingDefinitions(false)
    }
  }, [inputMode, word])

  const handleGenerate = React.useCallback(async () => {
    const trimmedWord = word.trim()
    const definition =
      selectedDefinitionIndex === null
        ? ""
        : definitions[selectedDefinitionIndex]?.definition?.trim() ?? ""
    if (!trimmedWord) {
      setError("Please enter a Japanese word")
      return
    }
    if (!definition) {
      setError("Please select a definition")
      return
    }
    if (inputMode === "image" && !manualSentence.trim()) {
      setError("Please extract and review the sentence first")
      return
    }
    if (inputMode === "image" && !manualSentence.includes(trimmedWord)) {
      setError("Selected word must appear in the sentence")
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      if (inputMode === "image") {
        const generated = await generateFlashcardContentFromSentence(
          trimmedWord,
          definition,
          manualSentence
        )
        setContent(generated)
        setManualSentence(generated.sentenceJa)
      } else {
        const generated = await generateFlashcardContent(trimmedWord, definition)
        setContent(generated)
        setManualSentence(generated.sentenceJa)
      }
      setIsSentenceConfirmed(false)
      setWordAudioUri(null)
      setSentenceAudioUri(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcard content")
    } finally {
      setIsGenerating(false)
    }
  }, [definitions, inputMode, manualSentence, selectedDefinitionIndex, word])

  const handleGenerateAudio = React.useCallback(async () => {
    if (!content || !isSentenceConfirmed) return

    setIsGeneratingAudio(true)
    setError(null)
    try {
      const [wordAudio, sentenceAudio] = await Promise.all([
        generateSpeechAudio(word.trim()),
        generateSpeechAudio(manualSentence.trim()),
      ])
      setWordAudioUri(wordAudio)
      setSentenceAudioUri(sentenceAudio)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio")
    } finally {
      setIsGeneratingAudio(false)
    }
  }, [content, isSentenceConfirmed, manualSentence, word])

  const handleSave = React.useCallback(async () => {
    if (!db || !content) return

    setIsSaving(true)
    setError(null)

    try {
      const kanjiChars = Array.from(word)
        .filter((char) => /[\u4E00-\u9FFF]/u.test(char))
      const uniqueKanjiChars = Array.from(new Set(kanjiChars))
      const kanjiSubjects = await getKanjiSubjectsByCharacters(db, uniqueKanjiChars)
      const componentSubjectIds = kanjiSubjects.map((subject) => subject.id)

      await createFlashcard(db, {
        word: word.trim(),
        wordReading: content.wordReading,
        wordTranslation: content.wordTranslation,
        sentenceJa: manualSentence.trim(),
        sentenceReading: content.sentenceReading,
        sentenceTranslation: content.sentenceTranslation,
        wordAudioUri,
        sentenceAudioUri,
        componentSubjectIds,
        sourceModel: "gpt-4o-mini",
      })

      router.replace("/lessons" as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcard")
    } finally {
      setIsSaving(false)
    }
  }, [content, db, manualSentence, router, sentenceAudioUri, word, wordAudioUri])

  const handleConfirmSentence = React.useCallback(() => {
    if (!manualSentence.trim()) {
      setError("Sentence cannot be empty")
      return
    }

    setError(null)
    setIsSentenceConfirmed(true)
    setSentenceAudioUri(null)
  }, [manualSentence])

  const handleSentenceChange = React.useCallback((value: string) => {
    setManualSentence(value)
    setIsSentenceConfirmed(false)
    setSentenceAudioUri(null)
  }, [])

  const handleWordChange = React.useCallback((value: string) => {
    setWord(value)
    setContent(null)
    setDefinitions([])
    setSelectedDefinitionIndex(null)
    if (inputMode === "word") {
      setManualSentence("")
    }
    setIsSentenceConfirmed(false)
    setWordAudioUri(null)
    setSentenceAudioUri(null)
    setError(null)
  }, [inputMode])

  const handleWordPick = React.useCallback((value: string) => {
    setWord(value)
    setContent(null)
    setDefinitions([])
    setSelectedDefinitionIndex(null)
    setIsSentenceConfirmed(false)
    setWordAudioUri(null)
    setSentenceAudioUri(null)
    setError(null)
  }, [])

  const handleDefinitionSelect = React.useCallback((index: number) => {
    setSelectedDefinitionIndex(index)
    setContent(null)
    if (inputMode === "word") {
      setManualSentence("")
    }
    setIsSentenceConfirmed(false)
    setWordAudioUri(null)
    setSentenceAudioUri(null)
    setError(null)
  }, [inputMode])

  const canFetchDefinitions =
    word.trim().length > 0 && !isFetchingDefinitions && hasFlashcardApiKey
  const canGenerate =
    word.trim().length > 0
    && selectedDefinitionIndex !== null
    && !isGenerating
    && hasFlashcardApiKey
    && (inputMode === "word" || manualSentence.trim().length > 0)
  const canGenerateAudio = Boolean(
    content && manualSentence.trim() && isSentenceConfirmed && !isGeneratingAudio
  )
  const canSave = Boolean(
    content && manualSentence.trim() && isSentenceConfirmed && wordAudioUri && sentenceAudioUri && !isSaving
  )

  const sentenceStepTitle =
    inputMode === "image"
      ? content
        ? "Step 4: Finalize Sentence"
        : "Step 2: Review Sentence"
      : "Step 3: Finalize Sentence"

  const renderOptionStyleE = (definition: FlashcardDefinitions["definitions"][number], index: number) => {
    const isSelected = index === selectedDefinitionIndex
    return (
      <Pressable
        key={`style-e-${definition.definition}-${definition.commonness}-${index}`}
        onPress={() => handleDefinitionSelect(index)}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected ? colors.secondary : colors.card,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {index + 1}
            </Text>
          </View>
          <Text style={{ color: colors.foreground, flex: 1 }}>{definition.definition}</Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: colors.muted,
            }}
          >
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {definition.commonness}
              </Text>
            </View>
          </View>
        </Pressable>
      )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <ChevronLeft size={22} color={colors.foreground} />
        </Button>
        <Text className="text-lg font-semibold">Create Flashcard</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
        {!hasFlashcardApiKey && (
          <Card>
            <CardContent className="p-4 gap-3">
              <Text style={{ color: colors.destructive }}>
                AI key not set. Open Settings and configure Flashcard AI Key first.
              </Text>
              <Button variant="outline" onPress={handleOpenSettings}>
                <Text>Open Settings</Text>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mode</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                variant={inputMode === "word" ? "default" : "outline"}
                onPress={() => handleModeChange("word")}
              >
                <Text style={{ color: inputMode === "word" ? colors.primaryForeground : colors.foreground }}>
                  Word
                </Text>
              </Button>
              <Button
                className="flex-1"
                variant={inputMode === "image" ? "default" : "outline"}
                onPress={() => handleModeChange("image")}
              >
                <Text style={{ color: inputMode === "image" ? colors.primaryForeground : colors.foreground }}>
                  Image OCR
                </Text>
              </Button>
            </View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {inputMode === "word"
                ? "Type a word to generate a fresh sentence."
                : "Paste a manga speech bubble image to extract a sentence."}
            </Text>
          </CardContent>
        </Card>

        {inputMode === "word" ? (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Enter Word</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Input
                value={word}
                onChangeText={handleWordChange}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="日本語の単語"
              />
              <Button onPress={handleFetchDefinitions} disabled={!canFetchDefinitions}>
                <Text style={{ color: colors.primaryForeground }}>
                  {isFetchingDefinitions ? "Finding definitions..." : "Find Definitions"}
                </Text>
              </Button>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                Tip: pick the definition that matches your intended meaning.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Paste Image</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Button
                onPress={handleExtractSentence}
                disabled={!hasFlashcardApiKey || isExtractingSentence}
              >
                <Text style={{ color: colors.primaryForeground }}>
                  {isExtractingSentence ? "Extracting sentence..." : "Extract Sentence from Clipboard"}
                </Text>
              </Button>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                Copy the manga panel image to the Android clipboard first.
              </Text>
              {manualSentence.trim().length > 0 && (
                <Text className="text-sm" style={{ color: colors.foreground }}>
                  Extracted: {manualSentence}
                </Text>
              )}
            </CardContent>
          </Card>
        )}

        {inputMode === "image" && manualSentence.trim().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{sentenceStepTitle}</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              {content && (
                <>
                  <Text>Word translation: {content.wordTranslation}</Text>
                  <Text>Sentence translation: {content.sentenceTranslation}</Text>
                </>
              )}
              <Textarea
                value={manualSentence}
                onChangeText={handleSentenceChange}
                placeholder="Edit OCR sentence"
              />
              <Button variant="outline" onPress={handleConfirmSentence}>
                <Text>{isSentenceConfirmed ? "Sentence Confirmed" : "Confirm This Sentence"}</Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {inputMode === "image" && manualSentence.trim().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Pick Word</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Input
                value={word}
                onChangeText={handleWordChange}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="単語を入力"
              />
              {sentenceCandidates.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {sentenceCandidates.map((candidate) => (
                    <Button
                      key={`candidate-${candidate}`}
                      variant={candidate === word ? "default" : "outline"}
                      size="sm"
                      onPress={() => handleWordPick(candidate)}
                    >
                      <Text
                        style={{
                          color:
                            candidate === word ? colors.primaryForeground : colors.foreground,
                        }}
                      >
                        {candidate}
                      </Text>
                    </Button>
                  ))}
                </View>
              )}
              {isExtractingWords && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  Extracting word candidates...
                </Text>
              )}
              <Button onPress={handleFetchDefinitions} disabled={!canFetchDefinitions}>
                <Text style={{ color: colors.primaryForeground }}>
                  {isFetchingDefinitions ? "Finding definitions..." : "Find Definitions"}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {definitions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Choose Definition</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              {definitions.map(renderOptionStyleE)}
              <Button onPress={handleGenerate} disabled={!canGenerate}>
                <Text style={{ color: colors.primaryForeground }}>
                  {isGenerating
                    ? "Generating..."
                    : inputMode === "image"
                      ? "Generate Details"
                      : "Generate Sentence"}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {content && inputMode === "word" && (
          <Card>
            <CardHeader>
              <CardTitle>{sentenceStepTitle}</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Text>Word translation: {content.wordTranslation}</Text>
              <Text>Sentence translation: {content.sentenceTranslation}</Text>
              <Textarea
                value={manualSentence}
                onChangeText={handleSentenceChange}
                placeholder="Edit sentence manually"
              />
              <Button variant="outline" onPress={handleConfirmSentence}>
                <Text>{isSentenceConfirmed ? "Sentence Confirmed" : "Confirm This Sentence"}</Text>
              </Button>
              <Button variant="outline" onPress={handleGenerate} disabled={isGenerating}>
                <View className="flex-row items-center gap-2">
                  <RefreshCw size={16} color={colors.foreground} />
                  <Text>Regenerate Sentence</Text>
                </View>
              </Button>
            </CardContent>
          </Card>
        )}

        {content && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Generate Audio</CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                <Button onPress={handleGenerateAudio} disabled={!canGenerateAudio}>
                  <Text style={{ color: colors.primaryForeground }}>
                    {isGeneratingAudio ? "Generating audio..." : "Generate Word + Sentence Audio"}
                  </Text>
                </Button>
                {!isSentenceConfirmed && (
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                    Confirm your sentence before generating audio.
                  </Text>
                )}

                <View className="flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => wordAudioUri && audioPlayer.play(wordAudioUri)}
                    disabled={!wordAudioUri}
                  >
                    <View className="flex-row items-center gap-2">
                      <Volume2 size={16} color={colors.foreground} />
                      <Text>Play Word</Text>
                    </View>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => sentenceAudioUri && audioPlayer.play(sentenceAudioUri)}
                    disabled={!sentenceAudioUri}
                  >
                    <View className="flex-row items-center gap-2">
                      <Volume2 size={16} color={colors.foreground} />
                      <Text>Play Sentence</Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Button onPress={handleSave} disabled={!canSave}>
              <Text style={{ color: colors.primaryForeground }}>
                {isSaving ? "Saving..." : "Save Flashcard to Lessons"}
              </Text>
            </Button>
            {!canSave && (
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                Save unlocks after sentence confirmation and both audio clips are generated.
              </Text>
            )}
          </>
        )}

        {error && (
          <Text style={{ color: colors.destructive }}>{error}</Text>
        )}

        {(isGenerating
          || isGeneratingAudio
          || isSaving
          || isFetchingDefinitions
          || isExtractingSentence
          || isExtractingWords) && (
          <View className="py-2">
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
