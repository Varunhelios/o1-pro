/**
 * @description
 * This file defines the pricing page for the Learn Kannada app, showcasing the freemium model.
 * It displays pricing tiers (free and premium) and integrates with Stripe for subscription purchases.
 *
 * Key features:
 * - Pricing Tiers: Displays free and premium plans with features and pricing
 * - Stripe Integration: Redirects to Stripe checkout for premium subscriptions
 * - Authentication Check: Personalizes the call-to-action based on user login status
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides auth() for authentication status
 * - lucide-react: Provides icons for visual enhancement
 * - next/navigation: Provides notFound for handling invalid routes
 * - @/lib/stripe: Provides the Stripe client for checkout
 *
 * @notes
 * - This is a server component, marked with "use server"
 * - Pricing is hardcoded for simplicity; in production, fetch from Stripe products
 * - Assumes Stripe products are set up manually by the user per instructions
 * - Uses Tailwind for responsive, minimalistic design per design requests
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { Check, X } from "lucide-react"
import { notFound } from "next/navigation"
import { stripe } from "@/lib/stripe"

/**
 * Pricing tier interface for type safety.
 */
interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  isPremium: boolean
}

// Define pricing tiers
const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Basic lessons to get started",
    features: [
      "Access to beginner lessons",
      "Basic exercises",
      "Community chat"
    ],
    isPremium: false
  },
  {
    name: "Premium",
    price: "$9.99/month",
    description: "Full access to advanced features",
    features: [
      "All beginner, intermediate, and advanced lessons",
      "Premium exercises with AI feedback",
      "Live tutor sessions",
      "Offline mode"
    ],
    isPremium: true
  }
]

/**
 * Renders the pricing page with free and premium tiers.
 * Redirects to Stripe checkout for premium subscriptions.
 *
 * @returns {JSX.Element} The pricing page UI
 */
export default async function PricingPage() {
  const { userId } = await auth()

  // Handle Stripe checkout redirect for premium plan
  async function handlePremiumCheckout() {
    "use server"
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PREMIUM_PRICE_ID, // Set in .env.local
            quantity: 1
          }
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: { userId: userId || "" }
      })

      if (session.url) {
        return { redirect: session.url }
      }
      throw new Error("Failed to create checkout session")
    } catch (error) {
      console.error("Error creating checkout session:", error)
      throw error
    }
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-foreground mb-12 text-center text-4xl font-bold">
          Choose Your Plan
        </h1>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {pricingTiers.map(tier => (
            <div
              key={tier.name}
              className={`rounded-lg border p-6 shadow-md ${
                tier.isPremium
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-card"
              }`}
            >
              <h2
                className={`mb-2 text-2xl font-semibold ${
                  tier.isPremium ? "text-primary" : "text-foreground"
                }`}
              >
                {tier.name}
              </h2>
              <p className="text-foreground mb-4 text-3xl font-bold">
                {tier.price}
              </p>
              <p className="text-muted-foreground mb-6">{tier.description}</p>

              <ul className="mb-6 space-y-2">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <Check
                      className={`mr-2 size-5 ${
                        tier.isPremium ? "text-primary" : "text-green-500"
                      }`}
                    />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <form
                onSubmit={async e => {
                  e.preventDefault() // Prevent the default form submission
                  const result = await handlePremiumCheckout() // Call the checkout function
                  if (result && result.redirect) {
                    window.location.href = result.redirect // Redirect to the checkout URL
                  }
                }}
                className="w-full"
              >
                <button
                  type={tier.isPremium ? "submit" : "button"}
                  className={`w-full rounded-md py-2 font-medium ${
                    tier.isPremium
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  disabled={!tier.isPremium && !userId}
                >
                  {tier.isPremium
                    ? userId
                      ? "Get Premium"
                      : "Sign In to Subscribe"
                    : "Free Plan"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
