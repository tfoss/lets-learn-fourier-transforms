<!--
  TrackWaveform — Displays the waveform for a single audio track.

  Shows the track's color and label (e.g., "Track 1 - A4 (440Hz)").
  Uses real-time data from useAudioEngine when playing, or generates
  a static preview using generateWaveformSamples when stopped.
-->
<template>
  <div data-testid="track-waveform">
    <WaveformCanvas
      :data="waveformData"
      :color="track.color"
      :line-width="2"
      :height="120"
      :label="trackLabel"
      :secondary-label="timeFrameLabel"
      :animated="false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * TrackWaveform component.
 *
 * Props:
 *  - track: TrackConfig for this track
 *  - trackIndex: Zero-based index used for display labeling
 */

import { computed } from 'vue'
import type { TrackConfig } from '../types/audio'
import { generateWaveformSamples, applyEnvelopeToSamples, DEFAULT_SAMPLE_RATE } from '../utils/audio-math'
import { frequencyToNoteName } from '../utils/audio-math'
import WaveformCanvas from './WaveformCanvas.vue'

/**
 * Number of samples to generate for the static waveform preview.
 * Shows a few complete cycles of the wave so the shape is clearly visible.
 */
const STATIC_SAMPLE_COUNT = 1024

const props = defineProps<{
  track: TrackConfig
  trackIndex: number
}>()

/**
 * Builds a human-readable label for the track.
 *
 * @returns Label string, e.g., "Track 1 - A4 (440Hz)".
 */
const trackLabel = computed(() => {
  const displayIndex = props.trackIndex + 1
  const noteName = safeNoteName(props.track.frequency)
  return `Track ${displayIndex} - ${noteName} (${Math.round(props.track.frequency)}Hz)`
})

/**
 * Human-readable label for the time window shown in the waveform.
 * e.g., "23.2 ms" for 1024 samples at 44100 Hz.
 */
const timeFrameLabel = computed(() => {
  const durationSec = STATIC_SAMPLE_COUNT / DEFAULT_SAMPLE_RATE
  const durationMs = durationSec * 1000
  if (durationMs >= 1) {
    return `${durationMs.toFixed(1)} ms`
  }
  const durationUs = durationSec * 1_000_000
  return `${durationUs.toFixed(1)} \u00B5s`
})

/**
 * Safely converts frequency to a note name, returning empty string on error.
 *
 * @param frequency - Frequency in Hz.
 * @returns Note name string or empty string.
 */
function safeNoteName(frequency: number): string {
  try {
    return frequencyToNoteName(frequency)
  } catch {
    return ''
  }
}

/**
 * Generates static waveform preview data from track parameters.
 *
 * @returns Float32Array of preview samples.
 */
function generateStaticPreview(): Float32Array {
  if (props.track.isMuted) {
    return new Float32Array(STATIC_SAMPLE_COUNT)
  }
  let samples = generateWaveformSamples(
    props.track.waveformType,
    props.track.frequency,
    props.track.amplitude,
    props.track.phase,
    DEFAULT_SAMPLE_RATE,
    STATIC_SAMPLE_COUNT,
  )
  if (props.track.envelope.enabled) {
    samples = applyEnvelopeToSamples(samples, props.track.envelope, DEFAULT_SAMPLE_RATE)
  }
  return samples
}

/**
 * The waveform data to render — always a static preview computed
 * from track parameters so the wave shape is clearly visible.
 * Reactively updates when any track parameter changes.
 */
const waveformData = computed<Float32Array>(() => {
  return generateStaticPreview()
})
</script>
