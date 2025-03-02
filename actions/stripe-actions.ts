/**
 * @description
 * This file defines server actions for Stripe payment operations in the Learn Kannada app.
 * It handles creating checkout sessions for tutor bookings, updating customer details after one-time payments,
 * and managing subscription status changes. All actions are server-side, adhering to the project's backend and payments rules.
 *
 * Key features:
 * - Tutor Checkout: Creates a Stripe checkout session for booking live tutor sessions
 * - Customer Update: Updates user profile with Stripe customer ID after a one-time payment
 * - Subscription Management: Updates user profile based on Stripe webhook events
 * - Type Safety: Uses TypeScript interfaces for inputs and outputs
 *
 * @dependencies
 * - @/lib/stripe: Stripe instance initialized with API key
 * - @/db/db: Drizzle ORM instance for database access
 * - @/db/schema/profiles-schema: Profiles table schema for membership updates
 * - @/types/server-action-types: ActionState type for consistent return values
 * - drizzle-orm: For database operations (eq for querying)
 *
 * @notes
 * - Assumes STRIPE_SECRET_KEY is set in .env.local (from initial setup)
 * - Tutor session price ID is a placeholder; must be replaced with actual Stripe product ID
 * - Success and cancel URLs use NEXT_PUBLIC_BASE_URL from .env.local
 * - No direct client-side Stripe interaction; all logic is server-side per rules
 * - Error handling logs to console and returns meaningful messages
 */

"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/db/db"
import { profilesTable, InsertProfile } from "@/db/schema/profiles-schema"
import { ActionState } from "@/types/server-action-types"
import { eq } from "drizzle-orm"

// Define parameters for creating a tutor checkout session
export interface CreateTutorCheckoutSessionParams {
  userId: string
  successUrl: string
  cancelUrl: string
}

// Define response type for tutor checkout session
interface CheckoutSessionResponse {
  url: string // URL to redirect the user to for checkout
}

/**
 * Creates a Stripe checkout session for booking a tutor session.
 * @param {CreateTutorCheckoutSessionParams} params - User ID and redirect URLs
 * @returns {Promise<ActionState<CheckoutSessionResponse>>} Success/failure with checkout URL
 */
export async function createTutorCheckoutSessionAction({
  userId,
  successUrl,
  cancelUrl
}: CreateTutorCheckoutSessionParams): Promise<ActionState<CheckoutSessionResponse>> {
  try {
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          // Placeholder price ID; replace with actual Stripe price ID for tutor session
          price: "price_tutor_session_placeholder", // TODO: Update with real price ID
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId } // Store userId for webhook verification if needed
    })

    if (!session.url) {
      throw new Error("Stripe session URL not generated")
    }

    return {
      isSuccess: true,
      message: "Checkout session created successfully",
      data: { url: session.url }
    }
  } catch (error) {
    console.error("Error creating tutor checkout session:", error)
    return {
      isSuccess: false,
      message: "Failed to create checkout session. Please try again."
    }
  }
}

/**
 * Updates user profile with Stripe customer ID after a one-time payment (e.g., tutor session).
 * @param {string} userId - Clerk user ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<ActionState<void>>} Success/failure with no data
 */
export async function updateStripeCustomerAction(
  userId: string,
  customerId: string
): Promise<ActionState<void>> {
  try {
    const profileUpdates: Partial<InsertProfile> = {
      stripeCustomerId: customerId
      // No subscription ID or membership change for one-time payments
    }

    await db
      .update(profilesTable)
      .set(profileUpdates)
      .where(eq(profilesTable.userId, userId))

    return {
      isSuccess: true,
      message: "Customer details updated successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating customer details:", error)
    return {
      isSuccess: false,
      message: "Failed to update customer details"
    }
  }
}

/**
 * Updates user profile based on Stripe subscription events from webhooks.
 * @param {string} userId - Clerk user ID
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<ActionState<void>>} Success/failure with no data
 */
export async function manageSubscriptionStatusChange(
  userId: string,
  subscriptionId: string,
  customerId: string
): Promise<ActionState<void>> {
  try {
    const profileUpdates: Partial<InsertProfile> = {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      membership: "pro" // Upgrade to pro on successful subscription
    }

    await db
      .update(profilesTable)
      .set(profileUpdates)
      .where(eq(profilesTable.userId, userId))

    return {
      isSuccess: true,
      message: "Subscription status updated successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating subscription status:", error)
    return {
      isSuccess: false,
      message: "Failed to update subscription status"
    }
  }
}