CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY NOT NULL,
	`subject_id` integer NOT NULL,
	`subject_type` text NOT NULL,
	`srs_stage` integer NOT NULL,
	`level` integer NOT NULL,
	`unlocked_at` integer,
	`started_at` integer,
	`passed_at` integer,
	`burned_at` integer,
	`available_at` integer,
	`resurrected_at` integer,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `audio_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` integer NOT NULL,
	`voice_actor_id` integer NOT NULL,
	`url` text NOT NULL,
	`local_path` text NOT NULL,
	`file_size` integer,
	`cached_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `level_progressions` (
	`id` integer PRIMARY KEY NOT NULL,
	`level` integer NOT NULL,
	`created_at` integer,
	`unlocked_at` integer,
	`started_at` integer,
	`passed_at` integer,
	`completed_at` integer,
	`abandoned_at` integer,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `pending_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`is_lesson` integer NOT NULL,
	`meaning_wrong_count` integer DEFAULT 0 NOT NULL,
	`reading_wrong_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` integer,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `review_statistics` (
	`id` integer PRIMARY KEY NOT NULL,
	`subject_id` integer NOT NULL,
	`subject_type` text NOT NULL,
	`meaning_correct` integer DEFAULT 0 NOT NULL,
	`meaning_incorrect` integer DEFAULT 0 NOT NULL,
	`meaning_max_streak` integer DEFAULT 0 NOT NULL,
	`meaning_current_streak` integer DEFAULT 0 NOT NULL,
	`reading_correct` integer DEFAULT 0 NOT NULL,
	`reading_incorrect` integer DEFAULT 0 NOT NULL,
	`reading_max_streak` integer DEFAULT 0 NOT NULL,
	`reading_current_streak` integer DEFAULT 0 NOT NULL,
	`percentage_correct` integer DEFAULT 0 NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_statistics_subject_id_unique` ON `review_statistics` (`subject_id`);--> statement-breakpoint
CREATE TABLE `study_materials` (
	`id` integer PRIMARY KEY NOT NULL,
	`subject_id` integer NOT NULL,
	`subject_type` text NOT NULL,
	`meaning_note` text,
	`reading_note` text,
	`meaning_synonyms` text,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_materials_subject_id_unique` ON `study_materials` (`subject_id`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`level` integer NOT NULL,
	`characters` text,
	`slug` text NOT NULL,
	`document_url` text NOT NULL,
	`meanings` text NOT NULL,
	`readings` text,
	`auxiliary_meanings` text,
	`component_subject_ids` text,
	`amalgamation_subject_ids` text,
	`visually_similar_subject_ids` text,
	`meaning_mnemonic` text,
	`meaning_hint` text,
	`reading_mnemonic` text,
	`reading_hint` text,
	`context_sentences` text,
	`parts_of_speech` text,
	`pronunciation_audios` text,
	`character_images` text,
	`hidden_at` integer,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`last_sync_at` text,
	`last_full_sync_at` integer,
	`item_count` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`level` integer NOT NULL,
	`profile_url` text,
	`max_level_granted_by_subscription` integer NOT NULL,
	`subscribed` integer NOT NULL,
	`subscription_ends_at` integer,
	`started_at` integer,
	`vacation_started_at` integer,
	`data_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `voice_actors` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`description` text,
	`data_updated_at` text
);
