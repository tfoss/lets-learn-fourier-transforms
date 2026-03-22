/**
 * Tests for src/composables/useTimeScale.ts
 *
 * Verifies default values, setTimeScale behavior, sampleCount computation,
 * clamping, and the formatTimeScale utility.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  useTimeScale,
  computeSampleCount,
  clampValue,
  formatTimeScale,
  DEFAULT_TIME_SCALE_MS,
  MIN_TIME_SCALE_MS,
  MAX_TIME_SCALE_MS,
  MIN_SAMPLE_COUNT,
  MAX_SAMPLE_COUNT,
  TIME_SCALE_PRESETS,
} from '../../src/composables/useTimeScale'
import { DEFAULT_SAMPLE_RATE } from '../../src/utils/audio-math'

describe('useTimeScale', () => {
  beforeEach(() => {
    // Reset to default before each test
    const { setTimeScale } = useTimeScale()
    setTimeScale(DEFAULT_TIME_SCALE_MS)
  })

  it('returns the default time scale', () => {
    const { timeScaleMs } = useTimeScale()
    expect(timeScaleMs.value).toBeCloseTo(DEFAULT_TIME_SCALE_MS, 5)
  })

  it('computes sampleCount from default time scale', () => {
    const { sampleCount } = useTimeScale()
    expect(sampleCount.value).toBe(1024)
  })

  it('updates timeScaleMs via setTimeScale', () => {
    const { timeScaleMs, setTimeScale } = useTimeScale()
    setTimeScale(100)
    expect(timeScaleMs.value).toBe(100)
  })

  it('updates sampleCount reactively when time scale changes', () => {
    const { sampleCount, setTimeScale } = useTimeScale()
    setTimeScale(100)
    const expected = Math.round((100 / 1000) * DEFAULT_SAMPLE_RATE)
    expect(sampleCount.value).toBe(expected)
  })

  it('clamps time scale to minimum', () => {
    const { timeScaleMs, setTimeScale } = useTimeScale()
    setTimeScale(0.01)
    expect(timeScaleMs.value).toBe(MIN_TIME_SCALE_MS)
  })

  it('clamps time scale to maximum', () => {
    const { timeScaleMs, setTimeScale } = useTimeScale()
    setTimeScale(99999)
    expect(timeScaleMs.value).toBe(MAX_TIME_SCALE_MS)
  })

  it('is a singleton — all callers share the same state', () => {
    const a = useTimeScale()
    const b = useTimeScale()
    a.setTimeScale(50)
    expect(b.timeScaleMs.value).toBe(50)
  })
})

describe('computeSampleCount', () => {
  it('computes correct sample count for known values', () => {
    // 1024 / 44100 * 1000 ≈ 23.22ms → should give 1024
    const ms = (1024 / DEFAULT_SAMPLE_RATE) * 1000
    expect(computeSampleCount(ms)).toBe(1024)
  })

  it('clamps to minimum sample count', () => {
    expect(computeSampleCount(0.001)).toBe(MIN_SAMPLE_COUNT)
  })

  it('clamps to maximum sample count', () => {
    expect(computeSampleCount(100000)).toBe(MAX_SAMPLE_COUNT)
  })

  it('uses custom sample rate when provided', () => {
    const result = computeSampleCount(100, 48000)
    expect(result).toBe(Math.round((100 / 1000) * 48000))
  })
})

describe('clampValue', () => {
  it('returns value when within range', () => {
    expect(clampValue(5, 0, 10)).toBe(5)
  })

  it('clamps to minimum', () => {
    expect(clampValue(-1, 0, 10)).toBe(0)
  })

  it('clamps to maximum', () => {
    expect(clampValue(15, 0, 10)).toBe(10)
  })
})

describe('formatTimeScale', () => {
  it('formats millisecond values', () => {
    expect(formatTimeScale(23.2)).toBe('23.2 ms')
  })

  it('formats sub-millisecond values as microseconds', () => {
    expect(formatTimeScale(0.5)).toBe('500 \u00B5s')
  })

  it('formats values >= 1000ms as seconds', () => {
    expect(formatTimeScale(1000)).toBe('1.0 s')
    expect(formatTimeScale(2000)).toBe('2.0 s')
  })

  it('formats 1ms boundary correctly', () => {
    expect(formatTimeScale(1)).toBe('1.0 ms')
  })
})

describe('TIME_SCALE_PRESETS', () => {
  it('has entries with label and ms properties', () => {
    for (const preset of TIME_SCALE_PRESETS) {
      expect(preset).toHaveProperty('label')
      expect(preset).toHaveProperty('ms')
      expect(typeof preset.label).toBe('string')
      expect(typeof preset.ms).toBe('number')
      expect(preset.ms).toBeGreaterThan(0)
    }
  })

  it('is sorted in ascending order by ms', () => {
    for (let i = 1; i < TIME_SCALE_PRESETS.length; i++) {
      expect(TIME_SCALE_PRESETS[i].ms).toBeGreaterThan(TIME_SCALE_PRESETS[i - 1].ms)
    }
  })
})
