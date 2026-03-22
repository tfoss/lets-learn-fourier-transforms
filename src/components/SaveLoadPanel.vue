<script setup lang="ts">
/**
 * SaveLoadPanel — Panel wrapper for save/load configuration UI.
 *
 * Contains a "Save Current" button that opens the SaveConfigDialog,
 * and the ConfigList showing all saved configurations.
 */

import { ref } from 'vue'
import { useSavedConfigs } from '../composables/useSavedConfigs'
import SaveConfigDialog from './SaveConfigDialog.vue'
import ConfigList from './ConfigList.vue'

const {
  savedConfigs,
  saveCurrentConfig,
  loadConfig,
  deleteConfig,
  renameConfig,
  duplicateConfig,
  exportConfig,
  importConfig,
} = useSavedConfigs()

/** Whether the save dialog is currently open. */
const isSaveDialogOpen = ref(false)

/**
 * Opens the save configuration dialog.
 */
function openSaveDialog(): void {
  isSaveDialogOpen.value = true
}

/**
 * Handles the save event from the dialog.
 *
 * @param name - The user-provided configuration name.
 */
function handleSave(name: string): void {
  saveCurrentConfig(name)
}

/**
 * Handles loading a configuration.
 *
 * @param id - The id of the configuration to load.
 */
function handleLoad(id: string): void {
  loadConfig(id)
}

/**
 * Handles renaming a configuration.
 *
 * @param id - The id of the configuration to rename.
 * @param newName - The new name.
 */
function handleRename(id: string, newName: string): void {
  renameConfig(id, newName)
}

/**
 * Handles duplicating a configuration.
 *
 * @param id - The id of the configuration to duplicate.
 */
function handleDuplicate(id: string): void {
  duplicateConfig(id)
}

/**
 * Handles exporting a configuration.
 *
 * @param id - The id of the configuration to export.
 */
function handleExport(id: string): void {
  exportConfig(id)
}

/**
 * Handles deleting a configuration.
 *
 * @param id - The id of the configuration to delete.
 */
function handleDelete(id: string): void {
  deleteConfig(id)
}

/**
 * Handles importing a configuration from a file.
 *
 * @param file - The file to import.
 */
async function handleImport(file: File): Promise<void> {
  try {
    await importConfig(file)
  } catch {
    // Import failed — could show toast in the future
  }
}
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="save-load-panel">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-white">Saved Configurations</h3>
      <button
        class="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500 transition-colors"
        data-testid="save-current-btn"
        @click="openSaveDialog"
      >
        Save Current
      </button>
    </div>

    <ConfigList
      :configs="savedConfigs"
      @load="handleLoad"
      @rename="handleRename"
      @duplicate="handleDuplicate"
      @export="handleExport"
      @delete="handleDelete"
      @import="handleImport"
    />

    <SaveConfigDialog
      :open="isSaveDialogOpen"
      @update:open="isSaveDialogOpen = $event"
      @save="handleSave"
    />
  </div>
</template>
