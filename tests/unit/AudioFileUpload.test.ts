import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioFileUpload from '../../src/components/AudioFileUpload.vue'

// Mock the useAudioFilePlayer composable
vi.mock('../../src/composables/useAudioFilePlayer', () => ({
  useAudioFilePlayer: () => ({
    loadAudioFile: vi.fn(),
    isPlaying: { value: false },
    currentTime: { value: 0 },
    duration: { value: 0 },
    audioBuffer: { value: null },
    playAudioBuffer: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    cleanup: vi.fn(),
  }),
}))

describe('AudioFileUpload', () => {
  it('renders the drop zone', () => {
    const wrapper = mount(AudioFileUpload)
    const dropZone = wrapper.find('[data-testid="drop-zone"]')
    expect(dropZone.exists()).toBe(true)
  })

  it('renders the file input with correct accept attribute', () => {
    const wrapper = mount(AudioFileUpload)
    const input = wrapper.find('[data-testid="file-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('accept')).toBe('.wav,.mp3,.ogg')
  })

  it('renders the Choose Audio File button text', () => {
    const wrapper = mount(AudioFileUpload)
    expect(wrapper.text()).toContain('Choose Audio File')
  })

  it('renders supported formats text', () => {
    const wrapper = mount(AudioFileUpload)
    expect(wrapper.text()).toContain('Supports WAV, MP3, OGG')
  })

  it('does not show file info initially', () => {
    const wrapper = mount(AudioFileUpload)
    const fileInfo = wrapper.find('[data-testid="file-info"]')
    expect(fileInfo.exists()).toBe(false)
  })

  it('does not show error message initially', () => {
    const wrapper = mount(AudioFileUpload)
    const error = wrapper.find('[data-testid="error-message"]')
    expect(error.exists()).toBe(false)
  })

  it('does not show loading indicator initially', () => {
    const wrapper = mount(AudioFileUpload)
    const loading = wrapper.find('[data-testid="loading-indicator"]')
    expect(loading.exists()).toBe(false)
  })

  it('applies drag-over styling on dragenter', async () => {
    const wrapper = mount(AudioFileUpload)
    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragenter', { preventDefault: vi.fn() })

    expect(dropZone.classes()).toContain('border-blue-400')
  })

  it('removes drag-over styling on dragleave', async () => {
    const wrapper = mount(AudioFileUpload)
    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragenter', { preventDefault: vi.fn() })
    await dropZone.trigger('dragleave')

    expect(dropZone.classes()).toContain('border-gray-600')
  })

  it('removes drag-over styling on drop', async () => {
    const wrapper = mount(AudioFileUpload)
    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragenter', { preventDefault: vi.fn() })
    await dropZone.trigger('drop', {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] },
    })

    expect(dropZone.classes()).toContain('border-gray-600')
  })

  it('has hidden file input', () => {
    const wrapper = mount(AudioFileUpload)
    const input = wrapper.find('[data-testid="file-input"]')
    expect(input.classes()).toContain('hidden')
  })
})
