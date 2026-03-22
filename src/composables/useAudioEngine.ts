/**
 * Core audio engine composable (singleton).
 *
 * Manages the Web Audio API graph: oscillators, gain nodes, analyser nodes,
 * and the master output chain. Provides reactive state for UI binding and
 * methods for track lifecycle, playback, and FFT analysis.
 *
 * Usage:
 *   const { tracks, isPlaying, createTrack, playAll, getFFTData } = useAudioEngine()
 */

import { ref, type Ref } from 'vue'
import {
  type TrackConfig,
  type TrackId,
  type WaveformType,
  type FFTData,
  type EnvelopeConfig,
  createTrackId,
  DEFAULT_ENVELOPE,
} from '../types/audio'
import { DEFAULT_FREQUENCY, DEFAULT_AMPLITUDE } from '../utils/audio-math'
import { getTrackColor } from '../utils/color-palette'

// ── Internal types ─────────────────────────────────────────────────

/** Runtime nodes for a single track. */
interface TrackNodes {
  oscillator: OscillatorNode | null
  gainNode: GainNode
  analyserNode: AnalyserNode
  isOscillatorStarted: boolean
}

// ── Default FFT configuration ──────────────────────────────────────

const DEFAULT_FFT_SIZE = 2048
const PARAM_RAMP_TIME = 0.02 // seconds for smooth parameter transitions

// ── Singleton state (module-level) ─────────────────────────────────

let audioContext: AudioContext | null = null
let masterGainNode: GainNode | null = null
let masterAnalyserNode: AnalyserNode | null = null

const tracks: Ref<TrackConfig[]> = ref([])
const isPlaying: Ref<boolean> = ref(false)
const masterVolume: Ref<number> = ref(1)

/** Set of TrackIds that currently have an active oscillator. */
const playingTrackIds: Ref<Set<TrackId>> = ref(new Set())

/** Map from TrackId to its live audio nodes. */
const trackNodesMap = new Map<TrackId, TrackNodes>()

/** Counter for generating unique track IDs. */
let nextTrackIndex = 0

// ── Internal helpers ───────────────────────────────────────────────

/**
 * Lazily creates and returns the shared AudioContext.
 *
 * @returns The singleton AudioContext.
 */
function getOrCreateContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
    masterGainNode = audioContext.createGain()
    masterAnalyserNode = audioContext.createAnalyser()
    masterAnalyserNode.fftSize = DEFAULT_FFT_SIZE
    masterGainNode.connect(masterAnalyserNode)
    masterAnalyserNode.connect(audioContext.destination)
  }
  return audioContext
}

/**
 * Returns the master GainNode, creating the context if needed.
 *
 * @returns The master GainNode.
 */
function getMasterGain(): GainNode {
  getOrCreateContext()
  return masterGainNode!
}

/**
 * Returns the master AnalyserNode, creating the context if needed.
 *
 * @returns The master AnalyserNode.
 */
function getMasterAnalyser(): AnalyserNode {
  getOrCreateContext()
  return masterAnalyserNode!
}

/**
 * Finds the index of a track in the reactive tracks array.
 *
 * @param id - The track ID to find.
 * @returns The index, or -1 if not found.
 */
function findTrackIndex(id: TrackId): number {
  return tracks.value.findIndex((t) => t.id === id)
}

/**
 * Determines effective gain for a track considering mute/solo state.
 *
 * If any track is soloed, only soloed tracks produce sound.
 * Otherwise, muted tracks are silent.
 *
 * @param config - The track's configuration.
 * @returns Effective amplitude (0 if silenced).
 */
function effectiveAmplitude(config: TrackConfig): number {
  const anySolo = tracks.value.some((t) => t.isSolo)
  if (anySolo && !config.isSolo) return 0
  if (config.isMuted) return 0
  return config.amplitude
}

/**
 * Creates a fresh OscillatorNode for a track and connects it.
 *
 * @param config - Track configuration.
 * @param nodes - Track's node set (gainNode must already exist).
 * @returns The newly created OscillatorNode.
 */
