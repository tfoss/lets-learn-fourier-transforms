/**
 * Pure storage utilities for saved configurations.
 *
 * Handles localStorage CRUD operations, JSON export/import,
 * and validation of saved configuration data.
 */

import type { SavedConfiguration, SavedTrackConfig } from '../types/saved-config'
import { WAVEFORM_TYPES } from '../types/audio'
import type { WaveformType } from '../types/audio'

/** LocalStorage key for saved configurations. */
export const STORAGE_KEY = 'fourier-saved-configs'

/**
 * Loads all saved configurations from localStorage.
 *
 * Returns an empty array if localStorage is unavailable,
 * the data is missing, or the data is corrupt.
 *
 * @returns Array of saved configurations.
 */
export function loadAllConfigs(): SavedConfiguration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidSavedConfiguration)
  } catch {
    return []
  }
}

/**
 * Persists a configuration to localStorage.
 *
 * If a configuration with the same id already exists, it is replaced.
 * Otherwise, the configuration is appended.
 *
 * @param config - The configuration to save.
 */
export function saveConfig(config: SavedConfiguration): void {
  const configs = loadAllConfigs()
  const existingIndex = configs.findIndex((c) => c.id === config.id)
  if (existingIndex >= 0) {
    configs[existingIndex] = config
  } else {
    configs.push(config)
  }
  writeConfigsToStorage(configs)
}

/**
 * Removes a configuration from localStorage by id.
 *
 * @param id - The id of the configuration to delete.
 */
export function deleteConfig(id: string): void {
  const configs = loadAllConfigs()
  const filtered = configs.filter((c) => c.id !== id)
  writeConfigsToStorage(filtered)
}

/**
 * Serializes a configuration to a downloadable JSON string.
 *
 * @param config - The configuration to export.
 * @returns Formatted JSON string.
 */
export function exportConfigAsJson(config: SavedConfiguration): string {
  return JSON.stringify(config, null, 2)
}

/**
 * Parses and validates a JSON string as a SavedConfiguration.
 *
 * @param json - Raw JSON string to parse.
 * @returns The parsed configuration, or null if invalid.
 */
export function importConfigFromJson(json: string): SavedConfiguration | null {
  try {
    const parsed = JSON.parse(json)
    if (isValidSavedConfiguration(parsed)) {
      return parsed as SavedConfiguration
    }
    return null
  } catch {
    return null
  }
}

/**
 * Writes the full array of configurations to localStorage.
 *
 * @param configs - Array of configurations to persist.
 */
function writeConfigsToStorage(configs: SavedConfiguration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Validates that a value is a well-formed WaveformType.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid WaveformType.
 */
function isValidWaveformType(value: unknown): value is WaveformType {
  return typeof value === 'string' && WAVEFORM_TYPES.includes(value as WaveformType)
}

/**
 * Validates that a value is a well-formed EnvelopeConfig.
 *
 * @param value - The value to check.
 * @returns True if the value has the correct shape.
 */
function isValidEnvelope(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const env = value as Record<string, unknown>
  return (
    typeof env.enabled === 'boolean' &&
    typeof env.attack === 'number' &&
    typeof env.decay === 'number' &&
    typeof env.sustain === 'number' &&
    typeof env.release === 'number'
  )
}

/**
 * Validates that a value is a well-formed SavedTrackConfig.
 *
 * @param value - The value to check.
 * @returns True if the value has all required track fields.
 */
function isValidSavedTrackConfig(value: unknown): value is SavedTrackConfig {
  if (typeof value !== 'object' || value === null) return false
  const track = value as Record<string, unknown>
  return (
    typeof track.frequency === 'number' &&
    typeof track.amplitude === 'number' &&
    isValidWaveformType(track.waveformType) &&
    typeof track.phase === 'number' &&
    typeof track.duration === 'number' &&
    typeof track.isMuted === 'boolean' &&
    typeof track.isSolo === 'boolean' &&
    isValidEnvelope(track.envelope)
  )
}

/**
 * Validates that a value is a well-formed SavedConfiguration.
 *
 * @param value - The value to check.
 * @returns True if the value has all required configuration fields.
 */
export function isValidSavedConfiguration(value: unknown): value is SavedConfiguration {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Record<string, unknown>
  return (
    typeof config.id === 'string' &&
    typeof config.name === 'string' &&
    typeof config.createdAt === 'string' &&
    typeof config.updatedAt === 'string' &&
    typeof config.masterVolume === 'number' &&
    typeof config.timeScaleMs === 'number' &&
    Array.isArray(config.tracks) &&
    config.tracks.every(isValidSavedTrackConfig)
  )
}
