<script setup lang="ts">
/**
 * ChallengePanel — Main UI for the interactive challenge system.
 *
 * Displays the challenge selector, current challenge details,
 * type-specific input controls, feedback, and score progress.
 */
import { ref, computed } from 'vue'
import { useChallenges } from '../composables/useChallenges'
import { useAudioEngine } from '../composables/useAudioEngine'
import { CHALLENGES } from '../utils/challenges'
import type { Challenge } from '../types/challenge'

const {
  currentChallenge,
  isChallengeActive,
  attempts,
  lastSubmitCorrect,
  showHint,
  totalScore,
  completedCount,
  totalChallenges,
  startChallenge,
  submitAnswer,
  skipChallenge,
  endChallenge,
  getResult,
} = useChallenges()

const engine = useAudioEngine()

// ── Local state for user inputs ────────────────────────────────────

/** Frequency slider value for match-frequency challenges. */
const frequencyGuess = ref(440)

/** Selected note names for name-that-note challenges. */
const selectedNotes = ref<string[]>([])

/** Frequency inputs for find-hidden-frequency challenges. */
const frequencyInputs = ref<number[]>([])

/** Whether the challenge selector list is shown. */
const showSelector = ref(true)

// ── Computed ───────────────────────────────────────────────────────

/** Whether the reference sound is currently playing. */
const isReferencePlaying = computed(() => engine.isPlaying.value)

/** Difficulty badge color class. */
const difficultyColor = computed(() => {
  if (!currentChallenge.value) return ''
  switch (currentChallenge.value.difficulty) {
    case 'easy':
      return 'bg-green-600/30 text-green-300'
    case 'medium':
      return 'bg-yellow-600/30 text-yellow-300'
    case 'hard':
      return 'bg-red-600/30 text-red-300'
  }
})

/** Number of frequency inputs needed for the current challenge. */
const requiredFrequencyCount = computed(() => {
  if (!currentChallenge.value) return 0
  return currentChallenge.value.targetFrequencies.length
})

/** Number of note selections needed for the current challenge. */
const requiredNoteCount = computed(() => {
  if (!currentChallenge.value) return 0
  return currentChallenge.value.correctNoteNames?.length ?? 0
})

// ── Actions ────────────────────────────────────────────────────────

/**
 * Handles selecting a challenge from the list.
 *
 * @param challenge - The challenge to start.
 */
function handleSelectChallenge(challenge: Challenge): void {
  startChallenge(challenge.id)
  showSelector.value = false
  resetInputs(challenge)
}

/**
 * Resets input fields for a new challenge.
 *
 * @param challenge - The challenge being started.
 */
function resetInputs(challenge: Challenge): void {
  frequencyGuess.value = 440
  selectedNotes.value = []
  frequencyInputs.value = new Array(challenge.targetFrequencies.length).fill(300)
}

/**
 * Toggles reference sound playback.
 */
function toggleReference(): void {
  if (engine.isPlaying.value) {
    engine.stopAll()
  } else {
    engine.resumeContext()
    engine.playAll()
  }
}

/**
 * Handles submitting the answer for the current challenge type.
 */
function handleSubmit(): void {
  if (!currentChallenge.value) return

  switch (currentChallenge.value.type) {
    case 'match-frequency':
      if (currentChallenge.value.targetFrequencies.length === 1) {
        submitAnswer(frequencyGuess.value)
      } else {
        submitAnswer([frequencyGuess.value, ...frequencyInputs.value.slice(1)])
      }
      break
    case 'name-that-note':
      submitAnswer(selectedNotes.value)
      break
    case 'find-hidden-frequency':
      submitAnswer(frequencyInputs.value)
      break
  }
}

/**
 * Toggles a note selection for name-that-note challenges.
 *
 * @param note - The note name to toggle.
 */
function toggleNoteSelection(note: string): void {
  const index = selectedNotes.value.indexOf(note)
  if (index >= 0) {
    selectedNotes.value = selectedNotes.value.filter((n) => n !== note)
  } else if (selectedNotes.value.length < requiredNoteCount.value) {
    selectedNotes.value = [...selectedNotes.value, note]
  }
}

/**
 * Updates a frequency input value for find-hidden-frequency challenges.
 *
 * @param index - The input index.
 * @param value - The new frequency value.
 */
function updateFrequencyInput(index: number, value: number): void {
  const updated = [...frequencyInputs.value]
  updated[index] = value
  frequencyInputs.value = updated
}

/**
 * Handles skipping the current challenge.
 */
function handleSkip(): void {
  engine.stopAll()
  skipChallenge()
  showSelector.value = true
}

/**
 * Handles going back to the challenge list after completion.
 */
function handleBackToList(): void {
  engine.stopAll()
  endChallenge()
  showSelector.value = true
}

/**
 * Returns the difficulty badge color for a challenge in the list.
 *
 * @param difficulty - The challenge difficulty.
 * @returns Tailwind CSS class string.
 */
function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-600/30 text-green-300'
    case 'medium':
      return 'bg-yellow-600/30 text-yellow-300'
    case 'hard':
      return 'bg-red-600/30 text-red-300'
    default:
      return ''
  }
}
</script>

