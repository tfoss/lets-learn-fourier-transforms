# PROJECT.md — Project Brief

## One-liner

A web application to help a grade school student learn about Fourier Transforms and sound wave superposition.

## Problem

I'd like my son to be able to understand sound waves, how complex tones are generated, and then how FT decomposes those. This will be a web application that will allow him to generate multiple waves, be able to play them to hear the sounds of each wave, and then of combination of different waves with various parameters to adjust. I'd like him to also then be able to run an FFT of the resulting sound to show the resulting frequency domain plot. The app should be fun, aimed at a 10-14 year old audience, but a relatively quick precocious audience. I'd like to have clear linkage between the waves, the sounds, and the FFT. I'd also like to be able to load audio, play it, and show the FFT of the audio as it plays.

## Target Audience

A 10-14 year old who plays piano and violin. Musically literate — understands notes, pitch, and has an intuitive sense of how instruments sound different. Precocious and quick to pick up concepts, but needs concrete real-world anchors (instrument sounds, musical notes) rather than abstract math.

## Learning Flow

### Guided Mode (optional, run once)

A step-by-step walkthrough that builds understanding incrementally:

1. **Single sine wave** — see a pure tone, hear it, learn frequency and amplitude
2. **Change frequency** — slide the frequency and hear pitch go up/down; map to musical notes (e.g., A4 = 440Hz)
3. **Change amplitude** — learn that amplitude = volume
4. **Waveform types** — sine vs. square vs. sawtooth; hear how they sound different even at the same pitch
5. **Combine two waves** — add a second track, see superposition, hear the combined sound
6. **Constructive & destructive interference** — two waves at same frequency, adjust phase to cancel or reinforce
7. **Harmonics** — why a piano and violin sound different on the same note (different harmonic content)
8. **Introduce FFT** — run FFT on the combined sound; "aha, it pulls the component frequencies apart!"
9. **Load real audio** — load a clip, see the waveform, watch the FFT live as it plays

Each step has a brief, age-appropriate explanation of the concept before the interactive element.

### Sandbox Mode

After completing the guided mode (or skipping it), the user has full access to all features: multi-track wave generation, parameter controls, FFT, audio loading, presets, etc.

## Concepts to Teach

The app should surface clear, concise explanations of these concepts (in guided mode and as available help/tooltips in sandbox mode):

- **Frequency** — how many cycles per second (Hz); higher frequency = higher pitch
- **Amplitude** — how tall the wave is; bigger amplitude = louder sound
- **Phase** — where in its cycle a wave starts; matters when combining waves
- **Wavelength** — the physical length of one cycle
- **Waveform types** — sine (pure tone), square, triangle, sawtooth; and how non-sine waves are built from sine harmonics
- **Superposition** — waves add together; the combined waveform is the sum
- **Constructive/destructive interference** — when waves align vs. cancel
- **Harmonics and overtones** — why different instruments sound different on the same note
- **Time domain vs. frequency domain** — two ways to look at the same sound
- **FFT** — the algorithm that converts time domain to frequency domain; what the bins/peaks mean
- **Nyquist/sampling** — simplified: "we need lots of samples to capture a wave accurately"

## Core Behaviors

### Must-have

- High-performance web application with fast, high-quality graphing
- Generate sound wave plots and play the tones they define via Web Audio API
- Adjustable waveform parameters (see Parameters section below)
- Up to 8 simultaneous wave tracks, added incrementally (start with 1, add more as needed)
- Combined superposition waveform plot
- Each individual track playable on its own, plus the combined sound
- Static FFT analysis in sandbox mode — generate waves, compute FFT, display frequency domain
- Real-time FFT visualization when playing loaded audio files
- Color-coded visual linking: each track has a consistent color across time-domain and frequency-domain views
- Hover/select a frequency peak in FFT highlights the corresponding wave track
- Optional guided learning mode (see Learning Flow above)
- Sandbox mode with full feature access
- Sound presets for familiar instrument tones and musical concepts
- Load audio files (WAV, MP3, OGG), display waveform, show real-time FFT during playback
- Explanations of key concepts (frequency, amplitude, superposition, FFT, time vs. frequency domain)

