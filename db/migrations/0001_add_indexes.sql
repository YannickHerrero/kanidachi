-- Add indexes for better query performance
-- This migration adds indexes on frequently queried columns

-- Subjects indexes
CREATE INDEX IF NOT EXISTS `idx_subjects_level` ON `subjects` (`level`);
CREATE INDEX IF NOT EXISTS `idx_subjects_type` ON `subjects` (`type`);
CREATE INDEX IF NOT EXISTS `idx_subjects_type_level` ON `subjects` (`type`, `level`);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS `idx_assignments_subject_id` ON `assignments` (`subject_id`);
CREATE INDEX IF NOT EXISTS `idx_assignments_available_at` ON `assignments` (`available_at`);
CREATE INDEX IF NOT EXISTS `idx_assignments_srs_stage` ON `assignments` (`srs_stage`);
CREATE INDEX IF NOT EXISTS `idx_assignments_level` ON `assignments` (`level`);
CREATE INDEX IF NOT EXISTS `idx_assignments_started_at` ON `assignments` (`started_at`);
CREATE INDEX IF NOT EXISTS `idx_assignments_burned_at` ON `assignments` (`burned_at`);
-- Composite index for review queries (started, not burned, available)
CREATE INDEX IF NOT EXISTS `idx_assignments_review_query` ON `assignments` (`started_at`, `burned_at`, `available_at`);
-- Composite index for lesson queries (unlocked, not started)
CREATE INDEX IF NOT EXISTS `idx_assignments_lesson_query` ON `assignments` (`unlocked_at`, `started_at`);

-- Review statistics indexes
CREATE INDEX IF NOT EXISTS `idx_review_statistics_percentage` ON `review_statistics` (`percentage_correct`);

-- Level progressions indexes
CREATE INDEX IF NOT EXISTS `idx_level_progressions_level` ON `level_progressions` (`level`);

-- Audio cache indexes
CREATE INDEX IF NOT EXISTS `idx_audio_cache_subject_voice` ON `audio_cache` (`subject_id`, `voice_actor_id`);
