import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AudioFilePanel from '../../src/components/AudioFilePanel.vue'

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no manifest')))

// Mock the useAudioFilePlayer composable
vi.mock('../../src/composables/useAudioFilePlayer', () => ({
  useAudioFilePlayer: () => ({
    isPlaying: ref(false),
    currentTime: ref(0),
    duration: ref(0),
    audioBuffer: ref(null),
    loadAudioFile: vi.fn(),
    playAudioBuffer: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    cleanup: vi.fn(),
  }),
}))

describe('AudioFilePanel', () => {
  it('renders the panel container', () => {
    const wrapper = mount(AudioFilePanel)
    const panel = wrapper.find('[data-testid="audio-file-panel"]')
    expect(panel.exists()).toBe(true)
  })

  it('renders the Load Audio section title', () => {
    const wrapper = mount(AudioFilePanel)
    expect(wrapper.text()).toContain('Load Audio')
  })

  it('renders the AudioFileUpload component', () => {
    const wrapper = mount(AudioFilePanel)
    const upload = wrapper.find('[data-testid="audio-file-upload"]')
    expect(upload.exists()).toBe(true)
  })

  it('renders the drop zone within upload', () => {
    const wrapper = mount(AudioFilePanel)
    const dropZone = wrapper.find('[data-testid="drop-zone"]')
    expect(dropZone.exists()).toBe(true)
  })

  it('does not render the player initially (no audio loaded)', () => {
    const wrapper = mount(AudioFilePanel)
    const player = wrapper.find('[data-testid="audio-file-player"]')
    expect(player.exists()).toBe(false)
  })

  it('does not show sample files when no manifest is available', () => {
    const wrapper = mount(AudioFilePanel)
    const samples = wrapper.find('[data-testid="sample-files"]')
    expect(samples.exists()).toBe(false)
  })
})