### Nice-to-have

- Ability to generate a sound wave by "drawing" in an FFT frequency-domain window (inverse FFT)
- Spectrogram view (2D time-frequency heatmap) — especially compelling for loaded audio
- Microphone input — hum or whistle and see the FFT live
- Preset lessons/challenges — "Match this sound", "What note is this?", "Find the hidden frequency"
- Export/share — save a wave configuration as a shareable URL
- Save and reload generated sound configurations (localStorage/IndexedDB)

## Parameters

Each wave track exposes these adjustable parameters:

- **Frequency** (Hz) — range: 20Hz to 4000Hz; default: 440Hz (A4). Display musical note name alongside Hz value.
- **Amplitude** — range: 0 to 1; default: 0.5
- **Waveform type** — sine, square, triangle, sawtooth
- **Phase offset** (degrees or radians) — range: 0° to 360°; default: 0°
- **Duration** — how long the tone plays

### Presets

Include presets for sounds the audience would recognize:

- **Musical notes**: A4 (440Hz), middle C (261.6Hz), etc.
- **Instrument approximations**: piano-like tone (fundamental + harmonics with specific decay), violin-like tone (strong odd harmonics)
- **Intervals and chords**: perfect fifth, octave, major chord
- **Beat frequency**: two close frequencies producing audible "beats"
- **Tuning fork**: pure 440Hz sine wave

## Layout

- **Left/main area**: Wave tracks stacked vertically, each with its own waveform plot and controls. Combined superposition waveform at the bottom of the stack.
- **Right/side area**: FFT frequency-domain plot of the combined sound currently playing. This is a single graph showing the frequency content of whatever is being heard.
- Color-coding is consistent: Track 1's color in the waveform area matches its contribution shown in the FFT.
- No split-screen top/bottom layout. No animated time-to-frequency-domain transitions.

## Inputs / Outputs

### Inputs

- Audio file upload: WAV, MP3, OGG (decoded client-side via Web Audio API `decodeAudioData`)
- User-configured wave parameters via UI controls

### Outputs

- Visual: waveform plots, FFT frequency-domain plots, real-time visualizations
- Audio: playback of generated tones and loaded audio via Web Audio API
- Saved configurations (localStorage/IndexedDB) for reload

## Constraints

### Tech Stack

- **Frontend framework**: Vue.js (latest stable, Vue 3 with Composition API)
- **Language**: TypeScript
- **Build tool**: Vite
- **Audio engine**: Web Audio API (browser-native, no server-side audio processing)
  - `OscillatorNode` for tone generation
  - `AnalyserNode` for real-time FFT data
  - `decodeAudioData` for loading audio files
- **Visualization**: Canvas API for waveform rendering (performance-first). Use a lightweight canvas-based charting library (e.g., uPlot) if it helps. D3.js may be introduced later for more complex visualizations but is not needed for v1.
- **Storage**: localStorage or IndexedDB for saving/loading configurations. No backend database.
- **No backend server required**: The entire application runs client-side. Serve as static files.
- **Deployment**: Static file hosting (e.g., nginx serving the Vite build output). Docker is optional since there is no backend — a simple `npm run build` and static file serve is sufficient.

### Performance

- Waveform rendering must be smooth at 60fps during playback
- FFT updates should feel real-time (target 30+ updates/second for live audio)
- UI controls (sliders, knobs) must respond without perceptible lag

## Non-goals

- MIDI input/output
- Music notation or sheet music rendering
- Audio recording from microphone (v1 — this is a nice-to-have for later)
- Multi-user or collaborative features
- Mobile-optimized UI (desktop-first; responsive is fine but not a priority)
- Audio effects processing (reverb, delay, filters, etc.)
- Server-side computation or audio processing
- Music theory curriculum — this teaches signal processing concepts, not music theory
