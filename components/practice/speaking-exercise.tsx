/**
 * @description
 * This client-side component renders a speaking exercise UI for the Learn Kannada app.
 * It allows users to record their speech, transcribe it using the Web Speech API,
 * and receive AI-generated pronunciation feedback. Designed for use in /practice/[type]/page.tsx.
 *
 * Key features:
 * - Speech Recording: Uses Web Speech API to capture and transcribe user speech
 * - Pronunciation Feedback: Submits transcript to AI server action for evaluation
 * - Responsive UI: Clean design with Tailwind CSS and Shadcn components
 * - Error Handling: Manages unsupported browsers and API errors
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for recording and submission
 * - @/components/ui/textarea: Shadcn Textarea for transcript display
 * - @/actions/ai-actions: Imports assessPronunciationAction for feedback
 * - lucide-react: Provides Mic and Send icons
 * - react: Manages state and effects
 *
 * @notes
 * - Requires browser support for Web Speech API; falls back if unsupported
 * - Language set to "kn-IN" (Kannada) for accurate recognition
 * - No direct server actions are called here; submission is async via props
 * - Handles edge cases like empty transcripts or API failures with user feedback
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { assessPronunciationAction } from "@/actions/ai-actions"
import { Mic, Send } from "lucide-react"
import { useState } from "react"
import {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionResultList
} from "@/types/web-speech-types"

// Extend the Window interface to include SpeechRecognition
interface Window {
  SpeechRecognition: typeof window.SpeechRecognition
  webkitSpeechRecognition: typeof window.webkitSpeechRecognition
}

// Define the type for SpeechRecognition constructor
type SpeechRecognitionConstructor = new () => SpeechRecognition

// Define props interface for type safety
interface SpeakingExerciseProps {
  exercise: {
    id: string
    content: { phrase: string } // Expected phrase from exercise content
  } // Exercise data from database
}

// Define types for SpeechRecognitionEvent and SpeechRecognitionErrorEvent
interface SpeechRecognitionErrorEvent {
  error: string
}

/**
 * SpeakingExercise component renders a UI for speaking practice with feedback.
 * @param {SpeakingExerciseProps} props - Exercise data including the expected phrase
 * @returns {JSX.Element} A UI with recording controls, transcript, and feedback
 */
export default function SpeakingExercise({ exercise }: SpeakingExerciseProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  // Extract phrase from exercise content
  const phrase = exercise.content.phrase || "No phrase available"

  // Initialize SpeechRecognition
  const SpeechRecognition = (window.SpeechRecognition ||
    window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined
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
      setFeedback("") // Clear previous feedback
      recognition.start()
      setIsRecording(true)
    }
  }

  // Handle submission to get pronunciation feedback
  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setFeedback("Please record something to submit.")
      return
    }

    const { isSuccess, data, message } = await assessPronunciationAction(
      transcript,
      phrase
    )

    if (isSuccess) {
      setFeedback(data)
    } else {
      setFeedback(message || "Failed to get feedback. Please try again.")
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

          {/* Feedback display */}
          {feedback && (
            <div className="text-foreground bg-muted rounded-md p-4">
              <strong>Feedback:</strong> {feedback}
            </div>
          )}
        </>
      ) : (
        <div className="text-muted-foreground">
          Speech recognition is not supported in your browser.
        </div>
      )}
    </div>
  )
}
