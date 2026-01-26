import * as React from "react"
import { View, Pressable } from "react-native"
import { Volume2, VolumeX, Loader } from "lucide-react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { useAudio } from "@/hooks/useAudio"
import { useColorScheme } from "@/lib/useColorScheme"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface AudioPlayerProps {
  subject: Subject
  showCard?: boolean
  autoPlay?: boolean
}

/**
 * Audio player component for vocabulary/kana vocabulary pronunciation
 * Shows available audio with play button and voice actor info
 */
export function AudioPlayer({ subject, showCard = true, autoPlay = false }: AudioPlayerProps) {
  const { colorScheme } = useColorScheme()
  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  const {
    state,
    hasAudio,
    selectedAudio,
    play,
    stop,
    toggle,
  } = useAudio({
    subjectId: subject.id,
    pronunciationAudiosJson: subject.pronunciationAudios,
    autoPlay,
  })

  // Don't render if no audio available
  if (!hasAudio || !selectedAudio) {
    return null
  }

  const isPlaying = state === "playing"
  const isLoading = state === "loading"
  const voiceActorName = selectedAudio.metadata.voiceActorName

  const content = (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={toggle}
        disabled={isLoading}
        className={cn(
          "w-12 h-12 rounded-full items-center justify-center",
          isPlaying ? "bg-primary" : "bg-muted"
        )}
      >
        {isLoading ? (
          <Loader size={24} color={isPlaying ? "#fff" : iconColor} />
        ) : isPlaying ? (
          <VolumeX size={24} color="#fff" />
        ) : (
          <Volume2 size={24} color={iconColor} />
        )}
      </Pressable>
      <View className="flex-1">
        <Text className="text-base font-medium">
          {isPlaying ? "Playing..." : "Play Audio"}
        </Text>
        <Muted className="text-xs">
          Voice: {voiceActorName}
        </Muted>
      </View>
    </View>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pronunciation</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

/**
 * Compact audio button for inline use (e.g., in headers or list items)
 */
interface AudioButtonProps {
  subject: Subject
  size?: "sm" | "md" | "lg"
  autoPlay?: boolean
  className?: string
}

export function AudioButton({ subject, size = "md", autoPlay = false, className }: AudioButtonProps) {
  const { colorScheme } = useColorScheme()
  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  const {
    state,
    hasAudio,
    toggle,
  } = useAudio({
    subjectId: subject.id,
    pronunciationAudiosJson: subject.pronunciationAudios,
    autoPlay,
  })

  // Don't render if no audio available
  if (!hasAudio) {
    return null
  }

  const isPlaying = state === "playing"
  const isLoading = state === "loading"

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  return (
    <Pressable
      onPress={toggle}
      disabled={isLoading}
      className={cn(
        "rounded-full items-center justify-center",
        sizeClasses[size],
        isPlaying ? "bg-primary" : "bg-muted/50",
        className
      )}
    >
      {isLoading ? (
        <Loader size={iconSizes[size]} color={isPlaying ? "#fff" : iconColor} />
      ) : isPlaying ? (
        <VolumeX size={iconSizes[size]} color="#fff" />
      ) : (
        <Volume2 size={iconSizes[size]} color={iconColor} />
      )}
    </Pressable>
  )
}
