<script setup lang="ts">
/**
 * AudioFileUpload — Drag-and-drop audio file upload component.
 *
 * Provides a drop zone and file picker for loading audio files (.wav, .mp3, .ogg).
 * Displays file metadata (name, duration, size) after successful loading.
 * Shows loading indicator during decoding and error messages for invalid files.
 */
import { ref, computed } from 'vue'
import { useAudioFilePlayer } from '../composables/useAudioFilePlayer'
import { formatTime, formatFileSize } from '../utils/time-format'

const emit = defineEmits<{
  /** Emitted when an audio file is successfully loaded and decoded. */
  'file-loaded': [buffer: AudioBuffer, fileName: string]
}>()

const { loadAudioFile } = useAudioFilePlayer()

const isDragOver = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const loadedFileName = ref('')
const loadedFileSize = ref(0)
const loadedDuration = ref(0)

/** Accepted audio MIME types. */
const ACCEPTED_TYPES = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/x-wav', 'audio/wave']

/** Accepted file extensions. */
const ACCEPTED_EXTENSIONS = '.wav,.mp3,.ogg'

/** Whether a file has been successfully loaded. */
const hasLoadedFile = computed(() => loadedFileName.value !== '')

/** Formatted duration of the loaded file. */
const formattedDuration = computed(() => formatTime(loadedDuration.value))

/** Formatted file size of the loaded file. */
const formattedFileSize = computed(() => formatFileSize(loadedFileSize.value))

/**
 * Validates that a file is an accepted audio format.
 *
 * @param file - The file to validate.
 * @returns True if the file is an accepted audio type.
 */
function isValidAudioFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) {
    return true
  }
  // Fallback: check file extension
  const name = file.name.toLowerCase()
  return name.endsWith('.wav') || name.endsWith('.mp3') || name.endsWith('.ogg')
}

/**
 * Processes a selected or dropped file.
 *
 * @param file - The File object to load.
 */
async function handleFile(file: File): Promise<void> {
  errorMessage.value = ''

  if (!isValidAudioFile(file)) {
    errorMessage.value = `Unsupported file type. Please select a .wav, .mp3, or .ogg file.`
    return
  }

  isLoading.value = true

  try {
    const buffer = await loadAudioFile(file)
    loadedFileName.value = file.name
    loadedFileSize.value = file.size
    loadedDuration.value = buffer.duration
    emit('file-loaded', buffer, file.name)
  } catch (err) {
    errorMessage.value = `Failed to decode audio file: ${err instanceof Error ? err.message : 'Unknown error'}`
  } finally {
    isLoading.value = false
  }
}

/**
 * Handles the file input change event.
 *
 * @param event - The native input change event.
 */
function onFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    handleFile(file)
  }
  // Reset so re-selecting the same file triggers change
  input.value = ''
}

/** Handles dragenter event on the drop zone. */
function onDragEnter(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

/** Handles dragover event on the drop zone. */
function onDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

/** Handles dragleave event on the drop zone. */
function onDragLeave(): void {
  isDragOver.value = false
}

/** Handles drop event on the drop zone. */
function onDrop(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer?.files?.[0]
  if (file) {
    handleFile(file)
  }
}
</script>

<template>
  <div data-testid="audio-file-upload">
    <!-- Drop zone -->
    <div
      data-testid="drop-zone"
      class="relative rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      :class="[
        isDragOver
          ? 'border-blue-400 bg-blue-400/10'
          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500',
      ]"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- Loading state -->
      <div v-if="isLoading" data-testid="loading-indicator" class="flex flex-col items-center gap-2">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        <span class="text-sm text-gray-400">Decoding audio...</span>
      </div>

      <!-- Default upload prompt -->
      <div v-else class="flex flex-col items-center gap-3">
        <svg
          class="h-10 w-10 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"
          />
        </svg>

        <p class="text-sm text-gray-400">
          Drag &amp; drop an audio file here, or
        </p>

        <label
          class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Choose Audio File
          <input
            type="file"
            class="hidden"
            :accept="ACCEPTED_EXTENSIONS"
            data-testid="file-input"
            @change="onFileInputChange"
          />
        </label>

        <p class="text-xs text-gray-500">Supports WAV, MP3, OGG</p>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      data-testid="error-message"
      class="mt-2 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400"
    >
      {{ errorMessage }}
    </div>

    <!-- Loaded file info -->
    <div
      v-if="hasLoadedFile && !isLoading"
      data-testid="file-info"
      class="mt-3 flex items-center justify-between rounded-md bg-gray-700/50 px-3 py-2 text-sm"
    >
      <span class="truncate font-medium text-gray-200" data-testid="file-name">
        {{ loadedFileName }}
      </span>
      <div class="flex gap-3 text-gray-400">
        <span data-testid="file-duration">{{ formattedDuration }}</span>
        <span data-testid="file-size">{{ formattedFileSize }}</span>
      </div>
    </div>
  </div>
</template>
