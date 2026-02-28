import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { parseContextSentences } from "@/db/queries"
import { useThemeColors } from "@/hooks/useThemeColors"
import type { Subject } from "@/stores/reviews"

interface FlashcardFrontProps {
  subject: Subject
}

export function FlashcardFront({ subject }: FlashcardFrontProps) {
  const colors = useThemeColors()
  const sentence = parseContextSentences(subject.contextSentences)[0]

  return (
    <View className="flex-1 px-2 items-center justify-center">
      <Muted className="text-sm mb-4">Sentence Card</Muted>
      <Text className="text-3xl leading-[44px] text-center font-medium">
        {sentence?.ja ?? subject.characters ?? ""}
      </Text>
      <Text className="text-base text-center mt-8" style={{ color: colors.mutedForeground }}>
        Tap to reveal answer
      </Text>
    </View>
  )
}
