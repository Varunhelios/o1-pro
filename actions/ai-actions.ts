/**
 * @description
 * This file contains server actions for AI-driven features in the Learn Kannada app.
 * It integrates with OpenAI to provide grammar explanations, lesson adjustments,
 * and pronunciation assessments, enhancing the learning experience with personalized feedback.
 *
 * Key features:
 * - Grammar Explanations: Generates explanations for grammatical errors
 * - Lesson Difficulty Adjustment: Adapts lessons based on user progress
 * - Pronunciation Assessment: Evaluates spoken input against expected phrases
 *
 * @dependencies
 * - @/lib/ai/openai: Provides the OpenAI client for API calls
 * - @/types: Imports ActionState for consistent return types
 *
 * @notes
 * - All actions are server-side (marked "use server") per project rules
 * - Uses OPENAI_API_KEY from .env.local, set up in Step 1
 * - Handles API errors with fallback messages to ensure user feedback
 * - Assumes lesson content includes phrases for pronunciation comparison
 */

"use server"

import { openai } from "@/lib/ai/openai"
import { ActionState } from "@/types"

/**
 * Generates a grammar explanation for a given sentence using OpenAI.
 * @param {string} sentence - The sentence to analyze
 * @returns {Promise<ActionState<string>>} The explanation or an error message
 */
export async function getGrammarExplanationAction(
  sentence: string
): Promise<ActionState<string>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a Kannada grammar expert. Provide a concise explanation of any grammatical errors in the given sentence, or confirm it’s correct."
        },
        { role: "user", content: sentence }
      ],
      max_tokens: 150
    })

    const explanation = response.choices[0].message.content ?? "No explanation provided."
    return {
      isSuccess: true,
      message: "Grammar explanation generated successfully",
      data: explanation
    }
  } catch (error) {
    console.error("Error generating grammar explanation:", error)
    return {
      isSuccess: false,
      message: "Failed to generate grammar explanation"
    }
  }
}

/**
 * Adjusts lesson difficulty based on user progress using OpenAI.
 * @param {string} userId - The user’s ID
 * @param {number} currentXp - The user’s current XP
 * @returns {Promise<ActionState<string>>} The recommended level or an error
 */
export async function adjustLessonDifficultyAction(
  userId: string,
  currentXp: number
): Promise<ActionState<string>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an adaptive learning system. Based on the user’s XP, recommend a lesson level: beginner (0-100 XP), intermediate (101-300 XP), or advanced (301+ XP)."
        },
        { role: "user", content: `User XP: ${currentXp}` }
      ],
      max_tokens: 50
    })

    const level = response.choices[0].message.content ?? "beginner"
    return {
      isSuccess: true,
      message: "Lesson difficulty adjusted successfully",
      data: level
    }
  } catch (error) {
    console.error("Error adjusting lesson difficulty:", error)
    return {
      isSuccess: false,
      message: "Failed to adjust lesson difficulty"
    }
  }
}

/**
 * Assesses a user’s pronunciation by comparing their transcript to an expected phrase.
 * @param {string} transcript - The user’s spoken input
 * @param {string} expectedPhrase - The correct phrase to compare against
 * @returns {Promise<ActionState<string>>} Feedback on pronunciation accuracy
 */
export async function assessPronunciationAction(
  transcript: string,
  expectedPhrase: string
): Promise<ActionState<string>> {
  // Input validation
  if (!transcript.trim() || !expectedPhrase.trim()) {
    return {
      isSuccess: false,
      message: "Transcript or expected phrase cannot be empty"
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a pronunciation coach for Kannada. Compare the user’s transcript to the expected phrase and provide feedback on accuracy. If incorrect, suggest improvements."
        },
        {
          role: "user",
          content: `Transcript: "${transcript}"\nExpected: "${expectedPhrase}"`
        }
      ],
      max_tokens: 200
    })

    const feedback = response.choices[0].message.content ?? "No feedback provided."
    return {
      isSuccess: true,
      message: "Pronunciation assessed successfully",
      data: feedback
    }
  } catch (error) {
    console.error("Error assessing pronunciation:", error)
    return {
      isSuccess: false,
      message: "Failed to assess pronunciation. Please try again."
    }
  }
}