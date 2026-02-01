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
import { Shuffle } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { Check } from "@/lib/icons/Check"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import {
  useSettingsStore,
  type ReviewOrdering,
} from "@/stores/settings"
import { Separator } from "@/components/ui/separator"
import { useThemeColors } from "@/hooks/useThemeColors"

// Wrap-up batch size options
const WRAPUP_BATCH_OPTIONS = [5, 10, 15, 20, 25] as const

// Session item limit options
const SESSION_LIMIT_OPTIONS = [
  { value: null, label: "Unlimited" },
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
  { value: 150, label: "150" },
  { value: 200, label: "200" },
] as const

// Ordering options with descriptions
const ORDERING_OPTIONS: Array<{
  value: ReviewOrdering
  title: string
  description: string
}> = [
  {
    value: "random",
    title: "Random",
    description: "Shuffled order for variety",
  },
  {
    value: "srs_stage",
    title: "SRS Stage",
    description: "Lower SRS stages first (Apprentice before Guru)",
  },
  {
    value: "level",
    title: "Level",
    description: "Lower level items first",
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

export const ReviewSettingsItem = () => {
  const colors = useThemeColors()
  const {
    reviewOrdering,
    wrapUpBatchSize,
    minimizeReviewPenalty,
    reviewItemLimit,
    setReviewOrdering,
    setWrapUpBatchSize,
    setMinimizeReviewPenalty,
    setReviewItemLimit,
  } = useSettingsStore()

  const { dismiss } = useBottomSheetModal()

  const selectedOrderingTitle =
    ORDERING_OPTIONS.find((o) => o.value === reviewOrdering)?.title ?? "Random"

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <Shuffle {...props} />}
          label="Reviews"
          itemRight={() => (
            <Text style={{ color: colors.mutedForeground }}>{selectedOrderingTitle}</Text>
          )}
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader style={{ backgroundColor: colors.background }}>
          <Text className="text-xl font-bold pb-1" style={{ color: colors.foreground }}>
            Review Settings
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-2 pt-4" style={{ backgroundColor: colors.background }}>
          {/* Ordering Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
            Order
          </Text>
          {ORDERING_OPTIONS.map((option) => (
            <OptionItem
              key={option.value}
              title={option.title}
              description={option.description}
              selected={reviewOrdering === option.value}
              onPress={() => setReviewOrdering(option.value)}
              colors={colors}
            />
          ))}

          <Separator className="my-2" />

          {/* Wrap-up Batch Size Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide mt-2" style={{ color: colors.mutedForeground }}>
            Wrap-up Batch Size
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>
            Number of items to complete when wrapping up a session
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {WRAPUP_BATCH_OPTIONS.map((size) => (
              <Pressable
                key={size}
                onPress={() => setWrapUpBatchSize(size)}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: wrapUpBatchSize === size ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: wrapUpBatchSize === size ? colors.primary : colors.border,
                }}
              >
                <Text
                  className={wrapUpBatchSize === size ? "font-medium" : undefined}
                  style={{ color: wrapUpBatchSize === size ? colors.primaryForeground : colors.foreground }}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>

          <Separator className="my-2" />

          {/* Session Item Limit Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide mt-2" style={{ color: colors.mutedForeground }}>
            Session Item Limit
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>
            Maximum number of items per review session
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SESSION_LIMIT_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => setReviewItemLimit(option.value)}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: reviewItemLimit === option.value ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: reviewItemLimit === option.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  className={reviewItemLimit === option.value ? "font-medium" : undefined}
                  style={{ color: reviewItemLimit === option.value ? colors.primaryForeground : colors.foreground }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Separator className="my-2" />

          {/* Minimize Penalty Section */}
          <Text className="text-sm font-semibold uppercase tracking-wide mt-2" style={{ color: colors.mutedForeground }}>
            Minimize Review Penalty
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>
            Cap wrong count at 1 even if you get an item wrong multiple times
          </Text>
          <View className="flex-row gap-2 mb-4">
            <Pressable
              onPress={() => setMinimizeReviewPenalty(true)}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: minimizeReviewPenalty ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: minimizeReviewPenalty ? colors.primary : colors.border,
              }}
            >
              <Text
                className={minimizeReviewPenalty ? "font-medium" : undefined}
                style={{ color: minimizeReviewPenalty ? colors.primaryForeground : colors.foreground }}
              >
                Enabled
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMinimizeReviewPenalty(false)}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: !minimizeReviewPenalty ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: !minimizeReviewPenalty ? colors.primary : colors.border,
              }}
            >
              <Text
                className={!minimizeReviewPenalty ? "font-medium" : undefined}
                style={{ color: !minimizeReviewPenalty ? colors.primaryForeground : colors.foreground }}
              >
                Disabled
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
