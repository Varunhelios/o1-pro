/**
 * @description
 * This file defines a Stripe webhook endpoint for the Learn Kannada app.
 * It processes Stripe events (e.g., checkout completion) to update user subscription status and customer data.
 *
 * Key features:
 * - Webhook Verification: Ensures events come from Stripe using the webhook secret
 * - Event Handling: Processes checkout.session.completed to update membership and customer info
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides auth for user verification
 * - next/server: Provides NextRequest and NextResponse for API handling
 * - @/actions/stripe-actions: Imports actions for subscription and customer updates
 * - @/lib/stripe: Provides the Stripe client
 *
 * @notes
 * - Expects STRIPE_WEBHOOK_SECRET in .env.local
 * - Returns 400 for unverified or unhandled events, 200 for success
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import {
  manageSubscriptionStatusChangeAction,
  updateStripeCustomerAction
} from "@/actions/stripe-actions"
import { stripe } from "@/lib/stripe"

/**
 * Handles POST requests to the Stripe webhook endpoint.
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse - HTTP response with status
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature or secret" },
      { status: 400 }
    )
  }

  let event
  try {
    const body = await request.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as any
      const userId = session.metadata?.userId
      const stripeSubscriptionId = session.subscription
      const stripeCustomerId = session.customer

      if (!userId || !stripeCustomerId) {
        return NextResponse.json(
          { error: "Missing userId or customerId in session metadata" },
          { status: 400 }
        )
      }

      // Update customer data
      const customerResult = await updateStripeCustomerAction({
        userId,
        stripeCustomerId,
        stripeSubscriptionId
      })
      if (!customerResult.isSuccess) {
        console.error("Customer update failed:", customerResult.message)
        return NextResponse.json(
          { error: customerResult.message },
          { status: 500 }
        )
      }

      // Update subscription status if applicable
      if (stripeSubscriptionId) {
        const subscriptionResult = await manageSubscriptionStatusChangeAction({
          userId,
          stripeSubscriptionId
        })
        if (!subscriptionResult.isSuccess) {
          console.error(
            "Subscription update failed:",
            subscriptionResult.message
          )
          return NextResponse.json(
            { error: subscriptionResult.message },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({ received: true }, { status: 200 })

    default:
      console.log(`Unhandled event type ${event.type}`)
      return NextResponse.json({ received: true }, { status: 200 })
  }
}
