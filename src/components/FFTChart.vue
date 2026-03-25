<script setup lang="ts">
/**
 * FFT frequency-domain visualization component.
 *
 * Renders FFT data from the audio engine as a bar chart on a canvas.
 * Supports logarithmic/linear scale, peak detection with note labels,
 * and interactive hover/click on peaks.
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { TrackId } from '../types/audio'
import type { Peak } from '../types/fft'
import { useAudioEngine } from '../composables/useAudioEngine'
import { useAudioFilePlayer } from '../composables/useAudioFilePlayer'
import { useMicrophone } from '../composables/useMicrophone'
import { useFFTRenderer } from '../composables/useFFTRenderer'
import { findPeaks } from '../utils/fft-analysis'
import { frequencyToX } from '../composables/useFFTRenderer'
import { MIN_FREQUENCY, MAX_FREQUENCY } from '../utils/audio-math'

// ── Props ─────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Canvas height in pixels. */
    height?: number
    /** Whether to use logarithmic frequency scale. */
    useLogScale?: boolean
    /** Whether to overlay peak labels. */
    showPeaks?: boolean
    /** Whether to show musical note names on the x-axis. */
    showNoteLabels?: boolean
    /** Track ID to highlight (matched peaks use track color). */
    highlightTrackId?: TrackId | null
  }>(),
  {
    height: 400,
    useLogScale: true,
    showPeaks: true,
    showNoteLabels: true,
    highlightTrackId: null,
  },
)

// ── Emits ─────────────────────────────────────────────────────────

const emit = defineEmits<{
  'peak-hover': [peak: Peak | null]
  'peak-click': [peak: Peak]
}>()

// ── Audio engine ──────────────────────────────────────────────────

const { tracks, isPlaying, getFFTData } = useAudioEngine()
const { isPlaying: isFilePlayerPlaying } = useAudioFilePlayer()
const { isListening: isMicListening } = useMicrophone()

/** Whether any audio source is active (engine tracks, file player, or mic). */
const isAnyPlaying = computed(() => isPlaying.value || isFilePlayerPlaying.value || isMicListening.value)

// ── Canvas and renderer ───────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)

const drawOptions = computed(() => ({
  color: '#3b82f6',
  barWidth: 2,
  useLogScale: props.useLogScale,
  minFrequency: MIN_FREQUENCY,
  maxFrequency: MAX_FREQUENCY,
  showGrid: true,
  gridColor: '#374151',
  labelColor: '#9ca3af',
}))

const { drawFFT, updateOptions } =
  useFFTRenderer(canvasRef, drawOptions.value)

// ── Peak state ────────────────────────────────────────────────────

const detectedPeaks = ref<Peak[]>([])
const hoveredPeak = ref<Peak | null>(null)

// ── Musical note markers for x-axis ──────────────────────────────

/** Combined note + frequency markers for the x-axis. */
const NOTE_MARKERS = [
  { note: 'C2', frequency: 65.41, label: '65' },
  { note: 'C3', frequency: 130.81, label: '131' },
  { note: 'C4', frequency: 261.63, label: '262' },
  { note: 'A4', frequency: 440, label: '440' },
  { note: 'C5', frequency: 523.25, label: '523' },
  { note: 'C6', frequency: 1046.5, label: '1k' },
  { note: 'C7', frequency: 2093, label: '2.1k' },
]

/** Frequency tolerance for matching a peak to a track (in Hz). */
const FREQUENCY_MATCH_TOLERANCE = 5

// ── Peak-to-track color matching ──────────────────────────────────

/**
 * Returns the track color if a peak frequency matches a track, otherwise the default color.
 *
 * @param peakFrequency - The frequency of the detected peak.
 * @returns CSS color string.
 */
function getColorForPeakFrequency(peakFrequency: number): string {
  for (const track of tracks.value) {
    if (Math.abs(track.frequency - peakFrequency) <= FREQUENCY_MATCH_TOLERANCE) {
      return track.color
    }
  }
  return '#3b82f6'
}

// ── Rendering loop ────────────────────────────────────────────────

let rafId: number | null = null

/**
 * Runs one frame of FFT rendering and peak detection.
 */
