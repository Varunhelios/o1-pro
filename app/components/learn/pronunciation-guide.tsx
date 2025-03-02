/**
 * @description
 * This client-side component provides a pronunciation guide for the Learn Kannada app.
 * It uses the Web Speech API to record and transcribe user pronunciation of Kannada phrases,
 * supporting the interactive pronunciation guides feature. Designed for use in lesson pages
 * (e.g., /learn/[level]/page.tsx) to enhance learning modules.
 *
 * Key features:
 * - Speech Recording: Toggles recording of user speech with start/stop functionality
 * - Transcription Display: Shows the transcribed text in a readonly textarea
 * - Browser Compatibility: Handles lack of Web Speech API support gracefully
 * - Responsive UI: Built with Tailwind CSS and Shadcn components for a clean, mobile-friendly design
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for recording and submission controls
 * - @/components/ui/textarea: Shadcn Textarea for displaying transcription
 * - lucide-react: Provides Mic and Send icons for UI enhancement
 * - react: Manages state and effects for recording and transcription
 *
 * @notes
 * - Uses 'kn-IN' language code for Kannada; assumes browser support for this locale
 * - Submits transcript via onSubmit prop for assessment in Step 23
 * - Handles edge cases: unsupported browsers, recognition errors, empty transcripts
 * - No direct assessment here; focuses on recording and transcription
 * - Adheres to client component rules: no server actions called directly
 */

"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Send } from "lucide-react"
import { useState, useEffect } from "react"

// Add these type declarations at the top of the file
interface SpeechRecognition {
  new (): SpeechRecognition
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
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
 * PronunciationGuide component enables users to practice Kannada pronunciation.
 * @param {PronunciationGuideProps} props - Phrase to pronounce and submission handler
 * @returns {JSX.Element} UI for recording and submitting speech
 */
export default function PronunciationGuide({
  phrase,
  onSubmit
}: PronunciationGuideProps) {
  const [isRecording, setIsRecording] = useState(false) // Tracks recording state
  const [transcript, setTranscript] = useState("") // Stores transcribed speech
  const [isSupported, setIsSupported] = useState(true) // Tracks Web Speech API support
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null) // SpeechRecognition instance

  // Initialize SpeechRecognition on component mount
  useEffect(() => {
    // Check for SpeechRecognition support (standard or webkit prefix)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    // Instantiate and configure SpeechRecognition
    const recog = new SpeechRecognition()
    recog.continuous = false // Single result, not continuous
    recog.interimResults = false // Final results only
    recog.lang = "kn-IN" // Kannada language code

    // Handle transcription result
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

    // Ensure recording stops cleanly
    recog.onend = () => setIsRecording(false)

    setRecognition(recog)

    // Cleanup on unmount
    return () => {
      if (recog) recog.stop()
    }
  }, []) // Empty dependency array: runs once on mount

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

  // Submit the transcript
  const handleSubmit = async () => {
    if (!transcript.trim() || isRecording) return // Prevent submission if empty or recording
    await onSubmit(transcript)
    setTranscript("") // Reset after submission
  }

  return (
    <div className="bg-background w-full max-w-md space-y-4 rounded-lg border p-4">
      {/* Phrase to pronounce */}
      <div className="text-foreground text-lg font-medium">{phrase}</div>

      {/* Recording UI */}
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
            <Send className="mr-2 size-4" />
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
