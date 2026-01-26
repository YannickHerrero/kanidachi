import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getStudyMaterialForSubject } from "@/db/queries"
import type { studyMaterials } from "@/db/schema"

export type StudyMaterial = typeof studyMaterials.$inferSelect

/**
 * Hook to fetch study material (user notes and synonyms) for a subject
 */
export function useStudyMaterial(subjectId: number | null) {
  const { db } = useDatabase()
  const [studyMaterial, setStudyMaterial] = React.useState<StudyMaterial | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [refreshCounter, setRefreshCounter] = React.useState(0)

  const refetch = React.useCallback(() => {
    setRefreshCounter((c) => c + 1)
  }, [])

  React.useEffect(() => {
    if (!db || subjectId === null) {
      setStudyMaterial(null)
      return
    }

    setIsLoading(true)
    getStudyMaterialForSubject(db, subjectId)
      .then((material) => {
        setStudyMaterial(material)
      })
      .catch((err) => {
        console.error("[useStudyMaterial] Error:", err)
        setStudyMaterial(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [db, subjectId, refreshCounter])

  return { studyMaterial, isLoading, refetch }
}

/**
 * Parse meaning synonyms from JSON string
 */
export function parseMeaningSynonyms(json: string | null | undefined): string[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}
