import * as React from "react"
import { useDatabase } from "@/db/provider"
import { searchSubjectsEnhanced } from "@/db/queries"
import type { subjects, assignments } from "@/db/schema"
import { useSettingsStore } from "@/stores/settings"

export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface SubjectWithAssignment {
  subject: Subject
  assignment: Assignment | null
}

interface UseSearchSubjectsResult {
  results: SubjectWithAssignment[]
  isSearching: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

const DEBOUNCE_MS = 300

export function useSearchSubjects(): UseSearchSubjectsResult {
  const { db } = useDatabase()
  const hideKanaVocabulary = useSettingsStore((s) => s.hideKanaVocabulary)
  const [results, setResults] = React.useState<SubjectWithAssignment[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const search = React.useCallback(
    (query: string) => {
      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Clear results if empty query
      if (!query.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      // Debounce the search
      debounceRef.current = setTimeout(async () => {
        if (!db) {
          setIsSearching(false)
          return
        }

        try {
          const searchResults = await searchSubjectsEnhanced(db, query, 50)

          const filteredResults = hideKanaVocabulary
            ? searchResults.filter((row) => row.subject.type !== "kana_vocabulary")
            : searchResults

          // Map to expected format
          const mapped: SubjectWithAssignment[] = filteredResults.map((row) => ({
            subject: row.subject,
            assignment: row.assignment,
          }))

          setResults(mapped)
          setError(null)
        } catch (err) {
          console.error("[useSearchSubjects] Error:", err)
          setError(err instanceof Error ? err.message : "Search failed")
          setResults([])
        } finally {
          setIsSearching(false)
        }
      }, DEBOUNCE_MS)
    },
    [db, hideKanaVocabulary]
  )

  const clearResults = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    setResults([])
    setError(null)
    setIsSearching(false)
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    results,
    isSearching,
    error,
    search,
    clearResults,
  }
}
