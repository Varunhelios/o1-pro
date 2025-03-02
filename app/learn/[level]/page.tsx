"use server"

import { getLessonsByLevelAction } from "@/actions/db/lessons-actions"
import { LessonCard } from "@/components/learn/lesson-card" // ✅ Named import
import { SelectLesson } from "@/db/schema/lessons-schema"

export default async function LearnLevelPage({
  params
}: {
  params: { level: string }
}) {
  const { level } = params

  const validLevels = ["beginner", "intermediate", "advanced"] as const
  type LessonLevel = (typeof validLevels)[number]

  if (!validLevels.includes(level as LessonLevel)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-lg">
          Invalid lesson level: {level}
        </div>
      </div>
    )
  }

  const validatedLevel = level as LessonLevel
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

  const lessons: SelectLesson[] = result.data

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold capitalize">
        {level} Lessons
      </h1>

      {lessons.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} /> // ✅ Fixes prop structure
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
