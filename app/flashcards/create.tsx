import * as React from "react"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ChevronLeft, RefreshCw, Volume2 } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { Textarea } from "@/components/ui/textarea"
import { useDatabase } from "@/db/provider"
import { createFlashcard } from "@/db/queries"
import { useThemeColors } from "@/hooks/useThemeColors"
import {
  generateFlashcardContent,
  generateSpeechAudio,
  type FlashcardGeneration,
} from "@/lib/flashcards/ai-client"
import { audioPlayer } from "@/lib/audio/player"
import { useSettingsStore } from "@/stores/settings"

export default function FlashcardCreateScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { db } = useDatabase()
  const refreshFlashcardApiKeyStatus = useSettingsStore((s) => s.refreshFlashcardApiKeyStatus)
  const hasFlashcardApiKey = useSettingsStore((s) => s.hasFlashcardApiKey)

  const [word, setWord] = React.useState("")
  const [content, setContent] = React.useState<FlashcardGeneration | null>(null)
  const [manualSentence, setManualSentence] = React.useState("")
  const [wordAudioUri, setWordAudioUri] = React.useState<string | null>(null)
  const [sentenceAudioUri, setSentenceAudioUri] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    refreshFlashcardApiKeyStatus()
  }, [refreshFlashcardApiKeyStatus])

  const handleBack = React.useCallback(() => {
    router.back()
  }, [router])

  const handleGenerate = React.useCallback(async () => {
    const trimmedWord = word.trim()
    if (!trimmedWord) {
      setError("Please enter a Japanese word")
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      const generated = await generateFlashcardContent(trimmedWord)
      setContent(generated)
      setManualSentence(generated.sentenceJa)
      setWordAudioUri(null)
      setSentenceAudioUri(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcard content")
    } finally {
      setIsGenerating(false)
    }
  }, [word])

  const handleGenerateAudio = React.useCallback(async () => {
    if (!content) return

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
  }, [content, manualSentence, word])

  const handleSave = React.useCallback(async () => {
    if (!db || !content) return

    setIsSaving(true)
    setError(null)

    try {
      await createFlashcard(db, {
        word: word.trim(),
        wordReading: content.wordReading,
        wordTranslation: content.wordTranslation,
        sentenceJa: manualSentence.trim(),
        sentenceReading: content.sentenceReading,
        sentenceTranslation: content.sentenceTranslation,
        wordAudioUri,
        sentenceAudioUri,
        sourceModel: "gpt-4o-mini",
      })

      router.replace("/lessons" as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcard")
    } finally {
      setIsSaving(false)
    }
  }, [content, db, manualSentence, router, sentenceAudioUri, word, wordAudioUri])

  const canGenerate = word.trim().length > 0 && !isGenerating && hasFlashcardApiKey
  const canGenerateAudio = Boolean(content && manualSentence.trim() && !isGeneratingAudio)
  const canSave = Boolean(content && manualSentence.trim() && !isSaving)

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
            <CardContent className="p-4">
              <Text style={{ color: colors.destructive }}>
                AI key not set. Open Settings and configure Flashcard AI Key first.
              </Text>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Word</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="日本語の単語"
            />
            <Button onPress={handleGenerate} disabled={!canGenerate}>
              <Text style={{ color: colors.primaryForeground }}>
                {isGenerating ? "Generating..." : "Generate Sentence"}
              </Text>
            </Button>
          </CardContent>
        </Card>

        {content && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                <Text>Word translation: {content.wordTranslation}</Text>
                <Text>Sentence translation: {content.sentenceTranslation}</Text>
                <Textarea
                  value={manualSentence}
                  onChangeText={setManualSentence}
                  placeholder="Edit sentence manually"
                />
                <Button variant="outline" onPress={handleGenerate} disabled={isGenerating}>
                  <View className="flex-row items-center gap-2">
                    <RefreshCw size={16} color={colors.foreground} />
                    <Text>Regenerate Sentence</Text>
                  </View>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audio</CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                <Button onPress={handleGenerateAudio} disabled={!canGenerateAudio}>
                  <Text style={{ color: colors.primaryForeground }}>
                    {isGeneratingAudio ? "Generating audio..." : "Generate Word + Sentence Audio"}
                  </Text>
                </Button>

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
                {isSaving ? "Saving..." : "Save Flashcard"}
              </Text>
            </Button>
          </>
        )}

        {error && (
          <Text style={{ color: colors.destructive }}>{error}</Text>
        )}

        {(isGenerating || isGeneratingAudio || isSaving) && (
          <View className="py-2">
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
