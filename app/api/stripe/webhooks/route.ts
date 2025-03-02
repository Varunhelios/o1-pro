/**
 * @description
 * This file defines the Stripe webhook endpoint for the Learn Kannada app.
 * It handles incoming Stripe events, such as checkout session completions,
 * to update user profiles accordingly. This is a server-side API route.
 *
 * Key features:
 * - Webhook Verification: Validates Stripe signatures for security
 * - Event Handling: Processes checkout.session.completed for tutor sessions
 * - Integration: Updates user profile via server actions
 *
 * @dependencies
 * - @/actions/stripe-actions: For updating customer details (updateStripeCustomerAction)
 * - @/lib/stripe: Stripe instance for webhook verification
 * - next/headers: For accessing request headers
 *
 * @notes
 * - Requires STRIPE_WEBHOOK_SECRET in .env.local for signature verification
 * - Returns appropriate HTTP responses (200 for success, 400 for errors)
 * - Logs errors to console for debugging; consider a proper logging solution in production
 * - Assumes userId is stored in checkout session metadata from createTutorCheckoutSessionAction
 */

import { NextResponse } from "next/server"
import {
  manageSubscriptionStatusChange,
  updateStripeCustomerAction
} from "@/actions/stripe-actions"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

/**
 * Handles POST requests to the Stripe webhook endpoint.
 * @param {Request} request - Incoming webhook request from Stripe
 * @returns {Promise<NextResponse>} HTTP response indicating success or failure
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get("Stripe-Signature") as string

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set in .env.local")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 400 }
    )
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.userId
        const customerId = session.customer as string

        if (!userId || !customerId) {
          console.error("Missing userId or customerId in session:", session)
          return NextResponse.json(
            { error: "Invalid session data" },
            { status: 400 }
          )
        }

        // Update customer details for one-time payment (e.g., tutor session)
        const result = await updateStripeCustomerAction(userId, customerId)
        if (!result.isSuccess) {
          console.error("Failed to update customer:", result.message)
          return NextResponse.json({ error: result.message }, { status: 400 })
        }
        break
      }
      // Add other event types (e.g., subscription events) as needed
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Error processing webhook event:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 400 }
    )
  }
}
