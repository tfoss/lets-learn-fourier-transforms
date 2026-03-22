/**
 * Audio file loading and playback composable.
 *
 * Provides the ability to load an audio file (e.g., WAV, MP3),
 * decode it into an AudioBuffer, and play it back through a
 * BufferSourceNode connected to the shared master AnalyserNode.
 *
 * Usage:
 *   const { loadAudioFile, playAudioBuffer, pause, resume, stop } = useAudioFilePlayer()
 */

import { ref, type Ref } from 'vue'
import { useAudioEngine } from './useAudioEngine'

// ── Singleton state ────────────────────────────────────────────────

const audioBufferRef: Ref<AudioBuffer | null> = ref(null)
const isPlayingRef: Ref<boolean> = ref(false)
const currentTimeRef: Ref<number> = ref(0)
const durationRef: Ref<number> = ref(0)

let sourceNode: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let startedAt = 0
let pausedAt = 0
let animationFrameId: number | null = null

// ── Internal helpers ───────────────────────────────────────────────

/**
 * Returns the shared AudioContext from the audio engine.
 *
 * Uses the engine's context so that file playback audio flows through
 * the engine's master analyser, making it visible to FFT and spectrogram.
 *
 * @returns The shared AudioContext.
 */
function getSharedContext(): AudioContext {
  const engine = useAudioEngine()
  return engine.getAudioContext()
}

/**
 * Updates the currentTime ref on each animation frame while playing.
 */
function updateCurrentTime(): void {
  if (!isPlayingRef.value) return

  const ctx = getSharedContext()
  currentTimeRef.value = ctx.currentTime - startedAt + pausedAt

  if (currentTimeRef.value >= durationRef.value) {
    stopPlayback()
    return
  }

  animationFrameId = requestAnimationFrame(updateCurrentTime)
}

/**
 * Stops playback and resets state.
 */
function stopPlayback(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch {
      // Already stopped
    }
    sourceNode.disconnect()
    sourceNode = null
  }

  isPlayingRef.value = false
}

/**
 * Creates a new BufferSourceNode and connects it to the output chain.
 *
 * @param buffer - The AudioBuffer to play.
 * @param offset - Start offset in seconds.
 * @returns The created source node.
 */
function createSourceNode(
  buffer: AudioBuffer,
  offset: number,
): AudioBufferSourceNode {
  const ctx = getSharedContext()
  const engine = useAudioEngine()

  if (!gainNode) {
    gainNode = ctx.createGain()
    // Connect through the engine's master analyser so FFT/spectrogram can see the data
    gainNode.connect(engine.getMasterAnalyser())
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(gainNode)

  source.onended = () => {
    if (isPlayingRef.value) {
      stopPlayback()
      currentTimeRef.value = 0
      pausedAt = 0
    }
  }

  return source
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Loads and decodes an audio file into an AudioBuffer.
 *
 * @param file - The File object to load (e.g., from an <input type="file">).
 * @returns A promise resolving to the decoded AudioBuffer.
 * @throws {Error} If the file cannot be decoded.
 */
async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getSharedContext()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = await ctx.decodeAudioData(arrayBuffer)

  audioBufferRef.value = buffer
  durationRef.value = buffer.duration
  currentTimeRef.value = 0
  pausedAt = 0

  return buffer
}

/**
 * Plays an AudioBuffer from the beginning or current position.
 *
 * @param buffer - The AudioBuffer to play.
 */
function playAudioBuffer(buffer: AudioBuffer): void {
  // Stop any current playback
  if (sourceNode) {
    stopPlayback()
  }

  const ctx = getSharedContext()

  sourceNode = createSourceNode(buffer, pausedAt)
  sourceNode.start(0, pausedAt)
  startedAt = ctx.currentTime
  isPlayingRef.value = true

  animationFrameId = requestAnimationFrame(updateCurrentTime)
}

/**
 * Pauses the current playback, remembering the position.
 */
function pause(): void {
  if (!isPlayingRef.value) return

  const ctx = getSharedContext()
  pausedAt = ctx.currentTime - startedAt + pausedAt

  stopPlayback()
}

/**
 * Resumes playback from the paused position.
 */
function resume(): void {
  if (isPlayingRef.value) return
  if (!audioBufferRef.value) return

  playAudioBuffer(audioBufferRef.value)
}

/**
 * Stops playback and resets to the beginning.
 */
function stop(): void {
  stopPlayback()
  currentTimeRef.value = 0
  pausedAt = 0
}

/**
 * Seeks to a specific time position.
 *
 * If currently playing, restarts playback from the new position.
 * If paused, updates the position for the next resume.
 *
 * @param time - Time in seconds to seek to.
 */
function seek(time: number): void {
  const clampedTime = Math.max(0, Math.min(time, durationRef.value))
  const wasPlaying = isPlayingRef.value

  if (wasPlaying) {
    stopPlayback()
  }

  pausedAt = clampedTime
  currentTimeRef.value = clampedTime

  if (wasPlaying && audioBufferRef.value) {
    playAudioBuffer(audioBufferRef.value)
  }
}

/**
 * Cleans up all file player resources.
 */
async function cleanupFilePlayer(): Promise<void> {
  stopPlayback()
  audioBufferRef.value = null
  currentTimeRef.value = 0
  durationRef.value = 0
  pausedAt = 0
  startedAt = 0

  if (gainNode) {
    gainNode.disconnect()
    gainNode = null
  }
}

// ── Composable export ──────────────────────────────────────────────

/**
 * Audio file player composable (singleton).
 *
 * Manages loading, decoding, and playback of audio files.
 *
 * @returns File player API and reactive state.
 */
export function useAudioFilePlayer() {
  return {
    // Reactive state
    isPlaying: isPlayingRef,
    currentTime: currentTimeRef,
    duration: durationRef,
    audioBuffer: audioBufferRef,

    // Methods
    loadAudioFile,
    playAudioBuffer,
    pause,
    resume,
    stop,
    seek,
    cleanup: cleanupFilePlayer,
  }
}
