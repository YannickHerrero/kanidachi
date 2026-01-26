import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { BookOpen } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useColorScheme } from "@/lib/useColorScheme"

interface ReviewCardProps {
  count: number
}

export function ReviewCard({ count }: ReviewCardProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const hasReviews = count > 0

  const handlePress = () => {
    if (hasReviews) {
      router.push("/reviews")
    }
  }

  return (
    <Pressable onPress={handlePress} disabled={!hasReviews} className="flex-1">
      <Card
        className={cn(
          "flex-1",
          hasReviews
            ? "bg-pink-500 dark:bg-pink-600 border-pink-600 dark:border-pink-700"
            : "opacity-60"
        )}
      >
        <CardContent className="p-4 items-center justify-center gap-2">
          <BookOpen
            size={24}
            color={hasReviews ? "#fff" : colorScheme === "dark" ? "#a1a1aa" : "#71717a"}
          />
          <Text
            className={cn(
              "text-4xl font-semibold",
              hasReviews ? "text-white" : "text-muted-foreground"
            )}
          >
            {count}
          </Text>
          <Text
            className={cn(
              "text-sm",
              hasReviews ? "text-white/90" : "text-muted-foreground"
            )}
          >
            Reviews
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  )
}
