/**
 * Tests for the URL serializer utility.
 *
 * Verifies serialization roundtrips, edge cases, malformed input handling,
 * and default value application for track URL encoding/decoding.
 */

import { describe, it, expect } from 'vitest'
import {
  serializeEnvelope,
  deserializeEnvelope,
  serializeTrack,
  deserializeTrack,
  serializeTracksToUrl,
  deserializeTracksFromUrl,
} from '../../src/utils/url-serializer'
import type { TrackConfig, EnvelopeConfig } from '../../src/types/audio'
import { createTrackId, DEFAULT_ENVELOPE } from '../../src/types/audio'

// ── Helpers ─────────────────────────────────────────────────────────

function makeTrack(overrides: Partial<TrackConfig> = {}): TrackConfig {
  return {
    id: createTrackId('test-1'),
    frequency: 440,
    amplitude: 0.5,
    waveformType: 'sine',
    phase: 0,
    duration: 0,
    color: '#ff0000',
    isMuted: false,
    isSolo: false,
    envelope: { ...DEFAULT_ENVELOPE },
    ...overrides,
  }
}

// ── Envelope serialization ──────────────────────────────────────────

describe('serializeEnvelope', () => {
  it('returns "0" for disabled envelope', () => {
    const envelope: EnvelopeConfig = { ...DEFAULT_ENVELOPE, enabled: false }
    expect(serializeEnvelope(envelope)).toBe('0')
  })

  it('encodes enabled envelope with all ADSR values', () => {
    const envelope: EnvelopeConfig = {
      enabled: true,
      attack: 0.01,
      decay: 0.3,
      sustain: 0.5,
      release: 0.3,
    }
    expect(serializeEnvelope(envelope)).toBe('1|0.01|0.3|0.5|0.3')
  })
})

describe('deserializeEnvelope', () => {
  it('returns disabled envelope for "0"', () => {
    const result = deserializeEnvelope('0')
    expect(result.enabled).toBe(false)
  })

  it('returns disabled envelope for empty string', () => {
    const result = deserializeEnvelope('')
    expect(result.enabled).toBe(false)
  })

  it('parses enabled envelope with ADSR values', () => {
    const result = deserializeEnvelope('1|0.02|0.4|0.6|0.5')
    expect(result.enabled).toBe(true)
    expect(result.attack).toBe(0.02)
    expect(result.decay).toBe(0.4)
    expect(result.sustain).toBe(0.6)
    expect(result.release).toBe(0.5)
  })

  it('uses defaults for missing ADSR values', () => {
    const result = deserializeEnvelope('1')
    expect(result.enabled).toBe(true)
    expect(result.attack).toBe(DEFAULT_ENVELOPE.attack)
    expect(result.decay).toBe(DEFAULT_ENVELOPE.decay)
  })
})

// ── Track serialization ─────────────────────────────────────────────

