/*
 * Defines server actions for managing lessons in the Learn Kannada app.
 * This file implements CRUD operations (Create, Read, Update, Delete) for the lessons table,
 * supporting the structured curriculum feature by allowing lesson creation, retrieval, modification, and deletion.
 *
 * Key features:
 * - CRUD operations for lessons using Drizzle ORM
 * - Authentication via Clerk to ensure only authorized users can manage lessons
 * - Returns ActionState for consistent success/failure handling
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides auth() for user authentication
 * - drizzle-orm: Provides database query utilities (eq)
 * - @/db/db: Imports the Drizzle database instance
 * - @/db/schema/lessons-schema: Imports lessonsTable and its types
 * - @/types: Imports ActionState type
 *
 * @notes
 * - All actions are server-side only ("use server")
 * - Actions follow CRUD order: Create, Read, Update, Delete
 * - Error handling includes logging and user-friendly messages
 * - Assumes userId is available via Clerk auth for potential future access control
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import { lessonsTable, InsertLesson, SelectLesson } from "@/db/schema/lessons-schema"
import { ActionState } from "@/types"

/**
 * Creates a new lesson in the database.
 * @param lesson - The lesson data to insert
 * @returns Promise<ActionState<SelectLesson>> - The result of the create operation
 */
export async function createLessonAction(
  lesson: InsertLesson
): Promise<ActionState<SelectLesson>> {
  try {
    const { userId } = await auth()

    // Check if user is authenticated
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to create a lesson" }
    }

    // Validate input (basic check; more could be added based on requirements)
    if (!lesson.title || !lesson.content || !lesson.level) {
      return { isSuccess: false, message: "Missing required fields: title, content, or level" }
    }

    // Insert the lesson into the database
    const [newLesson] = await db.insert(lessonsTable).values(lesson).returning()

    return {
      isSuccess: true,
      message: "Lesson created successfully",
      data: newLesson
    }
  } catch (error) {
    console.error("Error creating lesson:", error)
    return {
      isSuccess: false,
      message: "Failed to create lesson due to a server error"
    }
  }
}

/**
 * Retrieves lessons from the database based on optional level filter.
 * @param level - Optional level to filter lessons (beginner, intermediate, advanced)
 * @returns Promise<ActionState<SelectLesson[]>> - The result of the read operation
 */
export async function getLessonAction(
  level?: "beginner" | "intermediate" | "advanced"
): Promise<ActionState<SelectLesson[]>> {
  try {
    const { userId } = await auth()

    // Check if user is authenticated
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to view lessons" }
    }

    // Fetch lessons, optionally filtering by level
    const lessons = await db
  .select()
  .from(lessonsTable)
  .where(level ? eq(lessonsTable.level, level) : undefined)


    return {
      isSuccess: true,
      message: "Lessons retrieved successfully",
      data: lessons
    }
  } catch (error) {
    console.error("Error getting lessons:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve lessons due to a server error"
    }
  }
}

/**
 * Updates an existing lesson in the database.
 * @param id - The ID of the lesson to update
 * @param data - Partial lesson data to update
 * @returns Promise<ActionState<SelectLesson>> - The result of the update operation
 */
export async function updateLessonAction(
  id: string,
  data: Partial<InsertLesson>
): Promise<ActionState<SelectLesson>> {
  try {
    const { userId } = await auth()

    // Check if user is authenticated
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to update a lesson" }
    }

    // Validate input (ensure at least one field is provided)
    if (Object.keys(data).length === 0) {
      return { isSuccess: false, message: "No data provided to update" }
    }

    // Update the lesson in the database
    const [updatedLesson] = await db
      .update(lessonsTable)
      .set(data)
      .where(eq(lessonsTable.id, id))
      .returning()

    // Check if the lesson was found and updated
    if (!updatedLesson) {
      return { isSuccess: false, message: "Lesson not found" }
    }

    return {
      isSuccess: true,
      message: "Lesson updated successfully",
      data: updatedLesson
    }
  } catch (error) {
    console.error("Error updating lesson:", error)
    return {
      isSuccess: false,
      message: "Failed to update lesson due to a server error"
    }
  }
}

/**
 * Deletes a lesson from the database.
 * @param id - The ID of the lesson to delete
 * @returns Promise<ActionState<void>> - The result of the delete operation
 */
export async function deleteLessonAction(id: string): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()

    // Check if user is authenticated
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: You must be logged in to delete a lesson" }
    }

    // Delete the lesson from the database
    const deleted = await db.delete(lessonsTable).where(eq(lessonsTable.id, id)).returning()

    // Check if the lesson was found and deleted
    if (deleted.length === 0) {
      return { isSuccess: false, message: "Lesson not found" }
    }

    return {
      isSuccess: true,
      message: "Lesson deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return {
      isSuccess: false,
      message: "Failed to delete lesson due to a server error"
    }
  }
}