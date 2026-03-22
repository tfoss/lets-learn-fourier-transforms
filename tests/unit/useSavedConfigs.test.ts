/**
 * Tests for the useSavedConfigs composable.
 *
 * Verifies save/load/delete/rename/duplicate lifecycle, including
 * interaction with the audio engine and localStorage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateConfigId,
  trackConfigToSaved,
  createSavedConfiguration,
} from '../../src/composables/useSavedConfigs'
import type { TrackConfig } from '../../src/types/audio'
import { createTrackId } from '../../src/types/audio'

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

// ── Mock localStorage ──────────────────────────────────────────────

const mockStorage: Record<string, string> = {}

function installMockLocalStorage(): void {
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
  }
  vi.stubGlobal('localStorage', mockLocalStorage)
}

function clearMockStorage(): void {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key]
  }
}

// ── Test data ──────────────────────────────────────────────────────

function createTestTrackConfig(): TrackConfig {
  return {
    id: createTrackId('track-0'),
    frequency: 440,
    amplitude: 0.5,
    waveformType: 'sine',
    phase: 0,
    duration: 0,
    color: '#ff0000',
    isMuted: false,
    isSolo: false,
    envelope: {
      enabled: false,
      attack: 0.01,
      decay: 0.3,
      sustain: 0.5,
      release: 0.3,
    },
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('useSavedConfigs — pure helpers', () => {
  describe('generateConfigId', () => {
    it('returns a non-empty string', () => {
      const id = generateConfigId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('generates unique ids on successive calls', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateConfigId()))
      expect(ids.size).toBe(10)
    })
  })

  describe('trackConfigToSaved', () => {
    it('strips the id and color fields', () => {
      const track = createTestTrackConfig()
      const saved = trackConfigToSaved(track)
      expect(saved).not.toHaveProperty('id')
      expect(saved).not.toHaveProperty('color')
    })

    it('preserves all audio parameters', () => {
      const track = createTestTrackConfig()
      const saved = trackConfigToSaved(track)
      expect(saved.frequency).toBe(440)
      expect(saved.amplitude).toBe(0.5)
      expect(saved.waveformType).toBe('sine')
      expect(saved.phase).toBe(0)
      expect(saved.duration).toBe(0)
      expect(saved.isMuted).toBe(false)
      expect(saved.isSolo).toBe(false)
    })

    it('deep copies the envelope', () => {
      const track = createTestTrackConfig()
      const saved = trackConfigToSaved(track)
      expect(saved.envelope).toEqual(track.envelope)
      expect(saved.envelope).not.toBe(track.envelope)
    })
  })

  describe('createSavedConfiguration', () => {
    it('creates a configuration with the given name', () => {
      const tracks = [createTestTrackConfig()]
      const config = createSavedConfiguration('My Config', tracks, 0.8, 23.2)
      expect(config.name).toBe('My Config')
    })

    it('includes master volume and time scale', () => {
      const config = createSavedConfiguration('Test', [], 0.75, 50)
      expect(config.masterVolume).toBe(0.75)
      expect(config.timeScaleMs).toBe(50)
    })

    it('generates a unique id', () => {
      const a = createSavedConfiguration('A', [], 1, 10)
      const b = createSavedConfiguration('B', [], 1, 10)
      expect(a.id).not.toBe(b.id)
    })

    it('sets createdAt and updatedAt timestamps', () => {
      const config = createSavedConfiguration('Test', [], 1, 10)
      expect(config.createdAt).toBeTruthy()
      expect(config.updatedAt).toBeTruthy()
    })

    it('converts tracks to saved format', () => {
      const tracks = [createTestTrackConfig()]
      const config = createSavedConfiguration('Test', tracks, 1, 10)
      expect(config.tracks).toHaveLength(1)
      expect(config.tracks[0]).not.toHaveProperty('id')
      expect(config.tracks[0]).not.toHaveProperty('color')
      expect(config.tracks[0].frequency).toBe(440)
    })
  })
})

describe('useSavedConfigs — composable', () => {
  beforeEach(async () => {
    installMockLocalStorage()
    clearMockStorage()
    installMockAudioContext()
    // Dynamic import to reset singleton after clearing storage
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('initializes with configs from localStorage', async () => {
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')
    const { savedConfigs } = useSavedConfigs()
    expect(savedConfigs.value).toEqual([])
  })

  it('saves the current engine config', async () => {
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')

    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.setMasterVolume(0.7)

    const { saveCurrentConfig, savedConfigs } = useSavedConfigs()
    const result = saveCurrentConfig('My Setup')

    expect(result.name).toBe('My Setup')
    expect(result.masterVolume).toBe(0.7)
    expect(result.tracks).toHaveLength(1)
    expect(result.tracks[0].frequency).toBe(440)
    expect(savedConfigs.value.length).toBeGreaterThanOrEqual(1)
  })

  it('loads a saved config into the engine', async () => {
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')

    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.createTrack({ frequency: 880 })

    const { saveCurrentConfig, loadConfig } = useSavedConfigs()
    const saved = saveCurrentConfig('Two Tracks')

    // Clear tracks
    const trackIds = engine.tracks.value.map((t) => t.id)
    for (const id of trackIds) {
      engine.removeTrack(id)
    }
    expect(engine.tracks.value).toHaveLength(0)

    // Load saved config
    loadConfig(saved.id)
    expect(engine.tracks.value).toHaveLength(2)
    expect(engine.tracks.value[0].frequency).toBe(440)
    expect(engine.tracks.value[1].frequency).toBe(880)
  })

  it('deletes a saved config', async () => {
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')
    const { saveCurrentConfig, deleteConfig, savedConfigs } = useSavedConfigs()

    const config = saveCurrentConfig('To Delete')
    expect(savedConfigs.value.some((c) => c.id === config.id)).toBe(true)

    deleteConfig(config.id)
    expect(savedConfigs.value.some((c) => c.id === config.id)).toBe(false)
  })

  it('renames a saved config', async () => {
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')
    const { saveCurrentConfig, renameConfig, savedConfigs } = useSavedConfigs()

    const config = saveCurrentConfig('Original')
    renameConfig(config.id, 'Renamed')

    const found = savedConfigs.value.find((c) => c.id === config.id)
    expect(found?.name).toBe('Renamed')
  })

  it('duplicates a saved config', async () => {
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')
    const { saveCurrentConfig, duplicateConfig, savedConfigs } = useSavedConfigs()

    const original = saveCurrentConfig('Original')
    const duplicate = duplicateConfig(original.id)

    expect(duplicate).toBeDefined()
    expect(duplicate!.name).toBe('Original (copy)')
    expect(duplicate!.id).not.toBe(original.id)
    expect(savedConfigs.value.length).toBeGreaterThanOrEqual(2)
  })

  it('returns undefined when duplicating a nonexistent config', async () => {
    const { useSavedConfigs } = await import('../../src/composables/useSavedConfigs')
    const { duplicateConfig } = useSavedConfigs()
    expect(duplicateConfig('nonexistent')).toBeUndefined()
  })
})
