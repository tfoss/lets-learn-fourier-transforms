<script setup lang="ts">
/**
 * AppLayout — Main application layout with two-panel grid.
 *
 * Provides a header at the top, a scrollable tracks panel on the left,
 * and a sticky FFT visualization panel on the right.
 */
import AppHeader from './AppHeader.vue'
import type { AppMode } from '../types/ui'

defineProps<{
  /** Current application mode passed through to AppHeader. */
  mode: AppMode
  /** Current guided step passed through to AppHeader. */
  guidedStep?: number
  /** Total guided steps passed through to AppHeader. */
  totalSteps?: number
}>()

const emit = defineEmits<{
  /** Forwarded from AppHeader when the mode toggle changes. */
  'update:mode': [mode: AppMode]
  /** Forwarded from AppHeader when the help button is clicked. */
  'open-glossary': []
}>()

/** Forward mode update from header. */
function handleModeUpdate(mode: AppMode): void {
  emit('update:mode', mode)
}

/** Forward glossary open from header. */
function handleOpenGlossary(): void {
  emit('open-glossary')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-900 text-white">
    <!-- Header -->
    <AppHeader
      :mode="mode"
      :guided-step="guidedStep"
      :total-steps="totalSteps"
      @update:mode="handleModeUpdate"
      @open-glossary="handleOpenGlossary"
    />

    <!-- Two-panel grid -->
    <div class="grid flex-1 grid-cols-[7fr_3fr]" data-testid="layout-grid">
      <!-- Left panel: wave tracks (scrollable) -->
      <main
        class="overflow-y-auto bg-gray-900"
        data-testid="tracks-panel"
      >
        <slot name="tracks" />
      </main>

      <!-- Right panel: FFT visualization (sticky) -->
      <aside
        class="sticky top-0 h-screen overflow-y-auto border-l border-gray-700 bg-gray-850"
        style="background-color: rgb(24 28 36)"
        data-testid="fft-panel"
      >
        <slot name="fft" />
      </aside>
    </div>
  </div>
</template>
