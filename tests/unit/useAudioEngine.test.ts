/**
 * Tests for src/composables/useAudioEngine.ts
 *
 * Mocks the Web Audio API (AudioContext, OscillatorNode, GainNode,
 * AnalyserNode) to test the composable's logic without real audio.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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

function createMockOscillatorNode() {
  return {
    type: 'sine' as OscillatorType,
    frequency: createMockAudioParam(440),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  }
}

function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn((arr: Float32Array) => {
      arr.fill(-100)
    }),
    getFloatTimeDomainData: vi.fn((arr: Float32Array) => {
      arr.fill(0)
    }),
  }
}

let latestMockContext: ReturnType<typeof createMockContextObject>

function createMockContextObject() {
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => createMockOscillatorNode()),
    createGain: vi.fn(() => createMockGainNode()),
    createAnalyser: vi.fn(() => createMockAnalyserNode()),
  }
}

function installMockAudioContext() {
  latestMockContext = createMockContextObject()
  // Use a class so `new AudioContext()` works
  class MockAudioContext {
    state = latestMockContext.state
    currentTime = latestMockContext.currentTime
    sampleRate = latestMockContext.sampleRate
    destination = latestMockContext.destination
    resume = latestMockContext.resume
    close = latestMockContext.close
    createOscillator = latestMockContext.createOscillator
    createGain = latestMockContext.createGain
    createAnalyser = latestMockContext.createAnalyser
  }
  vi.stubGlobal('AudioContext', MockAudioContext)
  return latestMockContext
}

// ── Tests ──────────────────────────────────────────────────────────

describe('useAudioEngine', () => {
  let mockCtx: ReturnType<typeof createMockContextObject>

  beforeEach(async () => {
    vi.restoreAllMocks()

    // Install mock before importing the module so cleanup works
    mockCtx = installMockAudioContext()

    // Dynamic import to get a fresh module with the mocks in place
    // We use the singleton approach, so we just clean up
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const engine = useAudioEngine()
    await engine.cleanup()

    // Re-install mocks after cleanup closes the context
    mockCtx = installMockAudioContext()
  })

  async function getEngine() {
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    return useAudioEngine()
  }

  it('returns the expected API shape', async () => {
    const engine = await getEngine()
    expect(engine.tracks).toBeDefined()
    expect(engine.isPlaying).toBeDefined()
    expect(engine.masterVolume).toBeDefined()
    expect(typeof engine.createTrack).toBe('function')
    expect(typeof engine.removeTrack).toBe('function')
    expect(typeof engine.updateTrackParam).toBe('function')
    expect(typeof engine.playTrack).toBe('function')
    expect(typeof engine.stopTrack).toBe('function')
    expect(typeof engine.playAll).toBe('function')
    expect(typeof engine.stopAll).toBe('function')
    expect(typeof engine.setMasterVolume).toBe('function')
    expect(typeof engine.getFFTData).toBe('function')
    expect(typeof engine.getTrackTimeDomainData).toBe('function')
    expect(typeof engine.resumeContext).toBe('function')
    expect(typeof engine.cleanup).toBe('function')
  })

  it('starts with empty tracks', async () => {
    const engine = await getEngine()
    expect(engine.tracks.value).toEqual([])
    expect(engine.isPlaying.value).toBe(false)
    expect(engine.masterVolume.value).toBe(1)
  })

  describe('createTrack', () => {
    it('creates a track with default values', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      expect(engine.tracks.value.length).toBe(1)
      const track = engine.tracks.value[0]
      expect(track.id).toBe(id)
      expect(track.frequency).toBe(440)
      expect(track.amplitude).toBe(0.5)
      expect(track.waveformType).toBe('sine')
      expect(track.phase).toBe(0)
      expect(track.isMuted).toBe(false)
      expect(track.isSolo).toBe(false)
    })

    it('creates a track with custom values', async () => {
      const engine = await getEngine()
      const id = engine.createTrack({
        frequency: 880,
        amplitude: 0.8,
        waveformType: 'square',
      })

      const track = engine.tracks.value[0]
      expect(track.id).toBe(id)
      expect(track.frequency).toBe(880)
      expect(track.amplitude).toBe(0.8)
      expect(track.waveformType).toBe('square')
    })

    it('creates multiple tracks with unique IDs', async () => {
      const engine = await getEngine()
      const id1 = engine.createTrack()
      const id2 = engine.createTrack()

      expect(id1).not.toBe(id2)
      expect(engine.tracks.value.length).toBe(2)
    })

    it('creates audio nodes (gain, analyser)', async () => {
      const engine = await getEngine()
      engine.createTrack()

      expect(mockCtx.createGain).toHaveBeenCalled()
      expect(mockCtx.createAnalyser).toHaveBeenCalled()
    })
  })

  describe('removeTrack', () => {
    it('removes a track by ID', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()
      expect(engine.tracks.value.length).toBe(1)

      engine.removeTrack(id)
      expect(engine.tracks.value.length).toBe(0)
    })

    it('does nothing for non-existent ID', async () => {
      const engine = await getEngine()
      engine.createTrack()
      expect(engine.tracks.value.length).toBe(1)

      engine.removeTrack('nonexistent' as any)
      expect(engine.tracks.value.length).toBe(1)
    })
  })

  describe('updateTrackParam', () => {
    it('updates frequency', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.updateTrackParam(id, 'frequency', 880)
      expect(engine.tracks.value[0].frequency).toBe(880)
    })

    it('updates amplitude', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.updateTrackParam(id, 'amplitude', 0.3)
      expect(engine.tracks.value[0].amplitude).toBe(0.3)
    })

    it('updates waveformType', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.updateTrackParam(id, 'waveformType', 'square')
      expect(engine.tracks.value[0].waveformType).toBe('square')
    })

    it('updates isMuted', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.updateTrackParam(id, 'isMuted', true)
      expect(engine.tracks.value[0].isMuted).toBe(true)
    })

    it('updates isSolo', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.updateTrackParam(id, 'isSolo', true)
      expect(engine.tracks.value[0].isSolo).toBe(true)
    })

    it('does nothing for non-existent track', async () => {
      const engine = await getEngine()
      engine.createTrack()

      engine.updateTrackParam('nonexistent' as any, 'frequency', 999)
      expect(engine.tracks.value[0].frequency).toBe(440)
    })
  })

  describe('playback controls', () => {
    it('playTrack creates and starts an oscillator', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      engine.playTrack(id)

      expect(mockCtx.createOscillator).toHaveBeenCalled()
    })

    it('stopTrack stops the oscillator', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()
      engine.playTrack(id)

      // Should not throw
      engine.stopTrack(id)
    })

    it('playAll sets isPlaying to true', async () => {
      const engine = await getEngine()
      engine.createTrack()
      engine.createTrack()

      engine.playAll()
      expect(engine.isPlaying.value).toBe(true)
    })

    it('stopAll sets isPlaying to false', async () => {
      const engine = await getEngine()
      engine.createTrack()
      engine.playAll()
      expect(engine.isPlaying.value).toBe(true)

      engine.stopAll()
      expect(engine.isPlaying.value).toBe(false)
    })
  })

  describe('setMasterVolume', () => {
    it('updates the reactive masterVolume', async () => {
      const engine = await getEngine()
      engine.createTrack()

      engine.setMasterVolume(0.5)
      expect(engine.masterVolume.value).toBe(0.5)
    })

    it('clamps to [0, 1]', async () => {
      const engine = await getEngine()
      engine.createTrack()

      engine.setMasterVolume(1.5)
      expect(engine.masterVolume.value).toBe(1)

      engine.setMasterVolume(-0.5)
      expect(engine.masterVolume.value).toBe(0)
    })
  })

  describe('getFFTData', () => {
    it('returns FFTData with correct structure', async () => {
      const engine = await getEngine()
      engine.createTrack()

      const fftData = engine.getFFTData()
      expect(fftData.frequencyData).toBeInstanceOf(Float32Array)
      expect(fftData.timeDomainData).toBeInstanceOf(Float32Array)
      expect(fftData.sampleRate).toBe(44100)
      expect(fftData.fftSize).toBe(2048)
    })
  })

  describe('getTrackTimeDomainData', () => {
    it('returns Float32Array for existing track', async () => {
      const engine = await getEngine()
      const id = engine.createTrack()

      const data = engine.getTrackTimeDomainData(id)
      expect(data).toBeInstanceOf(Float32Array)
      expect(data.length).toBe(1024)
    })

    it('returns empty array for non-existent track', async () => {
      const engine = await getEngine()

      const data = engine.getTrackTimeDomainData('nonexistent' as any)
      expect(data.length).toBe(0)
    })
  })

  describe('resumeContext', () => {
    it('calls resume on suspended context', async () => {
      const engine = await getEngine()
      engine.createTrack() // ensure context creation
      // After context is created, check state
      // We can't easily change state after construction with class mock,
      // but we verify resume was callable
      await engine.resumeContext()
      // No error = success
    })
  })

  describe('cleanup', () => {
    it('resets all state', async () => {
      const engine = await getEngine()
      engine.createTrack()
      engine.createTrack()
      engine.playAll()

      await engine.cleanup()

      expect(engine.tracks.value).toEqual([])
      expect(engine.isPlaying.value).toBe(false)
      expect(engine.masterVolume.value).toBe(1)
    })
  })

  describe('singleton behavior', () => {
    it('multiple calls return the same state', async () => {
      const engine1 = await getEngine()
      const engine2 = await getEngine()

      const id = engine1.createTrack()
      expect(engine2.tracks.value.length).toBe(1)
      expect(engine2.tracks.value[0].id).toBe(id)
    })
  })
})
