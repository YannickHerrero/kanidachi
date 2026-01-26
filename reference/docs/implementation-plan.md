# Kanidachi Implementation Plan

## Overview

Kanidachi is a WaniKani client for Android and iOS with these key characteristics:
- **Anki-mode only** reviews (no typing, self-grading)
- **Combined meaning+reading cards** (single grade per item)
- **Individual lesson picker** (choose specific items to learn)
- **Fully offline capable** after initial sync
- **Dashboard-centric navigation** (single home with feature cards)
- **Stream-and-cache audio** (download as played)
- **Preferred voice actor** setting (global)
- **Wrap-up mode** for reviews
- **User notes sync** to WaniKani

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         App Layer                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │ Lessons │ │ Reviews │ │ Browse  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └──────────┬┴──────────┬┴──────────┬┘                │
│            ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐           │
│            │  Zustand  │ │  React │ │   Expo   │           │
│            │  Stores   │ │  Query │ │  Router  │           │
│            └─────┬─────┘ └───┬────┘ └──────────┘           │
├──────────────────┼───────────┼──────────────────────────────┤
│                  │   Data Layer                             │
│            ┌─────▼───────────▼─────┐                        │
│            │   WaniKani Client     │                        │
│            │  (API + Rate Limit)   │                        │
│            └──────────┬────────────┘                        │
│                       │                                     │
│  ┌────────────────────▼────────────────────┐               │
│  │           DrizzleORM + SQLite           │               │
│  │  ┌──────────┬──────────┬──────────┐    │               │
│  │  │ Subjects │Assignments│ Pending  │    │               │
│  │  │          │           │ Progress │    │               │
│  │  └──────────┴──────────┴──────────┘    │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Database Schema & Setup
- [x] `db/schema.ts` - DrizzleORM table definitions
- [x] `db/migrations/` - Migration files
- [x] `db/queries.ts` - Common query helpers

**Tables:**
- subjects - All radicals, kanji, vocabulary
- assignments - User's SRS progress
- study_materials - User notes and synonyms
- pending_progress - Offline queue for reviews/lessons
- sync_metadata - Last sync timestamps per entity
- audio_cache - Cached audio file paths
- voice_actors - Voice actor metadata

### 1.2 WaniKani API Client
- [x] `lib/wanikani/client.ts` - Core API client
- [x] `lib/wanikani/types.ts` - TypeScript types for API responses
- [x] `lib/wanikani/rate-limiter.ts` - Rate limiting logic
- [x] `lib/wanikani/errors.ts` - Custom error types

### 1.3 Authentication Flow
- [x] `app/login.tsx` - Login screen
- [x] `lib/auth.ts` - Auth helpers (token storage, validation)
- [x] `stores/auth.ts` - Auth state store

### 1.4 Initial Sync System
- [x] `app/sync.tsx` - Sync progress screen
- [x] `lib/sync/initial-sync.ts` - First-time sync logic
- [x] `lib/sync/incremental-sync.ts` - Update sync logic
- [x] `stores/sync.ts` - Sync state store

---

## Phase 2: Core Features (Week 2-3)

### 2.1 Dashboard
- [x] `app/index.tsx` - Dashboard (update existing)
- [x] `components/dashboard/review-card.tsx` - Available reviews card
- [x] `components/dashboard/lesson-card.tsx` - Available lessons card
- [x] `components/dashboard/forecast-chart.tsx` - 24-hour review forecast
- [x] `components/dashboard/level-progress.tsx` - Current level progress
- [x] `components/dashboard/srs-breakdown.tsx` - Items per SRS stage
- [x] `hooks/useDashboardData.ts` - Dashboard data fetching hook

