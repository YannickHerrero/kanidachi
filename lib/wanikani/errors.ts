/**
 * Custom error class for WaniKani API errors
 */
export class WaniKaniError extends Error {
  public readonly code: number
  public readonly response?: Response

  constructor(code: number, message: string, response?: Response) {
    super(message)
    this.name = "WaniKaniError"
    this.code = code
    this.response = response
  }

  /**
   * Whether this error is due to authentication issues
   */
  get isAuthError(): boolean {
    return this.code === 401 || this.code === 403
  }

  /**
   * Whether this error is due to rate limiting
   */
  get isRateLimitError(): boolean {
    return this.code === 429
  }

  /**
   * Whether this error is a validation error (e.g., invalid request data)
   */
  get isValidationError(): boolean {
    return this.code === 422
  }

  /**
   * Whether this error is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.code >= 500
  }

  /**
   * Whether this error should be retried
   */
  get shouldRetry(): boolean {
    // Retry rate limit errors and server errors, but not auth or validation errors
    return this.isRateLimitError || this.isServerError
  }
}

/**
 * Error thrown when the API token is not set
 */
export class WaniKaniNotAuthenticatedError extends Error {
  constructor() {
    super("WaniKani API token is not set. Please log in first.")
    this.name = "WaniKaniNotAuthenticatedError"
  }
}

/**
 * Error thrown when a network request fails
 */
export class WaniKaniNetworkError extends Error {
  public readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = "WaniKaniNetworkError"
    this.cause = cause
  }
}
