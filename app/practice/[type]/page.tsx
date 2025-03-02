/**
 * @description
 * This server-side page renders an interactive exercise for the Learn Kannada app based on the exercise type.
 * It fetches exercise data server-side and renders the appropriate client component (quiz, writing, or speaking)
 * with submission handling, supporting the interactive exercises feature.
 *
 * Key features:
 * - Dynamic Routing: Handles [type] parameter for quiz, writing, or speaking exercises
 * - Server-Side Data Fetching: Fetches exercises using a server action
 * - Exercise Rendering: Conditionally renders QuizExercise, WritingExercise, or SpeakingExercise
 * - Type Safety: Validates exercise content for SpeakingExercise compatibility
 *
 * @dependencies
 * - @/components/practice/quiz-exercise: Client component for quiz exercises
 * - @/components/practice/writing-exercise: Client component for writing exercises
 * - @/components/practice/speaking-exercise: Client component for speaking exercises
 * - @/actions/db/exercises-actions: Provides getExercisesByLessonIdAction and submitExerciseAction
 * - @/db/schema/exercises-schema: Imports SelectExercise for type safety
 * - next/navigation: Provides notFound for invalid types
 * - react: Provides Suspense for async rendering
 *
 * @notes
 * - Marked "use server" per server component rules
 * - Params are awaited as a Promise per Next.js 15 dynamic route behavior
 * - Validates content shape for SpeakingExercise to resolve type mismatch
 * - Handles edge cases like invalid type or missing exercise with 404
 */

"use server"

import QuizExercise from "@/components/practice/quiz-exercise"
import WritingExercise from "@/components/practice/writing-exercise"
import SpeakingExercise from "@/components/practice/speaking-exercise"
import {
  getExercisesByLessonIdAction,
  submitExerciseAction
} from "@/actions/db/exercises-actions"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { notFound } from "next/navigation"
import { Suspense } from "react"

// Define props interface for the page
interface PracticePageProps {
  params: Promise<{ type: string }> // Dynamic route params as a Promise
}

/**
 * Type guard to check if content matches SpeakingExercise's expected shape.
 * @param content - The content to validate
 * @returns {boolean} True if content has a phrase string
 */
function isSpeakingExerciseContent(
  content: unknown
): content is { phrase: string } {
  return (
    typeof content === "object" &&
    content !== null &&
    "phrase" in content &&
    typeof (content as any).phrase === "string"
  )
}

/**
 * PracticePage component fetches and renders an exercise based on type.
 * @param {PracticePageProps} props - The route parameters
 * @returns {JSX.Element} The exercise component or 404
 */
export default async function PracticePage({ params }: PracticePageProps) {
  // Await the params Promise to get the type
  const { type } = await params

  // Validate the type parameter
  const validTypes = ["quiz", "writing", "speaking"] as const
  if (!validTypes.includes(type as any)) {
    return notFound()
  }

  return (
    <Suspense fallback={<div>Loading exercise...</div>}>
      <ExerciseContentFetcher type={type} />
    </Suspense>
  )
}

/**
 * ExerciseContentFetcher fetches exercise data and renders the content.
 * @param {{ type: string }} props - The exercise type to fetch
 * @returns {JSX.Element} The rendered exercise component
 */
async function ExerciseContentFetcher({ type }: { type: string }) {
  // Simulate fetching an exercise (replace with actual lessonId if needed)
  // Assuming a default lessonId for simplicity; adjust as per your app logic
  const { isSuccess, data, message } =
    await getExercisesByLessonIdAction("default-lesson-id")

  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        {message || "No exercises found."}
      </div>
    )
  }

  // Find the first exercise matching the type
  const exercise = data.find(ex => ex.type === type)

  if (!exercise) {
    return notFound()
  }

  // Handle submission (stub; replace with actual logic if needed)
  const handleSubmit = async (response: string) => {
    "use server"
    await submitExerciseAction(exercise.id, response)
  }

  // Render the appropriate exercise component based on type
  switch (exercise.type) {
    case "quiz":
      return <QuizExercise exercise={exercise} onSubmit={handleSubmit} />
    case "writing":
      return <WritingExercise exercise={exercise} onSubmit={handleSubmit} />
    case "speaking":
      // Validate and assert content for SpeakingExercise
      if (!isSpeakingExerciseContent(exercise.content)) {
        return (
          <div className="text-muted-foreground p-4 text-center">
            Invalid exercise content: missing phrase.
          </div>
        )
      }
      return (
        <SpeakingExercise
          exercise={{ id: exercise.id, content: exercise.content }}
          onSubmit={handleSubmit}
        />
      )
    default:
      // This should never happen due to prior validation, but TypeScript requires it
      return notFound()
  }
}
