import { rateLimiter } from "./rate-limiter"
import { WaniKaniError, WaniKaniNetworkError, WaniKaniNotAuthenticatedError } from "./errors"
import type {
  WKUser,
  WKSubject,
  WKSubjectsCollection,
  WKAssignment,
  WKAssignmentsCollection,
  WKStudyMaterial,
  WKStudyMaterialsCollection,
  WKVoiceActor,
  WKVoiceActorsCollection,
  WKReviewStatistic,
  WKReviewStatisticsCollection,
  WKLevelProgression,
  WKLevelProgressionsCollection,
  WKCreateReviewRequest,
  WKCreateReviewResponse,
  WKStudyMaterialRequest,
  WKSubjectsParams,
  WKAssignmentsParams,
  WKStudyMaterialsParams,
  WKReviewStatisticsParams,
  WKLevelProgressionsParams,
  WKVoiceActorsParams,
  WKErrorResponse,
} from "./types"

const BASE_URL = "https://api.wanikani.com/v2"

/**
 * WaniKani API Client
 * 
 * Handles all communication with the WaniKani API including:
 * - Authentication via API token
 * - Rate limiting (60 requests per minute)
 * - Pagination for large collections
 * - Error handling and retries
 */
export class WaniKaniClient {
  private token: string | null = null

  /**
   * Set the API token for authentication
   */
  setToken(token: string | null): void {
    this.token = token
  }

  /**
   * Check if the client has a token set
   */
  get isAuthenticated(): boolean {
    return this.token !== null && this.token.length > 0
  }

  // ============================================================================
  // USER
  // ============================================================================

  /**
   * Fetch the current user's profile
   */
  async getUser(): Promise<WKUser> {
    return this.request<WKUser>("/user")
  }

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  /**
   * Fetch a single subject by ID
   */
  async getSubject(id: number): Promise<WKSubject> {
    return this.request<WKSubject>(`/subjects/${id}`)
  }

