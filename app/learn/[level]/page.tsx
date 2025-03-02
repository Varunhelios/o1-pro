/**
 * @description
 * This server-side page renders lessons for a specific level in the Learn Kannada app.
 * It fetches lessons from the database based on the level parameter and displays them using LessonCard components.
 * Includes an OfflineButton for each lesson to enable offline downloads.
 *
 * Key features:
 * - Dynamic Routing: Displays lessons filtered by level (beginner, intermediate, advanced)
 * - Data Fetching: Uses server-side fetching with Suspense for loading states
 * - Offline Support: Integrates OfflineButton for downloading lessons
 *
 * @dependencies
 * - @/actions/db/lessons-actions: getLessonAction for fetching lessons
 * - @/components/learn/lesson-card: LessonCard for rendering individual lessons
 * - @/components/learn/offline-button: OfflineButton for initiating downloads
 * - @/db/schema/lessons-schema: levelEnum and SelectLesson for type safety
 * - react: Suspense for async rendering
 * - next/navigation: notFound for handling invalid levels
 *
 * @notes
 * - Marked "use server" per frontend rules for server components
 * - Uses Suspense to handle async data fetching per frontend guidelines
 * - Validates level param against levelEnum values
 * - Assumes lessons are stored in the database and accessible via getLessonAction
 */

"use server"

import { getLessonAction } from "@/actions/db/lessons-actions"
import { LessonCard } from "@/components/learn/lesson-card"
import OfflineButton from "@/components/learn/offline-button"
import { levelEnum, SelectLesson } from "@/db/schema/lessons-schema"
import { Suspense } from "react"
import { notFound } from "next/navigation"

// Define props interface for the page
interface LearnLevelPageProps {
  params: Promise<{ level: string }>
}

/**
 * LearnLevelPage renders lessons for a given level.
 * @param {LearnLevelPageProps} props - Dynamic route params
 * @returns {JSX.Element} Lesson list with download buttons
 */
export default async function LearnLevelPage({ params }: LearnLevelPageProps) {
  const { level } = await params

  // Validate level against enum values
  if (!levelEnum.enumValues.includes(level as any)) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="text-center">Loading lessons...</div>}>
      <LessonList level={level as (typeof levelEnum.enumValues)[number]} />
    </Suspense>
  )
}

/**
 * LessonList fetches and renders lessons for the specified level.
 * @param {Object} props - Level to filter lessons
 * @param {string} props.level - Lesson level (beginner, intermediate, advanced)
 * @returns {JSX.Element} List of lesson cards with download buttons
 */
async function LessonList({
  level
}: {
  level: (typeof levelEnum.enumValues)[number]
}) {
  const result = await getLessonAction(level)

  if (!result.isSuccess || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {result.message || "Failed to load lessons. Please try again."}
        </p>
      </div>
    )
  }

  const lessons = result.data

  return (
    <div className="bg-background min-h-screen p-4">
      <h1 className="text-foreground mb-6 text-3xl font-bold capitalize">
        {level} Lessons
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson: SelectLesson) => (
          <div key={lesson.id} className="flex flex-col gap-2">
            <LessonCard title={lesson.title} level={lesson.level} />
            <OfflineButton lessonId={lesson.id} />
          </div>
        ))}
      </div>

      {lessons.length === 0 && (
        <p className="text-muted-foreground mt-8 text-center">
          No lessons available for this level yet.
        </p>
      )}
    </div>
  )
}
