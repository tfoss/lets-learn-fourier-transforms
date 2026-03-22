/**
 * Tests for the config-storage utility module.
 *
 * Verifies localStorage CRUD operations, JSON export/import,
 * validation, and error handling for corrupt data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  loadAllConfigs,
  saveConfig,
  deleteConfig,
  exportConfigAsJson,
  importConfigFromJson,
  isValidSavedConfiguration,
} from '../../src/utils/config-storage'
import type { SavedConfiguration } from '../../src/types/saved-config'

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

// ── Test data factories ─────────────────────────────────────────────

function createTestConfig(overrides: Partial<SavedConfiguration> = {}): SavedConfiguration {
  return {
    id: 'test-id-1',
    name: 'Test Config',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    masterVolume: 0.8,
    timeScaleMs: 23.2,
    tracks: [
      {
        frequency: 440,
        amplitude: 0.5,
        waveformType: 'sine',
        phase: 0,
        duration: 0,
        isMuted: false,
        isSolo: false,
        envelope: {
          enabled: false,
          attack: 0.01,
          decay: 0.3,
          sustain: 0.5,
          release: 0.3,
        },
      },
    ],
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('config-storage', () => {
  beforeEach(() => {
    installMockLocalStorage()
    clearMockStorage()
  })

  describe('loadAllConfigs', () => {
    it('returns an empty array when localStorage is empty', () => {
      expect(loadAllConfigs()).toEqual([])
    })

    it('returns an empty array when storage contains null', () => {
      mockStorage[STORAGE_KEY] = 'null'
      expect(loadAllConfigs()).toEqual([])
    })

    it('returns an empty array when storage contains invalid JSON', () => {
      mockStorage[STORAGE_KEY] = '{not valid json}}}'
      expect(loadAllConfigs()).toEqual([])
    })

    it('returns an empty array when storage contains a non-array', () => {
      mockStorage[STORAGE_KEY] = '"just a string"'
      expect(loadAllConfigs()).toEqual([])
    })

    it('loads valid configs from localStorage', () => {
      const config = createTestConfig()
      mockStorage[STORAGE_KEY] = JSON.stringify([config])
      const result = loadAllConfigs()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Config')
    })

    it('filters out invalid entries from the array', () => {
      const valid = createTestConfig()
      const invalid = { id: 'bad', name: 'missing fields' }
      mockStorage[STORAGE_KEY] = JSON.stringify([valid, invalid])
      const result = loadAllConfigs()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('test-id-1')
    })
  })

  describe('saveConfig', () => {
    it('saves a new config to localStorage', () => {
      const config = createTestConfig()
      saveConfig(config)
      const stored = JSON.parse(mockStorage[STORAGE_KEY])
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('test-id-1')
    })

    it('updates an existing config with the same id', () => {
      const config = createTestConfig()
      saveConfig(config)
      const updated = createTestConfig({ name: 'Updated Name' })
      saveConfig(updated)
      const stored = JSON.parse(mockStorage[STORAGE_KEY])
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Updated Name')
    })

    it('appends a config with a different id', () => {
      saveConfig(createTestConfig({ id: 'id-1' }))
      saveConfig(createTestConfig({ id: 'id-2', name: 'Second' }))
      const stored = JSON.parse(mockStorage[STORAGE_KEY])
      expect(stored).toHaveLength(2)
    })
  })

  describe('deleteConfig', () => {
    it('removes a config by id', () => {
      saveConfig(createTestConfig({ id: 'id-1' }))
      saveConfig(createTestConfig({ id: 'id-2' }))
      deleteConfig('id-1')
      const result = loadAllConfigs()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('id-2')
    })

    it('does nothing when id does not exist', () => {
      saveConfig(createTestConfig({ id: 'id-1' }))
      deleteConfig('nonexistent')
      expect(loadAllConfigs()).toHaveLength(1)
    })
  })

  describe('exportConfigAsJson', () => {
    it('serializes a config to formatted JSON', () => {
      const config = createTestConfig()
      const json = exportConfigAsJson(config)
      const parsed = JSON.parse(json)
      expect(parsed.id).toBe('test-id-1')
      expect(parsed.name).toBe('Test Config')
    })

    it('includes track data in the export', () => {
      const config = createTestConfig()
      const json = exportConfigAsJson(config)
      const parsed = JSON.parse(json)
      expect(parsed.tracks).toHaveLength(1)
      expect(parsed.tracks[0].frequency).toBe(440)
    })
  })

  describe('importConfigFromJson', () => {
    it('parses a valid JSON string into a SavedConfiguration', () => {
      const config = createTestConfig()
      const json = JSON.stringify(config)
      const result = importConfigFromJson(json)
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Test Config')
    })

    it('returns null for invalid JSON', () => {
      expect(importConfigFromJson('{bad json}')).toBeNull()
    })

    it('returns null for valid JSON with wrong structure', () => {
      expect(importConfigFromJson('{"foo": "bar"}')).toBeNull()
    })

    it('returns null for config with invalid waveform type', () => {
      const config = createTestConfig()
      const bad = { ...config, tracks: [{ ...config.tracks[0], waveformType: 'invalid' }] }
      expect(importConfigFromJson(JSON.stringify(bad))).toBeNull()
    })
  })

  describe('isValidSavedConfiguration', () => {
    it('returns true for a valid configuration', () => {
      expect(isValidSavedConfiguration(createTestConfig())).toBe(true)
    })

    it('returns false for null', () => {
      expect(isValidSavedConfiguration(null)).toBe(false)
    })

    it('returns false for a non-object', () => {
      expect(isValidSavedConfiguration('string')).toBe(false)
    })

    it('returns false when missing required fields', () => {
      expect(isValidSavedConfiguration({ id: 'x' })).toBe(false)
    })

    it('returns false when tracks array contains invalid entries', () => {
      const config = createTestConfig()
      const bad = { ...config, tracks: [{ frequency: 'not a number' }] }
      expect(isValidSavedConfiguration(bad)).toBe(false)
    })

    it('returns false when envelope is missing', () => {
      const config = createTestConfig()
      const bad = { ...config, tracks: [{ ...config.tracks[0], envelope: null }] }
      expect(isValidSavedConfiguration(bad)).toBe(false)
    })
  })
})
