/**
 * URL serialization/deserialization for track configurations.
 *
 * Encodes track configs into a compact URL hash string and parses
 * them back. Uses a minimal format to keep URLs short and readable.
 *
 * Format: #t=f:440,a:0.5,w:sine,p:0,e:0;f:880,a:0.25,w:sine,p:0,e:1|0.01|0.3|0.5|0.3
 */

import type { TrackConfig, WaveformType, EnvelopeConfig } from '../types/audio'
import { DEFAULT_ENVELOPE, WAVEFORM_TYPES } from '../types/audio'
import { DEFAULT_FREQUENCY, DEFAULT_AMPLITUDE } from './audio-math'

/** Prefix for the track data in the URL hash. */
const HASH_PREFIX = '#t='

/** Separator between multiple tracks. */
const TRACK_SEPARATOR = ';'

/** Separator between fields within a track. */
const FIELD_SEPARATOR = ','

/** Separator between envelope values. */
const ENVELOPE_SEPARATOR = '|'

/**
 * Serializes the envelope config into a compact string.
 *
 * Format: enabled|attack|decay|sustain|release (when enabled)
 * or just "0" when disabled.
 *
 * @param envelope - The ADSR envelope configuration.
 * @returns Compact envelope string.
 */
export function serializeEnvelope(envelope: EnvelopeConfig): string {
  if (!envelope.enabled) {
    return '0'
  }
  return [
    '1',
    String(envelope.attack),
    String(envelope.decay),
    String(envelope.sustain),
    String(envelope.release),
  ].join(ENVELOPE_SEPARATOR)
}

/**
 * Deserializes an envelope string back into an EnvelopeConfig.
 *
 * @param raw - The compact envelope string.
 * @returns Parsed EnvelopeConfig with defaults for missing values.
 */
export function deserializeEnvelope(raw: string): EnvelopeConfig {
  if (!raw || raw === '0') {
    return { ...DEFAULT_ENVELOPE, enabled: false }
  }

  const parts = raw.split(ENVELOPE_SEPARATOR)
  const enabled = parts[0] === '1'

  return {
    enabled,
    attack: safeParseFloat(parts[1], DEFAULT_ENVELOPE.attack),
    decay: safeParseFloat(parts[2], DEFAULT_ENVELOPE.decay),
    sustain: safeParseFloat(parts[3], DEFAULT_ENVELOPE.sustain),
    release: safeParseFloat(parts[4], DEFAULT_ENVELOPE.release),
  }
}

/**
 * Serializes a single track config into a compact string.
 *
 * Format: f:440,a:0.5,w:sine,p:0,e:0
 *
 * @param track - The track configuration to serialize.
 * @returns Compact track string.
 */
export function serializeTrack(track: TrackConfig): string {
  const fields = [
    `f:${track.frequency}`,
    `a:${track.amplitude}`,
    `w:${track.waveformType}`,
    `p:${track.phase}`,
    `e:${serializeEnvelope(track.envelope)}`,
  ]
  return fields.join(FIELD_SEPARATOR)
}

/**
 * Parses a single track string into a partial TrackConfig.
 *
 * Missing or invalid fields receive default values.
 *
 * @param raw - The compact track string.
 * @returns Partial track configuration.
 */
export function deserializeTrack(raw: string): Partial<TrackConfig> {
  if (!raw || raw.trim() === '') {
    return {}
  }

  const fields = raw.split(FIELD_SEPARATOR)
  const fieldMap = new Map<string, string>()

  for (const field of fields) {
    const colonIndex = field.indexOf(':')
    if (colonIndex === -1) continue
    const key = field.substring(0, colonIndex)
    const value = field.substring(colonIndex + 1)
    fieldMap.set(key, value)
  }

  const result: Partial<TrackConfig> = {}

  if (fieldMap.has('f')) {
    result.frequency = safeParseFloat(fieldMap.get('f'), DEFAULT_FREQUENCY)
  }
  if (fieldMap.has('a')) {
    result.amplitude = safeParseFloat(fieldMap.get('a'), DEFAULT_AMPLITUDE)
  }
  if (fieldMap.has('w')) {
    result.waveformType = safeParseWaveform(fieldMap.get('w'))
  }
  if (fieldMap.has('p')) {
    result.phase = safeParseFloat(fieldMap.get('p'), 0)
  }
  if (fieldMap.has('e')) {
    result.envelope = deserializeEnvelope(fieldMap.get('e')!)
  }

  return result
}

/**
 * Serializes an array of track configs into a URL hash string.
 *
 * @param tracks - Array of track configurations to encode.
 * @returns URL hash string (e.g., "#t=f:440,a:0.5,w:sine,p:0,e:0").
 */
export function serializeTracksToUrl(tracks: TrackConfig[]): string {
  if (tracks.length === 0) {
    return ''
  }

  const serialized = tracks.map(serializeTrack).join(TRACK_SEPARATOR)
  return `${HASH_PREFIX}${serialized}`
}

/**
 * Deserializes a URL hash string back into an array of partial TrackConfigs.
 *
 * Handles edge cases: empty hash, missing prefix, malformed data.
 *
 * @param hash - The URL hash string to parse.
 * @returns Array of partial track configurations.
 */
export function deserializeTracksFromUrl(hash: string): Partial<TrackConfig>[] {
  if (!hash || !hash.startsWith(HASH_PREFIX)) {
    return []
  }

  const data = hash.substring(HASH_PREFIX.length)
  if (data.trim() === '') {
    return []
  }

  const trackStrings = data.split(TRACK_SEPARATOR)
  const results: Partial<TrackConfig>[] = []

  for (const trackStr of trackStrings) {
    const trimmed = trackStr.trim()
    if (trimmed === '') continue
    const parsed = deserializeTrack(trimmed)
    if (Object.keys(parsed).length > 0) {
      results.push(parsed)
    }
  }

  return results
}

/**
 * Safely parses a float value, returning a default if invalid.
 *
 * @param value - The string value to parse.
 * @param defaultValue - Fallback if parsing fails.
 * @returns Parsed number or default.
 */
function safeParseFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') return defaultValue
  const parsed = parseFloat(value)
  if (isNaN(parsed) || !isFinite(parsed)) return defaultValue
  return parsed
}

/**
 * Safely parses a waveform type string, returning 'sine' if invalid.
 *
 * @param value - The waveform type string.
 * @returns A valid WaveformType.
 */
function safeParseWaveform(value: string | undefined): WaveformType {
  if (value && WAVEFORM_TYPES.includes(value as WaveformType)) {
    return value as WaveformType
  }
  return 'sine'
}
