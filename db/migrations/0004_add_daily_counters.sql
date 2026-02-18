CREATE TABLE IF NOT EXISTS "daily_counters" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "counter" text NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "updated_at" integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "daily_counters_date_counter_idx"
  ON "daily_counters" ("date", "counter");
