/**
 * Tests for the ConfigList component.
 *
 * Verifies list rendering, empty state, action buttons, and import functionality.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfigList from '../../src/components/ConfigList.vue'
import type { SavedConfiguration } from '../../src/types/saved-config'

// ── Test data factories ─────────────────────────────────────────────

function createTestConfig(overrides: Partial<SavedConfiguration> = {}): SavedConfiguration {
  return {
    id: 'test-id-1',
    name: 'Test Config',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    masterVolume: 0.8,
    timeScaleMs: 23.2,
    tracks: [
      {
        frequency: 440,
        amplitude: 0.5,
        waveformType: 'sine',
        phase: 0,
        duration: 0,
        isMuted: false,
        isSolo: false,
        envelope: {
          enabled: false,
          attack: 0.01,
          decay: 0.3,
          sustain: 0.5,
          release: 0.3,
        },
      },
    ],
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('ConfigList', () => {
  describe('empty state', () => {
    it('shows the empty message when configs array is empty', () => {
      const wrapper = mount(ConfigList, { props: { configs: [] } })
      expect(wrapper.find('[data-testid="config-list-empty"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('No saved configurations yet')
    })

    it('does not show config items when empty', () => {
      const wrapper = mount(ConfigList, { props: { configs: [] } })
      expect(wrapper.find('[data-testid="config-item"]').exists()).toBe(false)
    })
  })

  describe('with configs', () => {
    it('renders config items for each configuration', () => {
      const configs = [
        createTestConfig({ id: 'id-1', name: 'First' }),
        createTestConfig({ id: 'id-2', name: 'Second' }),
      ]
      const wrapper = mount(ConfigList, { props: { configs } })
      const items = wrapper.findAll('[data-testid="config-item"]')
      expect(items).toHaveLength(2)
    })

    it('displays the configuration name', () => {
      const wrapper = mount(ConfigList, {
        props: { configs: [createTestConfig({ name: 'My Setup' })] },
      })
      expect(wrapper.find('[data-testid="config-name"]').text()).toBe('My Setup')
    })

    it('displays the track count', () => {
      const wrapper = mount(ConfigList, {
        props: { configs: [createTestConfig()] },
      })
      expect(wrapper.find('[data-testid="config-track-count"]').text()).toContain('1 track')
    })

    it('pluralizes track count correctly', () => {
      const config = createTestConfig({
        tracks: [
          { frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0, duration: 0, isMuted: false, isSolo: false, envelope: { enabled: false, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 } },
          { frequency: 880, amplitude: 0.5, waveformType: 'sine', phase: 0, duration: 0, isMuted: false, isSolo: false, envelope: { enabled: false, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 } },
        ],
      })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      expect(wrapper.find('[data-testid="config-track-count"]').text()).toContain('2 tracks')
    })

    it('displays the date', () => {
      const wrapper = mount(ConfigList, {
        props: { configs: [createTestConfig()] },
      })
      expect(wrapper.find('[data-testid="config-date"]').exists()).toBe(true)
    })

    it('does not show the empty message', () => {
      const wrapper = mount(ConfigList, {
        props: { configs: [createTestConfig()] },
      })
      expect(wrapper.find('[data-testid="config-list-empty"]').exists()).toBe(false)
    })
  })

  describe('action buttons', () => {
    it('emits load event when Load is clicked', async () => {
      const config = createTestConfig({ id: 'load-test' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-load-btn"]').trigger('click')
      expect(wrapper.emitted('load')).toEqual([['load-test']])
    })

    it('emits duplicate event when Duplicate is clicked', async () => {
      const config = createTestConfig({ id: 'dup-test' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-duplicate-btn"]').trigger('click')
      expect(wrapper.emitted('duplicate')).toEqual([['dup-test']])
    })

    it('emits export event when Export is clicked', async () => {
      const config = createTestConfig({ id: 'export-test' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-export-btn"]').trigger('click')
      expect(wrapper.emitted('export')).toEqual([['export-test']])
    })

    it('emits delete event when Delete is clicked', async () => {
      const config = createTestConfig({ id: 'delete-test' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-delete-btn"]').trigger('click')
      expect(wrapper.emitted('delete')).toEqual([['delete-test']])
    })
  })

  describe('rename flow', () => {
    it('shows rename input when Rename is clicked', async () => {
      const config = createTestConfig({ id: 'rename-test', name: 'Original' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-rename-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="config-rename-input"]').exists()).toBe(true)
    })

    it('emits rename event when confirmed', async () => {
      const config = createTestConfig({ id: 'rename-test', name: 'Original' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-rename-btn"]').trigger('click')

      const input = wrapper.find('[data-testid="config-rename-input"]')
      await input.setValue('New Name')
      await wrapper.find('[data-testid="config-rename-confirm"]').trigger('click')

      expect(wrapper.emitted('rename')).toEqual([['rename-test', 'New Name']])
    })

    it('hides rename input when cancelled', async () => {
      const config = createTestConfig({ id: 'rename-test' })
      const wrapper = mount(ConfigList, { props: { configs: [config] } })
      await wrapper.find('[data-testid="config-rename-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="config-rename-input"]').exists()).toBe(true)

      await wrapper.find('[data-testid="config-rename-cancel"]').trigger('click')
      expect(wrapper.find('[data-testid="config-rename-input"]').exists()).toBe(false)
    })
  })

  describe('import', () => {
    it('renders the import button', () => {
      const wrapper = mount(ConfigList, { props: { configs: [] } })
      expect(wrapper.find('[data-testid="config-import-btn"]').exists()).toBe(true)
    })

    it('has a hidden file input for import', () => {
      const wrapper = mount(ConfigList, { props: { configs: [] } })
      const input = wrapper.find('[data-testid="config-import-input"]')
      expect(input.exists()).toBe(true)
    })
  })
})
