/**
 * Challenge state machine composable.
 *
 * Manages the lifecycle of interactive challenges: starting, submitting
 * answers, scoring, and persisting results to localStorage.
 *
 * Usage:
 *   const { currentChallenge, startChallenge, submitAnswer, totalScore } = useChallenges()
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Challenge, ChallengeResult } from '../types/challenge'
import {
  CHALLENGES,
  findChallengeById,
  calculateScore,
  areAllFrequenciesMatched,
  areNoteNamesCorrect,
} from '../utils/challenges'
import { useAudioEngine } from './useAudioEngine'
import { getChallengeTrackConfigs } from '../utils/challenges'

// ── Constants ──────────────────────────────────────────────────────

/** localStorage key for persisted challenge results. */
const STORAGE_KEY = 'fourier-explorer-challenge-results'

// ── Persistence helpers ────────────────────────────────────────────

/**
 * Loads challenge results from localStorage.
 *
 * @returns Array of persisted ChallengeResult, or empty array if none found.
 */
function loadResults(): ChallengeResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/**
 * Saves challenge results to localStorage.
 *
 * @param results - The results array to persist.
 */
function saveResults(results: ChallengeResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ── Singleton state ────────────────────────────────────────────────

const currentChallenge: Ref<Challenge | null> = ref(null)
const challengeResults: Ref<ChallengeResult[]> = ref(loadResults())
const isChallengeActive: Ref<boolean> = ref(false)
const attempts: Ref<number> = ref(0)
const lastSubmitCorrect: Ref<boolean | null> = ref(null)
const showHint: Ref<boolean> = ref(false)

// ── Computed properties ────────────────────────────────────────────

/** Total score across all completed challenges. */
const totalScore: ComputedRef<number> = computed(() =>
  challengeResults.value.reduce((sum, r) => sum + r.score, 0),
)

/** Number of challenges completed successfully. */
const completedCount: ComputedRef<number> = computed(() =>
  challengeResults.value.filter((r) => r.completed).length,
)

/** Total number of available challenges. */
const totalChallenges: ComputedRef<number> = computed(() => CHALLENGES.length)

// ── Actions ────────────────────────────────────────────────────────

/**
 * Starts a challenge by its ID.
 *
 * Sets up the audio engine with the challenge's reference tracks.
 * Resets attempt counter and feedback state.
 *
 * @param challengeId - The ID of the challenge to start.
 * @returns True if the challenge was found and started, false otherwise.
 */
function startChallenge(challengeId: string): boolean {
  const challenge = findChallengeById(challengeId)
  if (!challenge) return false

  const engine = useAudioEngine()

  // Clear existing tracks
  const currentIds = engine.tracks.value.map((t) => t.id)
  for (const id of currentIds) {
    engine.removeTrack(id)
  }

  // Set up challenge tracks
  const trackConfigs = getChallengeTrackConfigs(challenge)
  for (const config of trackConfigs) {
    engine.createTrack(config)
  }

  currentChallenge.value = challenge
  isChallengeActive.value = true
  attempts.value = 0
  lastSubmitCorrect.value = null
  showHint.value = false

  return true
}

/**
 * Submits an answer for the current challenge.
 *
 * Validates the answer based on challenge type, updates attempt count,
 * calculates score on success, and persists results.
 *
 * @param answer - The user's answer. Can be:
 *   - number: single frequency guess (match-frequency with one target)
 *   - number[]: multiple frequency guesses (match-frequency or find-hidden-frequency)
 *   - string: single note name (name-that-note with one answer)
 *   - string[]: multiple note names (name-that-note with multiple answers)
 * @returns The ChallengeResult if correct, or null if incorrect.
 */
function submitAnswer(answer: number | number[] | string | string[]): ChallengeResult | null {
  if (!currentChallenge.value || !isChallengeActive.value) return null

  attempts.value++
  const challenge = currentChallenge.value
  let correct = false

  if (challenge.type === 'name-that-note') {
    const noteAnswers = Array.isArray(answer)
      ? (answer as string[])
      : [answer as string]
    correct = areNoteNamesCorrect(noteAnswers, challenge.correctNoteNames ?? [])
  } else {
    // match-frequency or find-hidden-frequency
    const freqGuesses = Array.isArray(answer)
      ? (answer as number[])
      : [answer as number]
    correct = areAllFrequenciesMatched(freqGuesses, challenge.targetFrequencies, challenge.toleranceHz)
  }

  lastSubmitCorrect.value = correct

  if (correct) {
    const score = calculateScore(attempts.value)
    const result: ChallengeResult = {
      challengeId: challenge.id,
      completed: true,
      attempts: attempts.value,
      score,
    }

    // Update or add the result
    const existingIndex = challengeResults.value.findIndex(
      (r) => r.challengeId === challenge.id,
    )
    if (existingIndex >= 0) {
      // Keep the better score
      const existing = challengeResults.value[existingIndex]
      if (score > existing.score) {
        const updated = [...challengeResults.value]
        updated[existingIndex] = result
        challengeResults.value = updated
      }
    } else {
      challengeResults.value = [...challengeResults.value, result]
    }

    saveResults(challengeResults.value)
    return result
  }

  // Wrong answer — show hint after first wrong attempt
  if (attempts.value >= 1 && challenge.hint) {
    showHint.value = true
  }

  return null
}

/**
 * Skips the current challenge without earning points.
 *
 * Records a zero-score result and deactivates the challenge.
 */
function skipChallenge(): void {
  if (!currentChallenge.value) return

  const result: ChallengeResult = {
    challengeId: currentChallenge.value.id,
    completed: false,
    attempts: attempts.value,
    score: 0,
  }

  // Only add if no result exists yet
  const existingIndex = challengeResults.value.findIndex(
    (r) => r.challengeId === currentChallenge.value!.id,
  )
  if (existingIndex < 0) {
    challengeResults.value = [...challengeResults.value, result]
    saveResults(challengeResults.value)
  }

  isChallengeActive.value = false
  currentChallenge.value = null
  lastSubmitCorrect.value = null
  showHint.value = false
}

/**
 * Ends the current challenge (used after successful completion).
 *
 * Clears active challenge state without recording a skip.
 */
function endChallenge(): void {
  isChallengeActive.value = false
  currentChallenge.value = null
  lastSubmitCorrect.value = null
  showHint.value = false
}

/**
 * Returns the result for a specific challenge, if it exists.
 *
 * @param challengeId - The challenge ID to look up.
 * @returns The ChallengeResult, or undefined if not attempted.
 */
function getResult(challengeId: string): ChallengeResult | undefined {
  return challengeResults.value.find((r) => r.challengeId === challengeId)
}

/**
 * Resets all challenge results (clears localStorage).
 */
function resetAllResults(): void {
  challengeResults.value = []
  saveResults([])
}

// ── Composable export ──────────────────────────────────────────────

/**
 * Challenge system composable (singleton).
 *
 * Returns reactive state and methods for managing interactive challenges.
 * Multiple callers receive the same shared state.
 *
 * @returns Challenge system API.
 */
export function useChallenges() {
  return {
    // Reactive state
    currentChallenge,
    challengeResults,
    isChallengeActive,
    attempts,
    lastSubmitCorrect,
    showHint,

    // Computed
    totalScore,
    completedCount,
    totalChallenges,

    // Actions
    startChallenge,
    submitAnswer,
    skipChallenge,
    endChallenge,
    getResult,
    resetAllResults,
  }
}