### 2.2 Lesson Picker
- [x] `app/lessons/index.tsx` - Lesson picker screen
- [x] `app/lessons/content.tsx` - Lesson content viewer
- [x] `app/lessons/quiz.tsx` - Lesson quiz screen
- [x] `components/lessons/subject-grid.tsx` - Grid of selectable items
- [x] `components/lessons/subject-cell.tsx` - Subject selection cell
- [x] `components/lessons/filter-bar.tsx` - Type/level filters
- [x] `components/lessons/lesson-content.tsx` - Full subject content display
- [x] `components/lessons/quiz-card.tsx` - Anki-style quiz card
- [x] `stores/lessons.ts` - Lesson session state
- [x] `hooks/useAvailableLessons.ts` - Fetch available lessons

### 2.3 Anki Mode Reviews
- [x] `app/reviews/index.tsx` - Review session screen
- [x] `app/reviews/summary.tsx` - Review summary screen
- [x] `components/reviews/anki-card.tsx` - Flippable review card
- [x] `components/reviews/card-front.tsx` - Card front (character)
- [x] `components/reviews/card-back.tsx` - Card back (meanings, readings)
- [x] `components/reviews/grade-buttons.tsx` - Correct/Incorrect buttons
- [x] `components/reviews/progress-bar.tsx` - Session progress
- [x] `stores/reviews.ts` - Review session state
- [x] `hooks/useAvailableReviews.ts` - Fetch available reviews

### 2.4 Pending Progress Queue
- [x] `lib/sync/pending-queue.ts` - Queue management
- [x] `lib/sync/background-sync.ts` - Background sync logic
- [x] `hooks/useNetworkStatus.ts` - Network state hook

---

## Phase 3: Subject Browsing (Week 3-4)

### 3.1 Subject Catalog
- [x] `app/browse/index.tsx` - Browse home (level selector)
- [x] `app/browse/level/[level].tsx` - Items by level
- [x] `app/browse/search.tsx` - Search screen
- [x] `components/browse/subject-list.tsx` - Virtualized subject list
- [x] `components/browse/subject-cell.tsx` - List item cell
- [x] `components/browse/level-grid.tsx` - Level selection grid
- [x] `components/browse/search-bar.tsx` - Search input component
- [x] `components/dashboard/browse-card.tsx` - Dashboard navigation card

### 3.2 Subject Details
- [x] `app/subject/[id].tsx` - Subject detail screen
- [x] `components/subject/header.tsx` - Character + primary info
- [x] `components/subject/meanings.tsx` - Meanings list
- [x] `components/subject/readings.tsx` - Readings list
- [x] `components/subject/mnemonic.tsx` - Mnemonic with rich text
- [x] `components/subject/components.tsx` - Component radicals/kanji
- [x] `components/subject/amalgamations.tsx` - Used in...
- [x] `components/subject/sentences.tsx` - Context sentences
- [x] `components/subject/user-notes.tsx` - User notes (read-only)
- [x] `components/subject/subject-chip.tsx` - Tappable subject pill
- [x] `components/subject/visually-similar.tsx` - Similar kanji display
- [x] `components/subject/parts-of-speech.tsx` - Part of speech badges
- [x] `components/subject/audio-player.tsx` - Audio playback (implemented in Phase 4)

### 3.3 Data Layer
- [x] `hooks/useSubject.ts` - Fetch subject with related data
- [x] `hooks/useSubjectsByLevel.ts` - Fetch subjects for a level
- [x] `hooks/useSearchSubjects.ts` - Debounced search hook
- [x] `hooks/useLevelProgress.ts` - Level progress for grid
- [x] Added browse queries to `db/queries.ts`

---

## Phase 4: Audio & Media (Week 4)

### 4.1 Audio Playback
- [x] `lib/audio/player.ts` - Audio playback service (expo-av based)
- [x] `lib/audio/cache.ts` - Audio caching logic (stream-and-cache approach)
- [x] `hooks/useAudio.ts` - Audio hook for components
- [x] Add audio playback to lesson content screen
- [x] Add audio playback to review card back
- [x] Add audio playback to subject details
- [x] Auto-play audio option in settings
- [x] `stores/settings.ts` - Settings store with MMKV persistence
- [x] `components/settings/AudioSettingItem.tsx` - Audio settings UI

