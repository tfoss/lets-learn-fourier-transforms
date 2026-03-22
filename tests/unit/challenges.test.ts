/**
 * Tests for the challenges utility module.
 *
 * Verifies challenge data validity, lookup functions,
 * score calculation, and answer checking logic.
 */

import { describe, it, expect } from 'vitest'
import {
  CHALLENGES,
  findChallengeById,
  getChallengesByType,
  getChallengesByDifficulty,
  calculateScore,
  isFrequencyMatch,
  areAllFrequenciesMatched,
  areNoteNamesCorrect,
  getChallengeTrackConfigs,
  MAX_SCORE,
  ATTEMPT_PENALTY,
  MIN_COMPLETION_SCORE,
} from '../../src/utils/challenges'
import { MIN_FREQUENCY, MAX_FREQUENCY } from '../../src/utils/audio-math'

// ── Challenge data validity ────────────────────────────────────────

describe('challenges', () => {
  describe('CHALLENGES data validity', () => {
    it('has at least 12 challenges', () => {
      expect(CHALLENGES.length).toBeGreaterThanOrEqual(12)
    })

    it('every challenge has a non-empty id', () => {
      for (const c of CHALLENGES) {
        expect(c.id.length).toBeGreaterThan(0)
      }
    })

    it('all challenge ids are unique', () => {
      const ids = CHALLENGES.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('every challenge has a non-empty title', () => {
      for (const c of CHALLENGES) {
        expect(c.title.length).toBeGreaterThan(0)
      }
    })

    it('every challenge has a non-empty description', () => {
      for (const c of CHALLENGES) {
        expect(c.description.length).toBeGreaterThan(0)
      }
    })

    it('every challenge has a valid type', () => {
      const validTypes = ['match-frequency', 'name-that-note', 'find-hidden-frequency']
      for (const c of CHALLENGES) {
        expect(validTypes).toContain(c.type)
      }
    })

    it('every challenge has a valid difficulty', () => {
      const validDifficulties = ['easy', 'medium', 'hard']
      for (const c of CHALLENGES) {
        expect(validDifficulties).toContain(c.difficulty)
      }
    })

    it('every challenge has at least one target frequency', () => {
      for (const c of CHALLENGES) {
        expect(c.targetFrequencies.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('all target frequencies are positive', () => {
      for (const c of CHALLENGES) {
        for (const freq of c.targetFrequencies) {
          expect(freq).toBeGreaterThan(0)
        }
      }
    })

    it('every challenge has a non-negative tolerance', () => {
      for (const c of CHALLENGES) {
        expect(c.toleranceHz).toBeGreaterThanOrEqual(0)
      }
    })

    it('name-that-note challenges have options and correctNoteNames', () => {
      const noteChallengers = CHALLENGES.filter((c) => c.type === 'name-that-note')
      for (const c of noteChallengers) {
        expect(c.options).toBeDefined()
        expect(c.options!.length).toBeGreaterThanOrEqual(2)
        expect(c.correctNoteNames).toBeDefined()
        expect(c.correctNoteNames!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('name-that-note correct answers are included in options', () => {
      const noteChallengers = CHALLENGES.filter((c) => c.type === 'name-that-note')
      for (const c of noteChallengers) {
        for (const correct of c.correctNoteNames!) {
          expect(c.options).toContain(correct)
        }
      }
    })

    it('has at least 4 match-frequency challenges', () => {
      const count = CHALLENGES.filter((c) => c.type === 'match-frequency').length
      expect(count).toBeGreaterThanOrEqual(4)
    })

    it('has at least 4 name-that-note challenges', () => {
      const count = CHALLENGES.filter((c) => c.type === 'name-that-note').length
      expect(count).toBeGreaterThanOrEqual(4)
    })

    it('has at least 4 find-hidden-frequency challenges', () => {
      const count = CHALLENGES.filter((c) => c.type === 'find-hidden-frequency').length
      expect(count).toBeGreaterThanOrEqual(4)
    })
  })

  // ── Lookup functions ───────────────────────────────────────────

  describe('findChallengeById', () => {
    it('finds an existing challenge by id', () => {
      const result = findChallengeById('match-440')
      expect(result).toBeDefined()
      expect(result!.id).toBe('match-440')
      expect(result!.title).toBe('Match 440 Hz')
    })

    it('returns undefined for a non-existent id', () => {
      const result = findChallengeById('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('getChallengesByType', () => {
    it('returns only challenges of the specified type', () => {
      const matchChallenges = getChallengesByType('match-frequency')
      for (const c of matchChallenges) {
        expect(c.type).toBe('match-frequency')
      }
      expect(matchChallenges.length).toBeGreaterThanOrEqual(4)
    })

    it('returns empty array for unmatched type', () => {
      const result = getChallengesByType('nonexistent' as any)
      expect(result).toEqual([])
    })
  })

  describe('getChallengesByDifficulty', () => {
    it('returns only challenges of the specified difficulty', () => {
      const easyChallenges = getChallengesByDifficulty('easy')
      for (const c of easyChallenges) {
        expect(c.difficulty).toBe('easy')
      }
      expect(easyChallenges.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Score calculation ──────────────────────────────────────────

  describe('calculateScore', () => {
    it('returns MAX_SCORE for first attempt', () => {
      expect(calculateScore(1)).toBe(MAX_SCORE)
    })

    it('deducts ATTEMPT_PENALTY per extra attempt', () => {
      expect(calculateScore(2)).toBe(MAX_SCORE - ATTEMPT_PENALTY)
      expect(calculateScore(3)).toBe(MAX_SCORE - 2 * ATTEMPT_PENALTY)
    })

    it('never goes below MIN_COMPLETION_SCORE', () => {
      expect(calculateScore(10)).toBe(MIN_COMPLETION_SCORE)
      expect(calculateScore(100)).toBe(MIN_COMPLETION_SCORE)
    })

    it('returns 0 for zero or negative attempts', () => {
      expect(calculateScore(0)).toBe(0)
      expect(calculateScore(-1)).toBe(0)
    })
  })

  // ── Answer checking ────────────────────────────────────────────

  describe('isFrequencyMatch', () => {
    it('returns true for exact match', () => {
      expect(isFrequencyMatch(440, 440, 10)).toBe(true)
    })

    it('returns true within tolerance', () => {
      expect(isFrequencyMatch(445, 440, 10)).toBe(true)
      expect(isFrequencyMatch(435, 440, 10)).toBe(true)
    })

    it('returns true at exact tolerance boundary', () => {
      expect(isFrequencyMatch(450, 440, 10)).toBe(true)
      expect(isFrequencyMatch(430, 440, 10)).toBe(true)
    })

    it('returns false outside tolerance', () => {
      expect(isFrequencyMatch(451, 440, 10)).toBe(false)
      expect(isFrequencyMatch(429, 440, 10)).toBe(false)
    })
  })

  describe('areAllFrequenciesMatched', () => {
    it('returns true when all targets are matched', () => {
      expect(areAllFrequenciesMatched([440, 660], [440, 660], 10)).toBe(true)
    })

    it('returns true regardless of order', () => {
      expect(areAllFrequenciesMatched([660, 440], [440, 660], 10)).toBe(true)
    })

    it('returns true within tolerance', () => {
      expect(areAllFrequenciesMatched([445, 655], [440, 660], 10)).toBe(true)
    })

    it('returns false when a target is not matched', () => {
      expect(areAllFrequenciesMatched([440, 500], [440, 660], 10)).toBe(false)
    })

    it('returns false when not enough guesses', () => {
      expect(areAllFrequenciesMatched([440], [440, 660], 10)).toBe(false)
    })

    it('handles single target', () => {
      expect(areAllFrequenciesMatched([440], [440], 10)).toBe(true)
    })

    it('does not double-count a single guess for multiple targets', () => {
      expect(areAllFrequenciesMatched([440], [440, 440], 10)).toBe(false)
    })
  })

  describe('areNoteNamesCorrect', () => {
    it('returns true for correct single note', () => {
      expect(areNoteNamesCorrect(['A4'], ['A4'])).toBe(true)
    })

    it('returns true for correct multiple notes regardless of order', () => {
      expect(areNoteNamesCorrect(['E4', 'C4'], ['C4', 'E4'])).toBe(true)
    })

    it('returns false for wrong note', () => {
      expect(areNoteNamesCorrect(['B4'], ['A4'])).toBe(false)
    })

    it('returns false for wrong count', () => {
      expect(areNoteNamesCorrect(['A4', 'C4'], ['A4'])).toBe(false)
    })

    it('returns false for empty answers', () => {
      expect(areNoteNamesCorrect([], ['A4'])).toBe(false)
    })
  })

  // ── Track config generation ────────────────────────────────────

  describe('getChallengeTrackConfigs', () => {
    it('returns correct number of tracks for a simple challenge', () => {
      const challenge = findChallengeById('match-440')!
      const configs = getChallengeTrackConfigs(challenge)
      expect(configs.length).toBe(1)
      expect(configs[0].frequency).toBe(440)
    })

    it('returns tracks for multi-frequency challenge', () => {
      const challenge = findChallengeById('find-two-freqs')!
      const configs = getChallengeTrackConfigs(challenge)
      expect(configs.length).toBe(2)
      expect(configs[0].frequency).toBe(300)
      expect(configs[1].frequency).toBe(500)
    })

    it('returns extra harmonic tracks for find-odd-harmonic challenge', () => {
      const challenge = findChallengeById('find-odd-harmonic')!
      const configs = getChallengeTrackConfigs(challenge)
      // 4 harmonics + 1 target = 5 tracks
      expect(configs.length).toBe(5)
      const freqs = configs.map((c) => c.frequency)
      expect(freqs).toContain(200)
      expect(freqs).toContain(400)
      expect(freqs).toContain(600)
      expect(freqs).toContain(800)
      expect(freqs).toContain(550)
    })

    it('all track configs use sine waveform', () => {
      for (const challenge of CHALLENGES) {
        const configs = getChallengeTrackConfigs(challenge)
        for (const config of configs) {
          expect(config.waveformType).toBe('sine')
        }
      }
    })

    it('all track configs have valid amplitude', () => {
      for (const challenge of CHALLENGES) {
        const configs = getChallengeTrackConfigs(challenge)
        for (const config of configs) {
          expect(config.amplitude).toBeGreaterThan(0)
          expect(config.amplitude).toBeLessThanOrEqual(1)
        }
      }
    })
  })
})
