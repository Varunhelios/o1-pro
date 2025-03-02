/**
 * @description
 * This file contains server actions for managing Stripe payment operations in the Learn Kannada app.
 * It handles subscription status changes to support the freemium model, updating user membership levels
 * (free or pro) based on Stripe webhook events or direct actions.
 *
 * Key features:
 * - Subscription Management: Updates user membership in the database based on Stripe subscription status
 * - Error Handling: Manages Stripe API and database operation failures
 *
 * @dependencies
 * - @/db/db: Provides the Drizzle ORM database instance
 * - @/db/schema/profiles-schema: Imports profilesTable and membershipEnum for database operations
 * - @/lib/stripe: Provides the configured Stripe client
 * - @/types: Imports ActionState for type-safe return values
 * - drizzle-orm: Provides eq for database query conditions
 *
 * @notes
 * - This is a server-only file, marked with "use server"
 * - Assumes Stripe webhooks or manual calls provide subscription events
 * - Does not expose environment variables to the frontend per project rules
 * - Logs errors for debugging but returns user-friendly messages
 */

"use server"

import { db } from "@/db/db"
import { profilesTable, membershipEnum } from "@/db/schema/profiles-schema"
import { stripe } from "@/lib/stripe"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Interface for the input data required to manage subscription status changes.
 */
interface SubscriptionStatusChangeInput {
  stripeSubscriptionId: string // The Stripe subscription ID to check
  userId: string // The user ID associated with the subscription
}

/**
 * Updates a user's membership status based on their Stripe subscription status.
 * Sets membership to "pro" for active subscriptions and "free" for inactive ones.
 *
 * @param input - Object containing stripeSubscriptionId and userId
 * @returns Promise<ActionState<void>> - Success or failure state with no data returned
 */
export async function manageSubscriptionStatusChangeAction(
  input: SubscriptionStatusChangeInput
): Promise<ActionState<void>> {
  const { stripeSubscriptionId, userId } = input

  try {
    // Validate input parameters
    if (!stripeSubscriptionId || !userId) {
      return {
        isSuccess: false,
        message: "Subscription ID and user ID are required"
      }
    }

    // Retrieve subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    // Determine membership status based on subscription status
    const isActive =
      subscription.status === "active" || subscription.status === "trialing"
    const newMembership = isActive
      ? membershipEnum.enumValues[1] // "pro"
      : membershipEnum.enumValues[0] // "free"

    // Update the user's profile in the database
    const updatedProfile = await db
      .update(profilesTable)
      .set({
        membership: newMembership,
        stripeSubscriptionId: stripeSubscriptionId,
        updatedAt: new Date() // Explicitly set updatedAt to current time
      })
      .where(eq(profilesTable.userId, userId))
      .returning()

    // Check if the update was successful
    if (!updatedProfile.length) {
      return {
        isSuccess: false,
        message: "User profile not found or update failed"
      }
    }

    return {
      isSuccess: true,
      message: `Membership updated to ${newMembership} successfully`,
      data: undefined
    }
  } catch (error) {
    console.error("Error managing subscription status:", error)

    // Handle specific Stripe errors
    if (error instanceof stripe.errors.StripeError) {
      return {
        isSuccess: false,
        message: `Stripe error: ${error.message}`
      }
    }

    // Generic error fallback
    return {
      isSuccess: false,
      message: "Failed to update subscription status"
    }
  }
}