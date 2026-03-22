<!--
  EditableValue — Click-to-edit numeric value display.

  Shows a formatted value as text. When clicked, turns into an input field
  for direct numeric entry. Enter confirms, Escape cancels.
-->
<template>
  <span
    v-if="!isEditing"
    class="cursor-pointer rounded px-1 hover:bg-gray-600 transition-colors"
    :class="displayClass"
    :data-testid="testId"
    :title="'Click to edit'"
    @click="startEditing"
  >
    {{ displayValue }}
  </span>
  <input
    v-else
    ref="inputRef"
    type="number"
    :value="editValue"
    :min="min"
    :max="max"
    :step="step"
    class="w-20 rounded bg-gray-700 px-1 text-xs text-gray-100 outline-none ring-1 ring-blue-500"
    :data-testid="`${testId}-input`"
    @input="onInput"
    @keydown.enter="confirmEdit"
    @keydown.escape="cancelEdit"
    @blur="confirmEdit"
  />
</template>

<script setup lang="ts">
/**
 * EditableValue component.
 *
 * A text display that becomes an editable number input on click.
 * Validates and clamps the entered value to the min/max range.
 */

import { ref, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    /** The formatted string to display when not editing. */
    displayValue: string
    /** The raw numeric value for the input field. */
    modelValue: number
    /** Minimum allowed value. */
    min: number
    /** Maximum allowed value. */
    max: number
    /** Step increment for the input. */
    step?: number
    /** CSS class for the display text. */
    displayClass?: string
    /** Test ID prefix. */
    testId?: string
  }>(),
  {
    step: 1,
    displayClass: 'text-xs text-gray-200',
    testId: 'editable-value',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isEditing = ref(false)
const editValue = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

/**
 * Enters editing mode and focuses the input.
 */
async function startEditing(): Promise<void> {
  editValue.value = props.modelValue
  isEditing.value = true
  await nextTick()
  inputRef.value?.select()
}

/**
 * Updates the edit value as the user types.
 *
 * @param event - The input event.
 */
function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  editValue.value = parseFloat(target.value)
}

/**
 * Confirms the edit, clamps the value, and emits the update.
 */
function confirmEdit(): void {
  if (!isEditing.value) return
  isEditing.value = false

  let value = editValue.value
  if (isNaN(value)) return

  value = Math.max(props.min, Math.min(props.max, value))
  emit('update:modelValue', value)
}

/**
 * Cancels the edit without emitting a change.
 */
function cancelEdit(): void {
  isEditing.value = false
}
</script>
