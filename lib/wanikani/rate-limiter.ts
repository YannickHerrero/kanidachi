/**
 * Rate limiter for WaniKani API requests
 * WaniKani allows 60 requests per minute per API token
 */
export class RateLimiter {
  private readonly maxRequests = 60
  private readonly intervalMs = 60000 // 1 minute
  
  private requestTimestamps: number[] = []
  private estimatedClockSkew = 0
  private lastServerDate: Date | null = null

  /**
   * Wait if necessary to avoid rate limiting
   */
  async throttle(): Promise<void> {
    const now = Date.now()
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < this.intervalMs
    )

    // If we've hit the limit, wait until the oldest request expires
    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0]
      const waitTime = this.intervalMs - (now - oldestTimestamp) + 100 // +100ms buffer
      
      if (waitTime > 0) {
        console.log(`[RateLimiter] Rate limit reached, waiting ${waitTime}ms`)
        await this.sleep(waitTime)
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now())
  }

  /**
   * Update clock skew estimate from server response
   */
  updateClockSkew(serverDateHeader: string | null, roundTripTime: number): void {
    if (!serverDateHeader) return

    try {
      const serverDate = new Date(serverDateHeader)
      if (isNaN(serverDate.getTime())) return

      const clientTime = Date.now() - roundTripTime / 2
      this.estimatedClockSkew = serverDate.getTime() - clientTime
      this.lastServerDate = serverDate
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Get the number of requests remaining in the current interval
   */
  get requestsRemaining(): number {
    const now = Date.now()
    const recentRequests = this.requestTimestamps.filter(
      (ts) => now - ts < this.intervalMs
    )
    return Math.max(0, this.maxRequests - recentRequests.length)
  }

  /**
   * Get the time until the rate limit resets (in ms)
   */
  get resetTime(): number {
    if (this.requestTimestamps.length === 0) return 0
    
    const now = Date.now()
    const oldestTimestamp = this.requestTimestamps[0]
    const timeUntilReset = this.intervalMs - (now - oldestTimestamp)
    
    return Math.max(0, timeUntilReset)
  }

  /**
   * Get estimated server time
   */
  get serverTime(): Date {
    return new Date(Date.now() + this.estimatedClockSkew)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()
