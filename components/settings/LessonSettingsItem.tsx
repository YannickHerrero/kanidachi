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
import { BookOpenCheck } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { Check } from "@/lib/icons/Check"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import {
  useSettingsStore,
  type LessonOrdering,
} from "@/stores/settings"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useThemeColors } from "@/hooks/useThemeColors"

// Batch size options
const BATCH_SIZE_OPTIONS = [3, 5, 10, 15, 20] as const

// Ordering options with descriptions
const ORDERING_OPTIONS: Array<{
  value: LessonOrdering
  title: string
  description: string
}> = [
  {
    value: "ascending_level",
    title: "Ascending Level",
    description: "Start with lower level items first",
  },
  {
    value: "current_level_first",
    title: "Current Level First",
    description: "Prioritize items from your current level",
  },
  {
    value: "shuffled",
    title: "Shuffled",
    description: "Random order for variety",
  },
]

interface OptionItemProps {
  title: string
  description?: string
  selected: boolean
  onPress: () => void
  colors: ReturnType<typeof useThemeColors>
}

function OptionItem({ title, description, selected, onPress, colors }: OptionItemProps) {
  return (
    <Pressable className="py-3" onPress={onPress}>
      <View className="flex flex-row justify-between items-center">
        <View className="flex-1 pr-4">
          <H4>{title}</H4>
          {description && (
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>{description}</Text>
          )}
        </View>
        {selected && <Check color={colors.accentForeground} />}
      </View>
    </Pressable>
  )
}

export const LessonSettingsItem = () => {
  const colors = useThemeColors()
  const {
    lessonBatchSize,
    lessonOrdering,
    hideKanaVocabulary,
    setLessonBatchSize,
    setLessonOrdering,
    setHideKanaVocabulary,
  } = useSettingsStore()

  const { dismiss } = useBottomSheetModal()

  const selectedOrderingTitle =
    ORDERING_OPTIONS.find((o) => o.value === lessonOrdering)?.title ?? "Ascending Level"

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <BookOpenCheck {...props} />}
          label="Lessons"
          itemRight={() => (
            <Text style={{ color: colors.mutedForeground }}>{lessonBatchSize} items</Text>
          )}
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader style={{ backgroundColor: colors.background }}>
          <Text className="text-xl font-bold pb-1" style={{ color: colors.foreground }}>
            Lesson Settings
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-2 pt-4" style={{ backgroundColor: colors.background }}>
          {/* Batch Size Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
            Batch Size
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>
            Number of items to study in each lesson session
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {BATCH_SIZE_OPTIONS.map((size) => (
              <Pressable
                key={size}
                onPress={() => setLessonBatchSize(size)}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: lessonBatchSize === size ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: lessonBatchSize === size ? colors.primary : colors.border,
                }}
              >
                <Text
                  className={lessonBatchSize === size ? "font-medium" : undefined}
                  style={{ color: lessonBatchSize === size ? colors.primaryForeground : colors.foreground }}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>

          <Separator className="my-2" />

          {/* Ordering Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide mt-2" style={{ color: colors.mutedForeground }}>
            Order
          </Text>
          {ORDERING_OPTIONS.map((option) => (
            <OptionItem
              key={option.value}
              title={option.title}
              description={option.description}
              selected={lessonOrdering === option.value}
              onPress={() => setLessonOrdering(option.value)}
              colors={colors}
            />
          ))}

          <Separator className="my-2" />

          <Pressable
            className="flex-row items-center justify-between py-2"
            onPress={() => setHideKanaVocabulary(!hideKanaVocabulary)}
          >
            <View className="flex-1 pr-4">
              <H4>Hide kana-only vocabulary</H4>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Exclude kana-only vocabulary from lessons and progress views
              </Text>
            </View>
            <Switch
              checked={hideKanaVocabulary}
              onCheckedChange={setHideKanaVocabulary}
            />
          </Pressable>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
