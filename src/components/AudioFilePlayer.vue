<script setup lang="ts">
/**
 * AudioFilePlayer — Playback controls for loaded audio.
 *
 * Displays play/pause, stop, seek bar, and time information
 * for audio loaded via the useAudioFilePlayer composable.
 */
import { computed } from 'vue'
import { useAudioFilePlayer } from '../composables/useAudioFilePlayer'
import { formatTime } from '../utils/time-format'

const props = defineProps<{
  /** The loaded audio buffer, or null if no audio is loaded. */
  audioBuffer: AudioBuffer | null
  /** Name of the loaded audio file. */
  fileName: string
}>()

const { isPlaying, currentTime, duration, playAudioBuffer, pause, resume, stop, seek } =
  useAudioFilePlayer()

/** Whether any audio is loaded and available for playback. */
const hasAudio = computed(() => props.audioBuffer !== null)

/** Formatted current playback time. */
const formattedCurrentTime = computed(() => formatTime(currentTime.value))

/** Formatted total duration. */
const formattedDuration = computed(() => formatTime(duration.value))

/** Progress percentage (0–100) for the seek bar. */
const progressPercent = computed(() => {
  if (duration.value <= 0) return 0
  return clampPercent((currentTime.value / duration.value) * 100)
})

/**
 * Clamps a value between 0 and 100.
 *
 * @param value - The value to clamp.
 * @returns Clamped value.
 */
function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/** Toggles between play and pause. */
function togglePlayPause(): void {
  if (!props.audioBuffer) return

  if (isPlaying.value) {
    pause()
  } else {
    if (currentTime.value >= duration.value) {
      seek(0)
    }
    resume()
    // If resume didn't start (no previous buffer), play directly
    if (!isPlaying.value) {
      playAudioBuffer(props.audioBuffer)
    }
  }
}

/** Stops playback and resets to beginning. */
function handleStop(): void {
  stop()
}

/**
 * Handles click on the seek bar to jump to a position.
 *
 * @param event - The mouse click event on the seek bar.
 */
function handleSeekBarClick(event: MouseEvent): void {
  const bar = event.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  const targetTime = percent * duration.value
  seek(targetTime)
}
</script>

<template>
  <div data-testid="audio-file-player" class="flex flex-col gap-3">
    <!-- No audio loaded state -->
    <div
      v-if="!hasAudio"
      data-testid="no-audio-message"
      class="rounded-md bg-gray-800/50 px-4 py-6 text-center text-sm text-gray-500"
    >
      No audio loaded
    </div>

    <!-- Player controls -->
    <template v-else>
      <!-- File name display -->
      <div class="text-sm font-medium text-gray-300" data-testid="player-file-name">
        {{ fileName }}
      </div>

      <!-- Seek bar -->
      <div
        data-testid="seek-bar"
        class="group relative h-2 cursor-pointer rounded-full bg-gray-700"
        role="slider"
        :aria-valuenow="currentTime"
        :aria-valuemin="0"
        :aria-valuemax="duration"
        aria-label="Seek"
        @click="handleSeekBarClick"
      >
        <div
          class="h-full rounded-full bg-blue-500 transition-all"
          :style="{ width: `${progressPercent}%` }"
          data-testid="seek-bar-progress"
        />
      </div>

      <!-- Time display -->
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span data-testid="current-time">{{ formattedCurrentTime }}</span>
        <span data-testid="total-duration">{{ formattedDuration }}</span>
      </div>

      <!-- Transport controls -->
      <div class="flex items-center gap-2">
        <!-- Play/Pause button -->
        <button
          data-testid="play-pause-button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          @click="togglePlayPause"
        >
          <!-- Pause icon -->
          <svg
            v-if="isPlaying"
            class="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <!-- Play icon -->
          <svg
            v-else
            class="ml-0.5 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>

        <!-- Stop button -->
        <button
          data-testid="stop-button"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-gray-300 transition-colors hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Stop"
          @click="handleStop"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>
