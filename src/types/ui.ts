/**
 * UI type definitions for the application shell and layout.
 *
 * Provides types for app mode, concept entries, and other UI-related
 * data structures used across layout and glossary components.
 */

/** The two operating modes of the application. */
export type AppMode = 'guided' | 'sandbox'

/**
 * A single concept entry for the glossary.
 *
 * Each entry provides a short summary and a longer explanation
 * written for a 10-14 year old audience.
 */
export interface ConceptEntry {
  /** Unique identifier for the concept (kebab-case). */
  id: string
  /** Display title of the concept. */
  title: string
  /** One-sentence summary of the concept. */
  shortDescription: string
  /** Full explanation in 2-3 short paragraphs, targeting ages 10-14. */
  fullExplanation: string
  /** IDs of related concepts for cross-referencing. */
  relatedConcepts?: string[]
}
