/**
 * Track color palette for visual display.
 *
 * Provides 8 distinct, bright colors optimized for visibility on dark
 * (gray-900 / #111827) backgrounds. Colors cycle for track indices
 * beyond the palette size.
 */

/**
 * Palette of 8 bright, distinguishable track colors.
 *
 * Each color is chosen for high contrast on dark backgrounds and
 * perceptual distinctness from its neighbors.
 */
export const TRACK_COLORS: readonly string[] = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
] as const

/** Total number of colors in the palette. */
export const PALETTE_SIZE = TRACK_COLORS.length

/**
 * Returns the color for a track by its index.
 *
 * Wraps around the palette for indices >= PALETTE_SIZE, so any
 * non-negative integer is valid.
 *
 * @param trackIndex - Zero-based index of the track.
 * @returns CSS color string (hex).
 */
export function getTrackColor(trackIndex: number): string {
  const safeIndex = ((trackIndex % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE
  return TRACK_COLORS[safeIndex]
}