### 4.2 Radical Images
- [x] `components/subject/radical-image.tsx` - SVG radical display (uses react-native-svg)
- [x] Handle radicals without characters (image-only radicals)
- [x] Updated all components to display radical images where needed:
  - SubjectHeader, SubjectChip, SubjectCell (browse/lessons)
  - LessonContent, QuizCard, CardFront, CardBack

**Note:** Image caching uses the native platform's HTTP caching for SVG/PNG. A custom `lib/images/radical-cache.ts` was not needed.

---

## Phase 5: Settings & Notifications (Week 4-5) ✅ COMPLETED

### 5.1 Settings Screen
- [x] `app/settings.tsx` - Comprehensive settings screen with sections
- [x] `components/settings/ThemeItem.tsx` - Theme selection (light/dark/system)
- [x] `components/settings/AudioSettingItem.tsx` - Auto-play audio toggles
- [x] `components/settings/VoiceActorSettingItem.tsx` - Preferred voice actor selection
- [x] `components/settings/LessonSettingsItem.tsx` - Lesson batch size & ordering
- [x] `components/settings/ReviewSettingsItem.tsx` - Review ordering & wrap-up batch size
- [x] `components/settings/CacheSettingsItem.tsx` - Clear audio cache option
- [x] `components/settings/LogoutItem.tsx` - Sign out and clear all data
- [x] `components/settings/NotificationItem.tsx` - Notification preferences with time picker
- [x] `stores/settings.ts` - Settings store with MMKV persistence

**Implemented Settings:**
- [x] Preferred voice actor selection
- [x] Auto-play audio toggle (separate for lessons and reviews)
- [x] Lesson batch size (3, 5, 10, 15, 20)
- [x] Lesson ordering preference (ascending level, current level first, shuffled)
- [x] Review ordering preference (random, SRS stage, level)
- [x] Wrap-up batch size (5, 10, 15, 20, 25)
- [x] Theme selection (light/dark/system)
- [x] Notification preferences with time picker
- [x] Clear audio cache option
- [x] Sign out / clear all data

### 5.2 Push Notifications
- [x] `lib/notifications/permissions.ts` - Permission handling
- [x] `lib/notifications/scheduler.ts` - Notification scheduling
- [x] `hooks/useReviewNotifications.ts` - Badge and notification management
- [x] Configure notification handler in app layout
- [x] Android notification channel for reviews
- [x] Schedule daily review reminders
- [x] Configurable notification times
- [x] Badge count for available reviews (auto-updates on app active)

**Dependencies Added:**
- `expo-device` - Device detection for notifications
- `@react-native-community/datetimepicker` - Time picker for notification settings

---

## Phase 6: Statistics & Polish (Week 5) ✅ COMPLETED

### 6.1 Statistics
- [x] `app/stats.tsx` - Statistics screen with summary cards
- [x] `hooks/useStatistics.ts` - Statistics data fetching hook
- [x] `components/stats/accuracy-chart.tsx` - Overall accuracy and accuracy by type
- [x] `components/stats/level-timeline.tsx` - Level progression with time spent
- [x] `components/stats/leech-list.tsx` - Problem items (low accuracy)
- [x] `components/dashboard/stats-card.tsx` - Dashboard navigation card
- [x] Statistics queries in `db/queries.ts` (overall accuracy, accuracy by type, leeches, level timeline)

### 6.2 Error Handling & Edge Cases
- [x] `components/ui/error-view.tsx` - Reusable error state component (network, server, auth, generic)
- [x] `components/ui/empty-state.tsx` - Reusable empty state component (reviews, lessons, search)
- [x] `components/ui/network-status-bar.tsx` - Network/sync status indicator
- [x] Network error UI states in reviews, lessons, search screens
- [x] Empty states for no reviews, no lessons, no search results
- [x] Token expiration handling with automatic logout via `forceLogout` action
- [x] Auth error detection in background sync queue processing

