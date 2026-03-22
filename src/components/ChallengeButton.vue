<script setup lang="ts">
/**
 * ChallengeButton — Header button that opens the ChallengePanel popover.
 *
 * Shows a trophy-styled button with a score badge when the user has
 * earned points. Uses Radix-Vue Popover for the panel overlay.
 */
import { computed } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverPortal } from 'radix-vue'
import { useChallenges } from '../composables/useChallenges'
import ChallengePanel from './ChallengePanel.vue'

const { totalScore } = useChallenges()

/** Whether to show the score badge on the button. */
const showBadge = computed(() => totalScore.value > 0)
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="relative rounded-full bg-gray-700 px-3 py-1.5 text-sm font-medium text-yellow-300 transition-colors hover:bg-gray-600 hover:text-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
      data-testid="challenge-btn"
    >
      Challenges
      <span
        v-if="showBadge"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-xs font-bold text-gray-900"
        data-testid="score-badge"
      >
        {{ totalScore }}
      </span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl"
        :side-offset="8"
        side="bottom"
        align="end"
        data-testid="challenge-popover"
      >
        <ChallengePanel />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
