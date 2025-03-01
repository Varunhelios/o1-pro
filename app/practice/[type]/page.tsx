"use server"

import {
  getExercisesByLessonIdAction,
  submitExerciseAction
} from "@/actions/db/exercises-actions"
import QuizExercise from "@/components/practice/quiz-exercise"
import SpeakingExercise from "@/components/practice/speaking-exercise"
import WritingExercise from "@/components/practice/writing-exercise"
import { redirect } from "next/navigation"
import { Suspense } from "react"

// Skeleton component for loading state
function PracticeSkeleton() {
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
    return null
  }

  // Fetch exercises for the lesson
  const { isSuccess, data, message } =
    await getExercisesByLessonIdAction(lessonId)
  if (!isSuccess || !data || data.length === 0) {
    console.error(`Failed to fetch exercises: ${message}`)
    redirect("/learn")
    return null
  }

  // Find the first exercise matching the type
  const exercise = data.find(ex => ex.type === type)
  if (!exercise) {
    console.error(`No ${type} exercise found for lesson ${lessonId}`)
    redirect("/learn")
    return null
  }

  // Define submission handler
  const handleSubmit = async (response: string): Promise<void> => {
    "use server"
    const result = await submitExerciseAction(exercise.id, { response })
    if (!result.isSuccess) {
      console.error(`Submission failed: ${result.message}`)
    }
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
      redirect("/learn")
      return null
  }
}

/**
 * PracticePage renders the exercise interface for a specific type and lesson.
 * @param {{ params: { type: string }, searchParams: { lessonId?: string } }} props - Route and query params
 * @returns {JSX.Element} The exercise UI with Suspense boundary
 */
export default async function PracticePage({
  params,
  searchParams
}: {
  params: { type: string }
  searchParams: { lessonId?: string }
}) {
  const { type } = params
  const { lessonId } = searchParams

  // Validate lessonId presence
  if (!lessonId) {
    console.error("No lessonId provided in query parameters")
    redirect("/learn")
    return null
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Suspense fallback={<PracticeSkeleton />}>
        <PracticeExerciseFetcher lessonId={lessonId} type={type} />
      </Suspense>
    </div>
  )
}
