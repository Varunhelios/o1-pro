/**
 * @description
 * This file defines server actions for managing exercises in the Learn Kannada app.
 * It provides functions to create, retrieve, and submit exercises stored in the Supabase
 * PostgreSQL database using Drizzle ORM. These actions support the interactive exercises
 * feature by enabling exercise creation, retrieval by lesson, and basic scoring.
 *
 * Key features:
 * - Create Exercise: Adds a new exercise linked to a lesson
 * - Retrieve Exercises: Fetches all exercises for a given lesson ID
 * - Submit Exercise: Processes user responses and returns a score (basic implementation)
 *
 * @dependencies
 * - @clerk/nextjs/server: Used for authentication via Clerk
 * - drizzle-orm: Provides database query capabilities with Drizzle ORM
 * - @/db/db: Imports the database instance with schema
 * - @/db/schema/exercises-schema: Imports exercises table schema and types
 * - @/types/server-action-types: Imports ActionState type for consistent return values
 *
 * @notes
 * - All actions are server-side only ("use server") per Next.js conventions
 * - Authentication is included for submitExerciseAction; creation/retrieval may assume admin or lesson context
 * - Scoring in submitExerciseAction is basic (correct/incorrect); AI integration is planned for later steps
 * - Date handling relies on schema defaults for createdAt/updatedAt
 * - Assumes exercise content JSON includes a 'correctAnswer' field for scoring
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import {
  InsertExercise,
  SelectExercise,
  exercisesTable
} from "@/db/schema/exercises-schema"
import { ActionState } from "@/types/server-action-types"

/**
 * Creates a new exercise linked to a specific lesson.
 * @param exercise - The exercise data to insert (excluding id, createdAt, updatedAt)
 * @returns Promise<ActionState<SelectExercise>> - Success with new exercise or error
 */
export async function createExerciseAction(
  exercise: Omit<InsertExercise, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectExercise>> {
  try {
    // Validate required fields
    if (!exercise.lessonId || !exercise.type || !exercise.content) {
      return {
        isSuccess: false,
        message: "Missing required fields: lessonId, type, or content"
      }
    }

    // Insert the exercise into the database
    const [newExercise] = await db
      .insert(exercisesTable)
      .values(exercise)
      .returning()

    return {
      isSuccess: true,
      message: "Exercise created successfully",
      data: newExercise
    }
  } catch (error) {
    console.error("Error creating exercise:", error)
    return {
      isSuccess: false,
      message: "Failed to create exercise due to a server error"
    }
  }
}

/**
 * Retrieves all exercises associated with a given lesson ID.
 * @param lessonId - The ID of the lesson to fetch exercises for
 * @returns Promise<ActionState<SelectExercise[]>> - Success with exercise list or error
 */
export async function getExercisesByLessonIdAction(
  lessonId: string
): Promise<ActionState<SelectExercise[]>> {
  try {
    // Validate lessonId
    if (!lessonId) {
      return {
        isSuccess: false,
        message: "Lesson ID is required"
      }
    }

    // Fetch exercises for the specified lesson
    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.lessonId, lessonId))

    return {
      isSuccess: true,
      message: "Exercises retrieved successfully",
      data: exercises
    }
  } catch (error) {
    console.error("Error retrieving exercises:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve exercises due to a server error"
    }
  }
}

/**
 * Submits a user’s exercise response and returns a basic score.
 * @param exerciseId - The ID of the exercise being submitted
 * @param userResponse - The user’s response to the exercise (string or JSON based on type)
 * @returns Promise<ActionState<{ score: number; feedback: string }>> - Success with score or error
 */
export async function submitExerciseAction(
  exerciseId: string,
  userResponse: string | object
): Promise<ActionState<{ score: number; feedback: string }>> {
  // Authenticate the user
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to submit exercises"
    }
  }

  try {
    // Validate inputs
    if (!exerciseId || !userResponse) {
      return {
        isSuccess: false,
        message: "Exercise ID and user response are required"
      }
    }

    // Fetch the exercise to get the correct answer
    const [exercise] = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .limit(1)

    if (!exercise) {
      return {
        isSuccess: false,
        message: "Exercise not found"
      }
    }

    // Basic scoring logic (assumes content JSON has a 'correctAnswer' field)
    const content = exercise.content as { correctAnswer?: string }
    if (!content.correctAnswer) {
      return {
        isSuccess: false,
        message: "Exercise content lacks a correct answer for scoring"
      }
    }

    // Compare user response with correct answer (string comparison for simplicity)
    const isCorrect =
      typeof userResponse === "string" &&
      userResponse.trim().toLowerCase() === content.correctAnswer.trim().toLowerCase()
    const score = isCorrect ? 1 : 0
    const feedback = isCorrect ? "Correct! Well done." : "Incorrect. Try again!"

    return {
      isSuccess: true,
      message: "Exercise submitted successfully",
      data: { score, feedback }
    }
  } catch (error) {
    console.error("Error submitting exercise:", error)
    return {
      isSuccess: false,
      message: "Failed to submit exercise due to a server error"
    }
  }
}