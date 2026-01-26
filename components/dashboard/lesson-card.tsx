import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { GraduationCap } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useColorScheme } from "@/lib/useColorScheme"

interface LessonCardProps {
  count: number
}

export function LessonCard({ count }: LessonCardProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const hasLessons = count > 0

  const handlePress = () => {
    if (hasLessons) {
      router.push("/lessons")
    }
  }

  return (
    <Pressable onPress={handlePress} disabled={!hasLessons} className="flex-1">
      <Card
        className={cn(
          "flex-1",
          hasLessons
            ? "bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700"
            : "opacity-60"
        )}
      >
        <CardContent className="p-4 items-center justify-center gap-2">
          <GraduationCap
            size={24}
            color={hasLessons ? "#fff" : colorScheme === "dark" ? "#a1a1aa" : "#71717a"}
          />
          <Text
            className={cn(
              "text-4xl font-semibold",
              hasLessons ? "text-white" : "text-muted-foreground"
            )}
          >
            {count}
          </Text>
          <Text
            className={cn(
              "text-sm",
              hasLessons ? "text-white/90" : "text-muted-foreground"
            )}
          >
            Lessons
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  )
}
