<!--
  SuperpositionWaveform — Displays the combined (superposition) waveform
  of all active tracks.

  Uses real-time data from useAudioEngine when playing, or computes
  a static superposition from track parameters when stopped.
-->
<template>
  <div data-testid="superposition-waveform">
    <WaveformCanvas
      :data="waveformData"
      color="#ffffff"
      :line-width="2.5"
      :height="150"
      label="Combined (Superposition)"
      :secondary-label="timeFrameLabel"
      :animated="false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * SuperpositionWaveform component.
 *
 * Renders the sum of all track waveforms. Uses a white line and
 * slightly taller canvas to visually distinguish it from individual tracks.
 */

import { computed } from 'vue'
import {
  generateWaveformSamples,
  applyEnvelopeToSamples,
  sumWaveforms,
  DEFAULT_SAMPLE_RATE,
} from '../utils/audio-math'
import { useAudioEngine } from '../composables/useAudioEngine'
import { useTimeScale, formatTimeScale } from '../composables/useTimeScale'
import WaveformCanvas from './WaveformCanvas.vue'

const { timeScaleMs, sampleCount } = useTimeScale()

const { tracks } = useAudioEngine()

/**
 * Human-readable label for the time window shown in the waveform.
 */
const timeFrameLabel = computed(() => formatTimeScale(timeScaleMs.value))

/**
 * Generates a static superposition of all unmuted track waveforms.
 *
 * @returns Float32Array of the combined waveform.
 */
function generateStaticSuperposition(): Float32Array {
  const activeTracks = tracks.value.filter((t) => !t.isMuted)

  if (activeTracks.length === 0) {
    return new Float32Array(sampleCount.value)
  }

  const waveforms = activeTracks.map((t) => {
    let samples = generateWaveformSamples(
      t.waveformType,
      t.frequency,
      t.amplitude,
      t.phase,
      DEFAULT_SAMPLE_RATE,
      sampleCount.value,
    )
    if (t.envelope.enabled) {
      samples = applyEnvelopeToSamples(samples, t.envelope, DEFAULT_SAMPLE_RATE)
    }
    return samples
  })

  return sumWaveforms(waveforms)
}

/**
 * The waveform data to render — always a static superposition computed
 * from track parameters. Reactively updates when tracks change.
 */
const waveformData = computed<Float32Array>(() => {
  return generateStaticSuperposition()
})
</script>
