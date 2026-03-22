<script setup lang="ts">
/**
 * GuidedModeWrapper — Conditionally renders guided or sandbox content.
 *
 * When mode is 'guided', shows the GuidedStepView with step-specific
 * controls. When mode is 'sandbox', shows the full sandbox UI with
 * all controls unlocked.
 */

import type { AppMode } from '../types/ui'
import GuidedStepView from './GuidedStepView.vue'
import MasterControls from './MasterControls.vue'
import TrackControlList from './TrackControlList.vue'
import TrackList from './TrackList.vue'

defineProps<{
  /** Current application mode. */
  mode: AppMode
}>()
</script>

<template>
  <div data-testid="guided-mode-wrapper">
    <!-- Guided mode: step-by-step tutorial -->
    <GuidedStepView v-if="mode === 'guided'" />

    <!-- Sandbox mode: full controls -->
    <div v-else class="flex flex-col gap-4 p-4" data-testid="sandbox-content">
      <MasterControls />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrackControlList />
        <TrackList />
      </div>
    </div>
  </div>
</template>
