/**
 * Tests for src/composables/useMicrophone.ts
 *
 * Mocks the Web Audio API and getUserMedia to test microphone composable
 * logic without real hardware.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

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
    cancelScheduledValues: vi.fn(),
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
    getFloatFrequencyData: vi.fn((arr: Float32Array) => {
      arr.fill(-100)
    }),
    getFloatTimeDomainData: vi.fn((arr: Float32Array) => {
      arr.fill(0)
    }),
  }
}

function createMockMediaStreamSource() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockMediaStream() {
  const track = {
    stop: vi.fn(),
    kind: 'audio',
    enabled: true,
  }
  return {
    getTracks: vi.fn(() => [track]),
    _track: track,
  }
}

let mockMediaStreamSource: ReturnType<typeof createMockMediaStreamSource>
let mockGetUserMedia: Mock

function setupAudioMocks() {
  mockMediaStreamSource = createMockMediaStreamSource()
  mockGetUserMedia = vi.fn()

  // Must use function() (not arrow) so `new AudioContext()` works
  // @ts-expect-error - Mocking global AudioContext
  globalThis.AudioContext = function () {
    return {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn(() => createMockGainNode()),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: createMockAudioParam(440),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      })),
      createAnalyser: vi.fn(() => createMockAnalyserNode()),
      createMediaStreamSource: vi.fn(() => mockMediaStreamSource),
    }
  }

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
    configurable: true,
  })
}

// ── Tests ──────────────────────────────────────────────────────────

describe('useMicrophone', () => {
  beforeEach(async () => {
    vi.resetModules()
    setupAudioMocks()
  })

  it('exposes isSupported as true when getUserMedia is available', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()
    expect(mic.isSupported).toBe(true)
  })

  it('starts with isListening = false', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()
    expect(mic.isListening.value).toBe(false)
  })

  it('starts with permissionState = unknown', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()
    expect(mic.permissionState.value).toBe('unknown')
  })

  it('startListening sets isListening to true on success', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()

    expect(mic.isListening.value).toBe(true)
    expect(mic.permissionState.value).toBe('granted')
  })

  it('startListening calls getUserMedia with audio: true', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('startListening connects media source to analyser', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()

    expect(mockMediaStreamSource.connect).toHaveBeenCalled()
  })

  it('startListening is idempotent when already listening', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()
    await mic.startListening() // Second call should be no-op

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1)
  })

  it('startListening sets permissionState to denied on getUserMedia rejection', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await expect(mic.startListening()).rejects.toThrow('Permission denied')
    expect(mic.permissionState.value).toBe('denied')
    expect(mic.isListening.value).toBe(false)
  })

  it('stopListening sets isListening to false', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()
    mic.stopListening()

    expect(mic.isListening.value).toBe(false)
  })

  it('stopListening stops media stream tracks', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()
    mic.stopListening()

    expect(mockStream._track.stop).toHaveBeenCalled()
  })

  it('stopListening disconnects the source node', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()
    mic.stopListening()

    expect(mockMediaStreamSource.disconnect).toHaveBeenCalled()
  })

  it('stopListening is safe to call when not listening', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    // Should not throw
    mic.stopListening()
    expect(mic.isListening.value).toBe(false)
  })

  it('cleanup resets all state', async () => {
    const mockStream = createMockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    await mic.startListening()
    mic.cleanup()

    expect(mic.isListening.value).toBe(false)
    expect(mic.permissionState.value).toBe('unknown')
  })

  it('getFFTData returns FFT data from the engine', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()

    const fftData = mic.getFFTData()

    expect(fftData).toHaveProperty('frequencyData')
    expect(fftData).toHaveProperty('timeDomainData')
    expect(fftData).toHaveProperty('sampleRate')
    expect(fftData).toHaveProperty('fftSize')
  })
})

describe('useMicrophone — unsupported environment', () => {
  beforeEach(() => {
    vi.resetModules()

    // Remove mediaDevices to simulate unsupported environment
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('isSupported is false when getUserMedia is unavailable', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()
    expect(mic.isSupported).toBe(false)
  })

  it('startListening throws when not supported', async () => {
    const { useMicrophone } = await import('../../src/composables/useMicrophone')
    const mic = useMicrophone()
    await expect(mic.startListening()).rejects.toThrow(
      'Microphone input is not supported in this browser',
    )
  })
})
