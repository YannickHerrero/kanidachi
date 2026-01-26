import * as React from "react"
import { FlatList, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, Stack } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { SubjectCell } from "@/components/browse/subject-cell"
import { useDatabase } from "@/db/provider"
import { useColorScheme } from "@/lib/useColorScheme"
import { subjects, assignments } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

// SRS category definitions
const SRS_CATEGORIES = {
  apprentice: { stages: [1, 2, 3, 4], label: "Apprentice", color: "#DD0093" },
  guru: { stages: [5, 6], label: "Guru", color: "#882D9E" },
  master: { stages: [7], label: "Master", color: "#294DDB" },
  enlightened: { stages: [8], label: "Enlightened", color: "#0093DD" },
  burned: { stages: [9], label: "Burned", color: "#434343" },
} as const

type SrsCategory = keyof typeof SRS_CATEGORIES

type Subject = typeof subjects.$inferSelect
type Assignment = typeof assignments.$inferSelect

interface SubjectWithAssignment {
  subject: Subject
  assignment: Assignment
}

export default function SrsCategoryScreen() {
  const router = useRouter()
  const { category } = useLocalSearchParams<{ category: string }>()
  const { db } = useDatabase()
  const { colorScheme } = useColorScheme()
  
  const [items, setItems] = React.useState<SubjectWithAssignment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const categoryInfo = SRS_CATEGORIES[category as SrsCategory]

  React.useEffect(() => {
    if (!db || !categoryInfo) return

    const fetchItems = async () => {
      setIsLoading(true)
      try {
        const results = await db
          .select()
          .from(subjects)
          .innerJoin(assignments, eq(subjects.id, assignments.subjectId))
          .where(inArray(assignments.srsStage, categoryInfo.stages))
          .orderBy(subjects.level, subjects.id)

        // Map the results to match our interface
        const mapped: SubjectWithAssignment[] = results.map((r) => ({
          subject: r.subjects,
          assignment: r.assignments,
        }))

        setItems(mapped)
      } catch (error) {
        console.error("[SrsCategoryScreen] Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [db, categoryInfo])

  const handleBack = () => {
    router.back()
  }

  const handleSubjectPress = (subjectId: number) => {
    router.push(`/subject/${subjectId}`)
  }

  if (!categoryInfo) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-destructive">Invalid SRS category</Text>
          <Button onPress={handleBack} className="mt-4">
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 p-4 gap-2">
          <View className="flex-row items-center gap-2 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </View>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <ChevronLeft
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </Button>
        <View
          className="w-3 h-3 rounded-full mr-1"
          style={{ backgroundColor: categoryInfo.color }}
        />
        <Text className="text-lg font-semibold">{categoryInfo.label}</Text>
        <Text className="text-muted-foreground ml-auto">
          {items.length} items
        </Text>
      </View>

      {/* Subject List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.subject.id.toString()}
        renderItem={({ item }) => (
          <SubjectCell
            subject={item.subject}
            assignment={item.assignment}
            onPress={() => handleSubjectPress(item.subject.id)}
            showSrsStage={false}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">No items in this category</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