**Sync Conflict Resolution - IMPLEMENTED:**
- [x] Rate-limit aware queue processing (reserves quota for sync operations)
- [x] Quick sync (user + assignments) on app foreground via `useAppStateSync` hook
- [x] Full refresh sync (user + assignments + review stats + level progressions) on pull-to-refresh
- [x] Automatic quick sync after pending queue processing
- [x] 422 error handling: server wins, item removed from queue (following Tsurukame pattern)
- [x] Error logging table for debugging (`error_log` table, keeps last 100 errors)

### 6.3 Performance Optimization
- [x] Audio preloading for upcoming review items (`preloadAudio` in `lib/audio/cache.ts`)
- [x] Database query optimization via indexes (migration `0001_add_indexes.sql`)
  - Indexes on subjects (level, type, type+level)
  - Indexes on assignments (subject_id, available_at, srs_stage, level, review/lesson queries)
  - Indexes on review_statistics (percentage_correct)
  - Indexes on level_progressions (level)
  - Indexes on audio_cache (subject_id+voice_actor_id)

**Note:** FlashList estimatedItemSize was investigated but not supported in v2.0.2

---

## Deferred Features & Enhancements

This section tracks features that were intentionally deferred during initial implementation to be added later.

### From Phase 2 (Lessons & Reviews)

**Lesson Enhancements:**
- [x] Audio playback in lesson content (implemented in Phase 4)
- [x] Lesson ordering options (ascending level, shuffled, current level first) - implemented in Phase 5
- [x] Batch size configuration for lessons - implemented in Phase 5
- [x] "Skip to Quiz" option to bypass content viewing
- [x] Component radicals/kanji display in lesson content
- [x] Visually similar kanji display for kanji lessons

**Review Enhancements:**
- [x] Audio playback on card back (implemented in Phase 4)
- [x] Review ordering options (random, SRS stage, level) - implemented in Phase 5
- [x] Configurable wrap-up batch size - implemented in Phase 5
- [x] "Ask Again Later" - return item without penalty
- [x] "Mark Correct Override" - override wrong answer
- [x] Undo last answer
- [x] Minimize penalty option (reduce SRS penalty)
- [x] Session item limit setting
- [x] Haptic feedback on grade buttons

**Card Display Enhancements:**
- [x] Abbreviated mnemonic with "Show more" expand option
- [x] Context sentences on review card back
- [x] User synonyms display (with edit functionality)
- [x] User notes display (with edit functionality)
- [x] Part of speech display for vocabulary
- [x] Reading type labels (on'yomi/kun'yomi) on card back

### From Phase 3 (Subject Browsing)

**Implemented:**
- [x] Level progress indicator in grid cells (mini progress bars)
- [x] Rich text formatting for mnemonics (highlight radical/kanji/reading tags)
- [x] Filter search results by type (radical/kanji/vocab)

**Deferred to Future Phases (require additional infrastructure):**
- [x] Audio playback (implemented in Phase 4)
- [x] Editable user notes (Study Materials API sync)
- [x] Editable user synonyms (Study Materials API sync)
- [ ] SRS stage history display (requires review_statistics sync)
- [ ] Review accuracy statistics per subject (requires review_statistics sync)

**UX Enhancements (nice-to-have):**
- [x] SRS category browsing (browse all Apprentice items, all Guru items, etc.)
- [x] "Show remaining" view for current level (expandable breakdown in level progress)
- [ ] "Show Answers" toggle to hide meanings/readings while browsing
- [ ] Horizontal swipe between levels (PageView-style navigation)
- [x] "Practice" button to start a practice review for this subject
- [ ] Romaji-to-hiragana conversion for reading searches (needs wanakana library)
- [ ] Search history / recent searches
- [ ] Filter search results by SRS stage

### From Dashboard

- [x] Weekly forecast (7-day overview)
- [x] Vacation mode banner display
- [x] Pending sync indicator (show when items waiting to sync)

