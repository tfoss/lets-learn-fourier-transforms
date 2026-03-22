import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AudioFilePlayer from '../../src/components/AudioFilePlayer.vue'

// Mock the useAudioFilePlayer composable
const mockIsPlaying = ref(false)
const mockCurrentTime = ref(0)
const mockDuration = ref(120)

vi.mock('../../src/composables/useAudioFilePlayer', () => ({
  useAudioFilePlayer: () => ({
    isPlaying: mockIsPlaying,
    currentTime: mockCurrentTime,
    duration: mockDuration,
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

describe('AudioFilePlayer', () => {
  function createMockAudioBuffer(): AudioBuffer {
    return {
      duration: 120,
      length: 5292000,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: vi.fn(),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer
  }

  it('shows no-audio message when audioBuffer is null', () => {
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: null, fileName: '' },
    })
    const message = wrapper.find('[data-testid="no-audio-message"]')
    expect(message.exists()).toBe(true)
    expect(message.text()).toBe('No audio loaded')
  })

  it('does not show controls when audioBuffer is null', () => {
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: null, fileName: '' },
    })
    expect(wrapper.find('[data-testid="play-pause-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="stop-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="seek-bar"]').exists()).toBe(false)
  })

  it('shows controls when audioBuffer is provided', () => {
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })
    expect(wrapper.find('[data-testid="play-pause-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="stop-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="seek-bar"]').exists()).toBe(true)
  })

  it('displays the file name', () => {
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'my-song.mp3' },
    })
    const nameEl = wrapper.find('[data-testid="player-file-name"]')
    expect(nameEl.text()).toBe('my-song.mp3')
  })

  it('displays current time and total duration', () => {
    mockCurrentTime.value = 63
    mockDuration.value = 120

    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })

    const currentTimeEl = wrapper.find('[data-testid="current-time"]')
    const durationEl = wrapper.find('[data-testid="total-duration"]')

    expect(currentTimeEl.text()).toBe('1:03')
    expect(durationEl.text()).toBe('2:00')

    // Reset
    mockCurrentTime.value = 0
    mockDuration.value = 120
  })

  it('shows play button when not playing', () => {
    mockIsPlaying.value = false
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })
    const button = wrapper.find('[data-testid="play-pause-button"]')
    expect(button.attributes('aria-label')).toBe('Play')
  })

  it('shows pause button when playing', () => {
    mockIsPlaying.value = true
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })
    const button = wrapper.find('[data-testid="play-pause-button"]')
    expect(button.attributes('aria-label')).toBe('Pause')

    // Reset
    mockIsPlaying.value = false
  })

  it('renders the seek bar with slider role', () => {
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })
    const seekBar = wrapper.find('[data-testid="seek-bar"]')
    expect(seekBar.attributes('role')).toBe('slider')
    expect(seekBar.attributes('aria-label')).toBe('Seek')
  })

  it('stop button has correct aria-label', () => {
    const buffer = createMockAudioBuffer()
    const wrapper = mount(AudioFilePlayer, {
      props: { audioBuffer: buffer, fileName: 'test.wav' },
    })
    const stopBtn = wrapper.find('[data-testid="stop-button"]')
    expect(stopBtn.attributes('aria-label')).toBe('Stop')
  })
})
