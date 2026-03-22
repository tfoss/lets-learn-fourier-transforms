/**
 * Guided mode state machine composable (singleton).
 *
 * Manages the 9-step interactive tutorial, including step navigation,
 * audio engine setup per step, and localStorage persistence of progress.
 *
 * Usage:
 *   const { currentStep, isGuidedMode, nextStep, prevStep } = useGuidedMode()
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { GUIDED_STEPS, TOTAL_GUIDED_STEPS } from '../utils/guided-steps'
import type { GuidedStep } from '../types/guided'

// ── Constants ──────────────────────────────────────────────────────

/** localStorage key for persisting guided mode progress. */
const STORAGE_KEY = 'guided-mode-progress'

// ── Singleton state ────────────────────────────────────────────────

const currentStep: Ref<number> = ref(1)
const isGuidedMode: Ref<boolean> = ref(false)
const isComplete: Ref<boolean> = ref(false)

// ── Internal helpers ───────────────────────────────────────────────

/**
 * Loads persisted progress from localStorage.
 *
 * @returns The saved step number, or 1 if nothing is saved.
 */
function loadProgress(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const parsed = parseInt(saved, 10)
      if (isFinite(parsed) && parsed >= 1 && parsed <= TOTAL_GUIDED_STEPS) {
        return parsed
      }
    }
  } catch {
    // localStorage may not be available — that's fine
  }
  return 1
}

/**
 * Saves the current step to localStorage.
 *
 * @param step - The step number to persist.
 */
function saveProgress(step: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(step))
  } catch {
    // localStorage may not be available — that's fine
  }
}

/**
 * Clears persisted progress from localStorage.
 */
function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage may not be available — that's fine
  }
}

/**
 * Runs the setup function for the given step number.
 *
 * @param stepNumber - The 1-based step number.
 */
function runStepSetup(stepNumber: number): void {
  const step = GUIDED_STEPS.find((s) => s.id === stepNumber)
  if (step) {
    step.setupFn()
  }
}

// ── Public API ─────────────────────────────────────────────────────

/** The total number of guided steps. */
const totalSteps = TOTAL_GUIDED_STEPS

/** Computed config for the current step. */
const currentStepConfig: ComputedRef<GuidedStep> = computed(() => {
  const step = GUIDED_STEPS.find((s) => s.id === currentStep.value)
  return step ?? GUIDED_STEPS[0]
})

/**
 * Advances to the next guided step.
 * If already on the last step, marks the tutorial as complete.
 */
function nextStep(): void {
  if (currentStep.value < TOTAL_GUIDED_STEPS) {
    currentStep.value += 1
    saveProgress(currentStep.value)
    runStepSetup(currentStep.value)
  } else {
    isComplete.value = true
  }
}

/**
 * Goes back to the previous guided step.
 * Does nothing if already on step 1.
 */
function prevStep(): void {
  if (currentStep.value > 1) {
    currentStep.value -= 1
    saveProgress(currentStep.value)
    runStepSetup(currentStep.value)
  }
}

/**
 * Jumps directly to a specific step by number.
 * Runs the setup function for the target step.
 *
 * @param step - The 1-based step number to jump to.
 */
function goToStep(step: number): void {
  if (step < 1 || step > TOTAL_GUIDED_STEPS) return
  currentStep.value = step
  saveProgress(step)
  runStepSetup(step)
}

/**
 * Exits guided mode and switches to sandbox mode.
 * Clears persisted progress.
 */
function skipToSandbox(): void {
  isGuidedMode.value = false
  isComplete.value = false
  clearProgress()
}

/**
 * Enters guided mode starting from step 1 (or the last saved step).
 * Runs the setup function for the starting step.
 */
function startGuidedMode(): void {
  const savedStep = loadProgress()
  currentStep.value = savedStep
  isGuidedMode.value = true
  isComplete.value = false
  runStepSetup(currentStep.value)
}

/**
 * Resets guided mode to step 1 and clears all progress.
 */
function resetProgress(): void {
  currentStep.value = 1
  isComplete.value = false
  clearProgress()
}

// ── Composable export ──────────────────────────────────────────────

/**
 * Guided mode composable (singleton).
 *
 * Returns reactive state and methods for managing the guided
 * learning tutorial. Multiple callers receive the same shared state.
 *
 * @returns Guided mode API.
 */
export function useGuidedMode() {
  return {
    // Reactive state
    currentStep,
    isGuidedMode,
    isComplete,
    totalSteps,

    // Computed
    currentStepConfig,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Mode management
    skipToSandbox,
    startGuidedMode,
    resetProgress,
  }
}
