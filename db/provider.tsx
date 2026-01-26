import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"
import React, { type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { initialize, resetDatabase as resetDrizzleDatabase } from "./drizzle"

type ContextType = {
  db: SQLJsDatabase | ExpoSQLiteDatabase | null
  resetDatabase: () => Promise<void>
}

export const DatabaseContext = React.createContext<ContextType>({
  db: null,
  resetDatabase: async () => {},
})

export const useDatabase = () => useContext(DatabaseContext);


export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<SQLJsDatabase | ExpoSQLiteDatabase | null>(null)

  useEffect(() => {
    if (db) return
    let isMounted = true

    initialize().then((newDb) => {
      if (isMounted) {
        setDb(newDb)
      }
    })

    return () => {
      isMounted = false
    }
  }, [db])

  const resetDatabase = useCallback(async () => {
    await resetDrizzleDatabase()
  }, [])

  return (
    <DatabaseContext.Provider value={{ db, resetDatabase }}>
      {children}
    </DatabaseContext.Provider>
  )
}
