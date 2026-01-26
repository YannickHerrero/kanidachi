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

// Wrap-up batch size options
const WRAPUP_BATCH_OPTIONS = [5, 10, 15, 20, 25] as const

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
}

function OptionItem({ title, description, selected, onPress }: OptionItemProps) {
  return (
    <Pressable className="py-3" onPress={onPress}>
      <View className="flex flex-row justify-between items-center">
        <View className="flex-1 pr-4">
          <H4>{title}</H4>
          {description && (
            <Text className="text-sm text-muted-foreground">{description}</Text>
          )}
        </View>
        {selected && <Check className="text-accent-foreground" />}
      </View>
    </Pressable>
  )
}

export const ReviewSettingsItem = () => {
  const {
    reviewOrdering,
    wrapUpBatchSize,
    setReviewOrdering,
    setWrapUpBatchSize,
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
            <Text className="text-muted-foreground">{selectedOrderingTitle}</Text>
          )}
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader className="bg-background">
          <Text className="text-foreground text-xl font-bold pb-1">
            Review Settings
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-2 pt-4 bg-background">
          {/* Ordering Section */}
          <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Order
          </Text>
          {ORDERING_OPTIONS.map((option) => (
            <OptionItem
              key={option.value}
              title={option.title}
              description={option.description}
              selected={reviewOrdering === option.value}
              onPress={() => setReviewOrdering(option.value)}
            />
          ))}

          <Separator className="my-2" />

          {/* Wrap-up Batch Size Section */}
          <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-2">
            Wrap-up Batch Size
          </Text>
          <Text className="text-sm text-muted-foreground mb-2">
            Number of items to complete when wrapping up a session
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {WRAPUP_BATCH_OPTIONS.map((size) => (
              <Pressable
                key={size}
                onPress={() => setWrapUpBatchSize(size)}
                className={`px-4 py-2 rounded-lg border ${
                  wrapUpBatchSize === size
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
              >
                <Text
                  className={
                    wrapUpBatchSize === size
                      ? "text-primary-foreground font-medium"
                      : "text-foreground"
                  }
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
