<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from './components/AppLayout.vue'
import ConceptGlossary from './components/ConceptGlossary.vue'
import type { AppMode } from './types/ui'

const mode = ref<AppMode>('sandbox')
const glossaryOpen = ref(false)
</script>

<template>
  <AppLayout :mode="mode" @update:mode="mode = $event" @open-glossary="glossaryOpen = true">
    <template #tracks>
      <div class="p-4 text-gray-400 italic">Wave tracks will appear here...</div>
    </template>
    <template #fft>
      <div class="p-4 text-gray-400 italic">FFT visualization will appear here...</div>
    </template>
  </AppLayout>
  <ConceptGlossary v-model:open="glossaryOpen" />
</template>
