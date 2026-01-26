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
- [ ] `components/subject/audio-player.tsx` - Audio playback (deferred to Phase 4)

### 3.3 Data Layer
- [x] `hooks/useSubject.ts` - Fetch subject with related data
- [x] `hooks/useSubjectsByLevel.ts` - Fetch subjects for a level
- [x] `hooks/useSearchSubjects.ts` - Debounced search hook
- [x] `hooks/useLevelProgress.ts` - Level progress for grid
- [x] Added browse queries to `db/queries.ts`

---

## Phase 4: Audio & Media (Week 4)

### 4.1 Audio Playback
- [ ] `lib/audio/player.ts` - Audio playback service
- [ ] `lib/audio/cache.ts` - Audio caching logic
- [ ] `hooks/useAudio.ts` - Audio hook for components
- [ ] Add audio playback to lesson content screen
- [ ] Add audio playback to review card back
- [ ] Add audio playback to subject details
- [ ] Auto-play audio option in settings

### 4.2 Radical Images
- [ ] `components/subject/radical-image.tsx` - SVG radical display
- [ ] `lib/images/radical-cache.ts` - Image caching
- [ ] Handle radicals without characters (image-only radicals)

---

## Phase 5: Settings & Notifications (Week 4-5)

### 5.1 Settings Screen
- [ ] `app/settings.tsx` - Update existing
- [ ] `components/settings/` - Setting components
- [ ] `stores/settings.ts` - Settings store with MMKV persistence

**Settings to implement:**
- [ ] Preferred voice actor selection
- [ ] Auto-play audio toggle
- [ ] Lesson batch size
- [ ] Lesson ordering preference
- [ ] Review ordering preference
- [ ] Wrap-up batch size
- [ ] Theme selection (light/dark/system)
- [ ] Notification preferences
- [ ] Clear cache option
- [ ] Logout / clear data

### 5.2 Push Notifications
- [ ] `lib/notifications/scheduler.ts` - Notification scheduling
- [ ] `lib/notifications/permissions.ts` - Permission handling
- [ ] Schedule notifications for upcoming reviews
- [ ] Configurable notification times
- [ ] Badge count for available reviews

---

## Phase 6: Statistics & Polish (Week 5)

### 6.1 Statistics
- [ ] `app/stats.tsx` - Statistics screen
- [ ] `components/stats/accuracy-chart.tsx` - Accuracy over time
- [ ] `components/stats/level-timeline.tsx` - Level progression
- [ ] `components/stats/leech-list.tsx` - Problem items

### 6.2 Error Handling & Edge Cases
- [ ] Network error UI states
- [ ] Empty states (no reviews, no lessons)
- [ ] Sync conflict resolution
- [ ] Token expiration handling

### 6.3 Performance Optimization
- [ ] FlashList for large lists
- [ ] Image/audio preloading
- [ ] Database query optimization

---

## Deferred Features & Enhancements

This section tracks features that were intentionally deferred during initial implementation to be added later.

### From Phase 2 (Lessons & Reviews)

**Lesson Enhancements:**
- [ ] Audio playback in lesson content (deferred to Phase 4)
- [ ] Lesson ordering options (ascending level, shuffled, by type, current level first)
- [ ] Batch size configuration for lessons
- [ ] "Skip to Quiz" option to bypass content viewing
- [ ] Component radicals/kanji display in lesson content
- [ ] Visually similar kanji display for kanji lessons

**Review Enhancements:**
- [ ] Audio playback on card back (deferred to Phase 4)
- [ ] Review ordering options (random, SRS stage, level)
- [ ] "Ask Again Later" - return item without penalty
- [ ] "Mark Correct Override" - override wrong answer
- [ ] Undo last answer
- [ ] Minimize penalty option (reduce SRS penalty)
- [ ] Session item limit setting
- [ ] Configurable wrap-up batch size

**Card Display Enhancements:**
- [ ] Abbreviated mnemonic with "Show more" expand option
- [ ] Context sentences on review card back
- [ ] User synonyms display
- [ ] User notes display
- [ ] Part of speech display for vocabulary
- [ ] Reading type labels (on'yomi/kun'yomi) on card back

### From Phase 3 (Subject Browsing)

**Browse Enhancements:**
- [ ] SRS category browsing (browse all Apprentice items, all Guru items, etc.)
- [ ] Level progress indicator in grid cells (mini progress bars)
- [ ] "Show remaining" view for current level (items not yet passed)
- [ ] "Show Answers" toggle to hide meanings/readings while browsing
- [ ] Horizontal swipe between levels (PageView-style navigation)

