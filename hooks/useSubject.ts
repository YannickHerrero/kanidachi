import * as React from "react"
import { useDatabase } from "@/db/provider"
import {
  getSubjectWithAssignment,
  getSubjectsByIds,
  getStudyMaterialForSubject,
} from "@/db/queries"
import type { subjects, assignments, studyMaterials } from "@/db/schema"

export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect
export type StudyMaterial = typeof studyMaterials.$inferSelect

export interface SubjectWithAssignment {
  subject: Subject
  assignment: Assignment | null
}

interface UseSubjectResult {
  data: SubjectWithAssignment | null
  studyMaterial: StudyMaterial | null
  componentSubjects: Subject[]
  amalgamationSubjects: Subject[]
  visuallySimilarSubjects: Subject[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSubject(subjectId: number | null): UseSubjectResult {
  const { db } = useDatabase()
  const [data, setData] = React.useState<SubjectWithAssignment | null>(null)
  const [studyMaterial, setStudyMaterial] = React.useState<StudyMaterial | null>(null)
  const [componentSubjects, setComponentSubjects] = React.useState<Subject[]>([])
  const [amalgamationSubjects, setAmalgamationSubjects] = React.useState<Subject[]>([])
  const [visuallySimilarSubjects, setVisuallySimilarSubjects] = React.useState<Subject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchSubject = React.useCallback(async () => {
    if (!db || subjectId === null) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch main subject with assignment
      const result = await getSubjectWithAssignment(db, subjectId)
      
      if (!result) {
        setError("Subject not found")
        setData(null)
        setIsLoading(false)
        return
      }

      setData(result)

      // Fetch study material
      const material = await getStudyMaterialForSubject(db, subjectId)
      setStudyMaterial(material)

      // Parse related subject IDs
      const componentIds = parseNumberArray(result.subject.componentSubjectIds)
      const amalgamationIds = parseNumberArray(result.subject.amalgamationSubjectIds)
      const visuallySimilarIds = parseNumberArray(result.subject.visuallySimilarSubjectIds)

      // Fetch related subjects in parallel
      const [components, amalgamations, similar] = await Promise.all([
        componentIds.length > 0 ? getSubjectsByIds(db, componentIds) : [],
        amalgamationIds.length > 0 ? getSubjectsByIds(db, amalgamationIds) : [],
        visuallySimilarIds.length > 0 ? getSubjectsByIds(db, visuallySimilarIds) : [],
      ])

      setComponentSubjects(components)
      setAmalgamationSubjects(amalgamations)
      setVisuallySimilarSubjects(similar)
    } catch (err) {
      console.error("[useSubject] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load subject")
    } finally {
      setIsLoading(false)
    }
  }, [db, subjectId])

  React.useEffect(() => {
    fetchSubject()
  }, [fetchSubject])

  return {
    data,
    studyMaterial,
    componentSubjects,
    amalgamationSubjects,
    visuallySimilarSubjects,
    isLoading,
    error,
    refetch: fetchSubject,
  }
}

// Helper to parse JSON number arrays
function parseNumberArray(json: string | null): number[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}
