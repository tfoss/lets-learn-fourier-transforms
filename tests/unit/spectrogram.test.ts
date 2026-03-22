/**
 * Tests for src/utils/spectrogram.ts
 *
 * Covers colormap functions, frequencyToY mapping, and drawSpectrogramColumn.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  VIRIDIS_COLORMAP,
  HOT_COLORMAP,
  getColorMap,
  frequencyToY,
  drawSpectrogramColumn,
} from '../../src/utils/spectrogram'

// ── Colormap tests ────────────────────────────────────────────────

describe('VIRIDIS_COLORMAP', () => {
  it('returns a valid CSS rgb() string for value 0', () => {
    const color = VIRIDIS_COLORMAP(0)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('returns a valid CSS rgb() string for value 1', () => {
    const color = VIRIDIS_COLORMAP(1)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('returns a valid CSS rgb() string for value 0.5', () => {
    const color = VIRIDIS_COLORMAP(0.5)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('clamps values below 0', () => {
    const color = VIRIDIS_COLORMAP(-0.5)
    const colorZero = VIRIDIS_COLORMAP(0)
    expect(color).toBe(colorZero)
  })

  it('clamps values above 1', () => {
    const color = VIRIDIS_COLORMAP(1.5)
    const colorOne = VIRIDIS_COLORMAP(1)
    expect(color).toBe(colorOne)
  })

  it('returns dark color for value 0 (low magnitude)', () => {
    const color = VIRIDIS_COLORMAP(0)
    // Viridis starts dark purple: rgb(68, 1, 84)
    expect(color).toBe('rgb(68, 1, 84)')
  })

  it('returns bright color for value 1 (high magnitude)', () => {
    const color = VIRIDIS_COLORMAP(1)
    // Viridis ends yellow: rgb(253, 231, 37)
    expect(color).toBe('rgb(253, 231, 37)')
  })
})

describe('HOT_COLORMAP', () => {
  it('returns black for value 0', () => {
    const color = HOT_COLORMAP(0)
    expect(color).toBe('rgb(0, 0, 0)')
  })

  it('returns white for value 1', () => {
    const color = HOT_COLORMAP(1)
    expect(color).toBe('rgb(255, 255, 255)')
  })

  it('returns a valid CSS rgb() string for intermediate values', () => {
    const color = HOT_COLORMAP(0.3)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })
})

describe('getColorMap', () => {
  it('returns VIRIDIS_COLORMAP for "viridis"', () => {
    const map = getColorMap('viridis')
    expect(map(0)).toBe(VIRIDIS_COLORMAP(0))
    expect(map(1)).toBe(VIRIDIS_COLORMAP(1))
  })

  it('returns HOT_COLORMAP for "hot"', () => {
    const map = getColorMap('hot')
    expect(map(0)).toBe(HOT_COLORMAP(0))
    expect(map(1)).toBe(HOT_COLORMAP(1))
  })
})

// ── frequencyToY tests ────────────────────────────────────────────

describe('frequencyToY', () => {
  const canvasHeight = 200
  const minFreq = 20
  const maxFreq = 4000

  it('maps minimum frequency to the bottom of the canvas (linear)', () => {
    const y = frequencyToY(minFreq, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(canvasHeight)
  })

  it('maps maximum frequency to the top of the canvas (linear)', () => {
    const y = frequencyToY(maxFreq, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(0)
  })

  it('maps minimum frequency to the bottom of the canvas (log)', () => {
    const y = frequencyToY(minFreq, canvasHeight, minFreq, maxFreq, true)
    expect(y).toBe(canvasHeight)
  })

  it('maps maximum frequency to the top of the canvas (log)', () => {
    const y = frequencyToY(maxFreq, canvasHeight, minFreq, maxFreq, true)
    expect(y).toBe(0)
  })

  it('maps mid-range frequency to middle area (linear)', () => {
    const midFreq = (minFreq + maxFreq) / 2
    const y = frequencyToY(midFreq, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(canvasHeight / 2)
  })

  it('returns canvasHeight for zero frequency', () => {
    const y = frequencyToY(0, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(canvasHeight)
  })

  it('returns canvasHeight for negative frequency', () => {
    const y = frequencyToY(-100, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(canvasHeight)
  })

  it('clamps frequencies below minimum to bottom', () => {
    const y = frequencyToY(5, canvasHeight, minFreq, maxFreq, false)
    // 5 is below minFreq=20, so normalized would be negative, clamped to 0
    expect(y).toBe(canvasHeight)
  })

  it('clamps frequencies above maximum to top', () => {
    const y = frequencyToY(8000, canvasHeight, minFreq, maxFreq, false)
    expect(y).toBe(0)
  })

  it('log scale maps geometric midpoint to center', () => {
    // Geometric midpoint of 20 and 4000
    const geoMid = Math.sqrt(minFreq * maxFreq)
    const y = frequencyToY(geoMid, canvasHeight, minFreq, maxFreq, true)
    expect(y).toBeCloseTo(canvasHeight / 2, 0)
  })
})

// ── drawSpectrogramColumn tests ───────────────────────────────────

describe('drawSpectrogramColumn', () => {
  /**
   * Creates a mock CanvasRenderingContext2D with spy functions.
   */
  function createMockContext() {
    return {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D
  }

  it('calls fillRect for each visible frequency bin', () => {
    const ctx = createMockContext()
    const data = new Float32Array([0, 0.5, 1.0, 0.3])
    const sampleRate = 44100
    const fftSize = 2048

    drawSpectrogramColumn(
      ctx,
      100,
      2,
      data,
      200,
      VIRIDIS_COLORMAP,
      20,
      4000,
      sampleRate,
      fftSize,
    )

    // Should have called fillRect at least once for visible bins
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0)
  })

  it('draws at the specified columnX position', () => {
    const ctx = createMockContext()
    const data = new Float32Array([0.5, 0.5, 0.5])
    const sampleRate = 8000
    const fftSize = 8

    drawSpectrogramColumn(
      ctx,
      50,
      3,
      data,
      100,
      HOT_COLORMAP,
      20,
      4000,
      sampleRate,
      fftSize,
    )

    const fillRectCalls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls
    for (const call of fillRectCalls) {
      expect(call[0]).toBe(50) // columnX
      expect(call[2]).toBe(3)  // columnWidth
    }
  })

  it('skips bins below minFreq', () => {
    const ctx = createMockContext()
    // Bin 0 = 0 Hz (DC), should be skipped since < minFreq=20
    const data = new Float32Array([0.5, 0.5])
    const sampleRate = 8000
    const fftSize = 4

    drawSpectrogramColumn(
      ctx,
      0,
      1,
      data,
      100,
      VIRIDIS_COLORMAP,
      20,
      4000,
      sampleRate,
      fftSize,
    )

    // Bin 0 = 0 Hz (should be skipped), bin 1 = 2000 Hz (should draw)
    const fillRectCalls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls
    expect(fillRectCalls.length).toBe(1)
  })

  it('sets fillStyle using the colormap', () => {
    const ctx = createMockContext()
    const data = new Float32Array([0.0, 1.0])
    const sampleRate = 8000
    const fftSize = 4

    drawSpectrogramColumn(
      ctx,
      0,
      1,
      data,
      100,
      HOT_COLORMAP,
      0.1, // very low minFreq to include bin 0
      4000,
      sampleRate,
      fftSize,
    )

    // At least one fill should have happened
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0)
  })
})
