CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY NOT NULL,
	`assignment_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`starting_srs_stage` integer NOT NULL,
	`ending_srs_stage` integer NOT NULL,
	`incorrect_meaning_answers` integer NOT NULL,
	`incorrect_reading_answers` integer NOT NULL,
	`spaced_repetition_system_id` integer NOT NULL,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE INDEX `reviews_created_at_idx` ON `reviews` (`created_at`);
