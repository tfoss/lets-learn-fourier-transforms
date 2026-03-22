<script setup lang="ts">
/**
 * Interactive canvas for drawing frequency peaks.
 *
 * Users click to place frequency peaks on a frequency vs magnitude chart.
 * Clicking near an existing peak removes it. The resulting waveform
 * is displayed as a preview and can be played back.
 */

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useInverseFFT } from '../composables/useInverseFFT'
import { MIN_FREQUENCY, MAX_FREQUENCY } from '../utils/audio-math'

// ── Constants ──────────────────────────────────────────────────────

/** Minimum displayed frequency in Hz. */
const DISPLAY_MIN_FREQ = MIN_FREQUENCY

/** Maximum displayed frequency in Hz. */
const DISPLAY_MAX_FREQ = MAX_FREQUENCY

/** Radius of drawn peak dots in pixels. */
const PEAK_DOT_RADIUS = 6

/** Color for drawn peak dots. */
const PEAK_COLOR = '#f59e0b'

/** Color for the waveform preview line. */
const WAVEFORM_COLOR = '#3b82f6'

/** Height of the waveform preview area in pixels. */
const WAVEFORM_PREVIEW_HEIGHT = 80

// ── Composable ─────────────────────────────────────────────────────

const {
  drawnPeaks,
  isPlaying,
  generatedWaveform,
  addPeak,
  removePeak,
  findClosestPeakIndex,
  clearPeaks,
  playDrawnSound,
  stopDrawnSound,
} = useInverseFFT()

// ── Canvas refs ────────────────────────────────────────────────────

const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const waveformCanvasRef = ref<HTMLCanvasElement | null>(null)

// ── Coordinate conversion ──────────────────────────────────────────

/**
 * Converts a canvas x coordinate to frequency using log scale.
 *
 * @param x - X coordinate in pixels.
 * @param width - Canvas width in pixels.
 * @returns Frequency in Hz.
 */
function xToFrequency(x: number, width: number): number {
  const logMin = Math.log10(Math.max(1, DISPLAY_MIN_FREQ))
  const logMax = Math.log10(DISPLAY_MAX_FREQ)
  const logFreq = logMin + (x / width) * (logMax - logMin)
  return Math.pow(10, logFreq)
}

/**
 * Converts a frequency to canvas x coordinate using log scale.
 *
 * @param frequency - Frequency in Hz.
 * @param width - Canvas width in pixels.
 * @returns X coordinate in pixels.
 */
function frequencyToX(frequency: number, width: number): number {
  const logMin = Math.log10(Math.max(1, DISPLAY_MIN_FREQ))
  const logMax = Math.log10(DISPLAY_MAX_FREQ)
  const logFreq = Math.log10(Math.max(1, frequency))
  return ((logFreq - logMin) / (logMax - logMin)) * width
}

/**
 * Converts a canvas y coordinate to magnitude (0-1).
 *
 * @param y - Y coordinate in pixels.
 * @param height - Canvas height in pixels.
 * @returns Magnitude in [0, 1].
 */
function yToMagnitude(y: number, height: number): number {
  return 1 - y / height
}

/**
 * Converts a magnitude to canvas y coordinate.
 *
 * @param magnitude - Magnitude in [0, 1].
 * @param height - Canvas height in pixels.
 * @returns Y coordinate in pixels.
 */
function magnitudeToY(magnitude: number, height: number): number {
  return (1 - magnitude) * height
}

// ── Drawing ───────────────────────────────────────────────────────

/**
 * Draws the frequency grid, labels, and peak dots on the draw canvas.
 */
function renderDrawCanvas(): void {
  const canvas = drawCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const width = rect.width
  const height = rect.height

  // Clear
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(0, 0, width, height)

  drawFrequencyGrid(ctx, width, height)
  drawMagnitudeGrid(ctx, width, height)
  drawPeakDots(ctx, width, height)
}

/**
 * Draws vertical gridlines at standard frequencies.
 *
 * @param ctx - Canvas 2D context.
 * @param width - Canvas width.
 * @param height - Canvas height.
 */
function drawFrequencyGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gridFreqs = [50, 100, 200, 440, 500, 1000, 2000, 4000]

  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.fillStyle = '#9ca3af'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'

  for (const freq of gridFreqs) {
    const x = frequencyToX(freq, width)
    if (x < 0 || x > width) continue

    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`
    ctx.fillText(label, x, height - 4)
  }
}

/**
 * Draws horizontal gridlines for magnitude levels.
 *
 * @param ctx - Canvas 2D context.
 * @param width - Canvas width.
 * @param height - Canvas height.
 */
function drawMagnitudeGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.fillStyle = '#9ca3af'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'

  for (let mag = 0.25; mag <= 1; mag += 0.25) {
    const y = magnitudeToY(mag, height)

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()

    ctx.fillText(`${(mag * 100).toFixed(0)}%`, 4, y - 4)
  }
}

/**
 * Draws peak dots at the positions of drawn peaks.
 *
 * @param ctx - Canvas 2D context.
 * @param width - Canvas width.
 * @param height - Canvas height.
 */
function drawPeakDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = PEAK_COLOR

  for (const peak of drawnPeaks.value) {
    const x = frequencyToX(peak.frequency, width)
    const y = magnitudeToY(peak.magnitude, height)

    ctx.beginPath()
    ctx.arc(x, y, PEAK_DOT_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Draw vertical bar from bottom to peak
    ctx.strokeStyle = PEAK_COLOR
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(x, height)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalAlpha = 1.0
  }
}

/**
 * Draws the generated waveform as a preview on the waveform canvas.
 */
function renderWaveformPreview(): void {
  const canvas = waveformCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const width = rect.width
  const height = rect.height

  // Clear
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, width, height)

  const waveform = generatedWaveform.value
  if (waveform.length === 0) {
    drawEmptyWaveformText(ctx, width, height)
    return
  }

  drawWaveformLine(ctx, waveform, width, height)
}

/**
 * Draws placeholder text when no waveform exists.
 *
 * @param ctx - Canvas 2D context.
 * @param width - Canvas width.
 * @param height - Canvas height.
 */
function drawEmptyWaveformText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Waveform preview will appear here', width / 2, height / 2)
}

/**
 * Draws the waveform as a line on the canvas.
 *
 * @param ctx - Canvas 2D context.
 * @param waveform - Time-domain samples.
 * @param width - Canvas width.
 * @param height - Canvas height.
 */
function drawWaveformLine(
  ctx: CanvasRenderingContext2D,
  waveform: Float32Array,
  width: number,
  height: number,
): void {
  // Show first ~500 samples for preview
  const samplesToShow = Math.min(500, waveform.length)
  const step = samplesToShow / width

  // Find max amplitude for normalization
  let maxAmp = 0
  for (let i = 0; i < samplesToShow; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(waveform[i]))
  }
  if (maxAmp === 0) maxAmp = 1

  const centerY = height / 2

  ctx.strokeStyle = WAVEFORM_COLOR
  ctx.lineWidth = 1.5
  ctx.beginPath()

  for (let x = 0; x < width; x++) {
    const sampleIndex = Math.floor(x * step)
    const sample = sampleIndex < waveform.length ? waveform[sampleIndex] : 0
    const y = centerY - (sample / maxAmp) * (height / 2) * 0.9

    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()
}

// ── Event handlers ─────────────────────────────────────────────────

/**
 * Handles click on the draw canvas to add or remove a peak.
 *
 * @param event - The mouse event.
 */
function onCanvasClick(event: MouseEvent): void {
  const canvas = drawCanvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const frequency = xToFrequency(x, rect.width)
  const magnitude = yToMagnitude(y, rect.height)

  // Check if clicking near an existing peak to remove it
  const existingIndex = findClosestPeakIndex(frequency)

  if (existingIndex >= 0) {
    removePeak(existingIndex)
  } else {
    addPeak(frequency, magnitude)
  }
}

/**
 * Toggles playback on/off.
 */
function togglePlay(): void {
  if (isPlaying.value) {
    stopDrawnSound()
  } else {
    playDrawnSound()
  }
}

// ── Watchers ──────────────────────────────────────────────────────

watch(drawnPeaks, () => {
  renderDrawCanvas()
  renderWaveformPreview()
}, { deep: true })

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(() => {
  renderDrawCanvas()
  renderWaveformPreview()
})

onUnmounted(() => {
  stopDrawnSound()
})
</script>

<template>
  <div class="inverse-fft-drawer flex flex-col gap-2">
    <!-- Draw canvas -->
    <div class="relative bg-gray-800 rounded-lg overflow-hidden">
      <canvas
        ref="drawCanvasRef"
        :style="{ width: '100%', height: '200px' }"
        class="block w-full cursor-crosshair"
        @click="onCanvasClick"
      />
    </div>

    <!-- Waveform preview -->
    <div class="relative bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref="waveformCanvasRef"
        :style="{ width: '100%', height: `${WAVEFORM_PREVIEW_HEIGHT}px` }"
        class="block w-full"
      />
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
        :class="isPlaying
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-green-600 hover:bg-green-500 text-white'"
        :disabled="drawnPeaks.length === 0"
        @click="togglePlay"
      >
        {{ isPlaying ? 'Stop' : 'Play' }}
      </button>

      <button
        class="px-3 py-1.5 text-xs font-medium rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        :disabled="drawnPeaks.length === 0"
        @click="clearPeaks"
      >
        Clear
      </button>

      <span class="text-xs text-gray-400 ml-auto">
        {{ drawnPeaks.length }} peak{{ drawnPeaks.length !== 1 ? 's' : '' }}
      </span>
    </div>
  </div>
</template>
