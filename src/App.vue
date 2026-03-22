<script setup lang="ts">
/**
 * Root application component.
 *
 * Wires together the layout, guided/sandbox mode wrapper,
 * and FFT panel. Manages mode switching between guided tutorial
 * and sandbox exploration.
 */

import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from './components/AppLayout.vue'
import ConceptGlossary from './components/ConceptGlossary.vue'
import GuidedModeWrapper from './components/GuidedModeWrapper.vue'
import FFTPanel from './components/FFTPanel.vue'
import type { AppMode } from './types/ui'
import { useAudioEngine } from './composables/useAudioEngine'
import { useAudioFilePlayer } from './composables/useAudioFilePlayer'
import { useGuidedMode } from './composables/useGuidedMode'
import { useShareUrl } from './composables/useShareUrl'
import { formatTime } from './utils/time-format'

const {
  audioBuffer,
  isPlaying: fileIsPlaying,
  currentTime: fileCurrentTime,
  duration: fileDuration,
  playAudioBuffer,
  pause: filePause,
  resume: fileResume,
  stop: fileStop,
  seek: fileSeek,
} = useAudioFilePlayer()

const fileProgressPercent = computed(() => {
  if (fileDuration.value <= 0) return 0
  return Math.max(0, Math.min(100, (fileCurrentTime.value / fileDuration.value) * 100))
})

function toggleFilePlayback(): void {
  if (!audioBuffer.value) return
  if (fileIsPlaying.value) {
    filePause()
  } else {
    if (fileCurrentTime.value >= fileDuration.value) {
      fileSeek(0)
    }
    fileResume()
    if (!fileIsPlaying.value) {
      playAudioBuffer(audioBuffer.value)
    }
  }
}

function handleFileSeek(event: MouseEvent): void {
  const bar = event.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  fileSeek(percent * fileDuration.value)
}

const mode = ref<AppMode>('sandbox')
const glossaryOpen = ref(false)

const { tracks, createTrack } = useAudioEngine()
const { currentStep, totalSteps, startGuidedMode, skipToSandbox } = useGuidedMode()
const { loadFromUrl } = useShareUrl()

/**
 * On mount, first attempts to restore track configuration from the URL hash.
 * If no URL config is present, creates a default 440 Hz sine track
 * when in sandbox mode with no existing tracks.
 */
onMounted(() => {
  const loadedFromUrl = loadFromUrl()
  if (!loadedFromUrl && mode.value === 'sandbox' && tracks.value.length === 0) {
    createTrack({ frequency: 440, amplitude: 0.5, waveformType: 'sine' })
  }
})

/**
 * Handles mode changes: starts guided mode or exits to sandbox.
 *
 * @param newMode - The new application mode.
 */
function handleModeChange(newMode: AppMode): void {
  mode.value = newMode
  if (newMode === 'guided') {
    startGuidedMode()
  } else {
    skipToSandbox()
  }
}

/**
 * Watches for guided mode exit (e.g., from completing the tutorial).
 * Syncs the mode ref when the composable exits guided mode.
 */
watch(
  () => useGuidedMode().isGuidedMode.value,
  (isGuided) => {
    if (!isGuided && mode.value === 'guided') {
      mode.value = 'sandbox'
      if (tracks.value.length === 0) {
        createTrack({ frequency: 440, amplitude: 0.5, waveformType: 'sine' })
      }
    }
  },
)
</script>

<template>
  <AppLayout
    :mode="mode"
    :guided-step="mode === 'guided' ? currentStep : undefined"
    :total-steps="mode === 'guided' ? totalSteps : undefined"
    @update:mode="handleModeChange"
    @open-glossary="glossaryOpen = true"
  >
    <template v-if="audioBuffer" #bar>
      <div class="flex items-center gap-3 border-b border-gray-700 bg-gray-800/80 px-5 py-1.5">
        <!-- Play/Pause -->
        <button
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500"
          :aria-label="fileIsPlaying ? 'Pause' : 'Play'"
          @click="toggleFilePlayback"
        >
          <svg v-if="fileIsPlaying" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <svg v-else class="ml-0.5 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>
        <!-- Stop -->
        <button
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
          aria-label="Stop"
          @click="fileStop"
        >
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
        <!-- Time -->
        <span class="shrink-0 text-xs text-gray-400">{{ formatTime(fileCurrentTime) }}</span>
        <!-- Seek bar -->
        <div
          class="relative h-1.5 flex-1 cursor-pointer rounded-full bg-gray-700"
          @click="handleFileSeek"
        >
          <div
            class="h-full rounded-full bg-blue-500"
            :style="{ width: `${fileProgressPercent}%` }"
          />
        </div>
        <!-- Duration -->
        <span class="shrink-0 text-xs text-gray-400">{{ formatTime(fileDuration) }}</span>
      </div>
    </template>
    <template #tracks>
      <GuidedModeWrapper :mode="mode" />
    </template>
    <template #fft>
      <FFTPanel />
    </template>
  </AppLayout>
  <ConceptGlossary v-model:open="glossaryOpen" />
</template>
