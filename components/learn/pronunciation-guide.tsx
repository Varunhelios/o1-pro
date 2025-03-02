/**
 * @description
 * This client-side component provides a pronunciation guide for the Learn Kannada app.
 * It allows users to practice speaking Kannada phrases by recording their speech using
 * the Web Speech API and displaying the transcribed result. Designed for use in lesson
 * pages to support interactive pronunciation learning.
 *
 * Key features:
 * - Phrase Display: Shows the Kannada phrase to practice
 * - Speech Recording: Uses Web Speech API to record and transcribe user speech
 * - Responsive UI: Clean, minimalistic design with Tailwind CSS and Shadcn components
 * - Error Handling: Handles unsupported browsers and recognition errors gracefully
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for record/stop controls
 * - @/components/ui/textarea: Shadcn Textarea for displaying transcription
 * - lucide-react: Provides Mic and Send icons for UI
 * - react: Manages component state and effects
 *
 * @notes
 * - Requires browser support for Web Speech API (SpeechRecognition); falls back gracefully if unsupported
 * - Language is set to "kn-IN" (Kannada) for accurate recognition
 * - Submission handler is passed as a prop to allow integration with server actions (e.g., assessPronunciationAction)
 * - Handles edge cases like empty transcripts or API errors with user feedback
 * - No direct server actions are called here per client component rules
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Send } from "lucide-react"
import { useState, useEffect } from "react"

// Define props interface for type safety
interface PronunciationGuideProps {
  phrase: string // The Kannada phrase to practice
  onSubmit: (transcript: string) => Promise<void> // Handler to process the recorded speech
}

// Define types for SpeechRecognitionEvent and SpeechRecognitionErrorEvent
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

/**
 * PronunciationGuide component renders a UI for practicing pronunciation.
 * @param {PronunciationGuideProps} props - Phrase to practice and submission handler
 * @returns {JSX.Element} A UI with recording controls and transcript display
 */
export default function PronunciationGuide({
  phrase,
  onSubmit
}: PronunciationGuideProps) {
  // State for recording status, transcript, and API support
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  // Initialize SpeechRecognition API on mount
  useEffect(() => {
    // Check for SpeechRecognition support (falls back to webkit if needed)
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setIsSupported(false)
      return
    }

    // Create and configure the recognition instance
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false // Stop after one result
    recognition.interimResults = false // Only final results
    recognition.lang = "kn-IN" // Kannada language code

    // Handle successful recognition
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const spokenText = event.results[0][0].transcript
      setTranscript(spokenText)
      setIsRecording(false)
    }

    // Handle errors (e.g., no speech detected, network issues)
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setTranscript(`Error: ${event.error}. Please try again.`)
      setIsRecording(false)
    }

    // Handle recording toggle
    const toggleRecording = () => {
      if (isRecording) {
        recognition.stop()
      } else {
        setTranscript("") // Clear previous transcript
        recognition.start()
        setIsRecording(true)
      }
    }

    // Add click handler to the button
    const recordButton = document.getElementById("record-button")
    if (recordButton) {
      recordButton.onclick = toggleRecording
    }

    // Cleanup to prevent memory leaks
    return () => {
      recognition.stop()
      if (recordButton) {
        recordButton.onclick = null
      }
    }
  }, [isRecording]) // Re-run effect when recording state changes

  // Handle submission of the transcript
  const handleSubmit = async () => {
    if (transcript.trim()) {
      await onSubmit(transcript)
      setTranscript("") // Reset after successful submission
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6 p-4">
      {/* Display the phrase to practice */}
      <div className="text-foreground text-lg font-medium">{phrase}</div>

      {/* Recording controls and transcript display */}
      {isSupported ? (
        <>
          <Button
            id="record-button"
            className="w-full"
            variant={isRecording ? "destructive" : "default"}
            disabled={!isSupported}
          >
            <Mic className="mr-2 size-4" />
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>

          <Textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)} // Allow manual edits
            placeholder="Your speech will appear here..."
            className="h-32 resize-none"
            readOnly={isRecording} // Prevent edits during recording
          />

          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isRecording}
            className="w-full"
          >
            <Send className="mr-2 size-4" />
            Submit Speech
          </Button>
        </>
      ) : (
        <div className="text-muted-foreground text-center">
          Speech recognition is not supported in your browser. Please use a
          modern browser like Chrome or Firefox.
        </div>
      )}
    </div>
  )
}
