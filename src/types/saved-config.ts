/**
 * Type definitions for saved configurations.
 *
 * Defines the shape of persisted track setups, including all parameters
 * needed to fully restore the audio engine state.
 */

import type { WaveformType, EnvelopeConfig } from './audio'

/**
 * A saved track configuration (without runtime-only fields like id and color).
 */
export interface SavedTrackConfig {
  /** Oscillator frequency in Hz. */
  frequency: number
  /** Volume amplitude, 0 to 1. */
  amplitude: number
  /** Oscillator waveform shape. */
  waveformType: WaveformType
  /** Phase offset in radians. */
  phase: number
  /** Duration in seconds (0 = continuous). */
  duration: number
  /** Whether this track is muted. */
  isMuted: boolean
  /** Whether this track is soloed. */
  isSolo: boolean
  /** ADSR amplitude envelope configuration. */
  envelope: EnvelopeConfig
}

/**
 * A complete saved configuration snapshot.
 *
 * Contains everything needed to restore the audio engine to a
 * previously saved state, including all tracks, master volume,
 * and time scale.
 */
export interface SavedConfiguration {
  /** Unique identifier for this saved configuration. */
  id: string
  /** User-provided name for this configuration. */
  name: string
  /** ISO date string when this configuration was first saved. */
  createdAt: string
  /** ISO date string when this configuration was last updated. */
  updatedAt: string
  /** Master volume level (0 to 1). */
  masterVolume: number
  /** Time scale in milliseconds for waveform display. */
  timeScaleMs: number
  /** Array of saved track configurations. */
  tracks: SavedTrackConfig[]
}
