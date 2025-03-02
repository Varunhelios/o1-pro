/**
 * @description
 * This server-side page renders the tutor booking interface for the Learn Kannada app.
 * It allows premium users to book live tutor sessions by integrating with Stripe for payment.
 * Accessible only to authenticated users with a "pro" membership, it provides a clean UI
 * with a checkout button redirecting to Stripe.
 *
 * Key features:
 * - Authentication: Uses Clerk to ensure user is logged in
 * - Authorization: Checks for "pro" membership via profiles table
 * - Stripe Integration: Creates a checkout session via server action
 * - UI: Minimalistic design with Tailwind and Shadcn Button component
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication (auth helper)
 * - @/actions/stripe-actions: For creating Stripe checkout sessions (createTutorCheckoutSessionAction)
 * - @/actions/db/profiles-actions: For fetching user profile (getProfileByUserIdAction)
 * - @/components/ui/button: Shadcn Button for the checkout UI
 * - next/navigation: For redirecting unauthenticated users
 *
 * @notes
 * - This is a server component, marked with "use server" per frontend rules
 * - Assumes a Stripe product for tutor sessions is configured (user instruction provided)
 * - No client-side state management; all data fetching is server-side
 * - Error handling includes redirecting unauthenticated users and displaying membership errors
 * - Edge case: Non-premium users see a message instead of the checkout button
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  createTutorCheckoutSessionAction,
  CreateTutorCheckoutSessionParams
} from "@/actions/stripe-actions"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"

// Define props interface for the page (Next.js dynamic route params)
interface TutorPageProps {
  params: Promise<{}> // No dynamic params needed, but included for type safety
}

/**
 * TutorPage renders the tutor booking interface for premium users.
 * @param {TutorPageProps} props - Next.js page props (unused params awaited)
 * @returns {JSX.Element} The tutor booking UI or an error message
 */
export default async function TutorPage({ params }: TutorPageProps) {
  // Await params for type safety (though unused here)
  await params

  // Authenticate user with Clerk
  const { userId } = await auth()

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return redirect("/login")
  }

  // Fetch user profile to check membership status
  const profileResult = await getProfileByUserIdAction(userId)
  if (!profileResult.isSuccess || !profileResult.data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-foreground text-center">
          <h1 className="text-2xl font-semibold">Error</h1>
          <p className="mt-2">
            Unable to load your profile. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const profile = profileResult.data
  const isPremium = profile.membership === "pro"

  // Define checkout session parameters
  const checkoutParams: CreateTutorCheckoutSessionParams = {
    userId,
    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/community/tutors/success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/community/tutors`
  }

  // Function to handle checkout session creation
  async function getCheckoutUrl(): Promise<string | null> {
    const result = await createTutorCheckoutSessionAction(checkoutParams)
    if (result.isSuccess && result.data?.url) {
      return result.data.url
    }
    console.error("Failed to create checkout session:", result.message)
    return null
  }

  // Fetch checkout URL server-side
  const checkoutUrl = await getCheckoutUrl()

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-foreground mb-6 text-3xl font-bold">
          Book a Live Tutor Session
        </h1>
        <p className="text-muted-foreground mb-8">
          Connect with a Kannada tutor for personalized learning. Available
          exclusively for premium members.
        </p>

        {isPremium ? (
          checkoutUrl ? (
            <form action={checkoutUrl} method="POST">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
              >
                Book Now with Stripe
              </Button>
            </form>
          ) : (
            <div className="text-destructive">
              Failed to load checkout. Please try again later.
            </div>
          )
        ) : (
          <div className="text-muted-foreground">
            <p>
              This feature is available only to premium members. Upgrade your
              plan to book a tutor session.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => redirect("/pricing")}
            >
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
