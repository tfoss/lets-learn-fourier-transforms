/**
 * Time formatting utilities for audio playback display.
 *
 * Converts between numeric seconds and human-readable "m:ss" or "mm:ss" strings.
 */

/**
 * Formats a time value in seconds to a human-readable string.
 *
 * Examples:
 *   0     → "0:00"
 *   63.5  → "1:03"
 *   600   → "10:00"
 *   -5    → "0:00" (clamps negative values)
 *   NaN   → "0:00"
 *   Infinity → "0:00"
 *
 * @param seconds - Time in seconds (non-negative).
 * @returns Formatted string in "m:ss" or "mm:ss" format.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${padSeconds(remainingSeconds)}`
}

/**
 * Pads a seconds value to always be two digits.
 *
 * @param seconds - Seconds value (0–59).
 * @returns Two-character string, e.g. "03" or "59".
 */
function padSeconds(seconds: number): string {
  return seconds.toString().padStart(2, '0')
}

/**
 * Parses a formatted time string back to seconds.
 *
 * Accepts "m:ss", "mm:ss", or "h:mm:ss" format.
 *
 * @param formatted - Time string to parse (e.g., "1:03", "10:00").
 * @returns Time in seconds.
 * @throws {Error} If the string is not in a valid time format.
 */
export function parseTime(formatted: string): number {
  const trimmed = formatted.trim()

  if (trimmed === '') {
    throw new Error('Cannot parse empty time string')
  }

  const parts = trimmed.split(':')

  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid time format: "${formatted}". Expected "m:ss" or "mm:ss".`)
  }

  const parsedParts = parts.map(parseTimePart)

  if (parts.length === 3) {
    return parsedParts[0] * 3600 + parsedParts[1] * 60 + parsedParts[2]
  }

  return parsedParts[0] * 60 + parsedParts[1]
}

/**
 * Parses a single numeric part of a time string.
 *
 * @param part - A string representing a number (e.g., "1", "03").
 * @returns The parsed integer.
 * @throws {Error} If the part is not a valid non-negative integer.
 */
function parseTimePart(part: string): number {
  const num = parseInt(part, 10)

  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid time part: "${part}"`)
  }

  return num
}

/**
 * Formats a file size in bytes to a human-readable string.
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string, e.g. "1.2 MB", "340 KB".
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }

  const KB = 1024
  const MB = KB * 1024
  const GB = MB * 1024

  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(1)} GB`
  }
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(1)} MB`
  }
  if (bytes >= KB) {
    return `${(bytes / KB).toFixed(1)} KB`
  }

  return `${bytes} B`
}
