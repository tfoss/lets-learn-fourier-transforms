<script setup lang="ts">
/**
 * Root application component.
 *
 * Wires together the layout, track controls, waveform visualization,
 * and FFT panel. Creates a default track on first load so the app
 * is not empty.
 */

import { ref, onMounted } from 'vue'
import AppLayout from './components/AppLayout.vue'
import ConceptGlossary from './components/ConceptGlossary.vue'
import MasterControls from './components/MasterControls.vue'
import TrackControlList from './components/TrackControlList.vue'
import TrackList from './components/TrackList.vue'
import FFTPanel from './components/FFTPanel.vue'
import type { AppMode } from './types/ui'
import { useAudioEngine } from './composables/useAudioEngine'

const mode = ref<AppMode>('sandbox')
const glossaryOpen = ref(false)

const { tracks, createTrack } = useAudioEngine()

/**
 * Creates a default 440 Hz sine track if no tracks exist on mount.
 */
onMounted(() => {
  if (tracks.value.length === 0) {
    createTrack({ frequency: 440, amplitude: 0.5, waveformType: 'sine' })
  }
})
</script>

<template>
  <AppLayout :mode="mode" @update:mode="mode = $event" @open-glossary="glossaryOpen = true">
    <template #tracks>
      <div class="flex flex-col gap-4 p-4">
        <MasterControls />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrackControlList />
          <TrackList />
        </div>
      </div>
    </template>
    <template #fft>
      <FFTPanel />
    </template>
  </AppLayout>
  <ConceptGlossary v-model:open="glossaryOpen" />
</template>
