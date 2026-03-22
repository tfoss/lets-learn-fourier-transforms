<script setup lang="ts">
/**
 * SaveConfigDialog — Modal dialog for saving the current configuration.
 *
 * Provides a text input for the configuration name and Save/Cancel buttons.
 * Uses Radix-Vue Dialog for accessible modal behavior.
 */

import { ref } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue'

const props = defineProps<{
  /** Whether the dialog is open. */
  open: boolean
}>()

const emit = defineEmits<{
  /** Emitted to update the open state. */
  'update:open': [value: boolean]
  /** Emitted when the user confirms the save. */
  'save': [name: string]
}>()

/** The user-entered configuration name. */
const configName = ref('')

/**
 * Handles dialog open state changes from Radix-Vue.
 *
 * @param value - The new open state.
 */
function handleOpenChange(value: boolean): void {
  if (!value) {
    configName.value = ''
  }
  emit('update:open', value)
}

/**
 * Handles the save action.
 *
 * Trims the name, emits the save event, and closes the dialog.
 */
function handleSave(): void {
  const trimmed = configName.value.trim()
  if (!trimmed) return
  emit('save', trimmed)
  configName.value = ''
  emit('update:open', false)
}

/**
 * Handles the cancel action.
 */
function handleCancel(): void {
  configName.value = ''
  emit('update:open', false)
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 bg-black/50 z-40"
        data-testid="save-config-overlay"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl"
        data-testid="save-config-dialog"
      >
        <DialogTitle class="text-lg font-semibold text-white mb-4">
          Save Configuration
        </DialogTitle>

        <div class="flex flex-col gap-4">
          <div>
            <label
              for="config-name-input"
              class="block text-sm text-gray-400 mb-1"
            >
              Configuration Name
            </label>
            <input
              id="config-name-input"
              v-model="configName"
              type="text"
              class="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="My Configuration"
              data-testid="config-name-input"
              @keydown.enter="handleSave"
            />
          </div>

          <div class="flex justify-end gap-2">
            <DialogClose as-child>
              <button
                class="rounded px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="save-config-cancel"
                @click="handleCancel"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              class="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!configName.trim()"
              data-testid="save-config-confirm"
              @click="handleSave"
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
