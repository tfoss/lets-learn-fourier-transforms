/**
 * Step definitions for the guided learning mode.
 *
 * Each step teaches a single concept about sound and Fourier transforms,
 * building progressively from a pure sine wave to real audio analysis.
 * Explanations are written for a 10-14 year old piano/violin player.
 */

import type { GuidedStep } from '../types/guided'
import { useAudioEngine } from '../composables/useAudioEngine'
import { applyPreset, findPresetByName } from './presets'

// ── Helper functions ─────────────────────────────────────────────

/**
 * Removes all existing tracks from the audio engine.
 * Stops playback first to avoid audio glitches.
 */
function clearAllTracks(): void {
  const engine = useAudioEngine()
  engine.stopAll()
  const ids = engine.tracks.value.map((t) => t.id)
  for (const id of ids) {
    engine.removeTrack(id)
  }
}

/**
 * Sets up a single sine wave track at the given frequency.
 *
 * @param frequency - Frequency in Hz (defaults to 440).
 * @param amplitude - Amplitude 0-1 (defaults to 0.5).
 */
function setupSingleSineTrack(frequency = 440, amplitude = 0.5): void {
  clearAllTracks()
  const engine = useAudioEngine()
  engine.createTrack({ frequency, amplitude, waveformType: 'sine' })
}

/**
 * Sets up two sine wave tracks at the given frequencies.
 *
 * @param freq1 - First track frequency in Hz.
 * @param freq2 - Second track frequency in Hz.
 * @param amplitude - Amplitude for both tracks (defaults to 0.5).
 */
function setupTwoSineTracks(freq1: number, freq2: number, amplitude = 0.5): void {
  clearAllTracks()
  const engine = useAudioEngine()
  engine.createTrack({ frequency: freq1, amplitude, waveformType: 'sine' })
  engine.createTrack({ frequency: freq2, amplitude, waveformType: 'sine' })
}

/**
 * Applies a named preset, clearing existing tracks first.
 *
 * @param name - The preset name to apply.
 */
function applyNamedPreset(name: string): void {
  const preset = findPresetByName(name)
  if (preset) {
    applyPreset(preset)
  }
}

// ── Step definitions ─────────────────────────────────────────────

/** Total number of guided steps. */
export const TOTAL_GUIDED_STEPS = 9

