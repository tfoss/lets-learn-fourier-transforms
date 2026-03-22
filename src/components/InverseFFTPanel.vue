<script setup lang="ts">
/**
 * Panel wrapper for the inverse FFT draw-to-sound feature.
 *
 * Provides a title, explanation text, and contains the
 * InverseFFTDrawer component for interactive frequency drawing.
 */

import InverseFFTDrawer from './InverseFFTDrawer.vue'
</script>

<template>
  <div class="inverse-fft-panel flex flex-col bg-gray-900 text-gray-200">
    <!-- Title -->
    <div class="px-4 py-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold text-gray-100">
        Draw Frequencies → Hear Sound
      </h2>
    </div>

    <!-- Explanation -->
    <div class="px-4 py-2 border-b border-gray-700">
      <p class="text-xs text-gray-400">
        Click on the chart to place frequency peaks, then press Play to hear
        what those frequencies sound like combined!
      </p>
    </div>

    <!-- Drawer -->
    <div class="px-2 py-2">
      <InverseFFTDrawer />
    </div>
  </div>
</template>
