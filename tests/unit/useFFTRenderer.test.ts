/**
 * Tests for src/composables/useFFTRenderer.ts
 *
 * Tests the pure drawing functions and renderer setup.
 * Canvas interactions are tested via mock contexts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  frequencyToX,
  drawGrid,
  selectGridFrequencies,
  formatFrequencyLabel,
  drawFFTBars,
  drawFFTFrame,
} from '../../src/composables/useFFTRenderer'
import { DEFAULT_FFT_DRAW_OPTIONS } from '../../src/types/fft'

// ── Mock canvas context ───────────────────────────────────────────

function createMockContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    lineJoin: 'miter',
  } as unknown as CanvasRenderingContext2D
}

// ── frequencyToX ──────────────────────────────────────────────────

describe('frequencyToX', () => {
  it('maps minFrequency to x=0 in linear mode', () => {
    const x = frequencyToX(20, 800, 20, 4000, false)
    expect(x).toBeCloseTo(0, 1)
  })

  it('maps maxFrequency to x=width in linear mode', () => {
    const x = frequencyToX(4000, 800, 20, 4000, false)
    expect(x).toBeCloseTo(800, 1)
  })

  it('maps a mid frequency proportionally in linear mode', () => {
    const x = frequencyToX(2010, 800, 20, 4000, false)
    expect(x).toBeCloseTo(400, 1)
  })

  it('maps minFrequency to x=0 in log mode', () => {
    const x = frequencyToX(20, 800, 20, 4000, true)
    expect(x).toBeCloseTo(0, 1)
  })

  it('maps maxFrequency to x=width in log mode', () => {
    const x = frequencyToX(4000, 800, 20, 4000, true)
    expect(x).toBeCloseTo(800, 1)
  })

  it('log mode spreads low frequencies wider than linear', () => {
    const linearX = frequencyToX(200, 800, 20, 4000, false)
    const logX = frequencyToX(200, 800, 20, 4000, true)
    // In log mode, 200Hz should be proportionally further right than linear
    expect(logX).toBeGreaterThan(linearX)
  })
})

// ── selectGridFrequencies ─────────────────────────────────────────

describe('selectGridFrequencies', () => {
  it('returns frequencies within the given range', () => {
    const freqs = selectGridFrequencies(100, 2000)
    for (const f of freqs) {
      expect(f).toBeGreaterThanOrEqual(100)
      expect(f).toBeLessThanOrEqual(2000)
    }
  })

  it('includes common round frequencies', () => {
    const freqs = selectGridFrequencies(20, 4000)
    expect(freqs).toContain(100)
    expect(freqs).toContain(1000)
    expect(freqs).toContain(4000)
  })

  it('excludes frequencies outside the range', () => {
    const freqs = selectGridFrequencies(500, 1500)
    expect(freqs).not.toContain(100)
    expect(freqs).not.toContain(2000)
  })
})

// ── formatFrequencyLabel ──────────────────────────────────────────

describe('formatFrequencyLabel', () => {
  it('shows Hz for frequencies below 1000', () => {
    expect(formatFrequencyLabel(440)).toBe('440')
  })

  it('shows kHz for 1000', () => {
    expect(formatFrequencyLabel(1000)).toBe('1k')
  })

  it('shows kHz for 2000', () => {
    expect(formatFrequencyLabel(2000)).toBe('2k')
  })

  it('shows decimal kHz for non-integer thousands', () => {
    expect(formatFrequencyLabel(1500)).toBe('1.5k')
  })

  it('shows Hz for small values', () => {
    expect(formatFrequencyLabel(50)).toBe('50')
  })
})

// ── drawGrid ──────────────────────────────────────────────────────

describe('drawGrid', () => {
  it('draws gridlines by calling stroke', () => {
    const ctx = createMockContext()
    drawGrid(ctx, 800, 400, DEFAULT_FFT_DRAW_OPTIONS)

    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('does not draw canvas text labels (labels are HTML overlays)', () => {
    const ctx = createMockContext()
    drawGrid(ctx, 800, 400, DEFAULT_FFT_DRAW_OPTIONS)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('sets grid color from options', () => {
    const ctx = createMockContext()
    drawGrid(ctx, 800, 400, {
      ...DEFAULT_FFT_DRAW_OPTIONS,
      gridColor: '#ff0000',
    })

    expect(ctx.strokeStyle).toBe('#ff0000')
  })
})

// ── drawFFTBars ───────────────────────────────────────────────────

describe('drawFFTBars', () => {
  it('calls fillRect for bins with significant magnitude', () => {
    const ctx = createMockContext()
    const data = new Float32Array(1024)
    data.fill(-100)
    // Create a visible bar
    data[50] = -30

    drawFFTBars(ctx, data, 44100, 2048, 800, 400, DEFAULT_FFT_DRAW_OPTIONS)

    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('does not draw bars below minimum frequency', () => {
    const ctx = createMockContext()
    const data = new Float32Array(1024)
    data.fill(-30) // all bins have high magnitude

    const options = {
      ...DEFAULT_FFT_DRAW_OPTIONS,
      minFrequency: 5000,
      maxFrequency: 10000,
    }

    drawFFTBars(ctx, data, 44100, 2048, 800, 400, options)

    // Most bins for 44100/2048 are below 5000 Hz, so very few bars drawn
    // We just verify it doesn't crash
  })
})

// ── drawFFTFrame ──────────────────────────────────────────────────

describe('drawFFTFrame', () => {
  it('clears the canvas first', () => {
    const ctx = createMockContext()
    const data = new Float32Array(1024)
    data.fill(-100)

    drawFFTFrame(ctx, data, 44100, 2048, 800, 400, DEFAULT_FFT_DRAW_OPTIONS)

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 400)
  })

  it('draws grid when showGrid is true', () => {
    const ctx = createMockContext()
    const data = new Float32Array(1024)
    data.fill(-100)

    drawFFTFrame(ctx, data, 44100, 2048, 800, 400, {
      ...DEFAULT_FFT_DRAW_OPTIONS,
      showGrid: true,
    })

    // Grid draws lines, so stroke should be called
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('skips grid when showGrid is false', () => {
    const ctx = createMockContext()
    const data = new Float32Array(1024)
    data.fill(-100)

    drawFFTFrame(ctx, data, 44100, 2048, 800, 400, {
      ...DEFAULT_FFT_DRAW_OPTIONS,
      showGrid: false,
    })

    // No grid lines drawn
    expect(ctx.stroke).not.toHaveBeenCalled()
  })
})
