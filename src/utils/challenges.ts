/**
 * Challenge definitions for the interactive challenge system.
 *
 * Defines ~12 preset challenges across three categories:
 * - Match Frequency: user adjusts a slider to match a target frequency
 * - Name That Note: user identifies a played note from multiple choices
 * - Find Hidden Frequency: user identifies frequencies in a complex sound
 *
 * Each challenge includes setup/check functions that work with the audio engine.
 */

import type { Challenge, ChallengeType, ChallengeDifficulty } from '../types/challenge'
import { frequencyToNoteName, noteNameToFrequency } from './audio-math'

// ── Constants ──────────────────────────────────────────────────────

/** Maximum score for a perfect first-attempt answer. */
export const MAX_SCORE = 100

/** Score penalty per additional attempt. */
export const ATTEMPT_PENALTY = 25

/** Minimum score for completing a challenge (regardless of attempts). */
export const MIN_COMPLETION_SCORE = 10

// ── Challenge definitions ──────────────────────────────────────────

/** All available challenges, ordered by type then difficulty. */
export const CHALLENGES: readonly Challenge[] = [
  // ── Match Frequency ────────────────────────────────────────────
  {
    id: 'match-440',
    type: 'match-frequency',
    title: 'Match 440 Hz',
    description: 'A reference tone at 440 Hz (concert A) is playing. Adjust the slider until your frequency matches.',
    difficulty: 'easy',
    targetFrequencies: [440],
    toleranceHz: 10,
    hint: 'Concert A is the standard tuning reference. Try the middle of the slider range.',
  },
  {
    id: 'match-middle-c',
    type: 'match-frequency',
    title: 'Match Middle C',
    description: 'A reference tone at 261.63 Hz (middle C) is playing. Match it with your slider.',
    difficulty: 'easy',
    targetFrequencies: [261.63],
    toleranceHz: 10,
    hint: 'Middle C is lower than A4. Try around 260 Hz.',
  },
  {
    id: 'match-mystery-note',
    type: 'match-frequency',
    title: 'Match the Mystery Note',
    description: 'A mystery note is playing. Use your ears and the FFT display to match its frequency.',
    difficulty: 'medium',
    targetFrequencies: [329.63], // E4
    toleranceHz: 8,
    hint: 'Look at the FFT chart to see where the peak is. This note is between C4 and A4.',
  },
  {
    id: 'match-interval',
    type: 'match-frequency',
    title: 'Match the Interval',
    description: 'Two notes are playing together. Find both frequencies to complete the challenge.',
    difficulty: 'hard',
    targetFrequencies: [440, 660],
    toleranceHz: 8,
    hint: 'This is a perfect fifth interval. The two frequencies have a 3:2 ratio.',
  },

  // ── Name That Note ─────────────────────────────────────────────
  {
    id: 'name-a4',
    type: 'name-that-note',
    title: 'Name That Note: Easy',
    description: 'Listen to the tone and identify which note is playing.',
    difficulty: 'easy',
    targetFrequencies: [440],
    toleranceHz: 0,
    options: ['A4', 'C4', 'E4', 'G4'],
    correctNoteNames: ['A4'],
    hint: 'This is the standard tuning frequency used by orchestras worldwide.',
  },
  {
    id: 'name-note-medium',
    type: 'name-that-note',
    title: 'Name That Note: Medium',
    description: 'A note is playing. Can you identify it from these options?',
    difficulty: 'medium',
    targetFrequencies: [392],
    toleranceHz: 0,
    options: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    correctNoteNames: ['G4'],
    hint: 'This note is the fifth note of the C major scale.',
  },
  {
    id: 'name-note-medium-2',
    type: 'name-that-note',
    title: 'Name That Note: Tricky',
    description: 'Listen carefully. Which note do you hear?',
    difficulty: 'medium',
    targetFrequencies: [349.23],
    toleranceHz: 0,
    options: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    correctNoteNames: ['F4'],
    hint: 'This note is between E4 and G4.',
  },
  {
    id: 'name-two-notes',
    type: 'name-that-note',
    title: 'Name Both Notes',
    description: 'Two notes are playing at the same time. Identify both of them.',
    difficulty: 'hard',
    targetFrequencies: [261.63, 329.63],
    toleranceHz: 0,
    options: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    correctNoteNames: ['C4', 'E4'],
    hint: 'These two notes form a major third interval. The lower note is the first note of the scale.',
  },

  // ── Find Hidden Frequency ──────────────────────────────────────
  {
    id: 'find-two-freqs',
    type: 'find-hidden-frequency',
    title: 'Find Two Frequencies',
    description: 'A complex sound is made of 2 sine waves added together. Use the FFT display to identify both frequencies.',
    difficulty: 'easy',
    targetFrequencies: [300, 500],
    toleranceHz: 15,
    hint: 'Look for two distinct peaks in the FFT chart. One is around 300 Hz, the other higher.',
  },
  {
    id: 'find-three-freqs',
    type: 'find-hidden-frequency',
    title: 'Find Three Frequencies',
    description: 'Three sine waves are hidden in this sound. Use the FFT to find all three.',
    difficulty: 'medium',
    targetFrequencies: [200, 400, 700],
    toleranceHz: 15,
    hint: 'There are three peaks in the FFT. The lowest is around 200 Hz.',
  },
  {
    id: 'find-three-freqs-hard',
    type: 'find-hidden-frequency',
    title: 'Find the Tricky Frequencies',
    description: 'Three frequencies are close together. Can you distinguish and identify all three?',
    difficulty: 'medium',
    targetFrequencies: [400, 450, 500],
    toleranceHz: 12,
    hint: 'The frequencies are evenly spaced and all between 350-550 Hz.',
  },
  {
    id: 'find-odd-harmonic',
    type: 'find-hidden-frequency',
    title: 'Find the Odd Harmonic',
    description: 'A harmonic series is playing (200, 400, 600, 800 Hz) but one extra non-harmonic frequency is hidden. Find it!',
    difficulty: 'hard',
    targetFrequencies: [550],
    toleranceHz: 12,
    hint: 'The harmonics are at 200, 400, 600, 800 Hz. The odd one out is between two of these harmonics.',
  },
] as const

