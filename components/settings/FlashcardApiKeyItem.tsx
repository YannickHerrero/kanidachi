import * as React from "react"
import { Pressable, View } from "react-native"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import { KeyRound } from "lucide-react-native"

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "@/components/primitives/bottomSheet/bottom-sheet.native"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ListItem from "@/components/ui/list-item"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"
import {
  clearFlashcardApiKey,
  getFlashcardApiKey,
  setFlashcardApiKey,
} from "@/lib/flashcards/api-key"
import { useSettingsStore } from "@/stores/settings"

export function FlashcardApiKeyItem() {
  const colors = useThemeColors()
  const { dismiss } = useBottomSheetModal()
  const hasFlashcardApiKey = useSettingsStore((s) => s.hasFlashcardApiKey)
  const setHasFlashcardApiKey = useSettingsStore((s) => s.setHasFlashcardApiKey)

  const [apiKey, setApiKey] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleOpen = React.useCallback(async () => {
    const current = await getFlashcardApiKey()
    setApiKey(current ?? "")
    setError(null)
  }, [])

  const handleSave = React.useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const trimmed = apiKey.trim()
      if (!trimmed) {
        await clearFlashcardApiKey()
        setHasFlashcardApiKey(false)
      } else {
        await setFlashcardApiKey(trimmed)
        setHasFlashcardApiKey(true)
      }
      dismiss()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save API key")
    } finally {
      setIsSaving(false)
    }
  }, [apiKey, dismiss, setHasFlashcardApiKey])

  const handleClear = React.useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      await clearFlashcardApiKey()
      setHasFlashcardApiKey(false)
      setApiKey("")
      dismiss()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear API key")
    } finally {
      setIsSaving(false)
    }
  }, [dismiss, setHasFlashcardApiKey])

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild onPress={handleOpen}>
        <ListItem
          itemLeft={() => <KeyRound size={22} color={colors.foreground} />}
          label="Flashcard AI Key"
          itemRight={() => (
            <Text style={{ color: colors.mutedForeground }}>
              {hasFlashcardApiKey ? "Configured" : "Not set"}
            </Text>
          )}
        />
      </BottomSheetOpenTrigger>

      <BottomSheetContent>
        <BottomSheetHeader style={{ backgroundColor: colors.background }}>
          <Text className="text-xl font-bold pb-1" style={{ color: colors.foreground }}>
            Flashcard AI API Key
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-4 pt-4" style={{ backgroundColor: colors.background }}>
          <Text style={{ color: colors.mutedForeground }}>
            Used for sentence and audio generation. Leave empty to disable AI generation.
          </Text>

          <Input
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          {error && <Text style={{ color: colors.destructive }}>{error}</Text>}

          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={handleClear} disabled={isSaving}>
              <Text>Clear</Text>
            </Button>
            <Button className="flex-1" onPress={handleSave} disabled={isSaving}>
              <Text style={{ color: colors.primaryForeground }}>{isSaving ? "Saving..." : "Save"}</Text>
            </Button>
          </View>

          <Pressable onPress={() => dismiss()}>
            <Text className="text-center" style={{ color: colors.mutedForeground }}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