describe('serializeTrack', () => {
  it('serializes a basic track', () => {
    const track = makeTrack()
    const result = serializeTrack(track)
    expect(result).toContain('f:440')
    expect(result).toContain('a:0.5')
    expect(result).toContain('w:sine')
    expect(result).toContain('p:0')
    expect(result).toContain('e:0')
  })

  it('serializes a track with enabled envelope', () => {
    const track = makeTrack({
      envelope: { enabled: true, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
    })
    const result = serializeTrack(track)
    expect(result).toContain('e:1|0.01|0.3|0.5|0.3')
  })
})

describe('deserializeTrack', () => {
  it('parses a valid track string', () => {
    const result = deserializeTrack('f:880,a:0.25,w:square,p:1.5,e:0')
    expect(result.frequency).toBe(880)
    expect(result.amplitude).toBe(0.25)
    expect(result.waveformType).toBe('square')
    expect(result.phase).toBe(1.5)
    expect(result.envelope?.enabled).toBe(false)
  })

  it('returns empty object for empty string', () => {
    const result = deserializeTrack('')
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('handles missing fields gracefully', () => {
    const result = deserializeTrack('f:220')
    expect(result.frequency).toBe(220)
    expect(result.amplitude).toBeUndefined()
  })

  it('returns default waveform for invalid type', () => {
    const result = deserializeTrack('w:invalid')
    expect(result.waveformType).toBe('sine')
  })

  it('returns default frequency for non-numeric value', () => {
    const result = deserializeTrack('f:abc')
    expect(result.frequency).toBe(440)
  })
})

// ── Multi-track serialization ───────────────────────────────────────

describe('serializeTracksToUrl', () => {
  it('returns empty string for no tracks', () => {
    expect(serializeTracksToUrl([])).toBe('')
  })

  it('produces a hash string starting with #t=', () => {
    const tracks = [makeTrack()]
    const result = serializeTracksToUrl(tracks)
    expect(result.startsWith('#t=')).toBe(true)
  })

  it('separates multiple tracks with semicolons', () => {
    const tracks = [
      makeTrack({ frequency: 440 }),
      makeTrack({ frequency: 880 }),
    ]
    const result = serializeTracksToUrl(tracks)
    const parts = result.replace('#t=', '').split(';')
    expect(parts).toHaveLength(2)
  })
})

describe('deserializeTracksFromUrl', () => {
  it('returns empty array for empty hash', () => {
    expect(deserializeTracksFromUrl('')).toEqual([])
  })

  it('returns empty array for hash without prefix', () => {
    expect(deserializeTracksFromUrl('#other=data')).toEqual([])
  })

  it('returns empty array for hash with only prefix', () => {
    expect(deserializeTracksFromUrl('#t=')).toEqual([])
  })

  it('parses a single track from hash', () => {
    const hash = '#t=f:440,a:0.5,w:sine,p:0,e:0'
    const result = deserializeTracksFromUrl(hash)
    expect(result).toHaveLength(1)
    expect(result[0].frequency).toBe(440)
  })

  it('parses multiple tracks from hash', () => {
    const hash = '#t=f:440,a:0.5,w:sine,p:0,e:0;f:880,a:0.25,w:triangle,p:0,e:0'
    const result = deserializeTracksFromUrl(hash)
    expect(result).toHaveLength(2)
    expect(result[0].frequency).toBe(440)
    expect(result[1].frequency).toBe(880)
    expect(result[1].waveformType).toBe('triangle')
  })

  it('handles malformed data without crashing', () => {
    const hash = '#t=garbage;;more,,,garbage'
    const result = deserializeTracksFromUrl(hash)
    // Should not throw; may return empty or partial results
    expect(Array.isArray(result)).toBe(true)
  })
})

// ── Roundtrip ───────────────────────────────────────────────────────

describe('serialization roundtrip', () => {
  it('preserves track data through serialize/deserialize', () => {
    const original = [
      makeTrack({ frequency: 440, amplitude: 0.5, waveformType: 'sine', phase: 0 }),
      makeTrack({
        frequency: 880,
        amplitude: 0.25,
        waveformType: 'sawtooth',
        phase: 1.57,
        envelope: { enabled: true, attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.4 },
      }),
    ]

    const hash = serializeTracksToUrl(original)
    const restored = deserializeTracksFromUrl(hash)

    expect(restored).toHaveLength(2)
    expect(restored[0].frequency).toBe(440)
    expect(restored[0].amplitude).toBe(0.5)
    expect(restored[0].waveformType).toBe('sine')
    expect(restored[1].frequency).toBe(880)
    expect(restored[1].amplitude).toBe(0.25)
    expect(restored[1].waveformType).toBe('sawtooth')
    expect(restored[1].phase).toBe(1.57)
    expect(restored[1].envelope?.enabled).toBe(true)
    expect(restored[1].envelope?.attack).toBe(0.05)
    expect(restored[1].envelope?.sustain).toBe(0.7)
  })

  it('roundtrips all waveform types', () => {
    const waveforms = ['sine', 'square', 'triangle', 'sawtooth'] as const
    for (const wf of waveforms) {
      const tracks = [makeTrack({ waveformType: wf })]
      const hash = serializeTracksToUrl(tracks)
      const restored = deserializeTracksFromUrl(hash)
      expect(restored[0].waveformType).toBe(wf)
    }
  })
})
