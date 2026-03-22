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
import { useTimeScale, formatTimeScale } from '../composables/useTimeScale'
import WaveformCanvas from './WaveformCanvas.vue'

const { timeScaleMs, sampleCount } = useTimeScale()

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
const timeFrameLabel = computed(() => formatTimeScale(timeScaleMs.value))

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
    return new Float32Array(sampleCount.value)
  }
  let samples = generateWaveformSamples(
    props.track.waveformType,
    props.track.frequency,
    props.track.amplitude,
    props.track.phase,
    DEFAULT_SAMPLE_RATE,
    sampleCount.value,
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
