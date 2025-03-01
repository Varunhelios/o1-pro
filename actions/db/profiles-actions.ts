/**
 * @description
 * This file defines server actions for managing user progress in the Learn Kannada app.
 * It provides functions to create, retrieve, and update progress records stored in the
 * Supabase PostgreSQL database using Drizzle ORM. These actions support the progress
 * tracking and gamification features by managing XP, streaks, and badges for users.
 *
 * Key features:
 * - Create Progress: Initializes a new progress record for a user and lesson
 * - Retrieve Progress: Fetches all progress records for a given user
 * - Update Progress: Modifies an existing progress record (e.g., XP, streak, badges)
 *
 * @dependencies
 * - @clerk/nextjs/server: Used for authentication via Clerk
 * - drizzle-orm: Provides database query capabilities with Drizzle ORM
 * - @/db/db: Imports the database instance with schema
 * - @/db/schema/progress-schema: Imports progress table schema and types
 * - @/types/server-action-types: Imports ActionState type for consistent return values
 *
 * @notes
 * - All actions are server-side only ("use server") per Next.js conventions
 * - Authentication is required; unauthenticated requests are rejected
 * - Progress updates use partial updates to allow flexible modifications
 * - Date handling follows backend rules by relying on schema defaults for timestamps
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import {
  InsertProgress,
  SelectProgress,
  progressTable
} from "@/db/schema/progress-schema"
import { ActionState } from "@/types/server-action-types"
import { profilesTable } from "@/db/schema/profiles-schema"

/**
 * Creates a new progress record for the authenticated user.
 * @param progress - The progress data to insert (excluding id, createdAt, updatedAt)
 * @returns Promise<ActionState<SelectProgress>> - Success with new progress or error
 */
export async function createProgressAction(
  progress: Omit<InsertProgress, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectProgress>> {
  // Authenticate the user
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to create progress"
    }
  }

  try {
    // Ensure userId matches the authenticated user
    const progressData: InsertProgress = {
      ...progress,
      userId,
      xp: progress.xp ?? 0, // Default to 0 if not provided
      streak: progress.streak ?? 0, // Default to 0 if not provided
      badges: progress.badges ?? [] // Default to empty array if not provided
    }

    // Insert the progress record into the database
    const [newProgress] = await db
      .insert(progressTable)
      .values(progressData)
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
      message: "Failed to create progress due to a server error"
    }
  }
}

/**
 * Retrieves all progress records for the authenticated user.
 * @param userIdParam - Optional user ID to fetch progress for (must match auth user)
 * @returns Promise<ActionState<SelectProgress[]>> - Success with progress list or error
 */
export async function getProgressByUserIdAction(
  userIdParam?: string
): Promise<ActionState<SelectProgress[]>> {
  // Authenticate the user
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to view progress"
    }
  }

  // If userIdParam is provided, ensure it matches the authenticated user
  if (userIdParam && userIdParam !== userId) {
    return {
      isSuccess: false,
      message: "Forbidden: You can only view your own progress"
    }
  }

  try {
    // Fetch all progress records for the authenticated user
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
    return {
      isSuccess: false,
      message: "Failed to retrieve progress due to a server error"
    }
  }
}

/**
 * Updates an existing progress record for the authenticated user.
 * @param id - The ID of the progress record to update
 * @param data - Partial progress data to update (e.g., xp, streak, badges)
 * @returns Promise<ActionState<SelectProgress>> - Success with updated progress or error
 */
export async function updateProgressAction(
  id: string,
  data: Partial<Omit<InsertProgress, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<ActionState<SelectProgress>> {
  // Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to update progress"
    };
  }

  try {
    // Try to update progress directly and return the updated record
    const [updatedProgress] = await db
      .update(progressTable)
      .set(data)
      .where(eq(progressTable.id, id))
      .returning();

    if (!updatedProgress) {
      return {
        isSuccess: false,
        message: "Progress record not found or unauthorized"
      };
    }

    return {
      isSuccess: true,
      message: "Progress updated successfully",
      data: updatedProgress
    };
  } catch (error) {
    console.error("Error updating progress:", error);
    return {
      isSuccess: false,
      message: "Failed to update progress due to a server error"
    };
  }
}

export async function updateProfileAction(userId: string, data: any) {
    // Implementation for updating a profile based on userId
    try {
        const updatedProfile = await db
            .update(profilesTable) // Now profilesTable should be defined
            .set(data)
            .where(eq(profilesTable.userId, userId))
            .returning();

        return {
            isSuccess: true,
            message: "Profile updated successfully",
            data: updatedProfile
        };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            isSuccess: false,
            message: "Failed to update profile"
        };
    }
}

export async function updateProfileByStripeCustomerIdAction(customerId: string, data: any) {
    // Implementation for updating a profile based on Stripe customer ID
    try {
        const updatedProfile = await db
            .update(profilesTable) // Assuming profilesTable is defined
            .set(data)
            .where(eq(profilesTable.stripeCustomerId, customerId))
            .returning();

        return {
            isSuccess: true,
            message: "Profile updated successfully by Stripe customer ID",
            data: updatedProfile
        };
    } catch (error) {
        console.error("Error updating profile by Stripe customer ID:", error);
        return {
            isSuccess: false,
            message: "Failed to update profile by Stripe customer ID"
        };
    }
}
