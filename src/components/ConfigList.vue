<script setup lang="ts">
/**
 * ConfigList — Displays a scrollable list of saved configurations.
 *
 * Each item shows the name, date, and track count, with action buttons
 * for Load, Rename, Duplicate, Export, and Delete. Includes an Import
 * button and an empty state message.
 */

import { ref } from 'vue'
import type { SavedConfiguration } from '../types/saved-config'

const props = defineProps<{
  /** Array of saved configurations to display. */
  configs: SavedConfiguration[]
}>()

const emit = defineEmits<{
  /** Emitted when the user clicks Load on a configuration. */
  'load': [id: string]
  /** Emitted when the user confirms a rename. */
  'rename': [id: string, newName: string]
  /** Emitted when the user clicks Duplicate. */
  'duplicate': [id: string]
  /** Emitted when the user clicks Export. */
  'export': [id: string]
  /** Emitted when the user clicks Delete. */
  'delete': [id: string]
  /** Emitted when the user selects a file to import. */
  'import': [file: File]
}>()

/** The id of the config currently being renamed, or null. */
const renamingId = ref<string | null>(null)

/** The current value in the rename input field. */
const renameValue = ref('')

/** Reference to the hidden file input for imports. */
const fileInputRef = ref<HTMLInputElement | null>(null)

/**
 * Formats an ISO date string for compact display.
 *
 * @param isoString - The ISO date string to format.
 * @returns Formatted date string.
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

/**
 * Starts inline rename mode for a configuration.
 *
 * @param config - The configuration to rename.
 */
function startRename(config: SavedConfiguration): void {
  renamingId.value = config.id
  renameValue.value = config.name
}

/**
 * Confirms the rename and emits the event.
 */
function confirmRename(): void {
  const trimmed = renameValue.value.trim()
  if (renamingId.value && trimmed) {
    emit('rename', renamingId.value, trimmed)
  }
  cancelRename()
}

/**
 * Cancels rename mode.
 */
function cancelRename(): void {
  renamingId.value = null
  renameValue.value = ''
}

/**
 * Opens the file picker for importing a configuration.
 */
function openFilePicker(): void {
  fileInputRef.value?.click()
}

/**
 * Handles file input change for importing.
 *
 * @param event - The change event from the file input.
 */
function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('import', file)
    target.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="config-list">
    <!-- Empty state -->
    <div
      v-if="configs.length === 0"
      class="py-6 text-center text-sm text-gray-500"
      data-testid="config-list-empty"
    >
      No saved configurations yet
    </div>

    <!-- Config items -->
    <div
      v-for="config in configs"
      :key="config.id"
      class="flex flex-col gap-1 rounded border border-gray-700 bg-gray-900 p-2"
      data-testid="config-item"
    >
      <!-- Name row (or rename input) -->
      <div class="flex items-center gap-2">
        <template v-if="renamingId === config.id">
          <input
            v-model="renameValue"
            type="text"
            class="flex-1 rounded bg-gray-700 border border-gray-600 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
            data-testid="config-rename-input"
            @keydown.enter="confirmRename"
            @keydown.escape="cancelRename"
          />
          <button
            class="text-xs text-green-400 hover:text-green-300"
            data-testid="config-rename-confirm"
            @click="confirmRename"
          >
            OK
          </button>
          <button
            class="text-xs text-gray-500 hover:text-gray-400"
            data-testid="config-rename-cancel"
            @click="cancelRename"
          >
            X
          </button>
        </template>
        <template v-else>
          <span class="flex-1 truncate text-sm font-medium text-white" data-testid="config-name">
            {{ config.name }}
          </span>
          <span class="text-xs text-gray-500" data-testid="config-track-count">
            {{ config.tracks.length }} {{ config.tracks.length === 1 ? 'track' : 'tracks' }}
          </span>
        </template>
      </div>

      <!-- Date row -->
      <div class="text-xs text-gray-500" data-testid="config-date">
        {{ formatDate(config.updatedAt) }}
      </div>

      <!-- Action buttons -->
      <div class="flex gap-1 mt-1">
        <button
          class="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500 transition-colors"
          data-testid="config-load-btn"
          @click="emit('load', config.id)"
        >
          Load
        </button>
        <button
          class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          data-testid="config-rename-btn"
          @click="startRename(config)"
        >
          Rename
        </button>
        <button
          class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          data-testid="config-duplicate-btn"
          @click="emit('duplicate', config.id)"
        >
          Duplicate
        </button>
        <button
          class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          data-testid="config-export-btn"
          @click="emit('export', config.id)"
        >
          Export
        </button>
        <button
          class="rounded bg-red-600/20 px-2 py-0.5 text-xs text-red-400 hover:bg-red-600/40 transition-colors"
          data-testid="config-delete-btn"
          @click="emit('delete', config.id)"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Import button -->
    <button
      class="mt-1 rounded border border-dashed border-gray-600 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
      data-testid="config-import-btn"
      @click="openFilePicker"
    >
      Import from file...
    </button>
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      class="hidden"
      data-testid="config-import-input"
      @change="handleFileChange"
    />
  </div>
</template>
