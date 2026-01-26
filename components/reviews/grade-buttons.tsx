import * as React from "react"
import { View, Platform } from "react-native"
import { X, Check } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

interface GradeButtonsProps {
  onGrade: (correct: boolean) => void
  disabled?: boolean
}

export function GradeButtons({ onGrade, disabled = false }: GradeButtonsProps) {
  const handleGrade = React.useCallback((correct: boolean) => {
    // Trigger haptic feedback (different feedback for correct vs incorrect)
    if (Platform.OS !== "web") {
      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    }
    onGrade(correct)
  }, [onGrade])

  return (
    <View className="flex-row gap-4 px-4 pb-4">
      <Button
        variant="destructive"
        className="flex-1 h-16 flex-row items-center justify-center gap-2"
        onPress={() => handleGrade(false)}
        disabled={disabled}
      >
        <X size={24} color="#fff" />
        <Text className="text-destructive-foreground text-lg font-semibold">
          Incorrect
        </Text>
      </Button>

      <Button
        className="flex-1 h-16 bg-green-600 flex-row items-center justify-center gap-2"
        onPress={() => handleGrade(true)}
        disabled={disabled}
      >
        <Check size={24} color="#fff" />
        <Text className="text-white text-lg font-semibold">
          Correct
        </Text>
      </Button>
    </View>
  )
}
