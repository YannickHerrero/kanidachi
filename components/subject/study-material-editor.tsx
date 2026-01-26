import * as React from "react"
import { View, Pressable, Alert } from "react-native"
import { X, Plus } from "lucide-react-native"

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetView,
  BottomSheetTextInput,
  useBottomSheet,
} from "@/components/ui/bottom-sheet"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { useDatabase } from "@/db/provider"
import { wanikaniClient } from "@/lib/wanikani/client"
import { studyMaterials } from "@/db/schema"
import { useColorScheme } from "@/lib/useColorScheme"
import type { StudyMaterial } from "@/hooks/useStudyMaterial"

interface StudyMaterialEditorProps {
  subjectId: number
  studyMaterial: StudyMaterial | null
  onSave?: () => void
  children: (openEditor: (type: "synonyms" | "meaningNote" | "readingNote") => void) => React.ReactNode
}

export function StudyMaterialEditor({
  subjectId,
  studyMaterial,
  onSave,
  children,
}: StudyMaterialEditorProps) {
  const { db } = useDatabase()
  const { colorScheme } = useColorScheme()
  const { ref, open, close } = useBottomSheet()
  const [editType, setEditType] = React.useState<"synonyms" | "meaningNote" | "readingNote">("synonyms")
  const [isSaving, setIsSaving] = React.useState(false)

  // State for synonyms editing
  const [synonyms, setSynonyms] = React.useState<string[]>([])
  const [newSynonym, setNewSynonym] = React.useState("")

  // State for notes editing
  const [noteText, setNoteText] = React.useState("")

  const openEditor = (type: "synonyms" | "meaningNote" | "readingNote") => {
    setEditType(type)
    
    if (type === "synonyms") {
      // Parse existing synonyms
      const existing = studyMaterial?.meaningSynonyms
        ? JSON.parse(studyMaterial.meaningSynonyms)
        : []
      setSynonyms(existing)
      setNewSynonym("")
    } else if (type === "meaningNote") {
      setNoteText(studyMaterial?.meaningNote ?? "")
    } else if (type === "readingNote") {
      setNoteText(studyMaterial?.readingNote ?? "")
    }
    
    open()
  }

  const addSynonym = () => {
    const trimmed = newSynonym.trim().toLowerCase()
    if (trimmed && !synonyms.includes(trimmed)) {
      setSynonyms([...synonyms, trimmed])
      setNewSynonym("")
    }
  }

  const removeSynonym = (index: number) => {
    setSynonyms(synonyms.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!db) {
      Alert.alert("Error", "Database not available")
      return
    }

    setIsSaving(true)

    try {
      let result

      const updateData: {
        meaningNote?: string | null
        readingNote?: string | null
        meaningSynonyms?: string[]
      } = {}

      if (editType === "synonyms") {
        updateData.meaningSynonyms = synonyms
      } else if (editType === "meaningNote") {
        updateData.meaningNote = noteText || null
      } else if (editType === "readingNote") {
        updateData.readingNote = noteText || null
      }

      if (studyMaterial?.id) {
        // Update existing
        result = await wanikaniClient.updateStudyMaterial(studyMaterial.id, updateData)
      } else {
        // Create new
        result = await wanikaniClient.createStudyMaterial(subjectId, updateData)
      }

      // Update local database
      const localData = {
        id: result.id,
        subjectId: result.data.subject_id,
        subjectType: result.data.subject_type,
        meaningNote: result.data.meaning_note,
        readingNote: result.data.reading_note,
        meaningSynonyms: result.data.meaning_synonyms
          ? JSON.stringify(result.data.meaning_synonyms)
          : null,
        dataUpdatedAt: result.data_updated_at,
      }

      await db
        .insert(studyMaterials)
        .values(localData)
        .onConflictDoUpdate({
          target: studyMaterials.id,
          set: localData,
        })

      close()
      onSave?.()
    } catch (error) {
      console.error("[StudyMaterialEditor] Save error:", error)
      Alert.alert("Error", "Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const getTitle = () => {
    switch (editType) {
      case "synonyms":
        return "Edit Synonyms"
      case "meaningNote":
        return "Edit Meaning Note"
      case "readingNote":
        return "Edit Reading Note"
    }
  }

  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  return (
    <>
      {children(openEditor)}

      <BottomSheet>
        <BottomSheetContent
          ref={ref}
          enableDynamicSizing
          enablePanDownToClose
        >
          <BottomSheetHeader>
            <Text className="text-lg font-semibold">{getTitle()}</Text>
          </BottomSheetHeader>

          <BottomSheetView className="gap-4">
            {editType === "synonyms" ? (
              <>
                {/* Existing synonyms */}
                <View className="flex-row flex-wrap gap-2">
                  {synonyms.map((synonym, index) => (
                    <View
                      key={index}
                      className="flex-row items-center bg-blue-500/20 px-3 py-1.5 rounded-full gap-2"
                    >
                      <Text className="text-blue-600 dark:text-blue-400">{synonym}</Text>
                      <Pressable onPress={() => removeSynonym(index)}>
                        <X size={16} color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"} />
                      </Pressable>
                    </View>
                  ))}
                  {synonyms.length === 0 && (
                    <Muted>No synonyms yet</Muted>
                  )}
                </View>

                {/* Add new synonym */}
                <View className="flex-row gap-2">
                  <BottomSheetTextInput
                    placeholder="Add a synonym..."
                    value={newSynonym}
                    onChangeText={setNewSynonym}
                    onSubmitEditing={addSynonym}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1"
                  />
                  <Button onPress={addSynonym} disabled={!newSynonym.trim()}>
                    <Plus size={20} color="#fff" />
                  </Button>
                </View>
              </>
            ) : (
              /* Note editing */
              <BottomSheetTextInput
                placeholder={editType === "meaningNote" ? "Add a meaning note..." : "Add a reading note..."}
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="min-h-[120px]"
              />
            )}

            {/* Save button */}
            <Button onPress={handleSave} disabled={isSaving} className="mb-4">
              <Text className="text-primary-foreground font-semibold">
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </Button>
          </BottomSheetView>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
