<script setup lang="ts">
/**
 * GuidedStepView — Displays the current guided learning step.
 *
 * Shows the step title, explanation text, navigation controls,
 * progress indicator, and the relevant interactive audio components
 * for the current step.
 */

import { computed } from 'vue'
import { useGuidedMode } from '../composables/useGuidedMode'
import MasterControls from './MasterControls.vue'
import TrackControlList from './TrackControlList.vue'
import TrackList from './TrackList.vue'
import AudioFilePanel from './AudioFilePanel.vue'
import { applyPreset, findPresetByName } from '../utils/presets'

const {
  currentStep,
  totalSteps,
  currentStepConfig,
  isComplete,
  nextStep,
  prevStep,
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

/** Whether to show track controls (steps 1-6). */
const showTrackControls = computed(() => currentStep.value <= 6)

/** Whether to show preset comparison buttons (step 7). */
const showPresetComparison = computed(() => currentStep.value === 7)

/** Whether to show the audio file panel (step 9). */
const showAudioFilePanel = computed(() => currentStep.value === 9)

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
  <div class="flex flex-col gap-6 p-4" data-testid="guided-step-view">
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
        <!-- Step dots -->
        <div class="flex justify-center gap-1.5">
          <span
            v-for="step in totalSteps"
            :key="step"
            class="h-2 w-2 rounded-full transition-colors"
            :class="step <= currentStep ? 'bg-purple-400' : 'bg-gray-600'"
            :data-testid="`step-dot-${step}`"
          />
        </div>
      </div>

      <!-- Step header -->
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

      <!-- Interactive area -->
      <div class="flex flex-col gap-4">
        <!-- Master playback controls (always shown) -->
        <MasterControls />

        <!-- Track controls (steps 1-6) -->
        <div v-if="showTrackControls" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrackControlList />
          <TrackList />
        </div>

        <!-- Preset comparison buttons (step 7) -->
        <div
          v-if="showPresetComparison"
          class="flex flex-col gap-3"
          data-testid="preset-comparison"
        >
          <p class="text-sm font-medium text-gray-400">
            Compare instrument timbres:
          </p>
          <div class="flex gap-3">
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
          <!-- Show the resulting tracks -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrackControlList />
            <TrackList />
          </div>
        </div>

        <!-- Audio file panel (step 9) -->
        <AudioFilePanel v-if="showAudioFilePanel" />
      </div>

      <!-- Navigation buttons -->
      <div
        class="flex items-center justify-between border-t border-gray-700 pt-4"
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
