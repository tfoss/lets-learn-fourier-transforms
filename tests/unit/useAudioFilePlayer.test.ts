/**
 * Tests for src/composables/useAudioFilePlayer.ts
 *
 * Mocks the Web Audio API to test file loading and playback logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Web Audio API mocks ────────────────────────────────────────────

function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  }
}

function createMockGainNode() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockBufferSourceNode() {
  return {
    buffer: null as AudioBuffer | null,
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
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }
}

function createMockAudioBuffer(duration = 5): AudioBuffer {
  return {
    duration,
    length: duration * 44100,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: vi.fn(() => new Float32Array(duration * 44100)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer
}

let latestMockContext: ReturnType<typeof createMockContextObject>
let latestMockBuffer: AudioBuffer

function createMockContextObject() {
  latestMockBuffer = createMockAudioBuffer(5)
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createBufferSource: vi.fn(() => createMockBufferSourceNode()),
    createGain: vi.fn(() => createMockGainNode()),
    createAnalyser: vi.fn(() => createMockAnalyserNode()),
    createOscillator: vi.fn(),
    decodeAudioData: vi.fn().mockResolvedValue(latestMockBuffer),
  }
}

function installMockAudioContext() {
  latestMockContext = createMockContextObject()
  class MockAudioContext {
    state = latestMockContext.state
    currentTime = latestMockContext.currentTime
    sampleRate = latestMockContext.sampleRate
    destination = latestMockContext.destination
    resume = latestMockContext.resume
    close = latestMockContext.close
    createBufferSource = latestMockContext.createBufferSource
    createGain = latestMockContext.createGain
    createAnalyser = latestMockContext.createAnalyser
    createOscillator = latestMockContext.createOscillator
    decodeAudioData = latestMockContext.decodeAudioData
  }
  vi.stubGlobal('AudioContext', MockAudioContext)
  return latestMockContext
}

// ── Tests ──────────────────────────────────────────────────────────

describe('useAudioFilePlayer', () => {
  let mockCtx: ReturnType<typeof createMockContextObject>

  beforeEach(async () => {
    vi.restoreAllMocks()

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    mockCtx = installMockAudioContext()

    const { useAudioFilePlayer } = await import('../../src/composables/useAudioFilePlayer')
    const player = useAudioFilePlayer()
    await player.cleanup()

    mockCtx = installMockAudioContext()
  })

  async function getPlayer() {
    const { useAudioFilePlayer } = await import('../../src/composables/useAudioFilePlayer')
    return useAudioFilePlayer()
  }

  it('returns the expected API shape', async () => {
    const player = await getPlayer()
    expect(player.isPlaying).toBeDefined()
    expect(player.currentTime).toBeDefined()
    expect(player.duration).toBeDefined()
    expect(player.audioBuffer).toBeDefined()
    expect(typeof player.loadAudioFile).toBe('function')
    expect(typeof player.playAudioBuffer).toBe('function')
    expect(typeof player.pause).toBe('function')
    expect(typeof player.resume).toBe('function')
    expect(typeof player.stop).toBe('function')
    expect(typeof player.seek).toBe('function')
    expect(typeof player.cleanup).toBe('function')
  })

  it('starts with default state', async () => {
    const player = await getPlayer()
    expect(player.isPlaying.value).toBe(false)
    expect(player.currentTime.value).toBe(0)
    expect(player.duration.value).toBe(0)
    expect(player.audioBuffer.value).toBeNull()
  })

  describe('loadAudioFile', () => {
    it('decodes file and sets buffer + duration', async () => {
      const player = await getPlayer()

      const mockFile = new File(['audio data'], 'test.wav', {
        type: 'audio/wav',
      })

      const buffer = await player.loadAudioFile(mockFile)

      expect(buffer).toBeDefined()
      expect(buffer.duration).toBe(5)
      expect(player.audioBuffer.value).not.toBeNull()
      expect(player.audioBuffer.value!.duration).toBe(5)
      expect(player.duration.value).toBe(5)
      expect(player.currentTime.value).toBe(0)
    })
  })

  describe('playAudioBuffer', () => {
    it('starts playback and sets isPlaying', async () => {
      const player = await getPlayer()

      player.playAudioBuffer(latestMockBuffer)

      expect(player.isPlaying.value).toBe(true)
      expect(mockCtx.createBufferSource).toHaveBeenCalled()
    })
  })

  describe('pause', () => {
    it('stops playback when playing', async () => {
      const player = await getPlayer()
      player.playAudioBuffer(latestMockBuffer)
      expect(player.isPlaying.value).toBe(true)

      player.pause()
      expect(player.isPlaying.value).toBe(false)
    })

    it('does nothing when not playing', async () => {
      const player = await getPlayer()
      player.pause()
      expect(player.isPlaying.value).toBe(false)
    })
  })

  describe('stop', () => {
    it('stops playback and resets currentTime', async () => {
      const player = await getPlayer()
      player.playAudioBuffer(latestMockBuffer)

      player.stop()
      expect(player.isPlaying.value).toBe(false)
      expect(player.currentTime.value).toBe(0)
    })
  })

  describe('seek', () => {
    it('updates currentTime when paused', async () => {
      const player = await getPlayer()
      const mockFile = new File(['data'], 'test.wav', { type: 'audio/wav' })
      await player.loadAudioFile(mockFile)

      player.seek(2.5)
      expect(player.currentTime.value).toBe(2.5)
    })

    it('clamps seek to [0, duration]', async () => {
      const player = await getPlayer()
      const mockFile = new File(['data'], 'test.wav', { type: 'audio/wav' })
      await player.loadAudioFile(mockFile)

      player.seek(-1)
      expect(player.currentTime.value).toBe(0)

      player.seek(100)
      expect(player.currentTime.value).toBe(5)
    })
  })

  describe('cleanup', () => {
    it('resets all state', async () => {
      const player = await getPlayer()
      player.playAudioBuffer(latestMockBuffer)

      await player.cleanup()

      expect(player.isPlaying.value).toBe(false)
      expect(player.currentTime.value).toBe(0)
      expect(player.duration.value).toBe(0)
      expect(player.audioBuffer.value).toBeNull()
    })
  })

  describe('singleton behavior', () => {
    it('multiple calls share the same state', async () => {
      const player1 = await getPlayer()
      const player2 = await getPlayer()

      player1.playAudioBuffer(latestMockBuffer)
      expect(player2.isPlaying.value).toBe(true)
    })
  })
})
