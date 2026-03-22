<!--
  WaveformCanvas — Reusable canvas component for rendering a single waveform.

  Renders waveform data onto an HTML canvas, supporting both static (one-shot)
  and animated (requestAnimationFrame) modes. Fills parent width and uses
  the height prop for vertical sizing.
-->
<template>
  <div
    class="waveform-canvas-wrapper relative w-full rounded-lg overflow-hidden"
    :style="{ height: `${height}px` }"
    data-testid="waveform-canvas-wrapper"
  >
    <span
      v-if="label"
      class="absolute top-2 left-3 text-xs font-medium z-10 pointer-events-none"
      :style="{ color: color }"
      data-testid="waveform-label"
    >
      {{ label }}
    </span>
    <span
      v-if="secondaryLabel"
      class="absolute top-2 right-3 text-xs z-10 pointer-events-none text-gray-400"
      data-testid="waveform-secondary-label"
    >
      {{ secondaryLabel }}
    </span>
    <canvas
      ref="canvasRef"
      class="block w-full h-full"
      data-testid="waveform-canvas"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * WaveformCanvas component.
 *
 * Props:
 *  - data: Float32Array or null — waveform sample data
 *  - color: CSS color string for the waveform line
 *  - lineWidth: Stroke width in pixels
 *  - height: Component height in pixels
 *  - label: Optional label shown at top-left
 *  - animated: Whether to use requestAnimationFrame loop
 */

import { ref, watch, watchEffect, onMounted, onUnmounted, nextTick } from 'vue'
import {
  drawWaveformFrame,
  clearCanvas,
  type WaveformDisplayOptions,
} from '../composables/useWaveformRenderer'

const props = withDefaults(
  defineProps<{
    data: Float32Array | null
    color?: string
    lineWidth?: number
    height?: number
    label?: string
    secondaryLabel?: string
    animated?: boolean
  }>(),
  {
    color: '#3b82f6',
    lineWidth: 2,
    height: 120,
    label: undefined,
    secondaryLabel: undefined,
    animated: false,
  },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null

/**
 * Synchronizes the canvas internal resolution with its CSS display size.
 */
function syncCanvasSize(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const displayWidth = Math.floor(rect.width * dpr)
  const displayHeight = Math.floor(rect.height * dpr)

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
  }
}

/**
 * Builds display options from the current props.
 *
 * @returns WaveformDisplayOptions object.
 */
function getDisplayOptions(): WaveformDisplayOptions {
  return {
    color: props.color,
    lineWidth: props.lineWidth,
  }
}

/**
 * Renders a single frame of the waveform onto the canvas.
 */
function renderFrame(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  syncCanvasSize()
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (!props.data || props.data.length === 0) {
    clearCanvas(ctx, canvas.width, canvas.height)
    return
  }

  drawWaveformFrame(ctx, props.data, canvas.width, canvas.height, getDisplayOptions())
}

/**
 * Animation loop for continuous rendering.
 */
function animationLoop(): void {
  renderFrame()
  animationFrameId = requestAnimationFrame(animationLoop)
}

/**
 * Starts the animation loop.
 */
function startAnimation(): void {
  stopAnimation()
  animationLoop()
}

/**
 * Stops the animation loop.
 */
function stopAnimation(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Re-render whenever data or display props change in static mode.
// Uses watchEffect so Vue tracks all reactive accesses (props.data,
// props.animated, etc.) automatically — avoids issues with watch
// failing to detect new Float32Array references.
watchEffect(() => {
  // Access props to establish reactive dependencies
  const data = props.data
  const animated = props.animated
  // Access color and lineWidth to establish reactive dependencies
  void props.color
  void props.lineWidth

  if (!animated && canvasRef.value && data) {
    nextTick(() => renderFrame())
  }
})

// Watch for animated prop changes
watch(
  () => props.animated,
  (isAnimated) => {
    if (isAnimated) {
      startAnimation()
    } else {
      stopAnimation()
      renderFrame()
    }
  },
)

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    resizeObserver = new ResizeObserver(() => {
      syncCanvasSize()
      renderFrame()
    })
    resizeObserver.observe(canvas)
  }

  syncCanvasSize()

  if (props.animated) {
    startAnimation()
  } else {
    renderFrame()
  }
})

onUnmounted(() => {
  stopAnimation()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>
