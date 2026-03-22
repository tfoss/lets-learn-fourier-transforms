/**
 * Composable for canvas-based waveform rendering.
 *
 * Manages drawing waveform data onto an HTML canvas element with
 * requestAnimationFrame for smooth animation. Pure rendering logic
 * with no audio dependencies.
 */

import { ref, onUnmounted, type Ref } from 'vue'

/** Display options for waveform rendering. */
export interface WaveformDisplayOptions {
  /** CSS color string for the waveform line. */
  color: string
  /** Width of the waveform line in pixels. */
  lineWidth: number
}

/** Default display options. */
const DEFAULT_OPTIONS: WaveformDisplayOptions = {
  color: '#3b82f6',
  lineWidth: 2,
}

/**
 * Draws a single waveform frame onto a canvas 2D context.
 *
 * Renders the waveform centered vertically, scaled to fill the canvas
 * width and height. Clears the canvas before drawing.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param data - Waveform sample data (values expected in [-1, 1] range).
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @param options - Display options (color, lineWidth).
 */
export function drawWaveformFrame(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  options: WaveformDisplayOptions,
): void {
  ctx.clearRect(0, 0, width, height)

  if (data.length === 0) return

  const centerY = height / 2
  const sliceWidth = width / data.length

  ctx.beginPath()
  ctx.strokeStyle = options.color
  ctx.lineWidth = options.lineWidth
  ctx.lineJoin = 'round'

  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth
    const y = centerY - data[i] * centerY
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()
}

/**
 * Clears the entire canvas.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height)
}

/**
 * Composable that manages canvas-based waveform rendering.
 *
 * Takes a canvas ref and display options, provides methods for
 * drawing single frames or running a continuous animation loop.
 *
 * @param canvasRef - Ref to the HTMLCanvasElement.
 * @param options - Partial display options (defaults applied).
 * @returns Object with draw, animation, and clear methods.
 */
export function useWaveformRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: Partial<WaveformDisplayOptions> = {},
) {
  const mergedOptions: WaveformDisplayOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const isAnimating = ref(false)
  let animationFrameId: number | null = null
  let resizeObserver: ResizeObserver | null = null

  /**
   * Synchronizes the canvas internal resolution with its display size.
   *
   * @param canvas - The canvas element to resize.
   */
  function syncCanvasSize(canvas: HTMLCanvasElement): void {
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
   * Sets up a ResizeObserver on the canvas to handle size changes.
   *
   * @param canvas - The canvas element to observe.
   */
  function setupResizeObserver(canvas: HTMLCanvasElement): void {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    resizeObserver = new ResizeObserver(() => {
      syncCanvasSize(canvas)
    })
    resizeObserver.observe(canvas)
  }

  /**
   * Draws a single waveform frame on the canvas.
   *
   * @param data - Waveform sample data.
   */
  function drawWaveform(data: Float32Array): void {
    const canvas = canvasRef.value
    if (!canvas) return

    syncCanvasSize(canvas)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawWaveformFrame(ctx, data, canvas.width, canvas.height, mergedOptions)
  }

  /**
   * Starts a continuous animation loop that calls dataSource each frame.
   *
   * @param dataSource - Function returning the current waveform data.
   */
  function startAnimation(dataSource: () => Float32Array): void {
    const canvas = canvasRef.value
    if (!canvas) return

    setupResizeObserver(canvas)
    isAnimating.value = true

    function loop(): void {
      if (!isAnimating.value) return
      const data = dataSource()
      drawWaveform(data)
      animationFrameId = requestAnimationFrame(loop)
    }

    loop()
  }

  /**
   * Stops the animation loop.
   */
  function stopAnimation(): void {
    isAnimating.value = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  /**
   * Clears the canvas.
   */
  function clear(): void {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    clearCanvas(ctx, canvas.width, canvas.height)
  }

  /**
   * Cleans up the resize observer and stops animation.
   */
  function dispose(): void {
    stopAnimation()
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  onUnmounted(dispose)

  return {
    drawWaveform,
    startAnimation,
    stopAnimation,
    clear,
    dispose,
    isAnimating,
  }
}