function createOscillatorForTrack(
  config: TrackConfig,
  nodes: TrackNodes,
): OscillatorNode {
  const ctx = getOrCreateContext()
  const osc = ctx.createOscillator()
  osc.type = config.waveformType
  osc.frequency.setValueAtTime(config.frequency, ctx.currentTime)
  osc.connect(nodes.gainNode)
  return osc
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Resumes the AudioContext after user interaction (autoplay policy).
 *
 * Browsers require a user gesture before audio can play. Call this
 * in response to a click/tap event.
 *
 * @returns A promise that resolves when the context is running.
 */
async function resumeContext(): Promise<void> {
  const ctx = getOrCreateContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/**
 * Creates a new audio track with the given configuration overrides.
 *
 * Sets up the audio graph: OscillatorNode -> GainNode -> masterGain.
 * The oscillator is created but not started until playTrack() is called.
 *
 * @param config - Partial track configuration (defaults are applied).
 * @returns The new track's ID.
 */
function createTrack(config?: Partial<TrackConfig>): TrackId {
  const ctx = getOrCreateContext()
  const index = nextTrackIndex++
  const id = createTrackId(`track-${index}`)

  const trackConfig: TrackConfig = {
    id,
    frequency: config?.frequency ?? DEFAULT_FREQUENCY,
    amplitude: config?.amplitude ?? DEFAULT_AMPLITUDE,
    waveformType: config?.waveformType ?? 'sine',
    phase: config?.phase ?? 0,
    duration: config?.duration ?? 0,
    color: config?.color ?? getTrackColor(index),
    isMuted: config?.isMuted ?? false,
    isSolo: config?.isSolo ?? false,
    envelope: config?.envelope ?? { ...DEFAULT_ENVELOPE },
  }

  // Build audio nodes
  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(
    effectiveAmplitude(trackConfig),
    ctx.currentTime,
  )
  const analyserNode = ctx.createAnalyser()
  analyserNode.fftSize = DEFAULT_FFT_SIZE

  // Connect: gain -> per-track analyser -> master gain
  gainNode.connect(analyserNode)
  analyserNode.connect(getMasterGain())

  const nodes: TrackNodes = {
    oscillator: null,
    gainNode,
    analyserNode,
    isOscillatorStarted: false,
  }

  trackNodesMap.set(id, nodes)
  tracks.value = [...tracks.value, trackConfig]

  return id
}

/**
 * Removes a track and disconnects all its audio nodes.
 *
 * @param id - The track to remove.
 */
function removeTrack(id: TrackId): void {
  const nodes = trackNodesMap.get(id)
  if (nodes) {
    stopOscillator(nodes)
    nodes.gainNode.disconnect()
    nodes.analyserNode.disconnect()
    trackNodesMap.delete(id)
  }
  const next = new Set(playingTrackIds.value)
  next.delete(id)
  playingTrackIds.value = next
  tracks.value = tracks.value.filter((t) => t.id !== id)
}

/**
 * Safely stops and nullifies a track's oscillator.
 *
 * @param nodes - The track's node set.
 */
function stopOscillator(nodes: TrackNodes): void {
  if (nodes.oscillator && nodes.isOscillatorStarted) {
    try {
      nodes.oscillator.stop()
    } catch {
      // Already stopped — ignore
    }
  }
  nodes.oscillator = null
  nodes.isOscillatorStarted = false
}

/**
 * Updates a single parameter on a live track.
 *
 * For frequency and amplitude, uses exponential/linear ramps for
 * smooth transitions. For waveform type, swaps the oscillator type.
 *
 * @param id - Track to update.
 * @param param - Parameter name.
 * @param value - New value for the parameter.
 */
function updateTrackParam(
  id: TrackId,
  param: keyof TrackConfig,
  value: TrackConfig[keyof TrackConfig],
): void {
  const idx = findTrackIndex(id)
  if (idx === -1) return

  const config = { ...tracks.value[idx] }
  const nodes = trackNodesMap.get(id)

  // Apply the value to the config
  switch (param) {
    case 'frequency':
      config.frequency = value as number
      if (nodes?.oscillator) {
        const ctx = getOrCreateContext()
        nodes.oscillator.frequency.linearRampToValueAtTime(
          value as number,
          ctx.currentTime + PARAM_RAMP_TIME,
        )
      }
      break

    case 'amplitude':
      config.amplitude = value as number
      applyGain(config, nodes)
      break

    case 'waveformType':
      config.waveformType = value as WaveformType
      if (nodes?.oscillator) {
        nodes.oscillator.type = value as OscillatorType
      }
      break

    case 'isMuted':
      config.isMuted = value as boolean
      applyGain(config, nodes)
      break

    case 'isSolo':
      config.isSolo = value as boolean
      // Solo affects all tracks — reapply gains globally
      updateConfigAtIndex(idx, config)
      reapplyAllGains()
      return

    case 'phase':
      config.phase = value as number
      break

    case 'duration':
      config.duration = value as number
      break

    case 'color':
      config.color = value as string
      break

    case 'envelope':
      config.envelope = value as EnvelopeConfig
      break

    default:
      break
  }

  updateConfigAtIndex(idx, config)
}

/**
 * Replaces a track config at the given index, triggering reactivity.
 *
 * @param idx - Array index.
 * @param config - New config object.
 */
function updateConfigAtIndex(idx: number, config: TrackConfig): void {
  const updated = [...tracks.value]
  updated[idx] = config
  tracks.value = updated
}

/**
 * Applies the effective gain to a track's GainNode with a smooth ramp.
 *
 * @param config - Track configuration.
 * @param nodes - Track's audio nodes (may be undefined).
 */
function applyGain(config: TrackConfig, nodes: TrackNodes | undefined): void {
  if (!nodes) return
  const ctx = getOrCreateContext()
  const gain = effectiveAmplitude(config)
  nodes.gainNode.gain.linearRampToValueAtTime(
    gain,
    ctx.currentTime + PARAM_RAMP_TIME,
  )
}

/**
 * Reapplies gain values to all tracks (needed after solo changes).
 */
function reapplyAllGains(): void {
  for (const config of tracks.value) {
    const nodes = trackNodesMap.get(config.id)
    applyGain(config, nodes)
  }
}

/**
 * Starts a single track's oscillator.
 *
 * Creates a new OscillatorNode if one doesn't exist, then starts it.
 *
 * @param id - Track to play.
 */
function playTrack(id: TrackId): void {
  const idx = findTrackIndex(id)
  if (idx === -1) return

  const config = tracks.value[idx]
  const nodes = trackNodesMap.get(id)
  if (!nodes) return

  // If oscillator is already running, skip
  if (nodes.oscillator && nodes.isOscillatorStarted) return

  // Create a fresh oscillator
  const osc = createOscillatorForTrack(config, nodes)
  nodes.oscillator = osc
  nodes.isOscillatorStarted = true

  playingTrackIds.value = new Set([...playingTrackIds.value, id])

  // Schedule ADSR envelope on the gain node if enabled
  if (config.envelope.enabled) {
    const ctx = getOrCreateContext()
    const now = ctx.currentTime
    const amp = effectiveAmplitude(config)
    const env = config.envelope
    nodes.gainNode.gain.cancelScheduledValues(now)
    nodes.gainNode.gain.setValueAtTime(0, now)
    nodes.gainNode.gain.linearRampToValueAtTime(amp, now + env.attack)
    nodes.gainNode.gain.linearRampToValueAtTime(
      amp * env.sustain,
      now + env.attack + env.decay,
    )
    // Sustain holds until release (triggered in stopTrack)
  }

  if (config.duration > 0) {
    osc.start(0)
    osc.stop(getOrCreateContext().currentTime + config.duration)
    osc.onended = () => {
      nodes.oscillator = null
      nodes.isOscillatorStarted = false
      const next = new Set(playingTrackIds.value)
      next.delete(id)
      playingTrackIds.value = next
    }
  } else {
    osc.start(0)
  }
}

/**
 * Stops a single track's oscillator.
 *
 * @param id - Track to stop.
 */
function stopTrack(id: TrackId): void {
  const nodes = trackNodesMap.get(id)
  if (!nodes) return

  const idx = findTrackIndex(id)
  const config = idx !== -1 ? tracks.value[idx] : null

  // If envelope is enabled, schedule a release ramp before stopping
  if (config?.envelope.enabled && nodes.oscillator && nodes.isOscillatorStarted) {
    const ctx = getOrCreateContext()
    const now = ctx.currentTime
    const env = config.envelope
    nodes.gainNode.gain.cancelScheduledValues(now)
    nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, now)
    nodes.gainNode.gain.linearRampToValueAtTime(0, now + env.release)
    try {
      nodes.oscillator.stop(now + env.release)
    } catch {
      // Already stopped
    }
    nodes.oscillator.onended = () => {
      nodes.oscillator = null
      nodes.isOscillatorStarted = false
    }
  } else {
    stopOscillator(nodes)
  }

  const next = new Set(playingTrackIds.value)
  next.delete(id)
  playingTrackIds.value = next
}

/**
 * Starts all tracks and sets the global isPlaying flag.
 */
function playAll(): void {
  for (const config of tracks.value) {
    playTrack(config.id)
  }
  isPlaying.value = true
}

/**
 * Stops all tracks and clears the global isPlaying flag.
 */
function stopAll(): void {
  for (const config of tracks.value) {
    stopTrack(config.id)
  }
  isPlaying.value = false
}

/**
 * Sets the master volume (0–1) with a smooth ramp.
 *
 * @param volume - New master volume (clamped to [0, 1]).
 */
function setMasterVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume))
  masterVolume.value = clamped
  if (masterGainNode) {
    const ctx = getOrCreateContext()
    masterGainNode.gain.linearRampToValueAtTime(
      clamped,
      ctx.currentTime + PARAM_RAMP_TIME,
    )
  }
}

