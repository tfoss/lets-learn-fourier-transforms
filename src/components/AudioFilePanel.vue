<script setup lang="ts">
/**
 * AudioFilePanel — Container combining audio upload and player.
 *
 * Provides a "Load Audio" section with:
 * - AudioFileUpload for drag-and-drop or file picker
 * - Quick-load buttons for bundled sample files in public/audio/
 * - AudioFilePlayer for playback controls (visible after loading)
 */
import { ref, onMounted } from 'vue'
import AudioFileUpload from './AudioFileUpload.vue'
import AudioFilePlayer from './AudioFilePlayer.vue'
import { useAudioFilePlayer } from '../composables/useAudioFilePlayer'

/** Known sample audio files in public/audio/. */
const sampleFiles = ref<string[]>([])

const currentBuffer = ref<AudioBuffer | null>(null)
const currentFileName = ref('')

const { loadAudioFile } = useAudioFilePlayer()
const isLoadingSample = ref(false)

/**
 * Handles a successfully loaded audio file from the upload component.
 *
 * @param buffer - The decoded AudioBuffer.
 * @param fileName - Name of the loaded file.
 */
function onFileLoaded(buffer: AudioBuffer, fileName: string): void {
  currentBuffer.value = buffer
  currentFileName.value = fileName
}

/**
 * Fetches and loads a sample audio file from public/audio/.
 *
 * @param fileName - Name of the sample file to load.
 */
async function loadSampleFile(fileName: string): Promise<void> {
  isLoadingSample.value = true

  try {
    const response = await fetch(`/audio/${fileName}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}: ${response.status}`)
    }

    const blob = await response.blob()
    const file = new File([blob], fileName, { type: blob.type })
    const buffer = await loadAudioFile(file)

    currentBuffer.value = buffer
    currentFileName.value = fileName
  } catch (err) {
    console.error('Failed to load sample file:', err)
  } finally {
    isLoadingSample.value = false
  }
}

/**
 * Extracts a display name from a sample file name.
 *
 * Removes the extension and replaces hyphens/underscores with spaces.
 *
 * @param fileName - The file name to format.
 * @returns Human-readable display name.
 */
function sampleDisplayName(fileName: string): string {
  return fileName
    .replace(/\.(wav|mp3|ogg)$/i, '')
    .replace(/[-_]/g, ' ')
}

/**
 * Discovers available sample audio files by attempting to fetch a manifest.
 *
 * Checks for known audio files in public/audio/.
 */
async function discoverSampleFiles(): Promise<void> {
  try {
    const response = await fetch('/audio/manifest.json')
    if (response.ok) {
      const manifest = await response.json()
      if (Array.isArray(manifest)) {
        sampleFiles.value = manifest
      }
    }
  } catch {
    // No manifest available — that's fine, no samples to show
  }
}

onMounted(() => {
  discoverSampleFiles()
})
</script>

<template>
  <section data-testid="audio-file-panel" class="flex flex-col gap-4">
    <!-- Section title -->
    <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400">
      Load Audio
    </h2>

    <!-- File upload -->
    <AudioFileUpload @file-loaded="onFileLoaded" />

    <!-- Sample file buttons -->
    <div v-if="sampleFiles.length > 0" data-testid="sample-files" class="flex flex-col gap-2">
      <span class="text-xs font-medium text-gray-500">Sample Files</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sample in sampleFiles"
          :key="sample"
          data-testid="sample-file-button"
          class="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
          :disabled="isLoadingSample"
          @click="loadSampleFile(sample)"
        >
          {{ sampleDisplayName(sample) }}
        </button>
      </div>
    </div>

    <!-- Audio player (visible after loading) -->
    <AudioFilePlayer
      v-if="currentBuffer"
      :audio-buffer="currentBuffer"
      :file-name="currentFileName"
    />
  </section>
</template>
