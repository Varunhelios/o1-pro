/**
 * @description
 * This server-side page renders the learning interface for the Learn Kannada app.
 * It displays lessons for a specific level (beginner, intermediate, advanced) and adjusts
 * the level dynamically based on user progress using AI recommendations.
 *
 * Key features:
 * - Dynamic routing: Handles lesson level via [level] parameter
 * - Server-side data fetching: Retrieves lessons and adjusts difficulty
 * - Suspense: Provides loading states during async operations
 * - AI-driven adjustment: Redirects to recommended level if progress suggests a mismatch
 * - Responsive UI: Uses Tailwind CSS for a clean, minimalistic design
 *
 * @dependencies
 * - @/actions/db/lessons-actions: Fetches lessons by level
 * - @/actions/ai-actions: Adjusts lesson difficulty based on progress
 * - @/components/learn/lesson-card: Reusable component for lesson display
 * - @clerk/nextjs/server: Clerk auth for user identification
 * - react: Suspense for async handling
 * - next/navigation: Redirects for level adjustment
 *
 * @notes
 * - Requires user authentication via Clerk; redirects to login if unauthenticated
 * - Fetches all lessons for the requested level unless adjusted by AI
 * - Skeleton fallback enhances UX during data loading
 * - Edge case: If no lessons exist for a level, displays a message
 * - Progress is set to 0 as a placeholder; actual progress integration pending (e.g., Step 24)
 */

"use server"

import { getLessonsByLevelAction } from "@/actions/db/lessons-actions"
import { adjustLessonDifficultyAction } from "@/actions/ai-actions"
import { LessonCard } from "@/components/learn/lesson-card"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"

// Skeleton component for loading state
async function LearnSkeleton() {
  return (
    <div className="w-full max-w-4xl p-4">
      <div className="mb-6 h-8 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 w-full animate-pulse rounded bg-gray-200"
          />
        ))}
      </div>
    </div>
  )
}

// Fetcher component to handle async data retrieval and level adjustment
async function LessonsFetcher({ level }: { level: string }) {
  // Validate level parameter
  const validLevels = ["beginner", "intermediate", "advanced"]
  if (!validLevels.includes(level)) {
    redirect("/learn/beginner") // Default redirect for invalid levels
  }

  // Get authenticated user ID from Clerk
  const { userId } = await auth()
  if (!userId) {
    redirect("/login") // Redirect to login if user is not authenticated
  }

  // Adjust lesson difficulty based on user progress
  const adjustmentResult = await adjustLessonDifficultyAction(userId)
  if (adjustmentResult.isSuccess && adjustmentResult.data !== level) {
    // Redirect to the recommended level if it differs from the requested one
    redirect(`/learn/${adjustmentResult.data}`)
  }
  if (!adjustmentResult.isSuccess) {
    console.error(
      "Failed to adjust lesson difficulty:",
      adjustmentResult.message
    )
    // Proceed with requested level as fallback
  }

  // Fetch lessons for the requested level
  const { isSuccess, data, message } = await getLessonsByLevelAction(
    level as "beginner" | "intermediate" | "advanced"
  )
  if (!isSuccess || !data) {
    console.error(`Failed to fetch lessons: ${message}`)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">
          Failed to load lessons. Please try again later.
        </div>
      </div>
    )
  }

  // Render lessons if available
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="w-full max-w-4xl p-4">
        <h1 className="text-foreground mb-6 text-2xl font-semibold capitalize">
          {level} Lessons
        </h1>

        {data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map(lesson => (
              <LessonCard
                key={lesson.id}
                title={lesson.title}
                level={lesson.level}
                progress={0} // Placeholder; actual progress to be integrated later
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">
            No lessons available for this level yet.
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * LearnPage renders the lesson interface for a specific level with AI-driven adjustment.
 * @param {Promise<{ level: string }>} params - Dynamic route params with lesson level
 * @returns {JSX.Element} The lessons UI with Suspense boundary
 */
export default async function LearnPage({
  params
}: {
  params: Promise<{ level: string }>
}) {
  // Await dynamic params
  const { level } = await params

  return (
    <Suspense fallback={<LearnSkeleton />}>
      <LessonsFetcher level={level} />
    </Suspense>
  )
}
