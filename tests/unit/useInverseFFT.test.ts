/**
 * Tests for src/composables/useInverseFFT.ts
 *
 * Tests peak management (add, remove, clear), waveform computation,
 * and playback state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInverseFFT } from '../../src/composables/useInverseFFT'

// ── Mock Web Audio API ─────────────────────────────────────────────

const mockStop = vi.fn()
const mockStart = vi.fn()
const mockConnect = vi.fn()

const mockSourceNode = {
  buffer: null as AudioBuffer | null,
  loop: false,
  connect: mockConnect,
  start: mockStart,
  stop: mockStop,
  onended: null as (() => void) | null,
}

const mockCreateBuffer = vi.fn(() => ({
  getChannelData: () => new Float32Array(2048),
}))

const mockCreateBufferSource = vi.fn(() => ({ ...mockSourceNode }))
const mockResume = vi.fn()

vi.stubGlobal(
  'AudioContext',
  vi.fn(() => ({
    state: 'running',
    resume: mockResume,
    close: vi.fn(),
    createBuffer: mockCreateBuffer,
    createBufferSource: mockCreateBufferSource,
    destination: {},
    sampleRate: 44100,
  })),
)

// ── Tests ─────────────────────────────────────────────────────────

describe('useInverseFFT', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Peak management ──────────────────────────────────────────

  describe('addPeak', () => {
    it('adds a peak to drawnPeaks', () => {
      const { drawnPeaks, addPeak } = useInverseFFT()
      addPeak(440, 0.8)
      expect(drawnPeaks.value).toHaveLength(1)
      expect(drawnPeaks.value[0].frequency).toBe(440)
      expect(drawnPeaks.value[0].magnitude).toBe(0.8)
    })

    it('clamps magnitude to [0, 1]', () => {
      const { drawnPeaks, addPeak } = useInverseFFT()
      addPeak(440, 1.5)
      expect(drawnPeaks.value[0].magnitude).toBe(1)

      addPeak(880, -0.5)
      expect(drawnPeaks.value[1].magnitude).toBe(0)
    })

    it('clamps frequency to non-negative', () => {
      const { drawnPeaks, addPeak } = useInverseFFT()
      addPeak(-100, 0.5)
      expect(drawnPeaks.value[0].frequency).toBe(0)
    })

    it('adds multiple peaks', () => {
      const { drawnPeaks, addPeak } = useInverseFFT()
      addPeak(440, 0.8)
      addPeak(880, 0.5)
      addPeak(1320, 0.3)
      expect(drawnPeaks.value).toHaveLength(3)
    })
  })

  describe('removePeak', () => {
    it('removes the peak at the given index', () => {
      const { drawnPeaks, addPeak, removePeak } = useInverseFFT()
      addPeak(440, 0.8)
      addPeak(880, 0.5)

      removePeak(0)
      expect(drawnPeaks.value).toHaveLength(1)
      expect(drawnPeaks.value[0].frequency).toBe(880)
    })

    it('does nothing for out-of-bounds index', () => {
      const { drawnPeaks, addPeak, removePeak } = useInverseFFT()
      addPeak(440, 0.8)

      removePeak(5)
      expect(drawnPeaks.value).toHaveLength(1)

      removePeak(-1)
      expect(drawnPeaks.value).toHaveLength(1)
    })
  })

  describe('findClosestPeakIndex', () => {
    it('finds the closest peak within threshold', () => {
      const { addPeak, findClosestPeakIndex } = useInverseFFT()
      addPeak(440, 0.8)
      addPeak(880, 0.5)

      expect(findClosestPeakIndex(445)).toBe(0)
      expect(findClosestPeakIndex(875)).toBe(1)
    })

    it('returns -1 when no peak is within threshold', () => {
      const { addPeak, findClosestPeakIndex } = useInverseFFT()
      addPeak(440, 0.8)

      expect(findClosestPeakIndex(600)).toBe(-1)
    })

    it('returns -1 for empty peaks', () => {
      const { findClosestPeakIndex } = useInverseFFT()
      expect(findClosestPeakIndex(440)).toBe(-1)
    })
  })

  describe('clearPeaks', () => {
    it('removes all peaks', () => {
      const { drawnPeaks, addPeak, clearPeaks } = useInverseFFT()
      addPeak(440, 0.8)
      addPeak(880, 0.5)

      clearPeaks()
      expect(drawnPeaks.value).toHaveLength(0)
    })
  })

  // ── Waveform generation ────────────────────────────────────────

  describe('generatedWaveform', () => {
    it('returns empty array when no peaks exist', () => {
      const { generatedWaveform } = useInverseFFT()
      expect(generatedWaveform.value.length).toBe(0)
    })

    it('generates a waveform when peaks exist', () => {
      const { generatedWaveform, addPeak } = useInverseFFT()
      addPeak(440, 0.8)

      expect(generatedWaveform.value.length).toBeGreaterThan(0)
    })

    it('waveform length matches fftSize', () => {
      const fftSize = 1024
      const { generatedWaveform, addPeak } = useInverseFFT({ fftSize })
      addPeak(440, 0.8)

      expect(generatedWaveform.value.length).toBe(fftSize)
    })

    it('updates when peaks change', () => {
      const { generatedWaveform, addPeak, clearPeaks } = useInverseFFT()
      addPeak(440, 0.8)
      const waveform1Length = generatedWaveform.value.length

      clearPeaks()
      expect(generatedWaveform.value.length).toBe(0)

      addPeak(880, 0.5)
      expect(generatedWaveform.value.length).toBe(waveform1Length)
    })
  })

  // ── Playback state ────────────────────────────────────────────

  describe('isPlaying', () => {
    it('starts as false', () => {
      const { isPlaying } = useInverseFFT()
      expect(isPlaying.value).toBe(false)
    })
  })

  describe('stopDrawnSound', () => {
    it('sets isPlaying to false', () => {
      const { isPlaying, stopDrawnSound } = useInverseFFT()
      isPlaying.value = true
      stopDrawnSound()
      expect(isPlaying.value).toBe(false)
    })
  })
})
