# Sample Audio Files

Place sample audio files (.wav, .mp3, .ogg) in this directory for use as quick-load presets in the Audio File Panel.

## Manifest

To make sample files discoverable by the UI, create a `manifest.json` file listing the file names:

```json
["sample-sine-440hz.wav", "piano-chord.mp3"]
```

The UI will fetch `/audio/manifest.json` on mount and display buttons for each listed file.

## Supported Formats

- `.wav` — Uncompressed PCM audio
- `.mp3` — MPEG Layer 3 compressed audio
- `.ogg` — Ogg Vorbis compressed audio
