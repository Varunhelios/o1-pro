"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import { lessonsTable, InsertLesson, SelectLesson } from "@/db/schema/lessons-schema"
import { ActionState } from "@/types"

/**
 * Creates a new lesson in the database.
 */
export async function createLessonAction(
  lesson: InsertLesson
): Promise<ActionState<SelectLesson>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to create a lesson" }
    }

    if (!lesson.title || !lesson.content || !lesson.level) {
      return { isSuccess: false, message: "Missing required fields: title, content, or level" }
    }

    const [newLesson] = await db.insert(lessonsTable).values(lesson).returning()
    return { isSuccess: true, message: "Lesson created successfully", data: newLesson }
  } catch (error) {
    console.error("Error creating lesson:", error)
    return { isSuccess: false, message: "Failed to create lesson due to a server error" }
  }
}

/**
 * Retrieves lessons from the database based on an optional level filter.
 */
export async function getLessonAction(
  level?: "beginner" | "intermediate" | "advanced"
): Promise<ActionState<SelectLesson[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to view lessons" }
    }

    const lessons = level
      ? await db.select().from(lessonsTable).where(eq(lessonsTable.level, level))
      : await db.select().from(lessonsTable)

    return { isSuccess: true, message: "Lessons retrieved successfully", data: lessons }
  } catch (error) {
    console.error("Error getting lessons:", error)
    return { isSuccess: false, message: "Failed to retrieve lessons due to a server error" }
  }
}

/**
 * Retrieves lessons by level for the Learn Page.
 */
export async function getLessonsByLevelAction(
  level: "beginner" | "intermediate" | "advanced"
): Promise<ActionState<SelectLesson[]>> {
  return getLessonAction(level)
}

/**
 * Updates an existing lesson in the database.
 */
export async function updateLessonAction(
  id: string,
  data: Partial<InsertLesson>
): Promise<ActionState<SelectLesson>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to update a lesson" }
    }

    if (Object.keys(data).length === 0) {
      return { isSuccess: false, message: "No data provided to update" }
    }

    const [updatedLesson] = await db
      .update(lessonsTable)
      .set(data)
      .where(eq(lessonsTable.id, id))
      .returning()

    if (!updatedLesson) {
      return { isSuccess: false, message: "Lesson not found" }
    }

    return { isSuccess: true, message: "Lesson updated successfully", data: updatedLesson }
  } catch (error) {
    console.error("Error updating lesson:", error)
    return { isSuccess: false, message: "Failed to update lesson due to a server error" }
  }
}

/**
 * Deletes a lesson from the database.
 */
export async function deleteLessonAction(id: string): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to delete a lesson" }
    }

    const deleted = await db.delete(lessonsTable).where(eq(lessonsTable.id, id)).returning()

    if (deleted.length === 0) {
      return { isSuccess: false, message: "Lesson not found" }
    }

    return { isSuccess: true, message: "Lesson deleted successfully", data: undefined }
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return { isSuccess: false, message: "Failed to delete lesson due to a server error" }
  }
}
