/**
 * @description
 * This client-side component provides a pronunciation guide for the Learn Kannada app.
 * It leverages the Web Speech API to record user speech, transcribe it, and display the result,
 * enabling pronunciation practice for Kannada phrases. Designed for use in lesson pages
 * (e.g., /learn/[level]/page.tsx) to support interactive learning modules.
 *
 * Key features:
 * - Recording Control: Start/stop recording with a toggle button
 * - Speech Transcription: Displays transcribed speech in real-time
 * - Browser Compatibility: Gracefully handles lack of Web Speech API support
 * - Responsive UI: Clean, minimalistic design with Tailwind CSS and Shadcn components
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for recording controls
 * - @/components/ui/textarea: Shadcn Textarea for displaying transcription
 * - lucide-react: Provides Mic icon for the button
 * - react: Manages state and effects for recording and transcription
 *
 * @notes
 * - Uses "kn-IN" language code for Kannada; assumes browser support for this locale
 * - Does not perform assessment here; submits transcript via onSubmit for Step 23
 * - Handles edge cases like browser incompatibility and recognition errors
 * - Assumes Web Speech API is available in modern browsers (Chrome, Edge, etc.)
 * - No direct server actions; relies on parent component to handle submission
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic } from "lucide-react"
import { useState, useEffect } from "react"

// Add this at the top of the file
interface SpeechRecognition {
  new (): SpeechRecognition
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

// Define props interface for the component
interface PronunciationGuideProps {
  phrase: string // The Kannada phrase to pronounce
  onSubmit: (transcript: string) => Promise<void> // Callback to handle the transcribed speech
}

/**
 * PronunciationGuide component enables users to practice pronunciation using the Web Speech API.
 * @param {PronunciationGuideProps} props - The phrase to pronounce and submission handler
 * @returns {JSX.Element} A UI for recording and reviewing speech
 */
export default function PronunciationGuide({
  phrase,
  onSubmit
}: PronunciationGuideProps) {
  const [isRecording, setIsRecording] = useState(false) // Tracks recording state
  const [transcript, setTranscript] = useState("") // Stores the transcribed speech
  const [isSupported, setIsSupported] = useState(true) // Tracks Web Speech API support
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null) // SpeechRecognition instance

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    // Check if SpeechRecognition is supported (standard or webkit prefix)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    // Create and configure the recognition instance
    const recog = new SpeechRecognition()
    recog.continuous = false // Stop after one result
    recog.interimResults = false // Only final results
    recog.lang = "kn-IN" // Kannada language code

    // Handle successful transcription
    recog.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      setIsRecording(false)
    }

    // Handle recognition errors
    recog.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setTranscript(`Error: ${event.error}. Please try again.`)
      setIsRecording(false)
    }

    // Cleanup on unmount or error
    recog.onend = () => setIsRecording(false)

    setRecognition(recog)

    // Cleanup function to stop recognition if component unmounts
    return () => {
      if (recog) recog.stop()
    }
  }, [])

  // Toggle recording state
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
    if (transcript.trim() && !isRecording) {
      await onSubmit(transcript)
      setTranscript("") // Reset after submission
    }
  }

  return (
    <div className="bg-background w-full max-w-md space-y-4 rounded-lg border p-4">
      {/* Display the phrase to pronounce */}
      <div className="text-foreground text-lg font-medium">{phrase}</div>

      {/* Recording controls and transcription display */}
      {isSupported ? (
        <>
          <Button
            onClick={toggleRecording}
            disabled={!recognition}
            variant={isRecording ? "destructive" : "default"}
            className="w-full"
          >
            <Mic className="mr-2 size-4" />
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>

          <Textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)} // Allow manual edits
            placeholder="Your pronunciation will appear here..."
            className="h-24 resize-none"
            readOnly={isRecording} // Prevent edits during recording
          />

          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isRecording}
            className="w-full"
          >
            Submit Pronunciation
          </Button>
        </>
      ) : (
        <div className="text-muted-foreground text-center">
          Speech recognition is not supported in your browser. Please use a
          modern browser like Chrome or Edge.
        </div>
      )}
    </div>
  )
}
