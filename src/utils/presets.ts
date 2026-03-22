/**
 * Preset track configurations for common audio demonstrations.
 *
 * Each preset defines a set of tracks that illustrate a specific
 * acoustic concept — from pure tones to instrument timbres to
 * psychoacoustic phenomena like beating.
 */

import type { WaveformType } from '../types/audio'
import { useAudioEngine } from '../composables/useAudioEngine'

// ── Preset interface ──────────────────────────────────────────────

/**
 * A named preset containing one or more track configurations.
 */
export interface Preset {
  /** Human-readable name for the preset. */
  name: string
  /** Brief description of what the preset demonstrates. */
  description: string
  /** Track configurations (without id, color, or mute/solo state). */
  tracks: Array<{
    frequency: number
    amplitude: number
    waveformType: WaveformType
    phase: number
  }>
}

// ── Preset definitions ────────────────────────────────────────────

/** Pure 440 Hz sine wave — the standard tuning reference. */
const TUNING_FORK: Preset = {
  name: 'Tuning Fork',
  description: 'Pure 440 Hz sine wave — standard tuning reference (A4)',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

/** Middle C (C4) at 261.63 Hz. */
const MIDDLE_C: Preset = {
  name: 'Middle C',
  description: 'Single 261.63 Hz sine wave — middle C (C4)',
  tracks: [
    { frequency: 261.63, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

/** Piano-like A4 with harmonic overtones at decreasing amplitudes. */
const PIANO_A4: Preset = {
  name: 'Piano A4',
  description: 'A4 fundamental + harmonics simulating a piano timbre',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 880, amplitude: 0.25, waveformType: 'sine', phase: 0 },
    { frequency: 1320, amplitude: 0.15, waveformType: 'sine', phase: 0 },
    { frequency: 1760, amplitude: 0.1, waveformType: 'sine', phase: 0 },
  ],
}

/** Violin-like A4 with strong odd harmonics. */
const VIOLIN_A4: Preset = {
  name: 'Violin A4',
  description: 'A4 fundamental + strong odd harmonics simulating a violin',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 1320, amplitude: 0.35, waveformType: 'sine', phase: 0 },
    { frequency: 2200, amplitude: 0.2, waveformType: 'sine', phase: 0 },
  ],
}

/** Two notes a perfect fifth apart (3:2 frequency ratio). */
const PERFECT_FIFTH: Preset = {
  name: 'Perfect Fifth',
  description: 'Two sine waves at 440 Hz and 660 Hz (3:2 ratio)',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 660, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

/** Two notes an octave apart (2:1 frequency ratio). */
const OCTAVE: Preset = {
  name: 'Octave',
  description: 'Two sine waves at 440 Hz and 880 Hz (2:1 ratio)',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 880, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

/** C major chord (C4–E4–G4). */
const MAJOR_CHORD: Preset = {
  name: 'Major Chord',
  description: 'C major triad: C4 (261.63), E4 (329.63), G4 (392.00)',
  tracks: [
    { frequency: 261.63, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 329.63, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 392, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

/** Two nearby frequencies producing an audible beating pattern. */
const BEAT_FREQUENCY: Preset = {
  name: 'Beat Frequency',
  description: 'Two sine waves at 440 Hz and 442 Hz — produces 2 Hz beating',
  tracks: [
    { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 },
    { frequency: 442, amplitude: 0.5, waveformType: 'sine', phase: 0 },
  ],
}

// ── Exported preset list ──────────────────────────────────────────

/** All available presets, ordered for the preset selector UI. */
export const PRESETS: readonly Preset[] = [
  TUNING_FORK,
  MIDDLE_C,
  PIANO_A4,
  VIOLIN_A4,
  PERFECT_FIFTH,
  OCTAVE,
  MAJOR_CHORD,
  BEAT_FREQUENCY,
] as const

/**
 * Finds a preset by name.
 *
 * @param name - The preset name to search for (case-sensitive).
 * @returns The matching Preset, or undefined if not found.
 */
export function findPresetByName(name: string): Preset | undefined {
  return PRESETS.find((p) => p.name === name)
}

/**
 * Applies a preset by clearing all existing tracks and creating
 * new ones from the preset's track definitions.
 *
 * Uses the singleton audio engine to manage tracks.
 *
 * @param preset - The preset to apply.
 */
export function applyPreset(preset: Preset): void {
  const engine = useAudioEngine()

  // Remove all existing tracks
  const currentIds = engine.tracks.value.map((t) => t.id)
  for (const id of currentIds) {
    engine.removeTrack(id)
  }

  // Create tracks from preset
  for (const trackDef of preset.tracks) {
    engine.createTrack({
      frequency: trackDef.frequency,
      amplitude: trackDef.amplitude,
      waveformType: trackDef.waveformType,
      phase: trackDef.phase,
    })
  }
}
