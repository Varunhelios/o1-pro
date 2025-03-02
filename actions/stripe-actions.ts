/**
 * @description
 * This file contains server actions for managing Stripe payment operations in the Learn Kannada app.
 * It handles subscription status changes, customer updates, and tutor session checkouts to support the freemium model and premium features.
 *
 * Key features:
 * - Subscription Management: Updates user membership based on Stripe subscription status
 * - Customer Updates: Manages Stripe customer data in the database
 * - Tutor Checkout: Creates Stripe checkout sessions for tutor bookings
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
 * - Environment variables (e.g., STRIPE_TUTOR_PRICE_ID) must be set in .env.local
 */

"use server"

import { db } from "@/db/db"
import { profilesTable, membershipEnum } from "@/db/schema/profiles-schema"
import { stripe } from "@/lib/stripe"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Interface for subscription status change input.
 */
interface SubscriptionStatusChangeInput {
  stripeSubscriptionId: string
  userId: string
}

/**
 * Updates a user's membership status based on their Stripe subscription status.
 *
 * @param input - Object containing stripeSubscriptionId and userId
 * @returns Promise<ActionState<void>> - Success or failure state
 */
export async function manageSubscriptionStatusChangeAction(
  input: SubscriptionStatusChangeInput
): Promise<ActionState<void>> {
  const { stripeSubscriptionId, userId } = input

  try {
    if (!stripeSubscriptionId || !userId) {
      return { isSuccess: false, message: "Subscription ID and user ID are required" }
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const isActive = subscription.status === "active" || subscription.status === "trialing"
    const newMembership = isActive ? membershipEnum.enumValues[1] : membershipEnum.enumValues[0]

    const updatedProfile = await db
      .update(profilesTable)
      .set({
        membership: newMembership,
        stripeSubscriptionId: stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(profilesTable.userId, userId))
      .returning()

    if (!updatedProfile.length) {
      return { isSuccess: false, message: "User profile not found or update failed" }
    }

    return {
      isSuccess: true,
      message: `Membership updated to ${newMembership} successfully`,
      data: undefined
    }
  } catch (error) {
    console.error("Error managing subscription status:", error)
    return { isSuccess: false, message: "Failed to update subscription status" }
  }
}

/**
 * Interface for customer update input.
 */
interface UpdateCustomerInput {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId?: string
}

/**
 * Updates a user's Stripe customer data in the database.
 *
 * @param input - Object containing userId, stripeCustomerId, and optional stripeSubscriptionId
 * @returns Promise<ActionState<void>> - Success or failure state
 */
export async function updateStripeCustomerAction(
  input: UpdateCustomerInput
): Promise<ActionState<void>> {
  const { userId, stripeCustomerId, stripeSubscriptionId } = input

  try {
    if (!userId || !stripeCustomerId) {
      return { isSuccess: false, message: "User ID and Stripe Customer ID are required" }
    }

    const updatedProfile = await db
      .update(profilesTable)
      .set({
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscriptionId || null,
        updatedAt: new Date()
      })
      .where(eq(profilesTable.userId, userId))
      .returning()

    if (!updatedProfile.length) {
      return { isSuccess: false, message: "User profile not found or update failed" }
    }

    return {
      isSuccess: true,
      message: "Customer data updated successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating Stripe customer:", error)
    return { isSuccess: false, message: "Failed to update customer data" }
  }
}

/**
 * Interface for tutor checkout session input.
 */
interface TutorCheckoutInput {
  userId: string
}

/**
 * Creates a Stripe checkout session for a tutor booking.
 *
 * @param input - Object containing userId
 * @returns Promise<ActionState<{ url: string }>> - Success with checkout URL or failure
 */
export async function createTutorCheckoutSessionAction(
  input: TutorCheckoutInput
): Promise<ActionState<{ url: string }>> {
  const { userId } = input

  try {
    if (!userId) {
      return { isSuccess: false, message: "User ID is required" }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_TUTOR_PRICE_ID, // Must be set in .env.local
          quantity: 1
        }
      ],
      mode: "payment", // One-time payment for tutor session
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/tutors?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/tutors?canceled=true`,
      metadata: { userId }
    })

    if (!session.url) {
      throw new Error("Failed to create checkout session URL")
    }

    return {
      isSuccess: true,
      message: "Checkout session created successfully",
      data: { url: session.url }
    }
  } catch (error) {
    console.error("Error creating tutor checkout session:", error)
    return { isSuccess: false, message: "Failed to create tutor checkout session" }
  }
}