### Future Considerations

**Study Materials Sync:**
- [x] Create/update user notes from app
- [x] Create/update user synonyms from app
- [x] Sync study materials to WaniKani API

**Advanced Features:**
- [x] Leech detection and highlighting (implemented in Phase 6.1 - Statistics screen)
- [x] Critical items list (low accuracy items) (implemented as leech list in Phase 6.1)
- [ ] SRS stage history per item
- [ ] Review accuracy history per item
- [ ] Export/import session data
- [x] Haptic feedback on grade buttons
- [ ] Keyboard shortcuts for web

---

## File Structure

```
app/
  _layout.tsx           # Root layout with auth routing + notifications
  index.tsx             # Dashboard
  login.tsx             # Authentication
  sync.tsx              # Initial sync progress
  settings.tsx          # Settings
  stats.tsx             # Statistics
  lessons/
    index.tsx           # Lesson picker
    content.tsx         # Lesson content viewer
    quiz.tsx            # Lesson quiz
  reviews/
    index.tsx           # Review session
    summary.tsx         # Session summary
  practice/
    index.tsx           # Practice session (self-study mode)
  browse/
    index.tsx           # Browse home
    level/[level].tsx   # Browse by level
    srs/[category].tsx  # Browse by SRS category
    search.tsx          # Search
  subject/
    [id].tsx            # Subject details

components/
  dashboard/
    review-card.tsx         # Available reviews card
    lesson-card.tsx         # Available lessons card
    level-progress.tsx      # Current level progress (with expandable breakdown)
    srs-breakdown.tsx       # SRS stage breakdown (clickable for browsing)
    forecast-chart.tsx      # 24-hour forecast
    weekly-forecast.tsx     # 7-day forecast chart
    browse-card.tsx         # Browse navigation card
    stats-card.tsx          # Statistics navigation card
    pending-sync-indicator.tsx  # Pending sync status indicator
    vacation-banner.tsx     # Vacation mode active banner
  lessons/
    subject-cell.tsx    # Selectable subject cell
    subject-grid.tsx    # Grid of subjects by level
    filter-bar.tsx      # Type filter bar
    lesson-content.tsx  # Full subject content display
    quiz-card.tsx       # Anki-style quiz card
  reviews/
    anki-card.tsx       # Flippable card container
    card-front.tsx      # Card front (character)
    card-back.tsx       # Card back (answer)
    grade-buttons.tsx   # Correct/Incorrect buttons
    progress-bar.tsx    # Session progress
  browse/
    subject-list.tsx    # Virtualized subject list
    subject-cell.tsx    # List item cell
    level-grid.tsx      # Level selection grid
    search-bar.tsx      # Search input component
  subject/
    header.tsx              # Character + primary info
    meanings.tsx            # Meanings list
    readings.tsx            # Readings list
    mnemonic.tsx            # Mnemonic with rich text
    components.tsx          # Component radicals/kanji
    amalgamations.tsx       # Used in...
    sentences.tsx           # Context sentences
    user-notes.tsx          # User notes display
    subject-chip.tsx        # Tappable subject pill
    visually-similar.tsx    # Similar kanji display
    parts-of-speech.tsx     # Part of speech badges
    audio-player.tsx        # Audio playback component
    radical-image.tsx       # Radical image display (SVG/PNG)
    study-material-editor.tsx # Edit synonyms/notes bottom sheet
  stats/
    accuracy-chart.tsx    # Overall accuracy visualization
    level-timeline.tsx    # Level progression timeline
    leech-list.tsx        # Problem items list
  settings/
    ThemeItem.tsx           # Theme selection
    NotificationItem.tsx    # Notification settings with time picker
    AudioSettingItem.tsx    # Audio auto-play settings
    VoiceActorSettingItem.tsx # Voice actor selection
    LessonSettingsItem.tsx  # Lesson batch size & ordering
    ReviewSettingsItem.tsx  # Review ordering & wrap-up batch size
    CacheSettingsItem.tsx   # Clear audio cache
    LogoutItem.tsx          # Sign out and clear data
  ui/                   # Shared UI components
    error-view.tsx        # Reusable error state component
    empty-state.tsx       # Reusable empty state component
    network-status-bar.tsx # Network/sync status indicator
  primitives/           # Low-level primitives

lib/
  wanikani/
    client.ts           # API client
    types.ts            # API types
    rate-limiter.ts     # Rate limiting with clock skew estimation
    errors.ts           # Error types
  sync/
    initial-sync.ts     # First-time sync
    incremental-sync.ts # Update sync (includes quick sync + full refresh)
    pending-queue.ts    # Offline queue (rate-limit aware)
    background-sync.ts  # Background sync manager
  audio/
    player.ts           # Audio playback (expo-av)
    cache.ts            # Audio caching (stream-and-cache)
  notifications/
    permissions.ts      # Permission handling
    scheduler.ts        # Notification scheduling
    index.ts            # Exports
  auth.ts               # Auth helpers
  storage.ts            # MMKV storage helpers
  utils.ts              # Utility functions

stores/
  auth.ts               # Auth state
  sync.ts               # Sync state
  settings.ts           # Settings state (MMKV persistence)
  lessons.ts            # Lesson session state (supports ordering)
  reviews.ts            # Review session state (supports ordering, undo, actions)
  practice.ts           # Practice session state (self-study mode)

db/
  schema.ts             # Database schema (includes error_log table)
  provider.tsx          # Database context provider
  queries.ts            # Query helpers (includes error logging functions)
  drizzle.ts            # Native SQLite setup
  drizzle.web.ts        # Web sql.js setup
  migrate.ts            # Migration runner
  migrations/           # Migration files (0000, 0001_indexes, 0002_error_log)

hooks/
  useDashboardData.ts       # Dashboard data fetching (triggers full sync on refresh)
  useAvailableLessons.ts    # Fetch available lessons (with ordering)
  useAvailableReviews.ts    # Fetch available reviews
  useNetworkStatus.ts       # Network connectivity
  useSubject.ts             # Subject data with related subjects
  useSubjectsByLevel.ts     # Subjects grouped by type for a level
  useSearchSubjects.ts      # Debounced search
  useLevelProgress.ts       # Level progress for grid
  useAudio.ts               # Audio playback hook
  useReviewNotifications.ts # Badge and notification management
  useStatistics.ts          # Statistics data fetching
  useAppStateSync.ts        # App foreground sync trigger
  useColorScheme.ts         # Theme hook
  useFrameworkReady.ts      # Framework initialization
  useStudyMaterial.ts       # Fetch/refetch study materials for a subject
```