/** All guided learning steps in order. */
export const GUIDED_STEPS: readonly GuidedStep[] = [
  {
    id: 1,
    title: 'Single Sine Wave',
    conceptId: 'sine-wave',
    explanation:
      'Welcome! Let\'s start with the simplest sound possible: a pure tone. ' +
      'Click "Play" and listen — what you hear is a sine wave at 440 Hz, the note A above middle C. ' +
      'A sine wave is a smooth, repeating curve. It\'s the building block of ALL sounds. ' +
      'Watch the waveform on the right — see how it goes smoothly up and down, over and over? ' +
      'That\'s what a pure tone looks like.',
    setupFn: () => setupSingleSineTrack(440, 0.5),
    enabledControls: ['play'],
  },
  {
    id: 2,
    title: 'Change Frequency',
    conceptId: 'frequency',
    explanation:
      'Frequency means "how many vibrations per second" — it\'s measured in Hertz (Hz). ' +
      'Higher frequency = higher pitch. Lower frequency = lower pitch. ' +
      'Try moving the frequency slider! Musical notes map to specific frequencies: ' +
      'A4 = 440 Hz, middle C (C4) = 261.63 Hz. ' +
      'When you play a higher note on piano, the string vibrates faster — that\'s a higher frequency.',
    setupFn: () => setupSingleSineTrack(440, 0.5),
    enabledControls: ['play', 'frequency'],
  },
  {
    id: 3,
    title: 'Change Amplitude',
    conceptId: 'amplitude',
    explanation:
      'Amplitude is how big the wave is — it controls the volume. ' +
      'A bigger wave means louder sound, a smaller wave means quieter. ' +
      'Think about playing piano: when you press a key softly, the hammer hits the string gently ' +
      'and the string vibrates just a little (small amplitude = quiet). ' +
      'When you press hard, the string vibrates a lot (big amplitude = loud). ' +
      'Try the amplitude slider to hear the difference!',
    setupFn: () => setupSingleSineTrack(440, 0.5),
    enabledControls: ['play', 'frequency', 'amplitude'],
  },
  {
    id: 4,
    title: 'Waveform Types',
    conceptId: 'waveform',
    explanation:
      'Different wave shapes sound different, even at the same pitch! ' +
      'Sine = pure and smooth (like a flute). ' +
      'Square = buzzy and retro (like an old video game). ' +
      'Triangle = mellow and soft. ' +
      'Sawtooth = bright and harsh (like a buzzing bee). ' +
      'Here\'s a secret: non-sine waves actually contain hidden extra frequencies called "harmonics." ' +
      'We\'ll explore those soon! Try switching between the waveform types to hear how they differ.',
    setupFn: () => setupSingleSineTrack(440, 0.5),
    enabledControls: ['play', 'frequency', 'amplitude', 'waveformType'],
  },
  {
    id: 5,
    title: 'Combine Two Waves',
    conceptId: 'superposition',
    explanation:
      'When you play two notes on a piano at the same time, the air carries both sound waves combined — ' +
      'this is called superposition. The waves literally add together! ' +
      'You now have two tracks: A4 (440 Hz) and E4 (330 Hz). ' +
      'Try playing them individually first, then play both together. ' +
      'Look at the combined waveform — it\'s more complex because it\'s the sum of both waves. ' +
      'This is how chords work!',
    setupFn: () => setupTwoSineTracks(440, 330),
    enabledControls: ['play', 'play-individual', 'play-all', 'frequency', 'amplitude'],
  },
  {
    id: 6,
    title: 'Constructive & Destructive Interference',
    conceptId: 'interference',
    explanation:
      'When two waves line up perfectly (peaks match peaks), they make a BIGGER wave — ' +
      'this is called constructive interference. ' +
      'When one wave\'s peak lines up with the other\'s valley, they cancel each other out — ' +
      'that\'s destructive interference! ' +
      'Imagine two people pushing a swing: if they push at the same time, the swing goes higher. ' +
      'If one pushes while the other pulls, the swing barely moves. ' +
      'Use the phase slider on the second track to shift its wave. ' +
      'At 180 degrees (pi radians), the waves cancel out completely!',
    setupFn: () => setupTwoSineTracks(440, 440),
    enabledControls: ['play', 'play-all', 'phase'],
  },
  {
    id: 7,
    title: 'Harmonics & Timbre',
    conceptId: 'harmonics',
    explanation:
      'Why does a piano sound different from a violin, even playing the same note? ' +
      'Both play A4 (440 Hz), but each instrument adds different "extra" frequencies called harmonics. ' +
      'Harmonics are whole-number multiples of the main frequency (called the fundamental): ' +
      '880 Hz (2x), 1320 Hz (3x), 1760 Hz (4x), and so on. ' +
      'The "recipe" of harmonics — which ones are present and how loud they are — is what gives ' +
      'each instrument its unique sound color, called timbre (pronounced "TAM-ber"). ' +
      'Listen to the Piano A4 preset, then switch to Violin A4 to hear the difference!',
    setupFn: () => applyNamedPreset('Piano A4'),
    enabledControls: ['play', 'play-all', 'preset-comparison'],
  },
  {
    id: 8,
    title: 'Introduce FFT',
    conceptId: 'fft',
    explanation:
      'The FFT (Fast Fourier Transform) is like a prism for sound. ' +
      'A prism splits white light into a rainbow of colors — the FFT splits a complex sound ' +
      'into its individual frequencies. ' +
      'Look at the FFT panel on the right side of the screen. ' +
      'Each peak represents a frequency in the sound. ' +
      'With the Piano A4 preset playing, you should see peaks at 440, 880, 1320, and 1760 Hz — ' +
      'those are the harmonics! ' +
      'The FFT is incredibly useful: it lets us "see" what frequencies are inside any sound.',
    setupFn: () => applyNamedPreset('Piano A4'),
    enabledControls: ['play', 'play-all', 'fft'],
  },
  {
    id: 9,
    title: 'Load Real Audio',
    conceptId: 'real-audio',
    explanation:
      'Now for the fun part — try loading a real audio file! ' +
      'You can drag and drop an MP3 or WAV file, or click to browse. ' +
      'Watch the FFT panel dance in real-time as the music plays. ' +
      'You\'ll see the frequency peaks shift and change with every note and chord. ' +
      'Bass notes light up the left side (low frequencies), ' +
      'and high notes light up the right side (high frequencies). ' +
      'Congratulations — you now understand the basics of Fourier transforms!',
    setupFn: () => clearAllTracks(),
    enabledControls: ['audio-upload', 'audio-playback', 'fft'],
  },
] as const

/**
 * Retrieves a guided step by its 1-based ID.
 *
 * @param stepId - The step number (1-9).
 * @returns The GuidedStep, or undefined if the ID is out of range.
 */
export function getGuidedStep(stepId: number): GuidedStep | undefined {
  return GUIDED_STEPS.find((s) => s.id === stepId)
}
