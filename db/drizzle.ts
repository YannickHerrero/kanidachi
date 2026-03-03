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
DELETE FROM "reviews";
DELETE FROM "level_progressions";
DELETE FROM "user";
DELETE FROM "pending_progress";
DELETE FROM "sync_metadata";
DELETE FROM "audio_cache";
DELETE FROM "error_log";
DELETE FROM "daily_activity";
DELETE FROM "daily_counters";
DELETE FROM "flashcard_assignments";
DELETE FROM "flashcards";
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

const ENSURE_DAILY_COUNTERS_SQL = `
CREATE TABLE IF NOT EXISTS "daily_counters" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "counter" text NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "updated_at" integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "daily_counters_date_counter_idx"
  ON "daily_counters" ("date", "counter");
`

const ENSURE_REVIEWS_SQL = `
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" integer PRIMARY KEY NOT NULL,
  "assignment_id" integer NOT NULL,
  "subject_id" integer NOT NULL,
  "created_at" integer NOT NULL,
  "starting_srs_stage" integer NOT NULL,
  "ending_srs_stage" integer NOT NULL,
  "incorrect_meaning_answers" integer NOT NULL,
  "incorrect_reading_answers" integer NOT NULL,
  "spaced_repetition_system_id" integer NOT NULL,
  "data_updated_at" text
);
CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" ("created_at");
`

export const initialize = async (): Promise<ExpoSQLiteDatabase> => {
  await migrate(db, migrations);
  await expoDb.execAsync(ENSURE_DAILY_ACTIVITY_SQL)
  await expoDb.execAsync(ENSURE_DAILY_COUNTERS_SQL)
  await expoDb.execAsync(ENSURE_REVIEWS_SQL)
  return db;
};

export const resetDatabase = async (): Promise<void> => {
  await expoDb.execAsync(CLEAR_ALL_DATA_SQL)
}

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
