CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`word` text NOT NULL,
	`word_reading` text,
	`word_translation` text NOT NULL,
	`sentence_ja` text NOT NULL,
	`sentence_reading` text,
	`sentence_translation` text NOT NULL,
	`word_audio_uri` text,
	`sentence_audio_uri` text,
	`source_model` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flashcard_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`flashcard_id` text NOT NULL,
	`srs_stage` integer DEFAULT 0 NOT NULL,
	`unlocked_at` integer NOT NULL,
	`started_at` integer,
	`passed_at` integer,
	`burned_at` integer,
	`available_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `flashcard_assignments_flashcard_id_idx` ON `flashcard_assignments` (`flashcard_id`);
