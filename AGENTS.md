# Kanidachi - Agent Guidelines

Kanidachi is a WaniKani client for Android and iOS built with React Native and Expo.

## Tech Stack

- **Framework**: Expo v54 + React Native 0.81.4
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **Database**: Expo SQLite (native) / sql.js (web) with DrizzleORM
- **State**: Zustand for global state, MMKV for persistent storage
- **Forms**: React Hook Form + Zod validation
- **Linting/Formatting**: Biome

## Build & Development Commands

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Start with Android emulator
bun run dev:android

# Build and run on Android
bun run android

# Build and run on iOS
bun run ios

# Build for web
bun run build:web

# Format and lint code (auto-fix)
bun run format

# Generate database migrations
bun run db:generate

# Check Expo dependencies
bun run expo-check
```

## Project Structure

```
app/                    # Expo Router pages (file-based routing)
  _layout.tsx           # Root layout with providers
  index.tsx             # Home screen
  settings.tsx          # Settings screen
  global.css            # Tailwind CSS variables (light/dark themes)

components/
  ui/                   # Reusable UI components (shadcn/rn-reusables style)
  primitives/           # Low-level primitives (Radix-style)
  settings/             # Settings-specific components

db/
  schema.ts             # DrizzleORM table definitions
  provider.tsx          # Database context provider
  drizzle.ts            # Native SQLite initialization
  drizzle.web.ts        # Web sql.js initialization

lib/                    # Utilities and hooks
hooks/                  # Custom React hooks
assets/                 # Images, fonts, icons
```

## Code Style Guidelines

### Imports

Biome auto-organizes imports. Use path aliases:

```typescript
// Use @ alias for project imports
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDatabase } from "@/db/provider";

// React imports
import * as React from "react";
import { useEffect, useState } from "react";

// React Native imports
import { View, Pressable } from "react-native";
```

### Formatting

- 2-space indentation
- Double quotes for strings
- No semicolons (Biome handles this consistently)
- Max line length: ~100 characters (soft limit)

### TypeScript

- Strict mode enabled
- Use `type` imports: `import type { Props } from "./types"`
- Prefer interfaces for component props, types for unions/utilities
- Use explicit return types for exported functions

```typescript
// Props interface pattern
interface ButtonProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
}

// Component with forwardRef
const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <Pressable ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
```

### Naming Conventions

- **Files**: kebab-case for components (`button.tsx`, `list-item.tsx`)
- **Components**: PascalCase (`Button`, `ListItem`)
- **Hooks**: camelCase with `use` prefix (`useColorScheme`, `useDatabase`)
- **Utilities**: camelCase (`cn`, `getItem`, `setItem`)
- **Constants**: SCREAMING_SNAKE_CASE (`DARK_THEME`, `LIGHT_THEME`)

### Styling with NativeWind

Use Tailwind classes with the `cn()` utility for conditional styles:

```typescript
import { cn } from "@/lib/utils";

<View className={cn(
  "flex-1 items-center justify-center bg-background",
  isActive && "bg-primary",
  className
)} />
```

Platform-specific styles use `web:` and `native:` prefixes:

```typescript
className="h-10 native:h-12 web:hover:opacity-90"
```

### Component Patterns

Use class-variance-authority (CVA) for variant-based components:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Database (DrizzleORM)

Define schemas in `db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const items = sqliteTable("items", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
```

### Error Handling

- Use try/catch for async operations
- Log errors with `console.error`
- Return null or empty state on parse failures

```typescript
export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  try {
    return value ? JSON.parse(value) || null : null;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}
```

### Biome Linter Rules

Key disabled rules (see `biome.json`):
- `useExhaustiveDependencies`: off (React hooks deps)
- `noNonNullAssertion`: off (allows `!` operator)
- `useSelfClosingElements`: off
- Various a11y rules relaxed for mobile

Run `bun run format` before committing to auto-fix issues.

## Known Issues & Workarounds

### NativeWind v4 CSS Interop Race Condition

**Issue**: NativeWind v4 has a known bug where using `className` on `Pressable`, `TouchableOpacity`, or other interactive components can break React Navigation context and cause layout issues.

**Symptoms**:
- Error: "Couldn't find a navigation context"
- Components collapse to 0 height or become invisible
- Layout breaks after state changes

**Problematic patterns**:
```typescript
// BAD - className on Pressable breaks context
<Pressable className="flex-1 p-4" onPress={handlePress}>
  <Text>Content</Text>
</Pressable>

// BAD - Dynamic className with cn() on Pressable
<Pressable className={cn("p-4", isActive && "bg-primary")} />

// BAD - Opacity shorthand classes anywhere
<View className="text-white/80 bg-black/50" />
```

**Workaround**: Wrap `Pressable` in a `View` and use `style` prop instead of `className`:

```typescript
// GOOD - Wrap Pressable in View with layout styles
<View style={{ flex: 1 }}>
  <Pressable onPress={handlePress} style={{ flex: 1 }}>
    <View className="p-4">
      <Text>Content</Text>
    </View>
  </Pressable>
</View>

// GOOD - Use rgba() instead of opacity shorthand
<Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Content</Text>
```

**For complex components**: Convert to full `StyleSheet.create()` approach (see `components/lessons/subject-cell.tsx` for example).

**References**:
- https://github.com/nativewind/nativewind/discussions/1537
- https://github.com/nativewind/react-native-css/issues/269
- https://github.com/nativewind/nativewind/issues/1522
