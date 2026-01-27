/**
 * Mnemonic markup parser
 *
 * Parses WaniKani-style mnemonic text with tags like <kanji>, <vocabulary>, etc.
 * Supports both <tag> and [tag] syntax (matching Tsurukame behavior).
 *
 * Supported tags:
 * - <radical>, <kanji>, <vocabulary> - Subject type highlighting
 * - <reading> - Reading highlights
 * - <ja>, <jp> - Japanese text
 * - <b>, <em>, <strong> - Bold text
 * - <i> - Italic text
 * - <a href="..."> - Links
 */

export type MnemonicFormat =
  | "radical"
  | "kanji"
  | "vocabulary"
  | "reading"
  | "japanese"
  | "bold"
  | "italic"
  | "link"

export interface MnemonicSegment {
  text: string
  formats: MnemonicFormat[]
  linkUrl?: string
}

/**
 * Regex pattern explanation:
 * - ([^\[<]*) - Capture any text before a tag
 * - (?:[\[<] - Non-capturing group for opening bracket [ or <
 * - (/?) - Capture optional closing slash
 * - (radical|kanji|...|a) - Capture tag name
 * - (?: href="([^"]+)"[^>]*)? - Optional href attribute for links
 * - [\]>]) - Closing bracket ] or >
 */
const TAG_REGEX = new RegExp(
  "([^\\[<]*)" +
    "(?:[\\[<]" +
    "(/?)" +
    "(radical|kanji|vocabulary|reading|ja|jp|kan|b|em|i|strong|a)" +
    '(?: href="([^"]+)"[^>]*)?' +
    "[\\]>])",
  "gi"
)

/**
 * Parse mnemonic text into segments with formatting information.
 *
 * @param text - Raw mnemonic text with markup tags
 * @returns Array of segments, each with text content and applied formats
 */
export function parseMnemonic(
  text: string | null | undefined
): MnemonicSegment[] {
  if (!text) return []

  const segments: MnemonicSegment[] = []
  const formatStack: MnemonicFormat[] = []
  const linkUrlStack: string[] = []

  // Normalize line breaks
  const normalized = text.replace(/<br\s*\/?>/gi, "\n").trim()

  let lastIndex = 0

  // Reset regex state (important for global regex)
  TAG_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = TAG_REGEX.exec(normalized)) !== null) {
    const [fullMatch, textBefore, closingSlash, tagName, href] = match

    // Add text before this tag (if any)
    if (textBefore) {
      segments.push({
        text: textBefore,
        formats: [...formatStack],
        linkUrl: linkUrlStack[linkUrlStack.length - 1],
      })
    }

    const isClosing = closingSlash === "/"
    const format = normalizeTagName(tagName)

    if (isClosing) {
      // Remove format from stack (find last occurrence)
      const idx = formatStack.lastIndexOf(format)
      if (idx !== -1) {
        formatStack.splice(idx, 1)
        if (format === "link") {
          linkUrlStack.pop()
        }
      }
    } else {
      // Add format to stack
      formatStack.push(format)
      if (format === "link" && href) {
        linkUrlStack.push(href)
      }
    }

    lastIndex = match.index + fullMatch.length
  }

  // Add remaining text after last tag
  if (lastIndex < normalized.length) {
    segments.push({
      text: normalized.slice(lastIndex),
      formats: [...formatStack],
      linkUrl: linkUrlStack[linkUrlStack.length - 1],
    })
  }

  // If no tags found, return whole text as single segment
  if (segments.length === 0 && normalized) {
    return [{ text: normalized, formats: [] }]
  }

  return segments
}

/**
 * Normalize tag names to standard format names.
 * Handles aliases like "kan" -> "kanji", "jp" -> "japanese", etc.
 */
function normalizeTagName(tag: string): MnemonicFormat {
  switch (tag.toLowerCase()) {
    case "radical":
      return "radical"
    case "kanji":
    case "kan":
      return "kanji"
    case "vocabulary":
      return "vocabulary"
    case "reading":
      return "reading"
    case "ja":
    case "jp":
      return "japanese"
    case "b":
    case "em":
    case "strong":
      return "bold"
    case "i":
      return "italic"
    case "a":
      return "link"
    default:
      // Unknown tags treated as bold (fallback)
      return "bold"
  }
}