---

## Dependencies

### Already Installed
- `@tanstack/react-query` - Data fetching (available but not yet used)
- `expo-secure-store` - Secure token storage
- `expo-av` - Audio playback
- `expo-file-system` - File system access for caching
- `@react-native-community/netinfo` - Network status
- `expo-notifications` - Push notifications
- `@shopify/flash-list` - Performant lists
- `zustand` - State management
- `drizzle-orm` - Database ORM
- `react-native-mmkv` - Fast key-value storage
- `expo-device` - Device detection (added in Phase 5)
- `@react-native-community/datetimepicker` - Time picker (added in Phase 5)

### May Need to Add
- `victory-native` - Charts (if we want richer visualizations)
- `wanakana` - Romaji to kana conversion (for future typed input mode)

---

## Progress Tracking

### Current Phase: COMPLETE - All core phases finished
### Completed Phases: 1, 2, 3, 4, 5, 6

---

## Changelog

- **2026-01-26**: Completed All Deferred Features
  - **Lesson Enhancements:** Skip to Quiz button, component subjects in lesson content, visually similar kanji for kanji lessons
  - **Review Enhancements:** Ask Again Later, Mark Correct Override, Undo last answer, Minimize penalty option, Session item limit, Haptic feedback on grade buttons
  - **Card Display:** Expandable mnemonics (show more/less), context sentences, user synonyms/notes display with edit functionality, parts of speech, reading type labels
  - **Study Materials:** Full edit support for user notes and synonyms via WaniKani API with bottom sheet editor
  - **Dashboard:** Weekly forecast (7-day overview), Vacation mode banner, Pending sync indicator with retry
  - **Browsing:** SRS category browsing (tap SRS breakdown to browse by stage), Detailed level progress breakdown (expandable)
  - **Practice Mode:** Self-study practice for any subject without affecting SRS
  - New files: `useStudyMaterial.ts`, `study-material-editor.tsx`, `pending-sync-indicator.tsx`, `vacation-banner.tsx`, `weekly-forecast.tsx`, `app/browse/srs/[category].tsx`, `app/practice/index.tsx`, `stores/practice.ts`
