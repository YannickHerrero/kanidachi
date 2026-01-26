import * as React from "react"
import { View, Pressable } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { SubjectTypeFilter } from "@/hooks/useAvailableLessons"

interface FilterBarProps {
  selectedFilter: SubjectTypeFilter
  onFilterChange: (filter: SubjectTypeFilter) => void
  counts: {
    all: number
    radical: number
    kanji: number
    vocabulary: number
  }
}

const FILTERS: Array<{ key: SubjectTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "radical", label: "Radicals" },
  { key: "kanji", label: "Kanji" },
  { key: "vocabulary", label: "Vocab" },
]

export function FilterBar({ selectedFilter, onFilterChange, counts }: FilterBarProps) {
  return (
    <View className="flex-row gap-2 px-4 py-2 bg-muted/50">
      {FILTERS.map((filter) => {
        const count = counts[filter.key]
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
                isSelected ? "text-primary-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {filter.label} ({count})
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
