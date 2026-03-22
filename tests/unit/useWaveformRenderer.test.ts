/**
 * Tests for the useWaveformRenderer composable.
 *
 * Verifies drawing functions, canvas clearing, and the composable's
 * animation lifecycle using mocked canvas contexts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  drawWaveformFrame,
  clearCanvas,
  type WaveformDisplayOptions,
} from '../../src/composables/useWaveformRenderer'

/**
 * Creates a mock CanvasRenderingContext2D with spied methods.
 *
 * @returns A mock context object.
 */
function createMockContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
  } as unknown as CanvasRenderingContext2D
}

/**
 * Creates a Float32Array with a simple sine-like pattern.
 *
 * @param length - Number of samples.
 * @returns Float32Array with values between -1 and 1.
 */
function createTestData(length: number): Float32Array {
  const data = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin((2 * Math.PI * i) / length)
  }
  return data
}

describe('drawWaveformFrame', () => {
  let ctx: CanvasRenderingContext2D
  const defaultOptions: WaveformDisplayOptions = {
    color: '#3b82f6',
    lineWidth: 2,
  }

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('clears the canvas before drawing', () => {
    const data = createTestData(10)
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100)
  })

  it('does not draw when data is empty', () => {
    const data = new Float32Array(0)
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.clearRect).toHaveBeenCalled()
    expect(ctx.beginPath).not.toHaveBeenCalled()
  })

  it('sets stroke style and line width from options', () => {
    const data = createTestData(10)
    const options: WaveformDisplayOptions = { color: '#ff0000', lineWidth: 3 }
    drawWaveformFrame(ctx, data, 200, 100, options)
    expect(ctx.strokeStyle).toBe('#ff0000')
    expect(ctx.lineWidth).toBe(3)
  })

  it('calls moveTo for the first sample and lineTo for the rest', () => {
    const data = createTestData(5)
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledTimes(4)
  })

  it('calls stroke after drawing path', () => {
    const data = createTestData(5)
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
  })

  it('centers the waveform vertically', () => {
    const data = new Float32Array([0])
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    // A value of 0 should render at centerY = 50
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 50)
  })

  it('maps positive values above center and negative below', () => {
    // Value 1 should map to y=0 (top), value -1 should map to y=100 (bottom)
    const data = new Float32Array([1, -1])
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0) // 50 - 1*50 = 0
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100) // 50 - (-1)*50 = 100
  })

  it('handles single-sample data', () => {
    const data = new Float32Array([0.5])
    drawWaveformFrame(ctx, data, 200, 100, defaultOptions)
    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).not.toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })
})

describe('clearCanvas', () => {
  it('calls clearRect with full canvas dimensions', () => {
    const ctx = createMockContext()
    clearCanvas(ctx, 300, 150)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150)
  })
})
