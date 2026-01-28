import * as React from "react"
import { Pressable, View } from "react-native"

import { H4 } from "@/components/ui/typography"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "@/components/primitives/bottomSheet/bottom-sheet.native"
import { Text } from "@/components/ui/text"
import { Volume2 } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { Check } from "@/lib/icons/Check"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import { useSettingsStore } from "@/stores/settings"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useThemeColors } from "@/hooks/useThemeColors"

export const AudioSettingItem = () => {
  const colors = useThemeColors()
  const {
    autoPlayAudioLessons,
    autoPlayAudioReviews,
    setAutoPlayAudioLessons,
    setAutoPlayAudioReviews,
  } = useSettingsStore()

  const { dismiss } = useBottomSheetModal()

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <Volume2 {...props} />}
          label="Audio"
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader style={{ backgroundColor: colors.background }}>
          <Text className="text-xl font-bold pb-1" style={{ color: colors.foreground }}>
            Audio Settings
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-5 pt-6" style={{ backgroundColor: colors.background }}>
          {/* Auto-play in Lessons */}
          <Pressable
            className="flex-row items-center justify-between py-2"
            onPress={() => setAutoPlayAudioLessons(!autoPlayAudioLessons)}
          >
            <View className="flex-1 pr-4">
              <H4>Auto-play in Lessons</H4>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Automatically play pronunciation audio when viewing lesson content
              </Text>
            </View>
            <Switch
              checked={autoPlayAudioLessons}
              onCheckedChange={setAutoPlayAudioLessons}
            />
          </Pressable>

          <Separator />

          {/* Auto-play in Reviews */}
          <Pressable
            className="flex-row items-center justify-between py-2"
            onPress={() => setAutoPlayAudioReviews(!autoPlayAudioReviews)}
          >
            <View className="flex-1 pr-4">
              <H4>Auto-play in Reviews</H4>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Automatically play pronunciation audio when revealing the answer
              </Text>
            </View>
            <Switch
              checked={autoPlayAudioReviews}
              onCheckedChange={setAutoPlayAudioReviews}
            />
          </Pressable>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
