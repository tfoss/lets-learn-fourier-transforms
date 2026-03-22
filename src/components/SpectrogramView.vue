<script setup lang="ts">
/**
 * SpectrogramView — scrolling 2D time-frequency heatmap canvas.
 *
 * Displays frequency content over time as a color-coded heatmap.
 * Low frequencies at the bottom, high frequencies at the top.
 * Automatically scrolls left as new data arrives during playback.
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSpectrogram } from '../composables/useSpectrogram'

// ── Props ──────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Canvas height in pixels. */
    height?: number
    /** Minimum displayed frequency in Hz. */
    minFrequency?: number
    /** Maximum displayed frequency in Hz. */
    maxFrequency?: number
  }>(),
  {
    height: 200,
    minFrequency: 20,
    maxFrequency: 4000,
  },
)

// ── Refs ───────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// ── Engine state ──────────────────────────────────────────────────

const {
  isSpectrogramActive,
  colorMapName,
  startCapture,
  stopCapture,
  clearSpectrogram,
} = useSpectrogram()

// ── Frequency labels ──────────────────────────────────────────────

/** Key frequencies to label on the Y-axis. */
const frequencyLabels = [100, 500, 1000, 2000, 4000]

/**
 * Computes the Y position for a frequency label as a CSS percentage
 * from the bottom of the canvas.
 *
 * @param freq - The frequency in Hz.
 * @returns Percentage string for bottom positioning.
 */
function labelBottomPercent(freq: number): string {
  const logMin = Math.log10(props.minFrequency)
  const logMax = Math.log10(props.maxFrequency)
  const logFreq = Math.log10(freq)
  const normalized = (logFreq - logMin) / (logMax - logMin)
  const clamped = Math.max(0, Math.min(1, normalized))
  return `${clamped * 100}%`
}

/**
 * Formats a frequency value for display.
 *
 * @param freq - The frequency in Hz.
 * @returns Formatted string (e.g., "1k" or "100").
 */
function formatFreq(freq: number): string {
  if (freq >= 1000) {
    return `${freq / 1000}k`
  }
  return `${freq}`
}

// ── Canvas sizing ─────────────────────────────────────────────────

/**
 * Sets the canvas internal dimensions to match its container.
 */
function resizeCanvas(): void {
  if (!canvasRef.value || !containerRef.value) return
  canvasRef.value.width = containerRef.value.clientWidth
  canvasRef.value.height = props.height
}

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(() => {
  resizeCanvas()
  startCapture(canvasRef, props.minFrequency, props.maxFrequency)
})

onUnmounted(() => {
  stopCapture()
})

// Watch for playback state changes — spectrogram keeps running
// but only draws new data when audio is playing (handled in composable)

// Re-start capture when colormap changes (to pick up the new colormap)
watch(colorMapName, () => {
  if (isSpectrogramActive.value) {
    stopCapture()
    startCapture(canvasRef, props.minFrequency, props.maxFrequency)
  }
})

/**
 * Handles the clear button click.
 */
function handleClear(): void {
  clearSpectrogram(canvasRef)
}
</script>

<template>
  <div
    data-testid="spectrogram-view"
    class="relative rounded-lg bg-gray-950 overflow-hidden"
  >
    <!-- Y-axis frequency labels -->
    <div class="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none">
      <div
        v-for="freq in frequencyLabels"
        :key="freq"
        class="absolute left-0 text-[9px] text-gray-500 leading-none"
        :style="{ bottom: labelBottomPercent(freq) }"
      >
        {{ formatFreq(freq) }}
      </div>
    </div>

    <!-- Canvas container -->
    <div ref="containerRef" class="ml-8">
      <canvas
        ref="canvasRef"
        :height="height"
        class="block w-full"
        data-testid="spectrogram-canvas"
      />
    </div>

    <!-- Clear button -->
    <button
      class="absolute top-1 right-1 px-2 py-0.5 text-[10px] rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors z-10"
      data-testid="spectrogram-clear"
      @click="handleClear"
    >
      Clear
    </button>
  </div>
</template>
