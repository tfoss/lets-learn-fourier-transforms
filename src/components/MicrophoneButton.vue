<script setup lang="ts">
/**
 * MicrophoneButton — Toggle button for microphone input.
 *
 * Displays a mic icon with a pulsing indicator when actively listening.
 * Handles start/stop listening and shows permission-denied state.
 */
import { ref } from 'vue'
import { useMicrophone } from '../composables/useMicrophone'

const { isListening, isSupported, permissionState, startListening, stopListening } =
  useMicrophone()

/** Whether an error occurred (e.g., permission denied). */
const errorMessage = ref<string | null>(null)

/**
 * Toggles microphone listening on/off.
 * Catches and surfaces errors (permission denied, no mic, etc.).
 */
async function handleToggle(): Promise<void> {
  errorMessage.value = null

  if (isListening.value) {
    stopListening()
    return
  }

  try {
    await startListening()
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Microphone error'
  }
}
</script>

<template>
  <button
    :disabled="!isSupported"
    :aria-label="isListening ? 'Stop microphone' : 'Start microphone'"
    :title="
      !isSupported
        ? 'Microphone not supported'
        : permissionState === 'denied'
          ? 'Microphone permission denied'
          : isListening
            ? 'Stop microphone'
            : 'Start microphone'
    "
    class="relative flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    :class="[
      isListening
        ? 'bg-red-600 text-white hover:bg-red-500'
        : permissionState === 'denied'
          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
          : 'bg-gray-700 text-blue-300 hover:bg-gray-600 hover:text-blue-200',
    ]"
    data-testid="mic-toggle-btn"
    @click="handleToggle"
  >
    <!-- Pulsing dot when listening -->
    <span
      v-if="isListening"
      class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-400"
      data-testid="mic-listening-indicator"
    >
      <span
        class="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75"
      />
    </span>

    <!-- Mic icon (SVG) -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>

    <span>Mic</span>

    <!-- Permission denied indicator -->
    <span
      v-if="permissionState === 'denied'"
      class="text-xs text-red-400"
      data-testid="mic-denied-indicator"
    >
      (denied)
    </span>
  </button>
</template>
