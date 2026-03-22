<!--
  MasterControls — Master playback controls bar.

  Provides Play All / Stop All toggle, master volume slider,
  preset selector, and a visual playing indicator.
-->
<template>
  <div
    class="master-controls flex items-center gap-4 rounded-lg bg-gray-800 px-4 py-2"
    data-testid="master-controls"
  >
    <!-- Play All / Stop All toggle -->
    <button
      class="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors"
      :class="isPlaying
        ? 'bg-red-600 hover:bg-red-500 text-white'
        : 'bg-green-600 hover:bg-green-500 text-white'"
      data-testid="play-all-btn"
      @click="onTogglePlayAll"
    >
      <span
        v-if="isPlaying"
        class="inline-block h-2 w-2 rounded-full bg-red-300 animate-pulse"
        data-testid="playing-indicator"
      />
      {{ isPlaying ? 'Stop All' : 'Play All' }}
    </button>

    <!-- Master volume slider -->
    <div class="flex items-center gap-2">
      <label class="text-xs text-gray-400">Vol</label>
      <input
        type="range"
        min="0"
        max="100"
        :value="volumeSliderValue"
        class="w-24 accent-blue-500"
        data-testid="master-volume-slider"
        @input="onVolumeInput"
      />
      <span class="text-xs text-gray-200 w-8 text-right" data-testid="master-volume-display">
        {{ volumePercent }}%
      </span>
    </div>

    <!-- Preset selector -->
    <div class="ml-auto flex items-center gap-2">
      <label class="text-xs text-gray-400">Preset</label>
      <select
        class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 border border-gray-600 focus:border-blue-500 focus:outline-none"
        data-testid="preset-selector"
        :value="selectedPresetName"
        @change="onPresetChange"
      >
        <option value="">— Select —</option>
        <option
          v-for="preset in PRESETS"
          :key="preset.name"
          :value="preset.name"
        >
          {{ preset.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MasterControls component.
 *
 * Manages global playback state, master volume, and preset loading.
 */

import { ref, computed } from 'vue'
import { useAudioEngine } from '../composables/useAudioEngine'
import { PRESETS, findPresetByName, applyPreset } from '../utils/presets'

// ── Audio engine ──────────────────────────────────────────────────

const {
  isPlaying,
  masterVolume,
  resumeContext,
  playAll,
  stopAll,
  setMasterVolume,
} = useAudioEngine()

// ── Local state ───────────────────────────────────────────────────

/** Currently selected preset name (empty string = none). */
const selectedPresetName = ref('')

// ── Computed ──────────────────────────────────────────────────────

/** Master volume as a slider value (0–100). */
const volumeSliderValue = computed(() => Math.round(masterVolume.value * 100))

/** Master volume as a display percentage. */
const volumePercent = computed(() => Math.round(masterVolume.value * 100))

// ── Event handlers ────────────────────────────────────────────────

/**
 * Toggles between playing all tracks and stopping all tracks.
 */
async function onTogglePlayAll(): Promise<void> {
  await resumeContext()
  if (isPlaying.value) {
    stopAll()
  } else {
    playAll()
  }
}

/**
 * Handles master volume slider input.
 *
 * @param event - The input event from the range slider.
 */
function onVolumeInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10) / 100
  setMasterVolume(value)
}

/**
 * Handles preset selector change.
 *
 * @param event - The change event from the select element.
 */
async function onPresetChange(event: Event): Promise<void> {
  const target = event.target as HTMLSelectElement
  const name = target.value
  selectedPresetName.value = name

  if (!name) return

  const preset = findPresetByName(name)
  if (preset) {
    await resumeContext()
    applyPreset(preset)
  }
}
</script>
