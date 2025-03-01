/**
 * @description
 * This client-side component renders a speaking exercise UI for the Learn Kannada app.
 * It uses the Web Speech API to record and transcribe user speech for pronunciation practice.
 * Designed for use in /practice/[type]/page.tsx to support interactive learning.
 *
 * Key features:
 * - Displays a phrase for the user to speak
 * - Records and transcribes speech using Web Speech API
 * - Clean, responsive UI with Tailwind CSS and Shadcn components
 * - Submits transcript to a provided handler function
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for recording and submission
 * - @/components/ui/textarea: Shadcn Textarea for transcript display
 * - @/db/schema/exercises-schema: Imports SelectExercise for type safety
 * - lucide-react: Provides icons (e.g., Mic, Send)
 *
 * @notes
 * - Requires browser support for Web Speech API (SpeechRecognition)
 * - Fallback message if API is unavailable
 * - Assumes content JSON has a phrase string
 * - Submission handler is expected to call a server action (e.g., assessPronunciationAction)
 * - Handles edge cases like API unavailability and empty transcripts
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { Mic, Send } from "lucide-react"
import { useState } from "react"

// Add this interface declaration at the top of the file
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// Declare SpeechRecognition type (not included in TS by default)
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

// Define props interface
interface SpeakingExerciseProps {
  exercise: SelectExercise // Exercise data from database
  onSubmit: (transcript: string) => Promise<void> // Handler to process submission
}

/**
 * SpeakingExercise component renders a speaking exercise UI.
 * @param {SpeakingExerciseProps} props - Exercise data and submission handler
 * @returns {JSX.Element} A UI with phrase, recording controls, and transcript
 */
export default function SpeakingExercise({
  exercise,
  onSubmit
}: SpeakingExerciseProps) {
  // Parse exercise content (assuming JSON structure: { phrase: string })
  const content = exercise.content as { phrase: string }
  const phrase = content?.phrase ?? "No phrase available"

  // State for recording and transcript
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  // Initialize SpeechRecognition
  const SpeechRecognition = (window.SpeechRecognition ||
    window.webkitSpeechRecognition) as (new () => SpeechRecognition) | undefined
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  // Configure recognition if available
  if (recognition) {
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "kn-IN" // Kannada language code

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      setIsRecording(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setIsRecording(false)
      setTranscript("Error recording speech. Please try again.")
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
      setTranscript("")
      recognition.start()
      setIsRecording(true)
    }
  }

  // Handle submission
  const handleSubmit = async () => {
    if (transcript.trim()) {
      await onSubmit(transcript)
      setTranscript("") // Reset after submission
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6 p-4">
      {/* Phrase display */}
      <div className="text-foreground text-lg font-medium">{phrase}</div>

      {/* Recording controls */}
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

          {/* Transcript display */}
          <Textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Your speech will appear here..."
            className="h-32 resize-none"
            readOnly={isRecording}
          />

          {/* Submit button */}
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
        <div className="text-muted-foreground">
          Speech recognition is not supported in your browser.
        </div>
      )}
    </div>
  )
}
