/**
 * Microphone input composable.
 *
 * Captures audio from the user's microphone and feeds it into the
 * master AnalyserNode from useAudioEngine, so the existing FFT
 * visualization displays mic input automatically.
 *
 * The mic source is connected directly to the master AnalyserNode
 * (bypassing masterGain -> destination) to avoid feedback loops
 * where mic audio would play back through speakers.
 *
 * Usage:
 *   const { isListening, startListening, stopListening } = useMicrophone()
 */

import { ref, type Ref } from 'vue'
import { useAudioEngine } from './useAudioEngine'
import type { FFTData } from '../types/audio'

// ── Types ────────────────────────────────────────────────────────

/** Permission states for microphone access. */
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unknown'

// ── Singleton state ──────────────────────────────────────────────

const isListening: Ref<boolean> = ref(false)
const permissionState: Ref<MicPermissionState> = ref('unknown')

let mediaStream: MediaStream | null = null
let mediaSourceNode: MediaStreamAudioSourceNode | null = null

// ── Feature detection ────────────────────────────────────────────

/**
 * Checks whether getUserMedia is available in the current environment.
 *
 * @returns True if the browser supports microphone capture.
 */
function checkIsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

/** Whether getUserMedia is available. */
const isSupported: boolean = checkIsSupported()

// ── Permission query ─────────────────────────────────────────────

/**
 * Queries the current microphone permission state using the Permissions API.
 * Falls back to 'unknown' if the API is not available.
 *
 * @returns The current permission state.
 */
async function queryPermission(): Promise<MicPermissionState> {
  try {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      const mapped = mapPermissionState(status.state)
      permissionState.value = mapped
      return mapped
    }
  } catch {
    // Permissions API not supported or query failed
  }
  return 'unknown'
}

/**
 * Maps a browser PermissionState string to our MicPermissionState type.
 *
 * @param state - The browser permission state.
 * @returns The mapped permission state.
 */
function mapPermissionState(state: PermissionState): MicPermissionState {
  switch (state) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    case 'prompt':
      return 'prompt'
    default:
      return 'unknown'
  }
}

// ── Stream management ────────────────────────────────────────────

/**
 * Requests microphone access and returns the MediaStream.
 *
 * @returns The audio MediaStream.
 * @throws Error if permission is denied or no mic is available.
 */
async function requestMicStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: true })
}

/**
 * Stops all tracks on the current media stream and cleans up references.
 */
function stopMediaStream(): void {
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) {
      track.stop()
    }
    mediaStream = null
  }
}

/**
 * Disconnects the MediaStreamSourceNode and cleans up the reference.
 */
function disconnectSourceNode(): void {
  if (mediaSourceNode) {
    mediaSourceNode.disconnect()
    mediaSourceNode = null
  }
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Starts listening to the microphone.
 *
 * Requests mic access, creates a MediaStreamSourceNode, and connects
 * it directly to the master AnalyserNode (bypassing gain/destination
 * to prevent feedback).
 *
 * @throws Error if getUserMedia is not supported or permission is denied.
 */
async function startListening(): Promise<void> {
  if (isListening.value) return
  if (!isSupported) {
    throw new Error('Microphone input is not supported in this browser')
  }

  const engine = useAudioEngine()
  await engine.resumeContext()

  try {
    mediaStream = await requestMicStream()
    permissionState.value = 'granted'
  } catch (err: unknown) {
    permissionState.value = 'denied'
    const message =
      err instanceof Error ? err.message : 'Microphone access denied'
    throw new Error(message)
  }

  const ctx = engine.getAudioContext()
  const analyser = engine.getMasterAnalyser()

  mediaSourceNode = ctx.createMediaStreamSource(mediaStream)
  mediaSourceNode.connect(analyser)
  isListening.value = true
}

/**
 * Stops listening to the microphone.
 *
 * Disconnects the source node, stops the media stream tracks,
 * and updates state.
 */
function stopListening(): void {
  if (!isListening.value) return

  disconnectSourceNode()
  stopMediaStream()
  isListening.value = false
}

/**
 * Reads FFT data from the master analyser (same data source as the engine).
 *
 * This is a convenience method — since the mic feeds into the master
 * analyser, calling useAudioEngine().getFFTData() returns the same data.
 *
 * @returns FFT analysis data.
 */
function getFFTData(): FFTData {
  const engine = useAudioEngine()
  return engine.getFFTData()
}

/**
 * Full cleanup: stops listening and resets all state.
 */
function cleanup(): void {
  stopListening()
  permissionState.value = 'unknown'
}

// ── Composable export ────────────────────────────────────────────

/**
 * Microphone input composable.
 *
 * Returns reactive state and methods for capturing microphone audio
 * and feeding it into the FFT analysis pipeline.
 *
 * @returns Microphone API.
 */
export function useMicrophone() {
  return {
    // State
    isSupported,
    isListening,
    permissionState,

    // Actions
    startListening,
    stopListening,
    queryPermission,

    // Analysis
    getFFTData,

    // Cleanup
    cleanup,
  }
}
