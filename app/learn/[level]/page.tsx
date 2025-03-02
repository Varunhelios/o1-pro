/**
 * @description
 * This file defines the Learn page for a specific level in the Learn Kannada app.
 * It fetches lessons for the given level server-side and renders them using LessonCard components,
 * with offline download functionality.
 *
 * Key features:
 * - Dynamic routing: Displays lessons based on the level parameter (beginner, intermediate, advanced)
 * - Server-side data fetching: Retrieves lessons using getLessonAction
 * - Suspense: Handles loading states for asynchronous data
 * - Accessibility: Integrates LessonCard with text-to-speech from Step 31
 * - Offline support: Includes OfflineButton for downloading lessons
 *
 * @dependencies
 * - @/actions/db/lessons-actions: For fetching lesson data
 * - @/components/learn/lesson-card: Default export for rendering lesson cards
 * - @/components/learn/offline-button: For offline lesson downloads
 * - @/db/schema/lessons-schema: For lesson types and level enum
 * - react: For Suspense component
 *
 * @notes
 * - Marked as "use server" per frontend rules for server components
 * - Handles invalid levels with a 404 response
 * - Uses Tailwind for minimalistic, responsive styling
 * - Assumes lessons are fetched by ID, but filters by level client-side if needed
 */

"use server"

import { getLessonAction } from "@/actions/db/lessons-actions"
import LessonCard from "@/components/learn/lesson-card" // Corrected to default import
import OfflineButton from "@/components/learn/offline-button"
import { levelEnum, SelectLesson } from "@/db/schema/lessons-schema"
import { Suspense } from "react"
import { notFound } from "next/navigation"

/**
 * Props for the LearnPage component.
 * Defines the dynamic route parameters.
 */
interface LearnPageProps {
  params: Promise<{ level: string }> // Async params per Next.js App Router
}

/**
 * LearnPage component.
 * Fetches and displays lessons for a specific level, with loading states and offline support.
 *
 * @param {LearnPageProps} props - The route parameters including the level
 * @returns {JSX.Element} The rendered page with lesson cards
 */
export default async function LearnPage({ params }: LearnPageProps) {
  const { level } = await params // Await async params

  // Validate the level against the enum
  if (!levelEnum.enumValues.includes(level as any)) {
    notFound() // Return 404 for invalid levels
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LessonsFetcher
        level={level as "beginner" | "intermediate" | "advanced"}
      />
    </Suspense>
  )
}

/**
 * LessonsFetcher component.
 * Fetches lessons server-side and renders them as LessonCard components.
 *
 * @param {Object} props - Props containing the level to fetch
 * @param {"beginner" | "intermediate" | "advanced"} props.level - The lesson level
 * @returns {JSX.Element} The rendered lesson list
 */
async function LessonsFetcher({
  level
}: {
  level: "beginner" | "intermediate" | "advanced"
}) {
  // Fetch lessons (assuming getLessonAction can filter by level; adjust if needed)
  const { isSuccess, data, message } = await getLessonAction(level)

  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">
          {message || "No lessons found for this level."}
        </p>
      </div>
    )
  }

  // Filter lessons by level (if getLessonAction doesn’t already)
  const lessons = data.filter((lesson: SelectLesson) => lesson.level === level)

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold capitalize">{level} Lessons</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson: SelectLesson) => (
          <div key={lesson.id} className="flex flex-col">
            <LessonCard lesson={lesson} />

            <div className="mt-2">
              <OfflineButton lessonId={lesson.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * LoadingSkeleton component.
 * Displays a placeholder UI while lessons are being fetched.
 *
 * @returns {JSX.Element} The loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Loading...</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-muted h-32 animate-pulse rounded-lg"
          ></div>
        ))}
      </div>
    </div>
  )
}
