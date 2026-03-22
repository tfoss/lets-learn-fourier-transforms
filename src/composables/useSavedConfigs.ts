/**
 * useSavedConfigs — Composable for managing saved configurations.
 *
 * Provides reactive state and methods for saving, loading, deleting,
 * renaming, duplicating, exporting, and importing audio engine configurations.
 *
 * Usage:
 *   const { savedConfigs, saveCurrentConfig, loadConfig } = useSavedConfigs()
 */

import { ref, type Ref } from 'vue'
import type { SavedConfiguration, SavedTrackConfig } from '../types/saved-config'
import type { TrackConfig } from '../types/audio'
import {
  loadAllConfigs,
  saveConfig,
  deleteConfig as deleteFromStorage,
  exportConfigAsJson,
  importConfigFromJson,
} from '../utils/config-storage'
import { useAudioEngine } from './useAudioEngine'
import { useTimeScale } from './useTimeScale'

// ── Singleton state ────────────────────────────────────────────────

const savedConfigs: Ref<SavedConfiguration[]> = ref(loadAllConfigs())

// ── Pure helpers ───────────────────────────────────────────────────

/**
 * Generates a unique id for a new saved configuration.
 *
 * Uses crypto.randomUUID if available, otherwise falls back to
 * a timestamp-based id.
 *
 * @returns A unique string identifier.
 */
