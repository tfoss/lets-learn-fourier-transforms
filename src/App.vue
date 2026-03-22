<script setup lang="ts">
/**
 * Root application component.
 *
 * Wires together the layout, guided/sandbox mode wrapper,
 * and FFT panel. Manages mode switching between guided tutorial
 * and sandbox exploration.
 */

import { ref, watch, onMounted } from 'vue'
import AppLayout from './components/AppLayout.vue'
import ConceptGlossary from './components/ConceptGlossary.vue'
import GuidedModeWrapper from './components/GuidedModeWrapper.vue'
import FFTPanel from './components/FFTPanel.vue'
import type { AppMode } from './types/ui'
import { useAudioEngine } from './composables/useAudioEngine'
import { useGuidedMode } from './composables/useGuidedMode'

const mode = ref<AppMode>('sandbox')
const glossaryOpen = ref(false)

const { tracks, createTrack } = useAudioEngine()
const { currentStep, totalSteps, startGuidedMode, skipToSandbox } = useGuidedMode()

/**
 * Creates a default 440 Hz sine track if no tracks exist on mount
 * and we are in sandbox mode.
 */
onMounted(() => {
  if (mode.value === 'sandbox' && tracks.value.length === 0) {
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
    <template #tracks>
      <GuidedModeWrapper :mode="mode" />
    </template>
    <template #fft>
      <FFTPanel />
    </template>
  </AppLayout>
  <ConceptGlossary v-model:open="glossaryOpen" />
</template>
