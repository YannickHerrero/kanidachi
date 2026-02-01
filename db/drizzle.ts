import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { migrate, useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "./migrations/migrations";

const expoDb = openDatabaseSync("database.db", { enableChangeListener: true })
const db = drizzle(expoDb)

const CLEAR_ALL_DATA_SQL = `
PRAGMA foreign_keys = OFF;
DELETE FROM "subjects";
DELETE FROM "assignments";
DELETE FROM "study_materials";
DELETE FROM "voice_actors";
DELETE FROM "review_statistics";
DELETE FROM "level_progressions";
DELETE FROM "user";
DELETE FROM "pending_progress";
DELETE FROM "sync_metadata";
DELETE FROM "audio_cache";
DELETE FROM "error_log";
DELETE FROM "daily_activity";
PRAGMA foreign_keys = ON;
`

const ENSURE_DAILY_ACTIVITY_SQL = `
CREATE TABLE IF NOT EXISTS "daily_activity" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "activity" text NOT NULL,
  "seconds" integer NOT NULL DEFAULT 0,
  "updated_at" integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "daily_activity_date_activity_idx"
  ON "daily_activity" ("date", "activity");
`

export const initialize = async (): Promise<ExpoSQLiteDatabase> => {
  await migrate(db, migrations);
  await expoDb.execAsync(ENSURE_DAILY_ACTIVITY_SQL)
  return db;
};

export const resetDatabase = async (): Promise<void> => {
  await expoDb.execAsync(CLEAR_ALL_DATA_SQL)
}

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
