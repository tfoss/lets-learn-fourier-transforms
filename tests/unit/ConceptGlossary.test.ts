import { describe, it, expect, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import ConceptGlossary from '../../src/components/ConceptGlossary.vue'
import { CONCEPTS } from '../../src/utils/concepts'

/**
 * Stub for DialogPortal that renders children inline instead of teleporting.
 * This lets wrapper.find() access the dialog content in tests.
 */
const DialogPortalStub = {
  name: 'DialogPortal',
  setup(_: unknown, { slots }: { slots: Record<string, () => unknown> }) {
    return () => (slots.default ? slots.default() : null)
  },
}

/**
 * Stub for DialogOverlay to avoid DOM side effects in tests.
 */
const DialogOverlayStub = {
  name: 'DialogOverlay',
  setup() {
    return () => h('div', { 'data-testid': 'overlay' })
  },
}

function mountGlossary(open: boolean): VueWrapper {
  return mount(ConceptGlossary, {
    props: { open },
    global: {
      stubs: {
        DialogPortal: DialogPortalStub,
        DialogOverlay: DialogOverlayStub,
      },
    },
  })
}

describe('ConceptGlossary', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders the glossary panel when open', () => {
    wrapper = mountGlossary(true)
    const panel = wrapper.find('[data-testid="glossary-panel"]')
    expect(panel.exists()).toBe(true)
  })

  it('renders all 11 concept titles when open', () => {
    wrapper = mountGlossary(true)
    const text = wrapper.text()
    expect(CONCEPTS.length).toBe(11)
    for (const concept of CONCEPTS) {
      expect(text).toContain(concept.title)
    }
  })

  it('renders the dialog title', () => {
    wrapper = mountGlossary(true)
    expect(wrapper.text()).toContain('Concept Glossary')
  })

  it('has a search input', () => {
    wrapper = mountGlossary(true)
    const searchInput = wrapper.find('[data-testid="glossary-search"]')
    expect(searchInput.exists()).toBe(true)
  })

  it('does not render glossary content when closed', () => {
    wrapper = mountGlossary(false)
    const panel = wrapper.find('[data-testid="glossary-panel"]')
    expect(panel.exists()).toBe(false)
  })

  it('has a close button', () => {
    wrapper = mountGlossary(true)
    const closeBtn = wrapper.find('[data-testid="glossary-close"]')
    expect(closeBtn.exists()).toBe(true)
  })
})
