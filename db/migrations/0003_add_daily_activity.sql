CREATE TABLE IF NOT EXISTS "daily_activity" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "activity" text NOT NULL,
  "seconds" integer NOT NULL DEFAULT 0,
  "updated_at" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_activity_date_activity_idx"
  ON "daily_activity" ("date", "activity");