// ── Lookup helpers ─────────────────────────────────────────────────

/**
 * Finds a challenge by its unique ID.
 *
 * @param id - The challenge ID to search for.
 * @returns The matching Challenge, or undefined if not found.
 */
export function findChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}

/**
 * Returns all challenges of a specific type.
 *
 * @param type - The challenge type to filter by.
 * @returns Array of challenges matching the type.
 */
export function getChallengesByType(type: ChallengeType): Challenge[] {
  return CHALLENGES.filter((c) => c.type === type)
}

/**
 * Returns all challenges of a specific difficulty.
 *
 * @param difficulty - The difficulty level to filter by.
 * @returns Array of challenges matching the difficulty.
 */
export function getChallengesByDifficulty(difficulty: ChallengeDifficulty): Challenge[] {
  return CHALLENGES.filter((c) => c.difficulty === difficulty)
}

// ── Score calculation ──────────────────────────────────────────────

/**
 * Calculates the score for a completed challenge based on attempt count.
 *
 * First attempt: 100 points. Each additional attempt deducts 25 points,
 * with a minimum of 10 points for any completion.
 *
 * @param attempts - Number of attempts taken (must be >= 1).
 * @returns Score between MIN_COMPLETION_SCORE and MAX_SCORE.
 */
export function calculateScore(attempts: number): number {
  if (attempts < 1) return 0
  const penalty = (attempts - 1) * ATTEMPT_PENALTY
  return Math.max(MIN_COMPLETION_SCORE, MAX_SCORE - penalty)
}

// ── Answer checking ────────────────────────────────────────────────

/**
 * Checks if a frequency guess is within tolerance of a target.
 *
 * @param guess - The user's guessed frequency in Hz.
 * @param target - The target frequency in Hz.
 * @param toleranceHz - Allowed deviation in Hz.
 * @returns True if the guess is within tolerance.
 */
export function isFrequencyMatch(guess: number, target: number, toleranceHz: number): boolean {
  return Math.abs(guess - target) <= toleranceHz
}

/**
 * Checks if a set of frequency guesses matches all targets.
 *
 * Each target must be matched by at least one guess (order doesn't matter).
 * Uses a greedy matching algorithm to avoid double-counting.
 *
 * @param guesses - Array of guessed frequencies.
 * @param targets - Array of target frequencies.
 * @param toleranceHz - Allowed deviation in Hz for each match.
 * @returns True if all targets are matched.
 */
export function areAllFrequenciesMatched(
  guesses: number[],
  targets: number[],
  toleranceHz: number,
): boolean {
  if (guesses.length < targets.length) return false

  const usedGuesses = new Set<number>()

  for (const target of targets) {
    let matched = false
    for (let i = 0; i < guesses.length; i++) {
      if (usedGuesses.has(i)) continue
      if (isFrequencyMatch(guesses[i], target, toleranceHz)) {
        usedGuesses.add(i)
        matched = true
        break
      }
    }
    if (!matched) return false
  }

  return true
}

/**
 * Checks if a note name answer matches the correct answer(s) for a challenge.
 *
 * @param answers - The user's selected note name(s).
 * @param correctNames - The correct note name(s).
 * @returns True if all correct names are present in the answers.
 */
export function areNoteNamesCorrect(answers: string[], correctNames: string[]): boolean {
  if (answers.length !== correctNames.length) return false
  const sortedAnswers = [...answers].sort()
  const sortedCorrect = [...correctNames].sort()
  return sortedAnswers.every((a, i) => a === sortedCorrect[i])
}

/**
 * Returns the track configurations needed to set up a challenge's reference sound.
 *
 * For match-frequency: creates tracks at the target frequencies for playback.
 * For name-that-note: creates tracks at the target frequencies.
 * For find-hidden-frequency: creates tracks at all target frequencies
 *   (plus decoy harmonics for the hard challenge).
 *
 * @param challenge - The challenge to set up.
 * @returns Array of track configs (frequency, amplitude, waveformType).
 */
export function getChallengeTrackConfigs(challenge: Challenge): Array<{
  frequency: number
  amplitude: number
  waveformType: 'sine' | 'square' | 'triangle' | 'sawtooth'
}> {
  if (challenge.id === 'find-odd-harmonic') {
    // Include the harmonic series plus the hidden odd frequency
    const harmonics = [200, 400, 600, 800]
    const allFreqs = [...harmonics, ...challenge.targetFrequencies]
    const amplitude = 0.3
    return allFreqs.map((freq) => ({
      frequency: freq,
      amplitude,
      waveformType: 'sine' as const,
    }))
  }

  const amplitude = challenge.targetFrequencies.length > 2 ? 0.3 : 0.4
  return challenge.targetFrequencies.map((freq) => ({
    frequency: freq,
    amplitude,
    waveformType: 'sine' as const,
  }))
}