<template>
  <div class="w-80 max-h-[70vh] overflow-y-auto" data-testid="challenge-panel">
    <!-- Header with score -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-base font-bold text-white">Challenges</h2>
      <span class="text-sm text-gray-400" data-testid="challenge-progress">
        {{ completedCount }}/{{ totalChallenges }} completed, Score: {{ totalScore }}
      </span>
    </div>

    <!-- Challenge selector list -->
    <div v-if="showSelector" data-testid="challenge-list">
      <ul class="space-y-2">
        <li
          v-for="challenge in CHALLENGES"
          :key="challenge.id"
          class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-700 bg-gray-750 p-3 transition-colors hover:border-blue-500 hover:bg-gray-700"
          :data-testid="`challenge-item-${challenge.id}`"
          @click="handleSelectChallenge(challenge)"
        >
          <div class="flex-1 min-w-0 mr-2">
            <p class="text-sm font-medium text-white truncate">{{ challenge.title }}</p>
            <span
              class="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getDifficultyClass(challenge.difficulty)"
            >
              {{ challenge.difficulty }}
            </span>
          </div>
          <div class="flex-shrink-0">
            <span
              v-if="getResult(challenge.id)?.completed"
              class="text-green-400 text-sm"
              data-testid="challenge-completed-badge"
            >
              {{ getResult(challenge.id)?.score }}pts
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- Active challenge view -->
    <div v-else-if="currentChallenge && isChallengeActive" data-testid="active-challenge">
      <!-- Challenge info -->
      <div class="mb-3">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold text-white" data-testid="challenge-title">
            {{ currentChallenge.title }}
          </h3>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="difficultyColor"
            data-testid="difficulty-badge"
          >
            {{ currentChallenge.difficulty }}
          </span>
        </div>
        <p class="text-xs text-gray-400" data-testid="challenge-description">
          {{ currentChallenge.description }}
        </p>
      </div>

      <!-- Play reference button -->
      <button
        class="mb-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="isReferencePlaying
          ? 'bg-red-600 text-white hover:bg-red-500'
          : 'bg-blue-600 text-white hover:bg-blue-500'"
        data-testid="play-reference-btn"
        @click="toggleReference"
      >
        {{ isReferencePlaying ? 'Stop Reference' : 'Play Reference' }}
      </button>

      <!-- Match Frequency input -->
      <div v-if="currentChallenge.type === 'match-frequency'" data-testid="match-frequency-input">
        <div
          v-for="(_, idx) in requiredFrequencyCount"
          :key="idx"
          class="mb-2"
        >
          <label class="block text-xs text-gray-400 mb-1">
            Frequency {{ requiredFrequencyCount > 1 ? idx + 1 : '' }}: {{ idx === 0 ? frequencyGuess : frequencyInputs[idx] }} Hz
          </label>
          <input
            v-if="idx === 0"
            v-model.number="frequencyGuess"
            type="range"
            min="100"
            max="2000"
            step="1"
            class="w-full accent-blue-500"
            :data-testid="`freq-slider-${idx}`"
          />
          <input
            v-else
            :value="frequencyInputs[idx]"
            type="range"
            min="100"
            max="2000"
            step="1"
            class="w-full accent-blue-500"
            :data-testid="`freq-slider-${idx}`"
            @input="updateFrequencyInput(idx, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- Name That Note input -->
      <div v-if="currentChallenge.type === 'name-that-note'" data-testid="name-note-input">
        <p class="text-xs text-gray-400 mb-2">
          Select {{ requiredNoteCount }} note{{ requiredNoteCount > 1 ? 's' : '' }}:
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in currentChallenge.options"
            :key="option"
            class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="selectedNotes.includes(option)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
            :data-testid="`note-option-${option}`"
            @click="toggleNoteSelection(option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Find Hidden Frequency input -->
      <div v-if="currentChallenge.type === 'find-hidden-frequency'" data-testid="find-freq-input">
        <div
          v-for="(_, idx) in requiredFrequencyCount"
          :key="idx"
          class="mb-2"
        >
          <label class="block text-xs text-gray-400 mb-1">
            Frequency {{ idx + 1 }}: {{ frequencyInputs[idx] }} Hz
          </label>
          <input
            :value="frequencyInputs[idx]"
            type="range"
            min="100"
            max="2000"
            step="1"
            class="w-full accent-blue-500"
            :data-testid="`find-freq-slider-${idx}`"
            @input="updateFrequencyInput(idx, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- Feedback display -->
      <div v-if="lastSubmitCorrect !== null" class="my-3" data-testid="feedback">
        <div
          v-if="lastSubmitCorrect"
          class="rounded-lg bg-green-600/20 border border-green-600/40 p-3"
          data-testid="feedback-correct"
        >
          <p class="text-sm font-medium text-green-300">Correct!</p>
          <p class="text-xs text-green-400">
            Score: {{ getResult(currentChallenge.id)?.score ?? 0 }} points
            ({{ attempts }} attempt{{ attempts !== 1 ? 's' : '' }})
          </p>
        </div>
        <div
          v-else
          class="rounded-lg bg-red-600/20 border border-red-600/40 p-3"
          data-testid="feedback-wrong"
        >
          <p class="text-sm font-medium text-red-300">Not quite. Try again!</p>
          <p
            v-if="showHint && currentChallenge.hint"
            class="mt-1 text-xs text-yellow-300"
            data-testid="hint-text"
          >
            Hint: {{ currentChallenge.hint }}
          </p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="mt-3 flex gap-2">
        <button
          v-if="!lastSubmitCorrect"
          class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-btn"
          @click="handleSubmit"
        >
          Submit
        </button>
        <button
          v-if="lastSubmitCorrect"
          class="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
          data-testid="next-btn"
          @click="handleBackToList"
        >
          Back to Challenges
        </button>
        <button
          class="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
          data-testid="skip-btn"
          @click="handleSkip"
        >
          Skip
        </button>
      </div>

      <!-- Attempt counter -->
      <p class="mt-2 text-center text-xs text-gray-500" data-testid="attempt-counter">
        Attempts: {{ attempts }}
      </p>
    </div>
  </div>
</template>
