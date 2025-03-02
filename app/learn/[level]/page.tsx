/**
 * @description
 * This server-side page component renders lessons for a specific level in the Learn Kannada app.
 * It fetches lesson data based on the dynamic [level] route parameter and displays lesson cards,
 * supporting the structured curriculum feature. Designed as part of the /learn/[level] route
 * to provide a server-rendered learning experience.
 *
 * Key features:
 * - Dynamic Routing: Uses Next.js dynamic route parameter [level] to fetch lessons
 * - Lesson Display: Renders LessonCard components for each lesson
 * - Server-Side Fetching: Fetches data directly with server actions
 * - Responsive UI: Uses Tailwind CSS and Shadcn components for a clean, minimalistic design
 *
 * @dependencies
 * - @/actions/db/lessons-actions: Imports getLessonsByLevelAction for fetching lessons
 * - @/components/learn/lesson-card: Renders individual lesson cards
 * - @/db/schema/lessons-schema: Imports SelectLesson for type safety
 *
 * @notes
 * - Follows Step 15's intent for server-side fetching; converted from client component to fix import issues
 * - No Suspense explicitly needed since no async child components are rendered separately
 * - Handles edge cases like invalid levels or fetch failures with fallback UI
 * - Assumes lesson data is available in the database
 */

"use server"

import { getLessonsByLevelAction } from "@/actions/db/lessons-actions"
import { LessonCard } from "@/components/learn/lesson-card" // Change to named import
import { SelectLesson } from "@/db/schema/lessons-schema"

/**
 * LearnLevelPage component displays lessons for a specific level.
 * @param {Promise<{ level: string }>} params - Dynamic route parameters (awaited)
 * @returns {JSX.Element} A page with lesson cards or error/no-data states
 */
export default async function LearnLevelPage({
  params
}: {
  params: Promise<{ level: string }>
}) {
  const { level } = await params // Await params as per server component rules

  // Define valid levels
  const validLevels = ["beginner", "intermediate", "advanced"] as const
  type LessonLevel = (typeof validLevels)[number]

  // Validate and narrow level type
  if (!validLevels.includes(level as LessonLevel)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-lg">
          Invalid lesson level: {level}
        </div>
      </div>
    )
  }

  const validatedLevel = level as LessonLevel // Type assertion after validation

  // Fetch lessons server-side
  const result = await getLessonsByLevelAction(validatedLevel)
  if (!result.isSuccess || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-lg">
          {result.message || "Failed to fetch lessons"}
        </div>
      </div>
    )
  }

  const lessons: SelectLesson[] = result.data as SelectLesson[] // Explicit typing for clarity

  // Render lessons or no-data state
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold capitalize">
        {level} Lessons
      </h1>
      {lessons.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-lg">
          No lessons available for {level} level.
        </div>
      )}
    </div>
  )
}