/**
 * Reads the current FFT and time-domain data from the master AnalyserNode.
 *
 * @returns An FFTData object with frequency and time-domain arrays.
 */
function getFFTData(): FFTData {
  const analyser = getMasterAnalyser()
  const ctx = getOrCreateContext()

  const frequencyData = new Float32Array(analyser.frequencyBinCount)
  const timeDomainData = new Float32Array(analyser.frequencyBinCount)

  analyser.getFloatFrequencyData(frequencyData)
  analyser.getFloatTimeDomainData(timeDomainData)

  return {
    frequencyData,
    timeDomainData,
    sampleRate: ctx.sampleRate,
    fftSize: analyser.fftSize,
  }
}

/**
 * Reads time-domain data from a specific track's AnalyserNode.
 *
 * @param id - Track to read from.
 * @returns Float32Array of time-domain samples, or an empty array if not found.
 */
function getTrackTimeDomainData(id: TrackId): Float32Array {
  const nodes = trackNodesMap.get(id)
  if (!nodes) return new Float32Array(0)

  const data = new Float32Array(nodes.analyserNode.frequencyBinCount)
  nodes.analyserNode.getFloatTimeDomainData(data)
  return data
}

/**
 * Cleans up all audio resources.
 *
 * Stops all oscillators, disconnects all nodes, and closes the AudioContext.
 */
