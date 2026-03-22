/**
 * Tests for the TrackWaveform component.
 *
 * Verifies track label rendering and correct prop passing to WaveformCanvas.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackWaveform from '../../src/components/TrackWaveform.vue'
import type { TrackConfig } from '../../src/types/audio'
import { createTrackId, DEFAULT_ENVELOPE } from '../../src/types/audio'

/**
 * Creates a test TrackConfig with sensible defaults.
 *
 * @param overrides - Partial TrackConfig to override defaults.
 * @returns A complete TrackConfig.
 */
function createTestTrack(overrides: Partial<TrackConfig> = {}): TrackConfig {
  return {
    id: createTrackId('test-track-0'),
    frequency: 440,
    amplitude: 0.5,
    waveformType: 'sine',
    phase: 0,
    duration: 0,
    color: '#3b82f6',
    isMuted: false,
    isSolo: false,
    envelope: { ...DEFAULT_ENVELOPE },
    ...overrides,
  }
}

describe('TrackWaveform', () => {
  it('renders the component wrapper', () => {
    const track = createTestTrack()
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 0 },
    })
    expect(wrapper.find('[data-testid="track-waveform"]').exists()).toBe(true)
  })

  it('shows track label with index, note name, and frequency', () => {
    const track = createTestTrack({ frequency: 440 })
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 0 },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('Track 1')
    expect(label.text()).toContain('A4')
    expect(label.text()).toContain('440Hz')
  })

  it('uses 1-based track numbering', () => {
    const track = createTestTrack()
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 2 },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.text()).toContain('Track 3')
  })

  it('renders a canvas element via WaveformCanvas', () => {
    const track = createTestTrack()
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 0 },
    })
    expect(wrapper.find('[data-testid="waveform-canvas"]').exists()).toBe(true)
  })

  it('applies the track color to the label', () => {
    const track = createTestTrack({ color: '#ef4444' })
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 0 },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.attributes('style')).toContain('color')
  })

  it('handles non-standard frequencies in the label', () => {
    const track = createTestTrack({ frequency: 261.63 })
    const wrapper = mount(TrackWaveform, {
      props: { track, trackIndex: 0 },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.text()).toContain('Track 1')
    expect(label.text()).toContain('262Hz')
  })
})
