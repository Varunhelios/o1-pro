/**
 * @description
 * This file augments the global TypeScript types for the Web Speech API,
 * specifically adding SpeechRecognition and webkitSpeechRecognition to the Window interface.
 * It relies on native DOM types (SpeechRecognitionEvent, SpeechRecognitionResult, etc.)
 * from lib.dom.d.ts, ensuring compatibility with browser implementations.
 *
 * Key features:
 * - Extends Window with constructor types for SpeechRecognition
 *
 * @dependencies
 * - None (pure TypeScript augmentation leveraging lib.dom.d.ts)
 *
 * @notes
 * - Avoids redefining SpeechRecognitionEvent or related types to prevent conflicts
 * - Ensures type safety for both standard and webkit-prefixed implementations
 * - Wrapped in an ambient module to comply with TypeScript module scoping rules
 */

/**
 * Interface for the SpeechRecognition instance, matching native DOM type essentials.
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
 * Interface for SpeechRecognitionEvent, containing the recognition result.
 */
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

/**
 * Interface for SpeechRecognitionErrorEvent, handling recognition errors.
 */
export interface SpeechRecognitionErrorEvent {
  error: string
}

/**
 * Constructor type for SpeechRecognition or webkitSpeechRecognition.
 * Compatible with the native SpeechRecognition interface from lib.dom.d.ts.
 */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

// Extend the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
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
  length: number
}

/**
 * Interface for SpeechRecognitionAlternative, containing the transcript.
 */
export interface SpeechRecognitionAlternative {
  transcript: string
}
