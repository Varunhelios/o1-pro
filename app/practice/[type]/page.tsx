/**
 * @description
 * This server-side page renders the practice interface for interactive exercises in the Learn Kannada app.
 * It fetches exercises for a specific lesson and type (quiz, writing, or speaking) and delegates rendering
 * to the appropriate client component. The page is accessible at /practice/[type] with query params for lessonId.
 *
 * Key features:
 * - Dynamic routing: Handles exercise type via [type] parameter (quiz, writing, speaking)
 * - Server-side data fetching: Retrieves exercises using getExercisesByLessonIdAction
 * - Suspense: Provides loading states with a skeleton fallback during data fetch
 * - Component delegation: Renders QuizExercise, WritingExercise, or SpeakingExercise based on type
 *
 * @dependencies
 * - @/actions/db/exercises-actions: Imports getExercisesByLessonIdAction and submitExerciseAction for data operations
 * - @/components/practice/quiz-exercise: Client component for quiz exercises
 * - @/components/practice/writing-exercise: Client component for writing exercises
 * - @/components/practice/speaking-exercise: Client component for speaking exercises
 * - react: Provides Suspense for async handling
 *
 * @notes
 * - Requires a lessonId query parameter to fetch relevant exercises
 * - Redirects to /learn if lessonId is missing or type is invalid
 * - Assumes exercises are tied to lessons; fetches all exercises for a lesson and filters by type client-side
 * - Error handling redirects to /learn for invalid scenarios
 * - Skeleton fallback enhances UX during data loading
 */

"use server"

import {
  getExercisesByLessonIdAction,
  submitExerciseAction
} from "@/actions/db/exercises-actions"
import QuizExercise from "@/components/practice/quiz-exercise"
import SpeakingExercise from "@/components/practice/speaking-exercise"
import WritingExercise from "@/components/practice/writing-exercise"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { redirect } from "next/navigation"
import { Suspense } from "react"

// Skeleton component for loading state
async function PracticeSkeleton() {
  return (
    <div className="w-full max-w-lg p-4">
      <div className="mb-6 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-32 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
    </div>
  )
}

// Fetcher component to handle async data retrieval
async function PracticeExerciseFetcher({
  lessonId,
  type
}: {
  lessonId: string
  type: string
}) {
  // Validate exercise type
  const validTypes = ["quiz", "writing", "speaking"]
  if (!validTypes.includes(type)) {
    redirect("/learn")
  }

  // Fetch exercises for the lesson
  const { isSuccess, data, message } =
    await getExercisesByLessonIdAction(lessonId)
  if (!isSuccess || !data || data.length === 0) {
    console.error(`Failed to fetch exercises: ${message}`)
    redirect("/learn")
  }

  // Find the first exercise matching the type
  const exercise = data.find(ex => ex.type === type)
  if (!exercise) {
    console.error(`No ${type} exercise found for lesson ${lessonId}`)
    redirect("/learn")
  }

  // Define submission handler
  const handleSubmit = async (response: string): Promise<void> => {
    "use server"
    const result = await submitExerciseAction(exercise.id, { response })
    if (!result.isSuccess) {
      console.error(`Submission failed: ${result.message}`)
    }
    // Return nothing to satisfy the Promise<void> requirement
  }

  // Render the appropriate exercise component based on type
  switch (type) {
    case "quiz":
      return <QuizExercise exercise={exercise} onSubmit={handleSubmit} />
    case "writing":
      return <WritingExercise exercise={exercise} onSubmit={handleSubmit} />
    case "speaking":
      return <SpeakingExercise exercise={exercise} onSubmit={handleSubmit} />
    default:
      redirect("/learn") // Fallback, though unreachable due to earlier validation
  }
}

/**
 * PracticePage renders the exercise interface for a specific type and lesson.
 * @param {Promise<{ type: string }>} params - Dynamic route params with exercise type
 * @param {{ searchParams: { lessonId?: string } }} props - Query params including lessonId
 * @returns {JSX.Element} The exercise UI with Suspense boundary
 */
export default async function PracticePage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>
  searchParams: { lessonId?: string }
}) {
  // Await dynamic params
  const { type } = await params
  const { lessonId } = searchParams

  // Validate lessonId presence
  if (!lessonId) {
    console.error("No lessonId provided in query parameters")
    redirect("/learn")
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Suspense fallback={<PracticeSkeleton />}>
        <PracticeExerciseFetcher lessonId={lessonId} type={type} />
      </Suspense>
    </div>
  )
}
