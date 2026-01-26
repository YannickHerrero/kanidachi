import * as React from "react"
import { View, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { FlashList } from "@shopify/flash-list"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchBar, SubjectCell, TypeFilter, type SubjectTypeFilter } from "@/components/browse"
import { useSearchSubjects } from "@/hooks/useSearchSubjects"
import { useColorScheme } from "@/lib/useColorScheme"

export default function SearchScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const [query, setQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<SubjectTypeFilter>("all")
  const { results, isSearching, error, search, clearResults } = useSearchSubjects()

  // Trigger search when query changes
  React.useEffect(() => {
    search(query)
  }, [query, search])

  // Filter results by type
  const filteredResults = React.useMemo(() => {
    if (typeFilter === "all") return results

    return results.filter((item) => {
      if (typeFilter === "vocabulary") {
        return (
          item.subject.type === "vocabulary" ||
          item.subject.type === "kana_vocabulary"
        )
      }
      return item.subject.type === typeFilter
    })
  }, [results, typeFilter])

  // Calculate counts for filter badges
  const filterCounts = React.useMemo(() => {
    return {
      all: results.length,
      radical: results.filter((r) => r.subject.type === "radical").length,
      kanji: results.filter((r) => r.subject.type === "kanji").length,
      vocabulary: results.filter(
        (r) =>
          r.subject.type === "vocabulary" || r.subject.type === "kana_vocabulary"
      ).length,
    }
  }, [results])

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
          <ErrorView
            type="generic"
            message={error}
            compact
            className="m-4"
          />
        )}

        {/* Empty state - no query */}
        {!query.trim() && !isSearching && results.length === 0 && (
          <EmptyState
            type="search"
            title="Search for Subjects"
            message="Search by Japanese characters, meanings, or readings"
          />
        )}

        {/* Empty state - no results */}
        {query.trim() && !isSearching && results.length === 0 && !error && (
          <EmptyState
            type="search"
            title="No Results Found"
            message={`No subjects found for "${query}"`}
          />
        )}

        {/* Results list */}
        {results.length > 0 && (
          <>
            {/* Type filter */}
            <TypeFilter
              selectedFilter={typeFilter}
              onFilterChange={setTypeFilter}
              counts={filterCounts}
              showCounts
            />

            {/* Results count */}
            <View className="px-4 py-2 border-b border-border">
              <Text className="text-sm text-muted-foreground">
                {filteredResults.length} result
                {filteredResults.length !== 1 ? "s" : ""}
                {typeFilter !== "all" && ` (filtered from ${results.length})`}
              </Text>
            </View>

            {/* Filtered results empty state */}
            {filteredResults.length === 0 && (
              <View className="flex-1 items-center justify-center p-8">
                <Text className="text-muted-foreground text-center">
                  No {typeFilter} subjects found
                </Text>
              </View>
            )}

            {/* Results */}
            {filteredResults.length > 0 && (
              <FlashList
                data={filteredResults}
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
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
