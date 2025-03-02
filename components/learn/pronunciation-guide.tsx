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
 * - @/types: Imports SpeechRecognitionConstructor for type safety
 *
 * @notes
 * - Requires browser support for Web Speech API; falls back gracefully if unsupported
 * - Language is set to "kn-IN" (Kannada) for accurate recognition
 * - Submission handler is passed as a prop to allow integration with server actions
 * - Uses native DOM types (SpeechRecognitionEvent, SpeechRecognitionErrorEvent) from lib.dom.d.ts
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Send } from "lucide-react"
import { useState } from "react"
import { SpeechRecognitionConstructor } from "@/types"
import {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from "@/types/web-speech-types"

// Define props interface for type safety
interface PronunciationGuideProps {
  phrase: string // The Kannada phrase to practice
  onSubmit: (transcript: string) => Promise<void> // Handler to process the recorded speech
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
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  // Initialize SpeechRecognition with type safety
  const SpeechRecognition: SpeechRecognitionConstructor | undefined =
    window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  // Configure recognition if available
  if (recognition) {
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "kn-IN" // Kannada language code

    // Handle transcription result using native DOM type
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      setIsRecording(false)
    }

    // Handle recognition errors using native DOM type
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setTranscript(`Error: ${event.error}. Please try again.`)
      setIsRecording(false)
    }
  } else {
    setIsSupported(false)
  }

  // Handle recording toggle
  const toggleRecording = () => {
    if (!recognition) return

    if (isRecording) {
      recognition.stop()
    } else {
      setTranscript("") // Clear previous transcript
      recognition.start()
      setIsRecording(true)
    }
  }

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
            onClick={toggleRecording}
            disabled={!recognition}
            className="w-full"
            variant={isRecording ? "destructive" : "default"}
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
