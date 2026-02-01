import * as React from "react"
import { AppState } from "react-native"
import { useIsFocused } from "@react-navigation/native"

import { useDatabase } from "@/db/provider"
import { incrementDailyActivitySeconds } from "@/db/queries"
import type { DailyActivityType } from "@/db/schema"
import { getLocalDateKey } from "@/lib/date-utils"

const FLUSH_INTERVAL_MS = 15000

export function useActivityTimer(activity: DailyActivityType, enabled: boolean) {
  const { db } = useDatabase()
  const isFocused = useIsFocused()

  const appStateRef = React.useRef(AppState.currentState)
  const isRunningRef = React.useRef(false)
  const lastTickRef = React.useRef<number | null>(null)
  const pendingSecondsRef = React.useRef(0)
  const dateKeyRef = React.useRef(getLocalDateKey())
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const flushPending = React.useCallback(async (dateOverride?: string) => {
    if (!db) return
    const seconds = pendingSecondsRef.current
    if (seconds <= 0) return

    pendingSecondsRef.current = 0
    const dateKey = dateOverride ?? dateKeyRef.current

    try {
      await incrementDailyActivitySeconds(db, dateKey, activity, seconds)
    } catch (error) {
      console.error("[useActivityTimer] Failed to persist activity:", error)
      pendingSecondsRef.current += seconds
    }
  }, [activity, db])

  const tick = React.useCallback(() => {
    if (!isRunningRef.current || !lastTickRef.current) return

    const now = Date.now()
    const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000)
    if (elapsedSeconds <= 0) return

    lastTickRef.current = now

    const currentDateKey = getLocalDateKey()
    if (currentDateKey !== dateKeyRef.current) {
      const previousDateKey = dateKeyRef.current
      const secondsToFlush = pendingSecondsRef.current + elapsedSeconds
      pendingSecondsRef.current = 0
      dateKeyRef.current = currentDateKey

      if (db && secondsToFlush > 0) {
        void incrementDailyActivitySeconds(db, previousDateKey, activity, secondsToFlush)
      }
      return
    }

    pendingSecondsRef.current += elapsedSeconds
  }, [activity, db])

  const start = React.useCallback(() => {
    if (!db || isRunningRef.current) return

    isRunningRef.current = true
    lastTickRef.current = Date.now()
    intervalRef.current = setInterval(tick, FLUSH_INTERVAL_MS)
  }, [db, tick])

  const stop = React.useCallback((flush = true) => {
    if (!isRunningRef.current) return

    if (lastTickRef.current) {
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000)
      if (elapsedSeconds > 0) {
        pendingSecondsRef.current += elapsedSeconds
      }
    }

    isRunningRef.current = false
    lastTickRef.current = null

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (flush) {
      void flushPending()
    }
  }, [flushPending])

  React.useEffect(() => {
    const shouldRun = enabled && isFocused && appStateRef.current === "active"
    if (shouldRun) {
      start()
    } else {
      stop(true)
    }

    return () => {
      stop(true)
    }
  }, [enabled, isFocused, start, stop])

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState
      if (nextState !== "active") {
        stop(true)
      } else if (enabled && isFocused) {
        start()
      }
    })

    return () => subscription.remove()
  }, [enabled, isFocused, start, stop])
}
