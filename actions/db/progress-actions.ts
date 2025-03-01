/**
 * @description
 * This file contains server actions for managing user progress in the Learn Kannada app.
 * It provides CRUD operations to create, retrieve, and update progress entries,
 * supporting the progress tracking and gamification features.
 *
 * Key features:
 * - Create: Adds new progress entries with XP, streak, and badges
 * - Read: Retrieves all progress entries for a user by userId
 * - Update: Modifies existing progress entries by ID
 * - Uses Drizzle ORM for database operations with type safety
 * - Returns ActionState for consistent success/failure responses
 *
 * @dependencies
 * - @/db/db: Drizzle ORM database instance
 * - @/db/schema/progress-schema: Progress table schema and types
 * - @/types: ActionState type for response consistency
 * - drizzle-orm: Equality operator (eq) for queries
 *
 * @notes
 * - No Delete action included as it’s not specified in Step 9; add later if needed
 * - All actions are marked with "use server" per frontend rules
 * - Error handling logs issues to console and returns failure states
 * - Assumes progressTable is already migrated to the database
 * - Follows CRUD order: Create, Read, Update
 */

"use server"

import { db } from "@/db/db"
import { InsertProgress, SelectProgress, progressTable } from "@/db/schema/progress-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Creates a new progress entry for a user.
 * @param {InsertProgress} progress - The progress data to insert
 * @returns {Promise<ActionState<SelectProgress>>} The result of the creation
 */
export async function createProgressAction(
  progress: InsertProgress
): Promise<ActionState<SelectProgress>> {
  try {
    // Insert the new progress entry and return the created record
    const [newProgress] = await db
      .insert(progressTable)
      .values(progress)
      .returning()

    return {
      isSuccess: true,
      message: "Progress created successfully",
      data: newProgress
    }
  } catch (error) {
    console.error("Error creating progress:", error)
    return {
      isSuccess: false,
      message: "Failed to create progress"
    }
  }
}

/**
 * Retrieves all progress entries for a given user.
 * @param {string} userId - The ID of the user whose progress to fetch
 * @returns {Promise<ActionState<SelectProgress[]>>} The user's progress entries
 */
export async function getProgressByUserIdAction(
  userId: string
): Promise<ActionState<SelectProgress[]>> {
  try {
    // Fetch all progress entries where userId matches
    const progressEntries = await db
      .select()
      .from(progressTable)
      .where(eq(progressTable.userId, userId))

    return {
      isSuccess: true,
      message: "Progress retrieved successfully",
      data: progressEntries
    }
  } catch (error) {
    console.error("Error retrieving progress:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve progress"
    }
  }
}

/**
 * Updates an existing progress entry by ID.
 * @param {string} id - The ID of the progress entry to update
 * @param {Partial<InsertProgress>} data - The fields to update
 * @returns {Promise<ActionState<SelectProgress>>} The updated progress entry
 */
export async function updateProgressAction(
  id: string,
  data: Partial<InsertProgress>
): Promise<ActionState<SelectProgress>> {
  try {
    // Update the progress entry and return the updated record
    const [updatedProgress] = await db
      .update(progressTable)
      .set(data)
      .where(eq(progressTable.id, id))
      .returning()

    if (!updatedProgress) {
      return {
        isSuccess: false,
        message: "Progress entry not found"
      }
    }

    return {
      isSuccess: true,
      message: "Progress updated successfully",
      data: updatedProgress
    }
  } catch (error) {
    console.error("Error updating progress:", error)
    return {
      isSuccess: false,
      message: "Failed to update progress"
    }
  }
}