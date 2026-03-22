/**
 * Type definitions for the audio engine.
 *
 * Provides branded types, configuration interfaces, and data structures
 * used throughout the audio system.
 */

/** Branded string type for track identifiers, ensuring type safety. */
export type TrackId = string & { readonly __brand: 'TrackId' }

/** Supported oscillator waveform types. */
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth'

/** All valid waveform type values. */
export const WAVEFORM_TYPES: readonly WaveformType[] = [
  'sine',
  'square',
  'triangle',
  'sawtooth',
] as const

/**
 * Configuration for a single audio track.
 *
 * Each track represents one oscillator with its associated parameters
 * and visual/mute state.
 */
export interface TrackConfig {
  /** Unique identifier for this track. */
  readonly id: TrackId
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
  /** CSS color string for visual display. */
  color: string
  /** Whether this track is muted. */
  isMuted: boolean
  /** Whether this track is soloed. */
  isSolo: boolean
}

/**
 * Top-level state of the audio engine.
 */
export interface AudioEngineState {
  /** Whether audio is currently playing. */
  isPlaying: boolean
  /** All configured tracks. */
  tracks: TrackConfig[]
  /** Master volume, 0 to 1. */
  masterVolume: number
}

/**
 * FFT analysis data from an AnalyserNode.
 */
export interface FFTData {
  /** Frequency-domain magnitudes. */
  frequencyData: Float32Array
  /** Time-domain waveform samples. */
  timeDomainData: Float32Array
  /** Sample rate of the audio context. */
  sampleRate: number
  /** FFT size used for the analysis. */
  fftSize: number
}

/**
 * Creates a branded TrackId from a plain string.
 *
 * @param id - The raw string identifier.
 * @returns A branded TrackId.
 */
export function createTrackId(id: string): TrackId {
  return id as TrackId
}