async function cleanup(): Promise<void> {
  stopAll()

  for (const [id, nodes] of trackNodesMap) {
    stopOscillator(nodes)
    nodes.gainNode.disconnect()
    nodes.analyserNode.disconnect()
    trackNodesMap.delete(id)
  }

  tracks.value = []
  isPlaying.value = false
  masterVolume.value = 1
  playingTrackIds.value = new Set()
  nextTrackIndex = 0

  if (masterGainNode) {
    masterGainNode.disconnect()
    masterGainNode = null
  }
  if (masterAnalyserNode) {
    masterAnalyserNode.disconnect()
    masterAnalyserNode = null
  }
  if (audioContext) {
    await audioContext.close()
    audioContext = null
  }
}

// ── Composable export ──────────────────────────────────────────────

/**
 * Audio engine composable (singleton).
 *
 * Returns reactive state and methods for managing the Web Audio API
 * graph. Multiple callers receive the same shared state.
 *
 * @returns Audio engine API.
 */
/**
 * Returns whether a specific track is currently playing.
 *
 * @param id - The track ID to check.
 * @returns True if the track's oscillator is active.
 */
function isTrackPlaying(id: TrackId): boolean {
  return playingTrackIds.value.has(id)
}

export function useAudioEngine() {
  return {
    // Reactive state
    tracks,
    isPlaying,
    masterVolume,
    playingTrackIds,

    // Context management
    resumeContext,

    // Track lifecycle
    createTrack,
    removeTrack,
    updateTrackParam,

    // Playback
    playTrack,
    stopTrack,
    playAll,
    stopAll,
    isTrackPlaying,

    // Volume
    setMasterVolume,

    // Analysis
    getFFTData,
    getTrackTimeDomainData,

    // Cleanup
    cleanup,
  }
}
