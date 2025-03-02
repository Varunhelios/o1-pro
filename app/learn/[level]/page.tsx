/**
 * @description
 * This server-side page renders a lesson for a specific level in the Learn Kannada app.
 * It fetches lesson data based on the dynamic [level] route parameter and displays the lesson
 * content, including a pronunciation guide for interactive learning.
 *
 * Key features:
 * - Dynamic Routing: Handles the [level] parameter as a Promise per Next.js 15
 * - Server-Side Data Fetching: Retrieves lesson data using a server action
 * - Pronunciation Practice: Integrates the PronunciationGuide client component
 * - Loading State: Uses Suspense for asynchronous data fetching
 *
 * @dependencies
 * - @/actions/db/lessons-actions: Provides getLessonAction for fetching lessons
 * - @/components/learn/pronunciation-guide: Client component for pronunciation practice
 * - react: Provides Suspense for async rendering
 * - @/db/schema/lessons-schema: Imports SelectLesson for type safety
 *
 * @notes
 * - Marked "use server" to adhere to server component rules
 * - Params are awaited as a Promise per Next.js 15 dynamic route behavior
 * - No direct client-side logic; data is passed to PronunciationGuide as props
 * - Placeholder onSubmit logs to console; will be replaced in Step 23 with assessPronunciationAction
 * - Handles edge case of lesson not found with a fallback message
 */

"use server"

import { Suspense } from "react"
import { getLessonAction } from "@/actions/db/lessons-actions"
import PronunciationGuide from "@/components/learn/pronunciation-guide"
import { SelectLesson } from "@/db/schema/lessons-schema"

/**
 * Props interface for the LessonPage component.
 * @interface LessonPageProps
 */
interface LessonPageProps {
  params: Promise<{ level: string }> // Dynamic route params as a Promise
}

/**
 * LessonPage component fetches and renders a lesson for a given level.
 * @param {LessonPageProps} props - The route parameters
 * @returns {JSX.Element} The lesson content with pronunciation guide
 */
export default async function LessonPage({ params }: LessonPageProps) {
  // Await the params Promise to get the level
  const { level } = await params

  return (
    <Suspense fallback={<div>Loading lesson...</div>}>
      <LessonContentFetcher level={level} />
    </Suspense>
  )
}

/**
 * LessonContentFetcher fetches lesson data and renders the content.
 * @param {{ level: string }} props - The level to fetch
 * @returns {JSX.Element} The rendered lesson content
 */
async function LessonContentFetcher({ level }: { level: string }) {
  // Define valid levels
  const validLevels = ["beginner", "intermediate", "advanced"] as const
  type LessonLevel = (typeof validLevels)[number]

  // Validate and assert the level type
  if (!validLevels.includes(level as LessonLevel)) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        {"Invalid lesson level."}
      </div>
    )
  }

  // Fetch the lesson data using the server action
  const { isSuccess, data, message } = await getLessonAction(
    level as LessonLevel
  )

  // Handle case where lesson is not found or fetch fails
  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        {message || "Lesson not found for this level."}
      </div>
    )
  }

  // Assuming data is an array, select the first lesson
  const lesson = data[0] // Get the first lesson from the array

  // Type assertion to ensure content has a phrase property
  const lessonContent = lesson.content as { phrase: string; text: string }

  return (
    <div className="container mx-auto p-4">
      {/* Lesson Title */}
      <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>

      {/* Lesson Content */}
      <div className="mb-6 text-lg">{lessonContent.text}</div>

      {/* Pronunciation Guide */}
      <PronunciationGuide
        phrase={lessonContent.phrase || "No phrase available"}
        onSubmit={async (transcript: string) => {
          // Placeholder: Log transcript; replace with assessPronunciationAction in Step 23
          console.log(`User said: ${transcript}`)
        }}
      />
    </div>
  )
}
