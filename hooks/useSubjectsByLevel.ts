import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getSubjectsWithAssignmentsByLevel } from "@/db/queries"
import type { subjects, assignments } from "@/db/schema"

export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface SubjectWithAssignment {
  subject: Subject
  assignment: Assignment | null
}

export interface GroupedSubjects {
  radicals: SubjectWithAssignment[]
  kanji: SubjectWithAssignment[]
  vocabulary: SubjectWithAssignment[]
}

interface UseSubjectsByLevelResult {
  subjects: SubjectWithAssignment[]
  grouped: GroupedSubjects
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// SRS stage to category mapping
function getSrsCategory(srsStage: number | null): string {
  if (srsStage === null || srsStage === 0) return "locked"
  if (srsStage >= 1 && srsStage <= 4) return "apprentice"
  if (srsStage >= 5 && srsStage <= 6) return "guru"
  if (srsStage === 7) return "master"
  if (srsStage === 8) return "enlightened"
  if (srsStage === 9) return "burned"
  return "locked"
}

// Sort by SRS stage (higher stages first, locked last)
function sortBySrsStage(a: SubjectWithAssignment, b: SubjectWithAssignment): number {
  const aStage = a.assignment?.srsStage ?? -1
  const bStage = b.assignment?.srsStage ?? -1
  
  // Locked items (no assignment or stage 0) go last
  if (aStage <= 0 && bStage > 0) return 1
  if (bStage <= 0 && aStage > 0) return -1
  
  // Otherwise sort by stage descending (burned first, apprentice last)
  return bStage - aStage
}

export function useSubjectsByLevel(level: number): UseSubjectsByLevelResult {
  const { db } = useDatabase()
  const [subjects, setSubjects] = React.useState<SubjectWithAssignment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchSubjects = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getSubjectsWithAssignmentsByLevel(db, level)
      
      // Map to expected format
      const mapped: SubjectWithAssignment[] = result.map((row) => ({
        subject: row.subject,
        assignment: row.assignment,
      }))

      setSubjects(mapped)
    } catch (err) {
      console.error("[useSubjectsByLevel] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load subjects")
    } finally {
      setIsLoading(false)
    }
  }, [db, level])

  React.useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // Group subjects by type and sort by SRS stage
  const grouped = React.useMemo<GroupedSubjects>(() => {
    const radicals = subjects
      .filter((s) => s.subject.type === "radical")
      .sort(sortBySrsStage)
    
    const kanji = subjects
      .filter((s) => s.subject.type === "kanji")
      .sort(sortBySrsStage)
    
    const vocabulary = subjects
      .filter((s) => s.subject.type === "vocabulary" || s.subject.type === "kana_vocabulary")
      .sort(sortBySrsStage)

    return { radicals, kanji, vocabulary }
  }, [subjects])

  return {
    subjects,
    grouped,
    isLoading,
    error,
    refetch: fetchSubjects,
  }
}

// Export utility for components
export { getSrsCategory }
