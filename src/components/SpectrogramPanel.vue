<script setup lang="ts">
/**
 * SpectrogramPanel — panel wrapper for the spectrogram visualization.
 *
 * Provides title, description, colormap toggle buttons, and contains
 * the SpectrogramView component.
 */

import { useSpectrogram } from '../composables/useSpectrogram'
import SpectrogramView from './SpectrogramView.vue'

const { colorMapName } = useSpectrogram()

/**
 * Sets the active colormap.
 *
 * @param name - The colormap to activate.
 */
function setColorMap(name: 'viridis' | 'hot'): void {
  colorMapName.value = name
}
</script>

<template>
  <div
    class="spectrogram-panel flex flex-col bg-gray-900 text-gray-200"
    data-testid="spectrogram-panel"
  >
    <!-- Title -->
    <div class="px-4 py-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold text-gray-100">
        Spectrogram
      </h2>
      <p class="text-xs text-gray-400 mt-1">
        This heatmap shows frequency content over time. Bright colors = louder frequencies.
      </p>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
      <span class="text-xs text-gray-400">Colormap:</span>
      <button
        class="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        :class="{ 'bg-blue-600 hover:bg-blue-500': colorMapName === 'viridis' }"
        data-testid="colormap-viridis"
        @click="setColorMap('viridis')"
      >
        Viridis
      </button>
      <button
        class="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        :class="{ 'bg-blue-600 hover:bg-blue-500': colorMapName === 'hot' }"
        data-testid="colormap-hot"
        @click="setColorMap('hot')"
      >
        Hot
      </button>
    </div>

    <!-- Spectrogram view -->
    <div class="px-2 py-2">
      <SpectrogramView />
    </div>
  </div>
</template>
