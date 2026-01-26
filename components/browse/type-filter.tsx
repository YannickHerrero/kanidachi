import * as React from "react"
import { View, Pressable, ScrollView } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

export type SubjectTypeFilter = "all" | "radical" | "kanji" | "vocabulary"

interface TypeFilterProps {
  selectedFilter: SubjectTypeFilter
  onFilterChange: (filter: SubjectTypeFilter) => void
  counts?: {
    all: number
    radical: number
    kanji: number
    vocabulary: number
  }
  showCounts?: boolean
}

const FILTERS: Array<{ key: SubjectTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "radical", label: "Radicals" },
  { key: "kanji", label: "Kanji" },
  { key: "vocabulary", label: "Vocab" },
]

export function TypeFilter({
  selectedFilter,
  onFilterChange,
  counts,
  showCounts = true,
}: TypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
      className="bg-muted/30"
    >
      {FILTERS.map((filter) => {
        const count = counts?.[filter.key] ?? 0
        const isSelected = selectedFilter === filter.key

        return (
          <Pressable
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            className={cn(
              "px-3 py-1.5 rounded-full",
              isSelected ? "bg-primary" : "bg-muted"
            )}
          >
            <Text
              className={cn(
                "text-sm",
                isSelected
                  ? "text-primary-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {filter.label}
              {showCounts && counts ? ` (${count})` : ""}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
