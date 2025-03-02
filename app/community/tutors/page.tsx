/**
 * @description
 * This file defines the tutor booking page for the Learn Kannada app.
 * It allows premium users to book live tutor sessions via Stripe checkout.
 *
 * Key features:
 * - Authentication Check: Ensures only signed-in users can book
 * - Stripe Integration: Redirects to Stripe checkout for tutor sessions
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides auth for user verification
 * - lucide-react: Provides icons for UI
 * - @/actions/stripe-actions: Imports createTutorCheckoutSessionAction
 *
 * @notes
 * - This is a server component, marked with "use server"
 * - Expects STRIPE_TUTOR_PRICE_ID in .env.local
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { Calendar, Clock } from "lucide-react"
import { createTutorCheckoutSessionAction } from "@/actions/stripe-actions"

/**
 * Renders the tutor booking page with a checkout button.
 *
 * @returns {JSX.Element} The tutor page UI
 */
export default async function TutorsPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-foreground mb-12 text-center text-4xl font-bold">
            Live Tutor Sessions
          </h1>
          <p className="text-muted-foreground text-center">
            Please sign in to book a tutor session.
          </p>
        </div>
      </div>
    )
  }

  async function handleCheckout() {
    "use server"
    if (!userId) {
      throw new Error("User ID is required for checkout")
    }

    const result = await createTutorCheckoutSessionAction({ userId })
    if (result.isSuccess && result.data?.url) {
      return { redirect: result.data.url }
    }
    throw new Error(result.message || "Failed to create checkout session")
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-foreground mb-12 text-center text-4xl font-bold">
          Book a Live Tutor Session
        </h1>

        <div className="bg-card mx-auto max-w-md rounded-lg border p-6 shadow-md">
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            One-on-One Tutoring
          </h2>
          <p className="text-muted-foreground mb-4">
            Get personalized help from a Kannada tutor for $20 per session.
          </p>

          <div className="mb-2 flex items-center">
            <Calendar className="text-primary mr-2 size-5" />
            <span className="text-foreground">30-minute session</span>
          </div>
          <div className="mb-6 flex items-center">
            <Clock className="text-primary mr-2 size-5" />
            <span className="text-foreground">Schedule after booking</span>
          </div>

          <form
            onSubmit={async e => {
              e.preventDefault()
              const result = await handleCheckout()
              if (result && result.redirect) {
                window.location.href = result.redirect
              }
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md py-2 font-medium"
            >
              Book Now - $20
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
