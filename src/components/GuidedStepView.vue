<script setup lang="ts">
/**
 * GuidedStepView — Tutorial overlay for the guided learning mode.
 *
 * Displays progress, step explanation, and navigation controls.
 * Does NOT render track/audio components — those are shared with
 * sandbox mode via GuidedModeWrapper.
 */

import { computed } from 'vue'
import { useGuidedMode } from '../composables/useGuidedMode'
import { GUIDED_STEPS } from '../utils/guided-steps'
import { applyPreset, findPresetByName } from '../utils/presets'

const {
  currentStep,
  totalSteps,
  currentStepConfig,
  isComplete,
  nextStep,
  prevStep,
  goToStep,
  skipToSandbox,
} = useGuidedMode()

/** Whether the user is on the first step. */
const isFirstStep = computed(() => currentStep.value === 1)

/** Whether the user is on the last step. */
const isLastStep = computed(() => currentStep.value === totalSteps)

/** Progress percentage for the progress bar. */
const progressPercent = computed(() =>
  Math.round((currentStep.value / totalSteps) * 100),
)

/** Whether to show preset comparison buttons (step 7). */
const showPresetComparison = computed(() => currentStep.value === 7)

/**
 * Switches to a named preset for comparison in step 7.
 *
 * @param presetName - The name of the preset to apply.
 */
function switchPreset(presetName: string): void {
  const preset = findPresetByName(presetName)
  if (preset) {
    applyPreset(preset)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="guided-step-view">
    <!-- Completion message -->
    <div
      v-if="isComplete"
      class="rounded-xl border border-green-600/30 bg-green-900/20 p-6 text-center"
      data-testid="guided-complete"
    >
      <h2 class="mb-2 text-2xl font-bold text-green-300">
        Tutorial Complete!
      </h2>
      <p class="mb-4 text-gray-300">
        You've learned the basics of sound waves and Fourier transforms.
        Now explore freely in Sandbox mode!
      </p>
      <button
        class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        data-testid="enter-sandbox-btn"
        @click="skipToSandbox"
      >
        Enter Sandbox Mode
      </button>
    </div>

    <!-- Active step content -->
    <template v-else>
      <!-- Progress bar -->
      <div class="flex flex-col gap-2" data-testid="guided-progress">
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>Step {{ currentStep }} of {{ totalSteps }}</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            class="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
            data-testid="progress-bar-fill"
          />
        </div>
        <!-- Step dots (clickable) -->
        <div class="flex justify-center gap-2">
          <button
            v-for="step in totalSteps"
            :key="step"
            class="h-3 w-3 rounded-full transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-purple-300/50"
            :class="[
              step === currentStep
                ? 'bg-purple-400 ring-2 ring-purple-300'
                : step < currentStep
                  ? 'bg-purple-400/60 hover:bg-purple-300'
                  : 'bg-gray-600 hover:bg-gray-400',
            ]"
            :data-testid="`step-dot-${step}`"
            :title="`Step ${step}: ${GUIDED_STEPS[step - 1]?.title ?? ''}`"
            @click="goToStep(step)"
          />
        </div>
      </div>

      <!-- Step explanation -->
      <div
        class="rounded-xl border border-purple-600/30 bg-purple-900/10 p-5"
        data-testid="step-content"
      >
        <h2 class="mb-3 text-xl font-bold text-white" data-testid="step-title">
          {{ currentStepConfig.title }}
        </h2>
        <p
          class="text-base leading-relaxed text-gray-300"
          data-testid="step-explanation"
        >
          {{ currentStepConfig.explanation }}
        </p>
      </div>

      <!-- Preset comparison buttons (step 7 only) -->
      <div
        v-if="showPresetComparison"
        class="flex items-center gap-3"
        data-testid="preset-comparison"
      >
        <span class="text-sm font-medium text-gray-400">Compare:</span>
        <button
          class="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          data-testid="preset-piano-btn"
          @click="switchPreset('Piano A4')"
        >
          Piano A4
        </button>
        <button
          class="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          data-testid="preset-violin-btn"
          @click="switchPreset('Violin A4')"
        >
          Violin A4
        </button>
      </div>

      <!-- Navigation buttons -->
      <div
        class="flex items-center justify-between"
        data-testid="step-navigation"
      >
        <button
          v-if="!isFirstStep"
          class="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-600"
          data-testid="prev-step-btn"
          @click="prevStep"
        >
          Back
        </button>
        <span v-else />

        <button
          class="text-xs text-gray-500 underline transition-colors hover:text-gray-300"
          data-testid="skip-tutorial-btn"
          @click="skipToSandbox"
        >
          Skip Tutorial
        </button>

        <button
          class="rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors"
          :class="isLastStep
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-blue-600 hover:bg-blue-500'"
          data-testid="next-step-btn"
          @click="nextStep"
        >
          {{ isLastStep ? 'Finish' : 'Next' }}
        </button>
      </div>
    </template>
  </div>
</template>
