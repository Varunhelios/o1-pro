/**
 * @description
 * This component renders a lesson card for the Learn Kannada app, displaying lesson details
 * such as title and level, with an added text-to-speech feature for accessibility.
 * It is a reusable client component used across the learning module pages.
 *
 * Key features:
 * - Displays lesson title and level with clean, minimalistic styling
 * - Text-to-speech: Reads lesson title aloud when triggered
 * - Responsive design using Tailwind CSS
 *
 * @dependencies
 * - react: For state management and hooks
 * - lucide-react: For icons (e.g., Volume2 for TTS button)
 * - @/types: For ActionState type (not directly used here but part of ecosystem)
 *
 * @notes
 * - Uses Web Speech API, which requires browser support (checked at runtime)
 * - Speech synthesis is set to Kannada language ("kn-IN") for consistency
 * - Error handling for lack of TTS support is minimal (disabled button)
 * - Assumes lesson content is simple text for now; expand for complex content if needed
 */

"use client"

import { useState } from "react"
import { Volume2 } from "lucide-react"

/**
 * Props for the LessonCard component.
 * Defines the structure of the lesson data passed to the component.
 */
interface LessonCardProps {
  lesson: {
    id: string
    title: string
    level: "beginner" | "intermediate" | "advanced"
    content: unknown // JSON content, not rendered here but available
    createdAt: Date
    updatedAt: Date
  }
}

/**
 * LessonCard component.
 * Displays a lesson preview with a button to trigger text-to-speech functionality.
 *
 * @param {LessonCardProps} props - The lesson data to display
 * @returns {JSX.Element} The rendered lesson card
 */
export default function LessonCard({ lesson }: LessonCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Check if Web Speech API is supported
  const isSpeechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window

  /**
   * Triggers text-to-speech for the lesson title.
   * Uses the Web Speech API to read the title aloud in Kannada.
   */
  const handleSpeak = () => {
    if (!isSpeechSupported) return // Exit if not supported

    const utterance = new SpeechSynthesisUtterance(lesson.title)
    utterance.lang = "kn-IN" // Set language to Kannada
    utterance.rate = 1.0 // Normal speed
    utterance.pitch = 1.0 // Normal pitch

    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = event => {
      console.error("Speech synthesis error:", event.error)
      setIsSpeaking(false)
    }

    // Cancel any ongoing speech and start new utterance
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Lesson Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold">
          {lesson.title}
        </h2>

        {/* Text-to-Speech Button */}
        <button
          onClick={handleSpeak}
          disabled={!isSpeechSupported || isSpeaking}
          className={`rounded-full p-2 transition-colors ${
            isSpeechSupported
              ? "text-muted-foreground hover:text-primary"
              : "text-muted cursor-not-allowed"
          } ${isSpeaking ? "animate-pulse" : ""}`}
          aria-label="Read lesson title aloud"
          title={
            isSpeechSupported
              ? "Read lesson title aloud"
              : "Text-to-speech not supported"
          }
        >
          <Volume2 className="size-5" />
        </button>
      </div>

      {/* Lesson Level */}
      <div className="text-muted-foreground mt-2 text-sm">
        Level: {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
      </div>
    </div>
  )
}
