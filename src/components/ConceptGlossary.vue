<script setup lang="ts">
/**
 * ConceptGlossary — Slide-out glossary panel with all core concepts.
 *
 * Uses Radix-Vue Dialog for the overlay and Accordion for collapsible
 * concept sections. Includes a search input to filter concepts.
 */
import { ref, computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from 'radix-vue'
import { CONCEPTS, searchConcepts } from '../utils/concepts'

const props = defineProps<{
  /** Whether the glossary panel is open. */
  open: boolean
}>()

const emit = defineEmits<{
  /** Emitted to update the open state. */
  'update:open': [value: boolean]
}>()

/** Current search query for filtering concepts. */
const searchQuery = ref('')

/** Filtered list of concepts based on search query. */
const filteredConcepts = computed(() => searchConcepts(searchQuery.value))

/** Handle dialog open state changes. */
function handleOpenChange(value: boolean): void {
  emit('update:open', value)
  if (!value) {
    searchQuery.value = ''
  }
}

/** Format explanation text — convert newlines to paragraph breaks. */
function formatExplanation(text: string): string[] {
  return text.split('\n\n')
}

/** Find the title of a related concept by its ID. */
function getRelatedTitle(id: string): string {
  const found = CONCEPTS.find((c) => c.id === id)
  return found ? found.title : id
}
</script>

<template>
  <DialogRoot :open="props.open" @update:open="handleOpenChange">
    <DialogPortal>
      <!-- Backdrop overlay -->
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />

      <!-- Slide-out panel -->
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-gray-800 shadow-2xl"
        data-testid="glossary-panel"
      >
        <!-- Panel header -->
        <div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <DialogTitle class="text-lg font-bold text-white">
            Concept Glossary
          </DialogTitle>
          <DialogClose
            class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            aria-label="Close glossary"
            data-testid="glossary-close"
          >
            X
          </DialogClose>
        </div>

        <!-- Search input -->
        <div class="border-b border-gray-700 px-5 py-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search concepts..."
            class="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400"
            data-testid="glossary-search"
          />
        </div>

        <!-- Concept list -->
        <div class="flex-1 overflow-y-auto px-5 py-3">
          <p
            v-if="filteredConcepts.length === 0"
            class="py-4 text-center text-sm text-gray-400"
            data-testid="no-results"
          >
            No concepts match your search.
          </p>

          <AccordionRoot type="multiple" class="space-y-2">
            <AccordionItem
              v-for="concept in filteredConcepts"
              :key="concept.id"
              :value="concept.id"
              class="rounded-lg border border-gray-700 bg-gray-750"
              style="background-color: rgb(31 36 46)"
              :data-testid="`concept-${concept.id}`"
            >
              <AccordionHeader>
                <AccordionTrigger
                  class="group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:text-blue-300"
                >
                  <div>
                    <div>{{ concept.title }}</div>
                    <div class="mt-1 text-xs font-normal text-gray-400">
                      {{ concept.shortDescription }}
                    </div>
                  </div>
                  <span
                    class="ml-2 shrink-0 text-gray-500 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  >
                    v
                  </span>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent
                class="overflow-hidden px-4 pb-4 text-sm leading-relaxed text-gray-300 data-[state=open]:animate-in data-[state=open]:fade-in-0"
              >
                <p
                  v-for="(paragraph, idx) in formatExplanation(concept.fullExplanation)"
                  :key="idx"
                  class="mt-2"
                >
                  {{ paragraph }}
                </p>

                <!-- Related concepts -->
                <div
                  v-if="concept.relatedConcepts && concept.relatedConcepts.length > 0"
                  class="mt-3 flex flex-wrap gap-1.5"
                >
                  <span class="text-xs text-gray-500">Related:</span>
                  <span
                    v-for="relatedId in concept.relatedConcepts"
                    :key="relatedId"
                    class="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-blue-300"
                  >
                    {{ getRelatedTitle(relatedId) }}
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
