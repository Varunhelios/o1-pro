/**
 * @description
 * Server actions for managing lessons in the Learn Kannada app.
 * Provides CRUD operations for lessons stored in the database.
 *
 * Key features:
 * - Create, read, update, and delete lessons
 * - Type-safe interactions with the lessons table
 *
 * @dependencies
 * - @/db/db: Drizzle ORM database instance
 * - @/db/schema/lessons-schema: Lesson schema definitions
 * - @/types: ActionState type for consistent return values
 * - drizzle-orm: For database operations (eq for where clauses)
 *
 * @notes
 * - All actions follow the ActionState pattern
 * - Errors are logged and returned as user-friendly messages
 */

"use server"

import { db } from "@/db/db"
import { lessonsTable } from "@/db/schema/lessons-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

// Explicitly define InsertLesson to enforce level enum
interface InsertLesson {
  id: string
  level: "beginner" | "intermediate" | "advanced"
  title: string
  content: unknown // JSON content, can be refined further if needed
}

// SelectLesson extends InsertLesson with timestamps
interface SelectLesson extends InsertLesson {
  createdAt: Date
  updatedAt: Date
}

/**
 * Creates a new lesson in the database.
 * @param lesson - The lesson data to insert
 * @returns Promise<ActionState<SelectLesson>> - Success or failure state with the created lesson
 */
export async function createLessonAction(lesson: InsertLesson): Promise<ActionState<SelectLesson>> {
  try {
    const [newLesson] = await db.insert(lessonsTable).values(lesson).returning()
    return { isSuccess: true, message: "Lesson created successfully", data: newLesson }
  } catch (error) {
    console.error("Error creating lesson:", error)
    return { isSuccess: false, message: "Failed to create lesson" }
  }
}

/**
 * Retrieves a lesson by its ID.
 * @param id - The ID of the lesson to retrieve
 * @returns Promise<ActionState<SelectLesson[]>> - Success or failure state with the lesson array
 */
export async function getLessonAction(id: string): Promise<ActionState<SelectLesson[]>> {
  try {
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id))
    return { isSuccess: true, message: "Lesson retrieved successfully", data: lessons }
  } catch (error) {
    console.error("Error getting lesson:", error)
    return { isSuccess: false, message: "Failed to get lesson" }
  }
}

/**
 * Updates an existing lesson by its ID.
 * @param id - The ID of the lesson to update
 * @param data - Partial lesson data to update
 * @returns Promise<ActionState<SelectLesson>> - Success or failure state with the updated lesson
 */
export async function updateLessonAction(id: string, data: Partial<InsertLesson>): Promise<ActionState<SelectLesson>> {
  try {
    const [updatedLesson] = await db.update(lessonsTable).set(data).where(eq(lessonsTable.id, id)).returning()
    return { isSuccess: true, message: "Lesson updated successfully", data: updatedLesson }
  } catch (error) {
    console.error("Error updating lesson:", error)
    return { isSuccess: false, message: "Failed to update lesson" }
  }
}

/**
 * Deletes a lesson by its ID.
 * @param id - The ID of the lesson to delete
 * @returns Promise<ActionState<void>> - Success or failure state
 */
export async function deleteLessonAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(lessonsTable).where(eq(lessonsTable.id, id))
    return { isSuccess: true, message: "Lesson deleted successfully", data: undefined }
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return { isSuccess: false, message: "Failed to delete lesson" }
  }
}