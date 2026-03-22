/**
 * Tests for the useShareUrl composable.
 *
 * Verifies URL generation, loading from URL hash, clipboard copy,
 * and config detection with mocked browser APIs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useShareUrl, hashHasConfig, buildShareUrl } from '../../src/composables/useShareUrl'
import { useAudioEngine } from '../../src/composables/useAudioEngine'
import type { TrackConfig } from '../../src/types/audio'
import { createTrackId, DEFAULT_ENVELOPE } from '../../src/types/audio'

// ── Web Audio API mocks ────────────────────────────────────────────

function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    setValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    linearRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    exponentialRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
  }
}

function createMockGainNode() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }
}

function installMockAudioContext(): void {
  class MockAudioContext {
    state: AudioContextState = 'running'
    currentTime = 0
    sampleRate = 44100
    destination = {}
    resume = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockResolvedValue(undefined)
    createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: createMockAudioParam(440),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }))
    createGain = vi.fn(() => createMockGainNode())
    createAnalyser = vi.fn(() => createMockAnalyserNode())
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
}

// ── Tests ──────────────────────────────────────────────────────────

describe('hashHasConfig', () => {
  it('returns false for empty string', () => {
    expect(hashHasConfig('')).toBe(false)
  })

  it('returns false for hash without prefix', () => {
    expect(hashHasConfig('#other')).toBe(false)
  })

  it('returns false for prefix only', () => {
    expect(hashHasConfig('#t=')).toBe(false)
  })

  it('returns true for valid track hash', () => {
    expect(hashHasConfig('#t=f:440')).toBe(true)
  })
})

describe('buildShareUrl', () => {
  it('combines base URL with serialized hash', () => {
    const track: TrackConfig = {
      id: createTrackId('t1'),
      frequency: 440,
      amplitude: 0.5,
      waveformType: 'sine',
      phase: 0,
      duration: 0,
      color: '#ff0000',
      isMuted: false,
      isSolo: false,
      envelope: { ...DEFAULT_ENVELOPE },
    }
    const url = buildShareUrl('http://localhost:3000/', [track])
    expect(url).toContain('http://localhost:3000/')
    expect(url).toContain('#t=')
    expect(url).toContain('f:440')
  })

  it('returns base URL with no hash for empty tracks', () => {
    const url = buildShareUrl('http://localhost:3000/', [])
    expect(url).toBe('http://localhost:3000/')
  })
})

describe('useShareUrl', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()

    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'http://localhost:3000',
        pathname: '/',
        hash: '',
      },
    })
  })

  describe('generateShareUrl', () => {
    it('returns a URL with encoded tracks', () => {
      const engine = useAudioEngine()
      engine.createTrack({ frequency: 440, amplitude: 0.5, waveformType: 'sine' })

      const { generateShareUrl } = useShareUrl()
      const url = generateShareUrl()

      expect(url).toContain('http://localhost:3000/')
      expect(url).toContain('#t=')
      expect(url).toContain('f:440')
    })

    it('returns base URL with no tracks', () => {
      const { generateShareUrl } = useShareUrl()
      const url = generateShareUrl()
      expect(url).toBe('http://localhost:3000/')
    })
  })

  describe('loadFromUrl', () => {
    it('returns false when hash is empty', () => {
      const { loadFromUrl } = useShareUrl()
      expect(loadFromUrl()).toBe(false)
    })

    it('loads tracks from valid hash', () => {
      window.location.hash = '#t=f:880,a:0.25,w:square,p:0,e:0'

      const { loadFromUrl } = useShareUrl()
      const loaded = loadFromUrl()

      expect(loaded).toBe(true)
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(880)
      expect(engine.tracks.value[0].waveformType).toBe('square')
    })

    it('clears existing tracks before loading from URL', () => {
      const engine = useAudioEngine()
      engine.createTrack({ frequency: 440 })
      expect(engine.tracks.value.length).toBe(1)

      window.location.hash = '#t=f:220,a:0.3,w:triangle,p:0,e:0'

      const { loadFromUrl } = useShareUrl()
      loadFromUrl()

      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(220)
    })

    it('loads multiple tracks from URL', () => {
      window.location.hash = '#t=f:440,a:0.5,w:sine,p:0,e:0;f:880,a:0.25,w:sawtooth,p:0,e:0'

      const { loadFromUrl } = useShareUrl()
      loadFromUrl()

      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(2)
    })
  })

  describe('copyToClipboard', () => {
    it('calls navigator.clipboard.writeText', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: { writeText: writeTextMock },
      })

      const engine = useAudioEngine()
      engine.createTrack({ frequency: 440 })

      const { copyToClipboard } = useShareUrl()
      const result = await copyToClipboard()

      expect(result).toBe(true)
      expect(writeTextMock).toHaveBeenCalledOnce()
    })

    it('returns false when clipboard write fails', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      })

      const { copyToClipboard } = useShareUrl()
      const result = await copyToClipboard()

      expect(result).toBe(false)
    })
  })
})
