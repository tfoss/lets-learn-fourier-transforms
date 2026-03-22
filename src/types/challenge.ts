/**
 * Type definitions for the interactive challenge system.
 *
 * Defines challenge types, challenge configuration, and result tracking
 * for gamified exercises like "Match this sound", "Name that note",
 * and "Find the hidden frequency".
 */

/** The three categories of challenges available. */
export type ChallengeType = 'match-frequency' | 'name-that-note' | 'find-hidden-frequency'

/** Difficulty levels for challenges. */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'

/**
 * A single challenge definition.
 *
 * Contains all the information needed to present and evaluate
 * a challenge, including the target answer and tolerance.
 */
export interface Challenge {
  /** Unique identifier for this challenge. */
  id: string
  /** The category of challenge. */
  type: ChallengeType
  /** Short display title for the challenge. */
  title: string
  /** Description explaining what the user needs to do. */
  description: string
  /** Difficulty rating. */
  difficulty: ChallengeDifficulty
  /** The target frequency (or frequencies) the user needs to find/match. */
  targetFrequencies: number[]
  /** Tolerance in Hz for matching (how close the user's answer must be). */
  toleranceHz: number
  /** Hint text shown after the first wrong attempt. */
  hint?: string
  /** For name-that-note challenges: the set of answer options. */
  options?: string[]
  /** For name-that-note challenges: the correct answer(s). */
  correctNoteNames?: string[]
}

/**
 * The result of a completed challenge attempt.
 *
 * Tracks whether the user completed the challenge, how many
 * attempts it took, and the score earned.
 */
export interface ChallengeResult {
  /** ID of the challenge this result is for. */
  challengeId: string
  /** Whether the challenge was completed successfully. */
  completed: boolean
  /** Number of attempts the user made. */
  attempts: number
  /** Score earned, 0-100. */
  score: number
}
