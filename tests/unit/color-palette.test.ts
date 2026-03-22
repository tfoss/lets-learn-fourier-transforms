/**
 * Tests for src/utils/color-palette.ts
 */

import { describe, it, expect } from 'vitest'
import {
  TRACK_COLORS,
  PALETTE_SIZE,
  getTrackColor,
} from '../../src/utils/color-palette'

describe('TRACK_COLORS', () => {
  it('has 8 colors', () => {
    expect(TRACK_COLORS.length).toBe(8)
  })

  it('palette size matches array length', () => {
    expect(PALETTE_SIZE).toBe(TRACK_COLORS.length)
  })

  it('all colors are valid hex strings', () => {
    for (const color of TRACK_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('all colors are distinct', () => {
    const unique = new Set(TRACK_COLORS)
    expect(unique.size).toBe(TRACK_COLORS.length)
  })
})

describe('getTrackColor', () => {
  it('returns the first color for index 0', () => {
    expect(getTrackColor(0)).toBe(TRACK_COLORS[0])
  })

  it('returns the last color for index 7', () => {
    expect(getTrackColor(7)).toBe(TRACK_COLORS[7])
  })

  it('wraps around for index >= palette size', () => {
    expect(getTrackColor(8)).toBe(TRACK_COLORS[0])
    expect(getTrackColor(9)).toBe(TRACK_COLORS[1])
    expect(getTrackColor(16)).toBe(TRACK_COLORS[0])
  })

  it('handles negative indices by wrapping', () => {
    expect(getTrackColor(-1)).toBe(TRACK_COLORS[7])
    expect(getTrackColor(-8)).toBe(TRACK_COLORS[0])
  })

  it('returns each palette color for indices 0-7', () => {
    for (let i = 0; i < PALETTE_SIZE; i++) {
      expect(getTrackColor(i)).toBe(TRACK_COLORS[i])
    }
  })
})