**Subject Detail Enhancements:**
- [ ] Audio playback (deferred to Phase 4)
- [ ] Editable user notes (create/update via API)
- [ ] Editable user synonyms (create/update via API)
- [ ] Rich text formatting for mnemonics (highlight radical/kanji/reading tags)
- [ ] SRS stage history display
- [ ] Review accuracy statistics per subject
- [ ] "Practice" button to start a practice review for this subject

**Search Enhancements:**
- [ ] Romaji-to-hiragana conversion for reading searches
- [ ] Search history / recent searches
- [ ] Filter search results by type (radical/kanji/vocab)
- [ ] Filter search results by SRS stage

### From Dashboard

- [ ] Weekly forecast (7-day overview) - originally planned but not implemented
- [ ] Vacation mode banner display
- [ ] Pending sync indicator (show when items waiting to sync)

### Future Considerations

**Study Materials Sync:**
- [ ] Create/update user notes from app
- [ ] Create/update user synonyms from app
- [ ] Sync study materials to WaniKani API

**Advanced Features:**
- [ ] Leech detection and highlighting
- [ ] Critical items list (low accuracy items)
- [ ] SRS stage history per item
- [ ] Review accuracy history per item
- [ ] Export/import session data
- [ ] Haptic feedback on grade buttons
- [ ] Keyboard shortcuts for web

---

## File Structure

```
app/
  _layout.tsx           # Root layout with auth routing
  index.tsx             # Dashboard
  login.tsx             # Authentication
  sync.tsx              # Initial sync progress
  settings.tsx          # Settings
  stats.tsx             # Statistics (planned)
  lessons/
    index.tsx           # Lesson picker
    content.tsx         # Lesson content viewer
    quiz.tsx            # Lesson quiz
  reviews/
    index.tsx           # Review session
    summary.tsx         # Session summary
  browse/               # (planned)
    index.tsx           # Browse home
    level/[level].tsx   # Browse by level
    search.tsx          # Search
  subject/              # (planned)
    [id].tsx            # Subject details

components/
  dashboard/
    review-card.tsx     # Available reviews card
    lesson-card.tsx     # Available lessons card
    level-progress.tsx  # Current level progress
    srs-breakdown.tsx   # SRS stage breakdown
    forecast-chart.tsx  # 24-hour forecast
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
  browse/               # (planned)
  subject/              # (planned)
  stats/                # (planned)
  settings/             # Setting components
  ui/                   # Shared UI components
  primitives/           # Low-level primitives

lib/
  wanikani/
    client.ts           # API client
    types.ts            # API types
    rate-limiter.ts     # Rate limiting
    errors.ts           # Error types
  sync/
    initial-sync.ts     # First-time sync
    incremental-sync.ts # Update sync
    pending-queue.ts    # Offline queue
    background-sync.ts  # Background sync
  audio/                # (planned)
    player.ts           # Audio playback
    cache.ts            # Audio caching
  notifications/        # (planned)
    scheduler.ts        # Notification scheduling
    permissions.ts      # Permission handling
  auth.ts               # Auth helpers
  storage.ts            # MMKV storage helpers
  utils.ts              # Utility functions

stores/
  auth.ts               # Auth state
  sync.ts               # Sync state
  settings.ts           # Settings state (planned)
  lessons.ts            # Lesson session state
  reviews.ts            # Review session state

db/
  schema.ts             # Database schema
  provider.tsx          # Database context provider
  queries.ts            # Query helpers
  drizzle.ts            # Native SQLite setup
  drizzle.web.ts        # Web sql.js setup
  migrate.ts            # Migration runner
  migrations/           # Migration files

hooks/
  useDashboardData.ts   # Dashboard data fetching
  useAvailableLessons.ts # Fetch available lessons
  useAvailableReviews.ts # Fetch available reviews
  useNetworkStatus.ts   # Network connectivity
  useSubject.ts         # Subject data with related subjects
  useSubjectsByLevel.ts # Subjects grouped by type for a level
  useSearchSubjects.ts  # Debounced search
  useLevelProgress.ts   # Level progress for grid
  useAudio.ts           # Audio hook (planned)
  useColorScheme.ts     # Theme hook
  useFrameworkReady.ts  # Framework initialization
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

### May Need to Add
- `victory-native` - Charts (if we want richer visualizations)
- `wanakana` - Romaji to kana conversion (for future typed input mode)

---

## Progress Tracking

### Current Phase: 4 - Audio & Media
### Current Task: 4.1 - Audio Playback

---

## Changelog

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
