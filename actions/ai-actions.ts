/**
 * @description
 * This file contains server actions for AI-driven features in the Learn Kannada app.
 * It uses the OpenAI client to generate grammar explanations and adjust lesson difficulty
 * based on user progress, supporting the AI-Driven Assistance and Learning Modules features.
 *
 * Key features:
 * - Grammar explanations: Generates concise explanations for Kannada grammar issues
 * - Lesson difficulty adjustment: Recommends lesson levels based on user performance
 * - Server-side execution: Ensures API key security and compliance with project rules
 * - Error handling: Manages API errors, rate limits, and data fetch failures gracefully
 *
 * @dependencies
 * - @/lib/ai/openai: Configured OpenAI client for API calls
 * - @/actions/db/progress-actions: Fetches user progress data
 * - @/types: ActionState type for consistent return values
 * - @/db/schema/lessons-schema: LevelEnum for type safety in lesson levels
 *
 * @notes
 * - Runs as a server action ("use server") to keep API interactions secure
 * - Assumes progress data reflects user performance; may need refinement with more metrics
 * - Response is limited to a single level recommendation for simplicity
 * - Caches could be added for rate limit mitigation in future iterations
 */

"use server"

import { openai } from "@/lib/ai/openai"
import { getProgressByUserIdAction } from "@/actions/db/progress-actions"
import { ActionState } from "@/types"
import { levelEnum } from "@/db/schema/lessons-schema"

/**
 * Generates an AI-driven grammar explanation for a given sentence or phrase.
 * @param input - The sentence or phrase to explain (e.g., a user’s mistake)
 * @returns {Promise<ActionState<string>>} - The explanation or an error message
 */
export async function getGrammarExplanationAction(
  input: string
): Promise<ActionState<string>> {
  // Validate input to prevent empty or invalid requests
  if (!input || input.trim().length === 0) {
    return {
      isSuccess: false,
      message: "Input sentence cannot be empty"
    }
  }

  try {
    // Construct a prompt for OpenAI to generate a grammar explanation
    const prompt = `Provide a concise explanation of the grammar rules for this Kannada sentence or phrase: "${input}". Focus on common errors like subject-verb agreement, word order, or case usage. Keep it simple and educational, under 100 words.`

    // Call OpenAI’s chat completion API
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for high-quality language understanding; adjust based on availability
      messages: [
        {
          role: "system",
          content:
            "You are a Kannada language expert providing clear, concise grammar explanations."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 100, // Limit response length for brevity
      temperature: 0.7 // Balanced creativity and accuracy
    })

    // Extract the explanation from the response
    const explanation = response.choices[0]?.message.content?.trim()
    if (!explanation) {
      return {
        isSuccess: false,
        message: "No explanation generated by AI"
      }
    }

    return {
      isSuccess: true,
      message: "Grammar explanation generated successfully",
      data: explanation
    }
  } catch (error) {
    // Handle specific OpenAI errors (e.g., rate limits, network issues)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error generating grammar explanation:", errorMessage)

    return {
      isSuccess: false,
      message: `Failed to generate explanation: ${errorMessage}`
    }
  }
}

/**
 * Adjusts lesson difficulty based on user progress using AI analysis.
 * @param userId - The ID of the user whose progress is assessed
 * @returns {Promise<ActionState<string>>} - Recommended lesson level (beginner, intermediate, advanced) or an error
 */
export async function adjustLessonDifficultyAction(
  userId: string
): Promise<ActionState<string>> {
  // Validate userId to ensure it’s provided
  if (!userId || userId.trim().length === 0) {
    return {
      isSuccess: false,
      message: "User ID cannot be empty"
    }
  }

  try {
    // Fetch user progress from the database
    const progressResult = await getProgressByUserIdAction(userId)
    if (!progressResult.isSuccess || !progressResult.data) {
      return {
        isSuccess: false,
        message: "Failed to fetch user progress: " + progressResult.message
      }
    }

    const progressData = progressResult.data
    // Summarize progress metrics for AI analysis
    const progressSummary = progressData.map(p => ({
      lessonId: p.lessonId,
      xp: p.xp,
      streak: p.streak
    }))
    const totalXP = progressData.reduce((sum, p) => sum + p.xp, 0)
    const maxStreak = Math.max(...progressData.map(p => p.streak), 0)

    // Construct a prompt for OpenAI to recommend a lesson level
    const prompt = `
      Based on the following user progress in learning Kannada:
      - Total XP: ${totalXP}
      - Maximum streak: ${maxStreak}
      - Progress details: ${JSON.stringify(progressSummary)}
      Recommend a lesson difficulty level from: beginner, intermediate, advanced.
      Return only the level name in lowercase (e.g., "beginner") with no additional text.
    `

    // Call OpenAI’s chat completion API
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Consistent with grammar explanation for quality
      messages: [
        {
          role: "system",
          content:
            "You are an AI tutor assessing user progress to recommend Kannada lesson difficulty."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 10, // Expecting a single word response
      temperature: 0.5 // Lower temperature for more deterministic output
    })

    // Extract the recommended level
    const recommendedLevel = response.choices[0]?.message.content?.trim().toLowerCase()
    if (!recommendedLevel || !["beginner", "intermediate", "advanced"].includes(recommendedLevel)) {
      return {
        isSuccess: false,
        message: "Invalid or no level recommended by AI"
      }
    }

    return {
      isSuccess: true,
      message: "Lesson difficulty adjusted successfully",
      data: recommendedLevel
    }
  } catch (error) {
    // Handle errors from progress fetch or OpenAI API
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error adjusting lesson difficulty:", errorMessage)

    return {
      isSuccess: false,
      message: `Failed to adjust lesson difficulty: ${errorMessage}`
    }
  }
}