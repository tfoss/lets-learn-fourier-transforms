<!--
  ShareButton -- Generates a shareable URL and copies it to the clipboard.

  Displays a share button that, when clicked, generates a URL encoding the
  current track configuration and copies it to the clipboard. Shows a brief
  "Copied!" confirmation and displays the URL for manual copying.
-->
<template>
  <div class="share-button-container relative flex items-center gap-2">
    <button
      class="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      data-testid="share-btn"
      @click="onShare"
    >
      Share
    </button>

    <div
      v-if="showUrl"
      class="flex items-center gap-2"
      data-testid="share-url-container"
    >
      <input
        type="text"
        readonly
        :value="shareUrl"
        class="w-48 rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 border border-gray-600"
        data-testid="share-url-input"
        @focus="selectAll"
      />
      <span
        v-if="showCopied"
        class="text-xs font-medium text-green-400"
        data-testid="copied-indicator"
      >
        Copied!
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ShareButton component.
 *
 * Generates a shareable URL from the current track configuration
 * and copies it to the clipboard with visual feedback.
 */

import { ref } from 'vue'
import { useShareUrl } from '../composables/useShareUrl'

/** Duration in ms to show the "Copied!" indicator. */
const COPIED_DISPLAY_MS = 2000

const { generateShareUrl, copyToClipboard } = useShareUrl()

/** The generated shareable URL. */
const shareUrl = ref('')

/** Whether to show the URL display area. */
const showUrl = ref(false)

/** Whether to show the "Copied!" confirmation. */
const showCopied = ref(false)

/** Timer ID for clearing the "Copied!" message. */
let copiedTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Handles the share button click.
 *
 * Generates the URL, copies to clipboard, and shows confirmation.
 */
async function onShare(): Promise<void> {
  shareUrl.value = generateShareUrl()
  showUrl.value = true

  const success = await copyToClipboard()
  if (success) {
    showCopiedIndicator()
  }
}

/**
 * Shows the "Copied!" indicator for a brief duration.
 */
function showCopiedIndicator(): void {
  showCopied.value = true
  if (copiedTimer !== null) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    showCopied.value = false
    copiedTimer = null
  }, COPIED_DISPLAY_MS)
}

/**
 * Selects all text in the URL input when focused.
 *
 * @param event - The focus event from the input element.
 */
function selectAll(event: FocusEvent): void {
  const target = event.target as HTMLInputElement
  target.select()
}
</script>
