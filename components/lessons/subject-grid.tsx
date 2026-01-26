import * as React from "react"
import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"

import { SubjectCell } from "./subject-cell"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import type { LessonItem } from "@/stores/lessons"

interface SubjectGridProps {
  items: LessonItem[]
  selectedIds: Set<number>
  onToggle: (subjectId: number) => void
}

export function SubjectGrid({ items, selectedIds, onToggle }: SubjectGridProps) {
  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-lg text-center mb-2">No lessons available</Text>
        <Muted className="text-center">
          Complete more reviews to unlock new items
        </Muted>
      </View>
    )
  }

  // Group items by level for section headers
  const groupedByLevel = React.useMemo(() => {
    const groups: Map<number, LessonItem[]> = new Map()
    for (const item of items) {
      const level = item.subject.level
      if (!groups.has(level)) {
        groups.set(level, [])
      }
      groups.get(level)!.push(item)
    }
    return groups
  }, [items])

  // Flatten into a list with headers
  const flatData = React.useMemo(() => {
    const result: Array<{ type: "header"; level: number } | { type: "item"; item: LessonItem }> = []

    const sortedLevels = Array.from(groupedByLevel.keys()).sort((a, b) => a - b)

    for (const level of sortedLevels) {
      result.push({ type: "header", level })
      const levelItems = groupedByLevel.get(level) ?? []
      for (const item of levelItems) {
        result.push({ type: "item", item })
      }
    }

    return result
  }, [groupedByLevel])

  const renderItem = ({ item }: { item: typeof flatData[number] }) => {
    if (item.type === "header") {
      return (
        <View className="px-2 py-3 bg-background">
          <Text className="text-sm font-semibold text-muted-foreground">
            Level {item.level}
          </Text>
        </View>
      )
    }

    return (
      <SubjectCell
        subject={item.item.subject}
        isSelected={selectedIds.has(item.item.subject.id)}
        onToggle={() => onToggle(item.item.subject.id)}
      />
    )
  }

  // We need to use a different approach for mixed headers and grid items
  // For simplicity, let's just render all items in a wrapped flex container
  return (
    <View className="flex-1 px-2">
      {Array.from(groupedByLevel.entries())
        .sort(([a], [b]) => a - b)
        .map(([level, levelItems]) => (
          <View key={level}>
            {/* Level header */}
            <View className="py-3">
              <Text className="text-sm font-semibold text-muted-foreground">
                Level {level}
              </Text>
            </View>

            {/* Items grid */}
            <View className="flex-row flex-wrap">
              {levelItems.map((item) => (
                <SubjectCell
                  key={item.subject.id}
                  subject={item.subject}
                  isSelected={selectedIds.has(item.subject.id)}
                  onToggle={() => onToggle(item.subject.id)}
                />
              ))}
            </View>
          </View>
        ))}
    </View>
  )
}
