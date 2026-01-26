import { type ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { migrate, useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "./migrations/migrations";

const expoDb = openDatabaseSync("database.db", { enableChangeListener: true });
const db = drizzle(expoDb);

export const initialize = async (): Promise<ExpoSQLiteDatabase> => {
  await migrate(db, migrations);
  return db;
};

export const useMigrationHelper = () => {
  return useMigrations(db, migrations);
};