  /**
   * Fetch subjects with optional filters
   */
  async getSubjects(params?: WKSubjectsParams): Promise<WKSubjectsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKSubjectsCollection>(`/subjects${query}`)
  }

  /**
   * Fetch all subjects, handling pagination automatically
   */
  async getAllSubjects(
    params?: Omit<WKSubjectsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKSubject[]> {
    return this.fetchAllPages<WKSubject, WKSubjectsCollection>(
      "/subjects",
      params,
      onProgress
    )
  }

  // ============================================================================
  // ASSIGNMENTS
  // ============================================================================

  /**
   * Fetch a single assignment by ID
   */
  async getAssignment(id: number): Promise<WKAssignment> {
    return this.request<WKAssignment>(`/assignments/${id}`)
  }

  /**
   * Fetch assignments with optional filters
   */
  async getAssignments(params?: WKAssignmentsParams): Promise<WKAssignmentsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKAssignmentsCollection>(`/assignments${query}`)
  }

  /**
   * Fetch all assignments, handling pagination automatically
   */
  async getAllAssignments(
    params?: Omit<WKAssignmentsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKAssignment[]> {
    return this.fetchAllPages<WKAssignment, WKAssignmentsCollection>(
      "/assignments",
      params,
      onProgress
    )
  }

  /**
   * Start an assignment (mark lesson as completed)
   */
  async startAssignment(assignmentId: number, startedAt?: Date): Promise<WKAssignment> {
    const body = {
      started_at: (startedAt ?? new Date()).toISOString(),
    }
    return this.request<WKAssignment>(`/assignments/${assignmentId}/start`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  // ============================================================================
  // REVIEWS
  // ============================================================================

  /**
   * Create a review (submit review result)
   */
  async createReview(
    assignmentId: number,
    incorrectMeaningAnswers: number,
    incorrectReadingAnswers: number,
    createdAt?: Date
  ): Promise<WKCreateReviewResponse> {
    const body: WKCreateReviewRequest = {
      review: {
        assignment_id: assignmentId,
        incorrect_meaning_answers: incorrectMeaningAnswers,
        incorrect_reading_answers: incorrectReadingAnswers,
      },
    }

    // Only set created_at if it's more than 15 minutes ago (to account for clock drift)
    if (createdAt && Date.now() - createdAt.getTime() > 15 * 60 * 1000) {
      body.review.created_at = createdAt.toISOString()
    }

    return this.request<WKCreateReviewResponse>("/reviews", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  // ============================================================================
  // STUDY MATERIALS
  // ============================================================================

  /**
   * Fetch a single study material by ID
   */
  async getStudyMaterial(id: number): Promise<WKStudyMaterial> {
    return this.request<WKStudyMaterial>(`/study_materials/${id}`)
  }

  /**
   * Fetch study materials with optional filters
   */
  async getStudyMaterials(params?: WKStudyMaterialsParams): Promise<WKStudyMaterialsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKStudyMaterialsCollection>(`/study_materials${query}`)
  }

  /**
   * Fetch all study materials, handling pagination automatically
   */
  async getAllStudyMaterials(
    params?: Omit<WKStudyMaterialsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKStudyMaterial[]> {
    return this.fetchAllPages<WKStudyMaterial, WKStudyMaterialsCollection>(
      "/study_materials",
      params,
      onProgress
    )
  }

  /**
   * Create a study material
   */
  async createStudyMaterial(
    subjectId: number,
    data: {
      meaningNote?: string | null
      readingNote?: string | null
      meaningSynonyms?: string[]
    }
  ): Promise<WKStudyMaterial> {
    const body: WKStudyMaterialRequest = {
      study_material: {
        subject_id: subjectId,
        meaning_note: data.meaningNote,
        reading_note: data.readingNote,
        meaning_synonyms: data.meaningSynonyms,
      },
    }
    return this.request<WKStudyMaterial>("/study_materials", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  /**
   * Update a study material
   */
  async updateStudyMaterial(
    id: number,
    data: {
      meaningNote?: string | null
      readingNote?: string | null
      meaningSynonyms?: string[]
    }
  ): Promise<WKStudyMaterial> {
    const body: WKStudyMaterialRequest = {
      study_material: {
        meaning_note: data.meaningNote,
        reading_note: data.readingNote,
        meaning_synonyms: data.meaningSynonyms,
      },
    }
    return this.request<WKStudyMaterial>(`/study_materials/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  // ============================================================================
  // VOICE ACTORS
  // ============================================================================

  /**
   * Fetch voice actors
   */
  async getVoiceActors(params?: WKVoiceActorsParams): Promise<WKVoiceActorsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKVoiceActorsCollection>(`/voice_actors${query}`)
  }

  /**
   * Fetch all voice actors
   */
  async getAllVoiceActors(
    params?: Omit<WKVoiceActorsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKVoiceActor[]> {
    return this.fetchAllPages<WKVoiceActor, WKVoiceActorsCollection>(
      "/voice_actors",
      params,
      onProgress
    )
  }

  // ============================================================================
  // REVIEW STATISTICS
  // ============================================================================

  /**
   * Fetch review statistics
   */
  async getReviewStatistics(params?: WKReviewStatisticsParams): Promise<WKReviewStatisticsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKReviewStatisticsCollection>(`/review_statistics${query}`)
  }

  /**
   * Fetch all review statistics
   */
  async getAllReviewStatistics(
    params?: Omit<WKReviewStatisticsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKReviewStatistic[]> {
    return this.fetchAllPages<WKReviewStatistic, WKReviewStatisticsCollection>(
      "/review_statistics",
      params,
      onProgress
    )
  }

  // ============================================================================
  // LEVEL PROGRESSIONS
  // ============================================================================

  /**
   * Fetch level progressions
   */
  async getLevelProgressions(params?: WKLevelProgressionsParams): Promise<WKLevelProgressionsCollection> {
    const query = this.buildQueryString(params as Record<string, unknown>)
    return this.request<WKLevelProgressionsCollection>(`/level_progressions${query}`)
  }

  /**
   * Fetch all level progressions
   */
  async getAllLevelProgressions(
    params?: Omit<WKLevelProgressionsParams, "page_after_id">,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<WKLevelProgression[]> {
    return this.fetchAllPages<WKLevelProgression, WKLevelProgressionsCollection>(
      "/level_progressions",
      params,
      onProgress
    )
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Make an authenticated request to the WaniKani API
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    if (!this.token) {
      throw new WaniKaniNotAuthenticatedError()
    }

    // Wait for rate limiter
    await rateLimiter.throttle()

    const url = `${BASE_URL}${path}`
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "Wanikani-Revision": "20170710",
          ...options.headers,
        },
      })

      // Update rate limiter with server time
      const serverDate = response.headers.get("Date")
      rateLimiter.updateClockSkew(serverDate, Date.now() - startTime)

      // Handle errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorBody = (await response.json()) as WKErrorResponse
          errorMessage = errorBody.error || errorMessage
        } catch {
          // Ignore JSON parse errors
        }

        const error = new WaniKaniError(response.status, errorMessage, response)

        // Retry if appropriate
        if (error.shouldRetry && retries > 0) {
          const delay = error.isRateLimitError ? rateLimiter.resetTime + 1000 : 1000 * (4 - retries)
          console.log(`[WaniKaniClient] Retrying in ${delay}ms (${retries} retries left)`)
          await this.sleep(delay)
          return this.request<T>(path, options, retries - 1)
        }

        throw error
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof WaniKaniError) {
        throw error
      }

      // Wrap network errors
      throw new WaniKaniNetworkError(
        `Network request failed: ${(error as Error).message}`,
        error as Error
      )
    }
  }

  /**
   * Fetch all pages of a paginated collection
   */
  private async fetchAllPages<T, C extends { data: T[]; pages: { next_url: string | null }; total_count: number }>(
    path: string,
    params?: Record<string, unknown>,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<T[]> {
    const allItems: T[] = []
    let nextUrl: string | null = `${BASE_URL}${path}${this.buildQueryString(params)}`
    let totalCount = 0

    while (nextUrl) {
      // Extract path from full URL
      const currentUrl: string = nextUrl
      const urlPath: string = currentUrl.replace(BASE_URL, "")
      const response: C = await this.request<C>(urlPath)

      allItems.push(...response.data)
      totalCount = response.total_count
      nextUrl = response.pages.next_url

      if (onProgress) {
        onProgress(allItems.length, totalCount)
      }
    }

    return allItems
  }

  /**
   * Build a query string from parameters
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return ""

    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        // WaniKani expects arrays as comma-separated values
        if (value.length > 0) {
          searchParams.set(key, value.join(","))
        }
      } else if (typeof value === "boolean") {
        searchParams.set(key, value.toString())
      } else {
        searchParams.set(key, String(value))
      }
    }

    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ""
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const wanikaniClient = new WaniKaniClient()
