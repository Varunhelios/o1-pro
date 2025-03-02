/**
 * @description
 * This file provides TypeScript type definitions for the Web Speech API,
 * specifically for SpeechRecognition and related interfaces. It extends the
 * Window interface to include these properties, addressing TypeScript errors
 * when accessing SpeechRecognition or webkitSpeechRecognition.
 *
 * Key features:
 * - Defines SpeechRecognition interface for speech-to-text functionality
 * - Extends Window to include SpeechRecognition and webkitSpeechRecognition as constructors
 *
 * @dependencies
 * - None (pure TypeScript definitions)
 *
 * @notes
 * - Based on Web Speech API spec; includes only necessary properties for the app
 * - Ensures type safety for both standard and webkit-prefixed implementations
 * - Uses readonly for properties to match API behavior and resolve modifier conflicts
 * - Structured as a module with ambient declarations for global augmentation
 */

/**
 * Interface for the SpeechRecognition instance.
 */
export interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

/**
 * Constructor type for SpeechRecognition or webkitSpeechRecognition.
 */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

/**
 * Interface for SpeechRecognitionEvent, containing the recognition result.
 */
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

/**
 * Interface for SpeechRecognitionResultList, holding the list of results.
 */
export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
  item(index: number): SpeechRecognitionResult
  [Symbol.iterator](): IterableIterator<SpeechRecognitionResult>
}

/**
 * Interface for SpeechRecognitionResult, representing a single recognition match.
 */
export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  readonly length: number // Marked readonly to ensure consistency and match API
}

/**
 * Interface for SpeechRecognitionAlternative, containing the transcript.
 */
export interface SpeechRecognitionAlternative {
  readonly transcript: string // Marked readonly to ensure consistency and match API
}

/**
 * Interface for SpeechRecognitionErrorEvent, handling recognition errors.
 */
export interface SpeechRecognitionErrorEvent {
  error: string
}

// Ambient declaration to extend the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}
