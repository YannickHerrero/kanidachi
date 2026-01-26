import * as React from "react"
import { View, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { FlashList } from "@shopify/flash-list"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { SearchBar, SubjectCell } from "@/components/browse"
import { useSearchSubjects } from "@/hooks/useSearchSubjects"
import { useColorScheme } from "@/lib/useColorScheme"

export default function SearchScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const [query, setQuery] = React.useState("")
  const { results, isSearching, error, search, clearResults } = useSearchSubjects()

  // Trigger search when query changes
  React.useEffect(() => {
    search(query)
  }, [query, search])

  const handleBack = () => {
    router.back()
  }

  const handleSubjectPress = (subjectId: number) => {
    router.push(`/subject/${subjectId}`)
  }

  const handleClear = () => {
    setQuery("")
    clearResults()
  }

  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with search */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <ChevronLeft size={24} color={iconColor} />
        </Button>

        <View className="flex-1">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={handleClear}
            placeholder="Search subjects..."
            autoFocus
          />
        </View>
      </View>

      {/* Results */}
      <View className="flex-1">
        {/* Loading state */}
        {isSearching && (
          <View className="p-4">
            <Text className="text-muted-foreground text-center">
              Searching...
            </Text>
          </View>
        )}

        {/* Error state */}
        {error && (
          <View className="p-4">
            <Text className="text-destructive text-center">{error}</Text>
          </View>
        )}

        {/* Empty state - no query */}
        {!query.trim() && !isSearching && results.length === 0 && (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-muted-foreground text-center text-lg mb-2">
              Search for Subjects
            </Text>
            <Text className="text-muted-foreground text-center text-sm">
              Search by Japanese characters, meanings, or readings
            </Text>
          </View>
        )}

        {/* Empty state - no results */}
        {query.trim() && !isSearching && results.length === 0 && !error && (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-muted-foreground text-center">
              No subjects found for "{query}"
            </Text>
          </View>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <>
            <View className="px-4 py-2 bg-muted/30 border-b border-border">
              <Text className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <FlashList
              data={results}
              renderItem={({ item }) => (
                <SubjectCell
                  subject={item.subject}
                  assignment={item.assignment}
                  onPress={() => handleSubjectPress(item.subject.id)}
                  showSrsStage
                />
              )}
              keyExtractor={(item) => String(item.subject.id)}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
