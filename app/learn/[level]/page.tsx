"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"

import { ActionState } from "@/types"
import { db } from "@/db/db"
import { lessonsTable, levelEnum } from "@/db/schema/lessons-schema"
import { LessonCard } from "@/components/learn/lesson-card"
import { SelectLesson } from "@/db/schema/lessons-schema"
import { eq } from "drizzle-orm"

// Define params interface for dynamic route
interface LearnPageParams {
  level: string
}

/**
 * Fetches lessons by level from the database.
 * @param {string} level - The lesson level to filter by
 * @returns {Promise<ActionState<SelectLesson[]>>} The lessons or an error state
 */
async function getLessonsByLevelAction(
  level: string
): Promise<ActionState<SelectLesson[]>> {
  // Validate level against allowed enum values
  if (!levelEnum.enumValues.includes(level as any)) {
    return {
      isSuccess: false,
      message: "Invalid level. Must be beginner, intermediate, or advanced."
    }
  }

  try {
    const lessons = await db
      .select()
      .from(lessonsTable)
      .where(
        eq(
          lessonsTable.level,
          level as "beginner" | "intermediate" | "advanced"
        )
      ) // Ensured proper type casting

    return {
      isSuccess: true,
      message: "Lessons retrieved successfully",
      data: lessons
    }
  } catch (error) {
    console.error("Error fetching lessons:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch lessons"
    }
  }
}

/**
 * LearnPage renders lessons for a specific level.
 * @param {Promise<{ level: string }>} params - Dynamic route params wrapped in Promise
 * @returns {JSX.Element} The lessons page UI
 */
export default async function LearnPage({
  params
}: {
  params: Promise<LearnPageParams>
}) {
  // Await params as per server component rules
  const { level } = await params

  // Validate level before querying
  if (!levelEnum.enumValues.includes(level as any)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">
          Invalid level: {level}. Please use beginner, intermediate, or
          advanced.
        </div>
      </div>
    )
  }

  // Check authentication
  const { userId } = await auth()
  if (!userId) {
    return redirect("/login") // Middleware (Step 28) will handle this later
  }

  // Fetch lessons server-side
  const lessonResponse = await getLessonsByLevelAction(level)

  // Handle fetch failure
  if (!lessonResponse.isSuccess || !lessonResponse.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">
          {lessonResponse.message || "Unable to load lessons."}
        </div>
      </div>
    )
  }

  const lessons = lessonResponse.data

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center space-x-3">
        <BookOpen className="text-primary size-8" />
        <h1 className="text-foreground text-3xl font-bold capitalize">
          {level} Lessons
        </h1>
      </div>

      {/* Lessons Grid */}
      {lessons.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              level={lesson.level}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-center text-lg">
          No lessons available for this level yet.
        </div>
      )}
    </div>
  )
}
