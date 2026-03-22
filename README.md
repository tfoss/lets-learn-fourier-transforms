# Let's Learn Fourier Transforms

A web app that teaches Fourier Transforms and sound wave superposition through interactive exploration. Aimed at a musically-literate 10–14 year old audience — generate waves, hear them, combine them, and watch FFT pull the frequencies apart.

## Features

- **Multi-track wave generation** — up to 8 sine/square/triangle/sawtooth tracks with adjustable frequency, amplitude, phase, and duration
- **Live audio playback** — hear individual tracks or the combined superposition via Web Audio API
- **FFT visualization** — static and real-time frequency-domain analysis with Canvas rendering
- **Guided learning mode** — step-by-step walkthrough from single sine waves through harmonics to FFT
- **Sandbox mode** — full access to all controls for free exploration
- **Audio file loading** — import WAV/MP3/OGG files, see waveforms, watch live FFT during playback
- **Musical note labels** — frequency axis annotated with note names (A4 = 440 Hz, etc.)
- **Sound presets** — tuning fork, instrument approximations, intervals, chords, beat frequencies

## Tech Stack

- **Vue 3** (Composition API) + **TypeScript**
- **Vite** for dev server and builds
- **Tailwind CSS v4** for styling
- **Radix-Vue** for accessible UI primitives
- **Web Audio API** for audio generation and analysis
- **Canvas API** for waveform and FFT rendering
- **Vitest** + **happy-dom** for unit tests
- **Playwright** for E2E tests

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

This starts a local Vite dev server (default http://localhost:5173). Open that URL in your browser.

> **Note:** You can't just open `index.html` directly — the app uses TypeScript, Vue single-file components, and ES modules that require Vite's dev server to compile and serve them.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file server:

```bash
npm run preview    # Vite's built-in preview server
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Lint source files (ESLint) |
| `npm run format` | Format source files (Prettier) |

## Project Structure

```
src/
  components/    # Vue single-file components
  composables/   # Vue composables (shared reactive logic)
  utils/         # Pure utility functions
  types/         # TypeScript type definitions
  assets/        # Static assets (images, etc.)
tests/
  unit/          # Vitest unit tests
  e2e/           # Playwright E2E tests
```
