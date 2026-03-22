/**
 * Type definitions for the guided learning mode.
 *
 * Defines the shape of each guided step, including its content,
 * setup function, and which controls are available to the learner.
 */

/**
 * A single step in the guided learning tutorial.
 *
 * Each step teaches one concept by configuring the audio engine
 * to a specific state and unlocking only the relevant controls.
 */
export interface GuidedStep {
  /** Step number (1-based). */
  id: number
  /** Short title for the step. */
  title: string
  /** Optional link to a ConceptEntry id for glossary cross-reference. */
  conceptId?: string
  /** Age-appropriate explanation text for a 10-14 year old musician. */
  explanation: string
  /** Function to set up the audio engine state for this step. */
  setupFn: () => void
  /** Which controls are unlocked at this step. */
  enabledControls: string[]
}
