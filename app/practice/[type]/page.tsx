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
import { NextPage } from "next"

// Define the correct type for `params`
interface PracticePageProps {
  params: { type: string }
  searchParams?: { lessonId?: string }
}

// Loading skeleton component
function PracticeSkeleton() {
  return (
    <div className="w-full max-w-lg p-4">
      <div className="mb-6 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-32 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
    </div>
  )
}

// Fetching and handling exercises
async function PracticeExerciseFetcher({
  lessonId,
  type
}: {
  lessonId: string
  type: string
}) {
  const validTypes = ["quiz", "writing", "speaking"]
  if (!validTypes.includes(type)) {
    redirect("/learn")
    return null
  }

  const { isSuccess, data, message } =
    await getExercisesByLessonIdAction(lessonId)
  if (!isSuccess || !data || data.length === 0) {
    console.error(`Failed to fetch exercises: ${message}`)
    redirect("/learn")
    return null
  }

  const exercise = data.find(ex => ex.type === type)
  if (!exercise) {
    console.error(`No ${type} exercise found for lesson ${lessonId}`)
    redirect("/learn")
    return null
  }

  const handleSubmit = async (response: string): Promise<void> => {
    "use server"
    const result = await submitExerciseAction(exercise.id, { response })
    if (!result.isSuccess) {
      console.error(`Submission failed: ${result.message}`)
    }
  }

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

// ✅ Fix: Ensure `params` is correctly destructured
export default function PracticePage({
  params,
  searchParams
}: PracticePageProps) {
  if (!params?.type) {
    console.error("Invalid params provided")
    redirect("/learn")
    return null
  }

  const { type } = params // Destructure `type` safely
  const lessonId = searchParams?.lessonId

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
