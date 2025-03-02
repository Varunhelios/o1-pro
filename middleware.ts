/**
 * @description
 * This file configures Clerk middleware to manage route protection and authentication
 * for the Learn Kannada app. It defines which routes require authentication and
 * handles redirects for unauthenticated users attempting to access protected routes.
 *
 * Key features:
 * - Route Protection: Uses a route matcher to protect specific paths
 * - Authentication: Integrates with Clerk to check user authentication status
 * - Redirects: Sends unauthenticated users to the sign-in page with a return URL
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides Clerk middleware and route matcher utilities
 * - next/server: Provides NextResponse for handling HTTP responses
 *
 * @notes
 * - Protected routes include /learn, /practice, /dashboard, and /community with all sub-routes
 * - The matcher config ensures middleware applies to all relevant app routes
 * - Does not expose environment variables per project rules
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define protected routes using a route matcher
// Updated to include /learn, /practice, /dashboard, and /community per Step 28
const isProtectedRoute = createRouteMatcher([
  "/todo(.*)",          // Existing protected route
  "/learn(.*)",         // Protects all learning module routes
  "/practice(.*)",      // Protects all interactive exercise routes
  "/dashboard(.*)",     // Protects the user dashboard and its sub-routes
  "/community(.*)"      // Protects community features like chat and tutors
])

/**
 * Middleware function to handle authentication and route protection.
 * Checks if the user is authenticated and redirects to sign-in for protected routes if not.
 *
 * @param auth - Clerk authentication object with methods to check user status
 * @param req - Incoming HTTP request object
 * @returns NextResponse - Proceeds to the next middleware or redirects to sign-in
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Check if the user is authenticated and the requested route is protected
  if (!userId && isProtectedRoute(req)) {
    // Redirect unauthenticated users to the sign-in page
    // returnBackUrl ensures users return to the originally requested page after login
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // If authenticated or route is public, proceed to the next middleware or page
  return NextResponse.next()
})

/**
 * Configuration for the middleware matcher.
 * Ensures the middleware runs on all routes except static files and Next.js internals.
 */
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // Match all paths except static files and _next
    "/",                      // Match root path
    "/(api|trpc)(.*)"         // Match API and TRPC routes
  ]
}