function renderFrame(): void {
  const fftData = getFFTData()
  drawFFT(
    fftData.frequencyData,
    fftData.sampleRate,
    fftData.fftSize,
    drawOptions.value,
  )

  if (props.showPeaks) {
    detectedPeaks.value = findPeaks(
      fftData.frequencyData,
      fftData.sampleRate,
      fftData.fftSize,
    )
  } else {
    detectedPeaks.value = []
  }

  if (isAnyPlaying.value) {
    rafId = requestAnimationFrame(renderFrame)
  }
}

/**
 * Starts the animation loop if any audio is playing.
 */
function startRendering(): void {
  stopRendering()
  if (isAnyPlaying.value) {
    renderFrame()
  }
}

/**
 * Stops the animation loop.
 */
function stopRendering(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// ── Watch play state ──────────────────────────────────────────────

watch(isAnyPlaying, (playing) => {
  if (playing) {
    startRendering()
  } else {
    stopRendering()
    // Render one static frame
    renderFrame()
  }
})

// ── Watch options changes ─────────────────────────────────────────

watch(drawOptions, (newOpts) => {
  updateOptions(newOpts)
  if (!isPlaying.value) {
    renderFrame()
  }
})

// ── Mouse interaction ─────────────────────────────────────────────

/**
 * Finds the peak closest to a given x-pixel coordinate.
 *
 * @param clientX - Mouse x position relative to the canvas.
 * @returns The closest peak within tolerance, or null.
 */
function findPeakAtX(clientX: number): Peak | null {
  const canvas = canvasRef.value
  if (!canvas || detectedPeaks.value.length === 0) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const width = rect.width

  let closest: Peak | null = null
  let closestDist = Infinity

  for (const peak of detectedPeaks.value) {
    const peakX = frequencyToX(
      peak.frequency,
      width,
      drawOptions.value.minFrequency,
      drawOptions.value.maxFrequency,
      drawOptions.value.useLogScale,
    )

    const dist = Math.abs(x - peakX)
    if (dist < closestDist && dist < 20) {
      closestDist = dist
      closest = peak
    }
  }

  return closest
}

/**
 * Handles mouse move over the canvas for peak hover detection.
 *
 * @param event - The mouse event.
 */
function onMouseMove(event: MouseEvent): void {
  const peak = findPeakAtX(event.clientX)
  hoveredPeak.value = peak
  emit('peak-hover', peak)
}

/**
 * Handles mouse leave from the canvas.
 */
function onMouseLeave(): void {
  hoveredPeak.value = null
  emit('peak-hover', null)
}

/**
 * Handles click on the canvas for peak selection.
 *
 * @param event - The mouse event.
 */
function onClick(event: MouseEvent): void {
  const peak = findPeakAtX(event.clientX)
  if (peak) {
    emit('peak-click', peak)
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(() => {
  // Render initial static frame
  renderFrame()
})

onUnmounted(() => {
  stopRendering()
})
</script>

<template>
  <div class="fft-chart relative bg-gray-800 rounded-lg overflow-hidden">
    <canvas
      ref="canvasRef"
      :style="{ width: '100%', height: `${height}px` }"
      class="block w-full"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click="onClick"
    />

    <!-- Peak labels overlay -->
    <template v-if="showPeaks">
      <div
        v-for="peak in detectedPeaks.slice(0, 8)"
        :key="peak.binIndex"
        class="absolute text-xs pointer-events-none whitespace-nowrap"
        :style="{
          left: `${frequencyToX(peak.frequency, canvasRef?.getBoundingClientRect()?.width ?? 0, drawOptions.minFrequency, drawOptions.maxFrequency, drawOptions.useLogScale)}px`,
          top: '8px',
          color: getColorForPeakFrequency(peak.frequency),
          transform: 'translateX(-50%)',
        }"
      >
        {{ Math.round(peak.frequency) }}Hz - {{ peak.noteName }}
      </div>
    </template>

    <!-- Note + frequency labels on x-axis -->
    <template v-if="showNoteLabels">
      <div
        v-for="marker in NOTE_MARKERS"
        :key="marker.note"
        class="absolute pointer-events-none text-center leading-tight"
        :style="{
          left: `${frequencyToX(marker.frequency, canvasRef?.getBoundingClientRect()?.width ?? 0, drawOptions.minFrequency, drawOptions.maxFrequency, drawOptions.useLogScale)}px`,
          bottom: '2px',
          transform: 'translateX(-50%)',
        }"
      >
        <div class="text-[10px] text-gray-300 font-medium">{{ marker.note }}</div>
        <div class="text-[9px] text-gray-500">{{ marker.label }}</div>
      </div>
    </template>
  </div>
</template>
