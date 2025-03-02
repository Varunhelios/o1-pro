/**
 * @description
 * This file contains server actions for managing user progress in the Learn Kannada app.
 * It provides CRUD operations for progress records and gamification logic to track XP,
 * streaks, and badges, enhancing user engagement through motivational features.
 *
 * Key features:
 * - Create, read, and update progress records
 * - Gamification: Calculates XP, increments streaks, and awards badges
 * - Integrates with Supabase via Drizzle ORM for database operations
 *
 * @dependencies
 * - @/db/db: Provides the Drizzle ORM database instance
 * - @/db/schema/progress-schema: Imports progressTable and types
 * - @/types: Imports ActionState for consistent return types
 * - drizzle-orm: Provides eq and desc for query conditions and ordering
 *
 * @notes
 * - Marked "use server" per backend rules
 * - XP is awarded based on exercise completion (10 XP per submission)
 * - Streaks increment if updated within 24 hours of last update
 * - Badges are awarded at XP thresholds: Learner (50), Scholar (150), Master (300)
 * - No migrations generated here; handled externally
 */

"use server"

import { db } from "@/db/db"
import { InsertProgress, SelectProgress, progressTable } from "@/db/schema/progress-schema"
import { ActionState } from "@/types"
import { eq, desc } from "drizzle-orm"

// XP per exercise completion
const XP_PER_EXERCISE = 10

// Badge thresholds and names
const BADGE_THRESHOLDS: { [key: number]: string } = {
  50: "Learner",
  150: "Scholar",
  300: "Master"
}

// 24-hour window for streak increment (in milliseconds)
const STREAK_WINDOW = 24 * 60 * 60 * 1000

/**
 * Creates a new progress record for a user.
 * @param {InsertProgress} progress - The progress data to insert
 * @returns {Promise<ActionState<SelectProgress>>} The created progress record or error
 */
export async function createProgressAction(
  progress: InsertProgress
): Promise<ActionState<SelectProgress>> {
  try {
    const [newProgress] = await db.insert(progressTable).values(progress).returning()
    return {
      isSuccess: true,
      message: "Progress created successfully",
      data: newProgress
    }
  } catch (error) {
    console.error("Error creating progress:", error)
    return { isSuccess: false, message: "Failed to create progress" }
  }
}

/**
 * Retrieves all progress records for a user.
 * @param {string} userId - The user’s ID
 * @returns {Promise<ActionState<SelectProgress[]>>} The user’s progress records or error
 */
export async function getProgressByUserIdAction(
  userId: string
): Promise<ActionState<SelectProgress[]>> {
  try {
    const progressRecords = await db
      .select()
      .from(progressTable)
      .where(eq(progressTable.userId, userId))
    return {
      isSuccess: true,
      message: "Progress retrieved successfully",
      data: progressRecords
    }
  } catch (error) {
    console.error("Error retrieving progress:", error)
    return { isSuccess: false, message: "Failed to retrieve progress" }
  }
}

/**
 * Updates a progress record with new data.
 * @param {string} id - The progress record ID
 * @param {Partial<InsertProgress>} data - The data to update
 * @returns {Promise<ActionState<SelectProgress>>} The updated progress record or error
 */
export async function updateProgressAction(
  id: string,
  data: Partial<InsertProgress>
): Promise<ActionState<SelectProgress>> {
  try {
    const [updatedProgress] = await db
      .update(progressTable)
      .set(data)
      .where(eq(progressTable.id, id))
      .returning()

    if (!updatedProgress) {
      return { isSuccess: false, message: "Progress record not found" }
    }

    return {
      isSuccess: true,
      message: "Progress updated successfully",
      data: updatedProgress
    }
  } catch (error) {
    console.error("Error updating progress:", error)
    return { isSuccess: false, message: "Failed to update progress" }
  }
}

/**
 * Updates a user’s progress with gamification logic after an exercise submission.
 * @param {string} userId - The user’s ID
 * @param {string} lessonId - The lesson ID (optional)
 * @returns {Promise<ActionState<SelectProgress>>} The updated progress record or error
 */
export async function updateProgressWithGamificationAction(
  userId: string,
  lessonId?: string
): Promise<ActionState<SelectProgress>> {
  try {
    // Fetch the latest progress record for the user
    const existingProgressRecords = await db
      .select()
      .from(progressTable)
      .where(eq(progressTable.userId, userId))
      .orderBy(desc(progressTable.updatedAt))
      .limit(1)

    const existingProgress = existingProgressRecords[0]

    // Calculate new XP
    const newXp = (existingProgress?.xp || 0) + XP_PER_EXERCISE

    // Calculate streak
    const now = new Date()
    let newStreak = existingProgress?.streak || 0
    if (existingProgress && existingProgress.updatedAt) {
      const lastUpdate = new Date(existingProgress.updatedAt)
      const timeDiff = now.getTime() - lastUpdate.getTime()
      if (timeDiff <= STREAK_WINDOW) {
        newStreak += 1
      } else if (timeDiff > STREAK_WINDOW * 2) {
        newStreak = 1 // Reset streak if more than 48 hours have passed
      }
    } else {
      newStreak = 1 // First activity starts the streak
    }

    // Calculate badges
    let badges: string[] = existingProgress?.badges
      ? (existingProgress.badges as string[])
      : []
    for (const [threshold, badgeName] of Object.entries(BADGE_THRESHOLDS)) {
      if (newXp >= Number(threshold) && !badges.includes(badgeName)) {
        badges.push(badgeName)
      }
    }

    // Prepare updated progress data
    const updatedData: Partial<InsertProgress> = {
      xp: newXp,
      streak: newStreak,
      badges,
      updatedAt: now,
      ...(lessonId && { lessonId }) // Update lessonId if provided
    }

    let updatedProgress: SelectProgress

    if (existingProgress) {
      // Update existing record
      const [result] = await db
        .update(progressTable)
        .set(updatedData)
        .where(eq(progressTable.id, existingProgress.id))
        .returning()
      updatedProgress = result
    } else {
      // Create new record if none exists
      const [result] = await db
        .insert(progressTable)
        .values({
          userId,
          lessonId,
          xp: newXp,
          streak: newStreak,
          badges,
          createdAt: now,
          updatedAt: now
        })
        .returning()
      updatedProgress = result
    }

    return {
      isSuccess: true,
      message: "Progress updated with gamification successfully",
      data: updatedProgress
    }
  } catch (error) {
    console.error("Error updating progress with gamification:", error)
    return { isSuccess: false, message: "Failed to update progress with gamification" }
  }
}