- **2026-01-26**: Completed Sync Enhancements
  - Implemented complete sync conflict resolution system (following Tsurukame patterns)
  - Rate-limit aware queue processing with API quota reservation
  - Quick sync (user + assignments) on app foreground via useAppStateSync hook
  - Full refresh sync on pull-to-refresh (includes review stats + level progressions)
  - Automatic quick sync after pending queue success
  - Error logging table for debugging (keeps last 100 errors)
  - 422 conflict handling: server wins, item silently removed from queue
- **2026-01-26**: Completed Phase 6 - Statistics & Polish
  - 6.1: Statistics screen with accuracy chart, level timeline, and leech list
  - 6.2: Error handling with reusable ErrorView and EmptyState components
  - 6.3: Performance optimization with audio preloading and database indexes
  - Added token expiration handling with automatic logout
  - Added network status bar component for offline/sync indication
  - Created database migration for query performance indexes
- **2026-01-26**: Completed Phase 5 - Settings & Notifications
  - 5.1: Comprehensive settings screen with sections for appearance, study, audio, notifications, storage, and account
  - 5.2: Push notification system with permissions, scheduling, daily reminders, and badge count
  - Added VoiceActorSettingItem for preferred voice actor selection
  - Added LessonSettingsItem for batch size and ordering preferences
  - Added ReviewSettingsItem for review ordering and wrap-up batch size
  - Added CacheSettingsItem for clearing audio cache
  - Added LogoutItem for signing out and clearing all data
  - Updated NotificationItem with time picker for configurable daily reminders
  - Integrated settings into lesson and review screens
  - Added useReviewNotifications hook for automatic badge updates
  - Installed expo-device and @react-native-community/datetimepicker
- **2026-01-26**: Completed Phase 4 - Audio & Media
  - 4.1: Audio playback with expo-av, stream-and-cache caching, auto-play settings
  - 4.2: Radical image support for image-only radicals using react-native-svg
  - Created settings store with MMKV persistence
  - Added audio settings UI to app settings
  - Updated all subject display components to support radical images
- **2026-01-26**: Completed Phase 3 - Subject Browsing
  - 3.1: Subject Catalog with level grid, browse by level, search screen
  - 3.2: Subject Details with meanings, readings, mnemonics, components, amalgamations, sentences
  - 3.3: Data layer with hooks (useSubject, useSubjectsByLevel, useSearchSubjects, useLevelProgress)
  - Added BrowseCard to Dashboard for navigation
  - Added SubjectChip component for linked navigation between subjects
- **2026-01-26**: Completed Phase 2 - Core Features
  - 2.2: Lesson Picker with individual item selection, content viewer, Anki-style quiz
  - 2.3: Anki Mode Reviews with flippable cards, self-grading, wrap-up mode
  - 2.4: Pending Progress Queue with background sync
- **2026-01-26**: Completed Phase 2.1 - Dashboard with review/lesson cards, level progress, SRS breakdown, and forecast chart
- **2026-01-26**: Initial plan created
