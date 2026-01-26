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
PRAGMA foreign_keys = ON;
`

export const initialize = async (): Promise<ExpoSQLiteDatabase> => {
  await migrate(db, migrations);
  return db;
};

export const resetDatabase = async (): Promise<void> => {
  await expoDb.execAsync(CLEAR_ALL_DATA_SQL)
}

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
