/**
 * @description
 * This server component serves as the page for interactive exercises in the Learn Kannada app.
 * It handles the /practice/[type] route, fetching exercises based on the type parameter
 * (quiz, writing, or speaking) and rendering the appropriate exercise component.
 *
 * Key features:
 * - Fetches exercises server-side using getExercisesByLessonIdAction
 * - Renders QuizExercise, WritingExercise, or SpeakingExercise based on type
 * - Uses Suspense for asynchronous data loading with a fallback
 * - Integrates Clerk authentication to protect the route
 * - Provides a submission handler to process user responses via submitExerciseAction
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication (auth helper)
 * - @/actions/db/exercises-actions: Server actions for fetching and submitting exercises
 * - @/components/practice/quiz-exercise: Client component for quiz exercises
 * - @/components/practice/writing-exercise: Client component for writing exercises
 * - @/components/practice/speaking-exercise: Client component for speaking exercises
 * - react: For Suspense and ReactNode types
 *
 * @notes
 * - Assumes lessonId is optional; fetches all exercises of a type if no lessonId is provided
 * - Only renders the first exercise from the fetched list for simplicity
 * - Invalid type parameters redirect to a 404 page
 * - Submission handler logs results; extend this for scoring or progress updates as needed
 * - Follows server component rules: no direct imports of client components into other client components
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import {
  getExercisesByLessonIdAction,
  submitExerciseAction
} from "@/actions/db/exercises-actions"
import QuizExercise from "@/components/practice/quiz-exercise"
import WritingExercise from "@/components/practice/writing-exercise"
import SpeakingExercise from "@/components/practice/speaking-exercise"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { Suspense } from "react"
import { notFound } from "next/navigation"

// Define valid exercise types
const VALID_TYPES = ["quiz", "writing", "speaking"] as const
type ExerciseType = (typeof VALID_TYPES)[number]

// Props interface for the page
interface PracticePageProps {
  params: Promise<{ type: string }> // Dynamic route parameter
}

/**
 * PracticePage component fetches and renders an exercise based on type.
 * @param {PracticePageProps} props - Contains params with the exercise type
 * @returns {JSX.Element} The rendered exercise page
 */
export default async function PracticePage({ params }: PracticePageProps) {
  // Await params as per server component rules
  const { type } = await params

  // Authenticate user with Clerk
  const { userId } = await auth()
  if (!userId) {
    // Redirect to sign-in if not authenticated (handled by middleware, but added as fallback)
    return <div>Please sign in to access practice exercises.</div>
  }

  // Validate exercise type
  if (!VALID_TYPES.includes(type as ExerciseType)) {
    notFound() // Redirect to 404 if type is invalid
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExerciseFetcher type={type as ExerciseType} userId={userId} />
    </Suspense>
  )
}

/**
 * ExerciseFetcher fetches exercises and renders the appropriate component.
 * @param {Object} props - Contains type and userId
 * @param {ExerciseType} props.type - The type of exercise to fetch
 * @param {string} props.userId - The authenticated user's ID
 * @returns {JSX.Element} The rendered exercise component
 */
async function ExerciseFetcher({
  type,
  userId
}: {
  type: ExerciseType
  userId: string
}) {
  // Fetch exercises (assuming empty string fetches all of type for simplicity)
  const { isSuccess, message, data } = await getExercisesByLessonIdAction("") // Use empty string instead

  // Handle fetch failure
  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-4">
        {message || "No exercises available for this type."}
      </div>
    )
  }

  // Take the first exercise for simplicity
  const exercise: SelectExercise = data[0]

  // Submission handler for all exercise types
  const handleSubmit = async (response: string): Promise<void> => {
    "use server" // Mark as server directive for action
    await submitExerciseAction(exercise.id, response) // Adjust to match expected parameters
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
      // This should never happen due to prior validation, but TypeScript requires it
      return notFound()
  }
}

/**
 * LoadingFallback component displays a loading state during data fetching.
 * @returns {JSX.Element} A simple loading indicator
 */
function LoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-muted-foreground">Loading exercise...</div>
    </div>
  )
}
