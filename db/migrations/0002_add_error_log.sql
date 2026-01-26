-- Add error_log table for debugging sync issues
CREATE TABLE `error_log` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`type` TEXT NOT NULL,
	`code` INTEGER,
	`message` TEXT NOT NULL,
	`details` TEXT,
	`request_url` TEXT,
	`response_data` TEXT,
	`created_at` INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_error_log_created_at` ON `error_log` (`created_at`);
