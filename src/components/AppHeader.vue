<script setup lang="ts">
/**
 * AppHeader — Top navigation bar for the application.
 *
 * Displays the app title, current mode indicator with toggle,
 * optional guided-mode progress, and a help button for the glossary.
 */
import { computed, ref } from 'vue'
import { SwitchRoot, SwitchThumb, PopoverRoot, PopoverTrigger, PopoverContent, PopoverPortal } from 'radix-vue'
import type { AppMode } from '../types/ui'
import AudioFileUpload from './AudioFileUpload.vue'
import MicrophoneButton from './MicrophoneButton.vue'
import ChallengeButton from './ChallengeButton.vue'
import { useAudioFilePlayer } from '../composables/useAudioFilePlayer'

/** Application version from build-time injection. */
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

/** Short git hash from build-time injection. */
const gitHash = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'local'

const audioPopoverOpen = ref(false)
const { audioBuffer } = useAudioFilePlayer()

/**
 * Handles a file loaded from the upload component.
 * Closes the popover so the FFT panel is visible during playback.
 */
function onFileLoaded(): void {
  audioPopoverOpen.value = false
}

const props = defineProps<{
  /** Current application mode. */
  mode: AppMode
  /** Current guided-mode step number (1-based). */
  guidedStep?: number
  /** Total number of guided-mode steps. */
  totalSteps?: number
}>()

const emit = defineEmits<{
  /** Emitted when the user toggles the mode switch. */
  'update:mode': [mode: AppMode]
  /** Emitted when the user clicks the help button. */
  'open-glossary': []
}>()

/** Whether guided mode is currently active. */
const isGuided = computed(() => props.mode === 'guided')

/** Label for the current mode. */
const modeLabel = computed(() => (isGuided.value ? 'Guided Mode' : 'Sandbox Mode'))

/** Whether to show the step progress indicator. */
const showProgress = computed(
  () => isGuided.value && props.guidedStep != null && props.totalSteps != null,
)

/** Formatted progress text, e.g. "Step 3 of 9". */
const progressText = computed(() => `Step ${props.guidedStep} of ${props.totalSteps}`)

/** Toggle between guided and sandbox mode. */
function handleModeToggle(checked: boolean): void {
  emit('update:mode', checked ? 'guided' : 'sandbox')
}

/** Emit event to open the glossary panel. */
function handleOpenGlossary(): void {
  emit('open-glossary')
}
</script>

<template>
  <header
    class="flex items-center justify-between bg-gray-800 px-5 py-3 shadow-md"
    role="banner"
  >
    <!-- App title + version -->
    <div class="flex items-baseline gap-2">
      <h1 class="text-lg font-bold tracking-tight text-white sm:text-xl">
        Fourier Explorer
      </h1>
      <span
        class="text-[10px] text-gray-500 select-all"
        :title="`Version ${appVersion} (${gitHash})`"
        data-testid="version-info"
      >
        v{{ appVersion }}/{{ gitHash }}
      </span>
    </div>

    <!-- Controls group -->
    <div class="flex items-center gap-4">
      <!-- Progress indicator (guided mode only) -->
      <span
        v-if="showProgress"
        class="rounded-full bg-purple-600/20 px-3 py-1 text-xs font-medium text-purple-300"
        data-testid="progress-indicator"
      >
        {{ progressText }}
      </span>

      <!-- Mode indicator & toggle -->
      <div class="flex items-center gap-2">
        <span
          class="text-sm font-medium"
          :class="isGuided ? 'text-green-400' : 'text-blue-400'"
          data-testid="mode-label"
        >
          {{ modeLabel }}
        </span>
        <SwitchRoot
          :checked="isGuided"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          :class="isGuided ? 'bg-green-500' : 'bg-gray-600'"
          aria-label="Toggle guided mode"
          data-testid="mode-toggle"
          @update:checked="handleModeToggle"
        >
          <SwitchThumb
            class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform"
            :class="isGuided ? 'translate-x-5' : 'translate-x-0'"
          />
        </SwitchRoot>
      </div>

      <!-- Challenges -->
      <ChallengeButton />

      <!-- Microphone toggle -->
      <MicrophoneButton />

      <!-- Audio menu popover -->
      <PopoverRoot v-model:open="audioPopoverOpen">
        <PopoverTrigger
          class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          :class="audioBuffer ? 'bg-green-700 text-green-200 hover:bg-green-600' : 'bg-gray-700 text-blue-300 hover:bg-gray-600 hover:text-blue-200'"
          data-testid="audio-menu-btn"
        >
          {{ audioBuffer ? 'Change Audio' : 'Load Audio' }}
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            class="w-96 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl"
            :side-offset="8"
            side="bottom"
            align="end"
            data-testid="audio-menu-popover"
          >
            <AudioFileUpload @file-loaded="onFileLoaded" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>

      <!-- Help / glossary button -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-blue-300 transition-colors hover:bg-gray-600 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label="Open glossary"
        data-testid="help-button"
        @click="handleOpenGlossary"
      >
        ?
      </button>
    </div>
  </header>
</template>
