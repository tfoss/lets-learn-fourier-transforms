/**
 * Composable for URL-based track sharing.
 *
 * Generates shareable URLs that encode the current track configuration,
 * restores configurations from URL hashes, and provides clipboard copy.
 *
 * Usage:
 *   const { generateShareUrl, loadFromUrl, copyToClipboard, hasUrlConfig } = useShareUrl()
 */

import { computed, type ComputedRef } from 'vue'
import { useAudioEngine } from './useAudioEngine'
import { serializeTracksToUrl, deserializeTracksFromUrl } from '../utils/url-serializer'
import type { TrackConfig } from '../types/audio'

/** Prefix that indicates track data is present in the URL hash. */
const HASH_PREFIX = '#t='

/**
 * Checks whether a hash string contains track configuration data.
 *
 * @param hash - The URL hash to check.
 * @returns True if the hash contains track data.
 */
export function hashHasConfig(hash: string): boolean {
  if (!hash || !hash.startsWith(HASH_PREFIX)) return false
  return hash.length > HASH_PREFIX.length
}

/**
 * Generates a full shareable URL from an array of track configs.
 *
 * Pure function that takes explicit inputs instead of reading globals.
 *
 * @param baseUrl - The base URL (origin + pathname).
 * @param tracks - The track configurations to encode.
 * @returns Full URL with encoded hash.
 */
export function buildShareUrl(baseUrl: string, tracks: TrackConfig[]): string {
  const hash = serializeTracksToUrl(tracks)
  return `${baseUrl}${hash}`
}

/**
 * Composable for shareable URL features.
 *
 * @returns Share URL API with generate, load, copy, and config detection.
 */
export function useShareUrl() {
  const { tracks, createTrack, removeTrack } = useAudioEngine()

  /**
   * Whether the current browser URL hash contains track configuration.
   */
  const hasUrlConfig: ComputedRef<boolean> = computed(() => {
    if (typeof window === 'undefined') return false
    return hashHasConfig(window.location.hash)
  })

  /**
   * Generates a shareable URL encoding the current track configuration.
   *
   * @returns Full URL with track data in the hash.
   */
  function generateShareUrl(): string {
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : ''
    return buildShareUrl(baseUrl, tracks.value)
  }

  /**
   * Loads track configuration from the current URL hash.
   *
   * If the hash contains valid track data, clears existing tracks
   * and creates new ones from the URL data.
   *
   * @returns True if tracks were loaded from the URL.
   */
  function loadFromUrl(): boolean {
    if (typeof window === 'undefined') return false

    const hash = window.location.hash
    if (!hashHasConfig(hash)) return false

    const parsedTracks = deserializeTracksFromUrl(hash)
    if (parsedTracks.length === 0) return false

    // Remove all existing tracks
    const existingIds = tracks.value.map((t) => t.id)
    for (const id of existingIds) {
      removeTrack(id)
    }

    // Create tracks from URL data
    for (const partial of parsedTracks) {
      createTrack(partial)
    }

    return true
  }

  /**
   * Copies the shareable URL to the clipboard.
   *
   * @returns True if the copy succeeded, false otherwise.
   */
  async function copyToClipboard(): Promise<boolean> {
    const url = generateShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }

  return {
    hasUrlConfig,
    generateShareUrl,
    loadFromUrl,
    copyToClipboard,
  }
}
