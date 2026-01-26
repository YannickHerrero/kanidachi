import * as React from "react"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"

import { H4 } from "@/components/ui/typography"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "@/components/primitives/bottomSheet/bottom-sheet.native"
import { Text } from "@/components/ui/text"
import { Mic } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { Check } from "@/lib/icons/Check"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import { useSettingsStore } from "@/stores/settings"
import { useDatabase } from "@/db/provider"
import { getAllVoiceActors } from "@/db/queries"
import type { voiceActors } from "@/db/schema"

type VoiceActor = typeof voiceActors.$inferSelect

interface VoiceActorItemProps {
  voiceActor: VoiceActor | null // null for "Auto" option
  onPress: () => void
  selected: boolean
}

function VoiceActorItem({ voiceActor, onPress, selected }: VoiceActorItemProps) {
  return (
    <Pressable className="py-4" onPress={onPress}>
      <View className="flex flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <H4>{voiceActor ? voiceActor.name : "Auto (Default)"}</H4>
          <Text className="text-sm text-muted-foreground">
            {voiceActor
              ? `${voiceActor.gender === "male" ? "Male" : "Female"}${voiceActor.description ? ` - ${voiceActor.description}` : ""}`
              : "Use WaniKani's default voice actor selection"}
          </Text>
        </View>
        <View className="pt-1">
          {selected && <Check className="text-accent-foreground" />}
        </View>
      </View>
    </Pressable>
  )
}

export const VoiceActorSettingItem = () => {
  const { db } = useDatabase()
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { preferredVoiceActorId, setPreferredVoiceActorId } = useSettingsStore()
  const { dismiss } = useBottomSheetModal()

  useEffect(() => {
    async function loadVoiceActors() {
      if (!db) return
      try {
        const actors = await getAllVoiceActors(db)
        setVoiceActors(actors)
      } catch (error) {
        console.error("Failed to load voice actors:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadVoiceActors()
  }, [db])

  const selectedActor = voiceActors.find((a) => a.id === preferredVoiceActorId)

  const handleSelect = (id: number | null) => {
    setPreferredVoiceActorId(id)
    dismiss()
  }

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <Mic {...props} />}
          label="Voice Actor"
          itemRight={() => (
            <Text className="text-muted-foreground">
              {selectedActor?.name ?? "Auto"}
            </Text>
          )}
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader className="bg-background">
          <Text className="text-foreground text-xl font-bold pb-1">
            Preferred Voice Actor
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-2 pt-6 bg-background">
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {/* Auto option */}
              <VoiceActorItem
                voiceActor={null}
                onPress={() => handleSelect(null)}
                selected={preferredVoiceActorId === null}
              />
              {/* Voice actor options */}
              {voiceActors.map((actor) => (
                <VoiceActorItem
                  key={actor.id}
                  voiceActor={actor}
                  onPress={() => handleSelect(actor.id)}
                  selected={actor.id === preferredVoiceActorId}
                />
              ))}
            </>
          )}
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