export function generateConfigId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `config-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Extracts the saveable fields from a TrackConfig.
 *
 * Strips runtime-only fields (id, color) that are regenerated on load.
 *
 * @param track - The full track configuration.
 * @returns A SavedTrackConfig with only persisted fields.
 */
export function trackConfigToSaved(track: TrackConfig): SavedTrackConfig {
  return {
    frequency: track.frequency,
    amplitude: track.amplitude,
    waveformType: track.waveformType,
    phase: track.phase,
    duration: track.duration,
    isMuted: track.isMuted,
    isSolo: track.isSolo,
    envelope: { ...track.envelope },
  }
}

/**
 * Creates a SavedConfiguration from the current engine state.
 *
 * @param name - User-provided name for the configuration.
 * @param tracks - Current track configs from the audio engine.
 * @param masterVolume - Current master volume level.
 * @param timeScaleMs - Current time scale in milliseconds.
 * @returns A new SavedConfiguration snapshot.
 */
export function createSavedConfiguration(
  name: string,
  tracks: TrackConfig[],
  masterVolume: number,
  timeScaleMs: number,
): SavedConfiguration {
  const now = new Date().toISOString()
  return {
    id: generateConfigId(),
    name,
    createdAt: now,
    updatedAt: now,
    masterVolume,
    timeScaleMs,
    tracks: tracks.map(trackConfigToSaved),
  }
}

/**
 * Triggers a file download with the given content.
 *
 * @param filename - The download filename.
 * @param content - The file content string.
 * @param mimeType - The MIME type for the file.
 */
export function triggerFileDownload(
  filename: string,
  content: string,
  mimeType: string = 'application/json',
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Reads a File object as text.
 *
 * @param file - The File to read.
 * @returns A promise resolving to the file's text content.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ── Composable ─────────────────────────────────────────────────────

/**
 * Returns reactive saved configuration state and management methods.
 *
 * This is a singleton — all callers share the same reactive list.
 *
 * @returns Object with savedConfigs ref and management functions.
 */
export function useSavedConfigs() {
  const engine = useAudioEngine()
  const { timeScaleMs, setTimeScale } = useTimeScale()

  /**
   * Reloads the saved configs list from localStorage.
   */
  function refreshConfigs(): void {
    savedConfigs.value = loadAllConfigs()
  }

  /**
   * Snapshots the current audio engine state and saves it.
   *
   * @param name - User-provided name for the configuration.
   * @returns The newly created SavedConfiguration.
   */
  function saveCurrentConfig(name: string): SavedConfiguration {
    const config = createSavedConfiguration(
      name,
      engine.tracks.value,
      engine.masterVolume.value,
      timeScaleMs.value,
    )
    saveConfig(config)
    refreshConfigs()
    return config
  }

  /**
   * Loads a saved configuration into the audio engine.
   *
   * Clears all existing tracks, then recreates them from the saved state.
   * Also restores master volume and time scale.
   *
   * @param id - The id of the configuration to load.
   */
  function loadSavedConfig(id: string): void {
    const config = savedConfigs.value.find((c) => c.id === id)
    if (!config) return

    // Stop and remove all existing tracks
    const currentTrackIds = engine.tracks.value.map((t) => t.id)
    for (const trackId of currentTrackIds) {
      engine.removeTrack(trackId)
    }

    // Restore master volume and time scale
    engine.setMasterVolume(config.masterVolume)
    setTimeScale(config.timeScaleMs)

    // Recreate tracks from saved state
    for (const savedTrack of config.tracks) {
      engine.createTrack({
        frequency: savedTrack.frequency,
        amplitude: savedTrack.amplitude,
        waveformType: savedTrack.waveformType,
        phase: savedTrack.phase,
        duration: savedTrack.duration,
        isMuted: savedTrack.isMuted,
        isSolo: savedTrack.isSolo,
        envelope: { ...savedTrack.envelope },
      })
    }
  }

  /**
   * Deletes a saved configuration by id.
   *
   * @param id - The id of the configuration to delete.
   */
  function deleteSavedConfig(id: string): void {
    deleteFromStorage(id)
    refreshConfigs()
  }

  /**
   * Renames a saved configuration.
   *
   * @param id - The id of the configuration to rename.
   * @param newName - The new name.
   */
  function renameConfig(id: string, newName: string): void {
    const config = savedConfigs.value.find((c) => c.id === id)
    if (!config) return
    const updated: SavedConfiguration = {
      ...config,
      name: newName,
      updatedAt: new Date().toISOString(),
    }
    saveConfig(updated)
    refreshConfigs()
  }

  /**
   * Duplicates a saved configuration with a new id and "(copy)" suffix.
   *
   * @param id - The id of the configuration to duplicate.
   * @returns The duplicated SavedConfiguration, or undefined if not found.
   */
  function duplicateConfig(id: string): SavedConfiguration | undefined {
    const original = savedConfigs.value.find((c) => c.id === id)
    if (!original) return undefined
    const now = new Date().toISOString()
    const duplicate: SavedConfiguration = {
      ...original,
      id: generateConfigId(),
      name: `${original.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      tracks: original.tracks.map((t) => ({ ...t, envelope: { ...t.envelope } })),
    }
    saveConfig(duplicate)
    refreshConfigs()
    return duplicate
  }

  /**
   * Exports a saved configuration as a downloadable JSON file.
   *
   * @param id - The id of the configuration to export.
   */
  function exportSavedConfig(id: string): void {
    const config = savedConfigs.value.find((c) => c.id === id)
    if (!config) return
    const json = exportConfigAsJson(config)
    const filename = `${config.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`
    triggerFileDownload(filename, json)
  }

  /**
   * Imports a configuration from a JSON file.
   *
   * Parses the file, validates the data, assigns a new id, and saves it.
   *
   * @param file - The File object to import.
   * @returns The imported SavedConfiguration.
   * @throws Error if the file cannot be read or contains invalid data.
   */
  async function importConfig(file: File): Promise<SavedConfiguration> {
    const text = await readFileAsText(file)
    const parsed = importConfigFromJson(text)
    if (!parsed) {
      throw new Error('Invalid configuration file')
    }
    // Assign a new id to avoid collisions
    const imported: SavedConfiguration = {
      ...parsed,
      id: generateConfigId(),
      updatedAt: new Date().toISOString(),
    }
    saveConfig(imported)
    refreshConfigs()
    return imported
  }

  return {
    savedConfigs,
    saveCurrentConfig,
    loadConfig: loadSavedConfig,
    deleteConfig: deleteSavedConfig,
    renameConfig,
    duplicateConfig,
    exportConfig: exportSavedConfig,
    importConfig,
  }
}
