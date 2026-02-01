export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getLocalDayRangeSeconds(date: Date = new Date()): {
  startSeconds: number
  endSeconds: number
} {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  return {
    startSeconds: Math.floor(start.getTime() / 1000),
    endSeconds: Math.floor(end.getTime() / 1000),
  }
}
