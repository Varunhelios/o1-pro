/**
 * @description
 * This server-side page renders the user dashboard for the Learn Kannada app.
 * It displays progress metrics including XP, streaks, and badges, supporting
 * the progress tracking and gamification feature to keep users motivated.
 *
 * Key features:
 * - Fetches progress data server-side using a server action
 * - Displays XP with a progress bar, streak count, and badge list
 * - Responsive UI: Uses Tailwind CSS and Shadcn components for a clean design
 * - Loading State: Implements Suspense for asynchronous data fetching
 *
 * @dependencies
 * - @/actions/db/progress-actions: Provides getProgressByUserIdAction
 * - @/components/ui/progress: Shadcn Progress bar for XP visualization
 * - @/db/schema/progress-schema: Imports SelectProgress for type safety
 * - @clerk/nextjs/server: Provides auth for user authentication
 * - lucide-react: Provides icons (Trophy, Flame)
 * - react: Provides Suspense for async rendering
 *
 * @notes
 * - Marked "use server" per server component rules
 * - Requires Clerk authentication; redirects unauthenticated users
 * - Assumes progress records exist; displays fallback if none found
 * - XP progress bar caps at 300 (Master badge threshold)
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { Suspense } from "react"
import { getProgressByUserIdAction } from "@/actions/db/progress-actions"
import { SelectProgress } from "@/db/schema/progress-schema"
import { Progress } from "@/components/ui/progress"
import { Trophy, Flame } from "lucide-react"

// Define props interface (though not directly used here due to server component)
interface DashboardPageProps {}

/**
 * DashboardPage component renders the user dashboard.
 * @returns {JSX.Element} The dashboard UI with progress metrics
 */
export default async function DashboardPage({}: DashboardPageProps) {
  const authResult = await auth()
  const { userId } = authResult

  if (!userId) {
    throw new Error("User not authenticated")
  }

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContentFetcher userId={userId} />
    </Suspense>
  )
}

/**
 * DashboardContentFetcher fetches progress data and renders the dashboard content.
 * @param {{ userId: string }} props - The authenticated user's ID
 * @returns {JSX.Element} The rendered dashboard content
 */
async function DashboardContentFetcher({ userId }: { userId: string }) {
  const { isSuccess, data, message } = await getProgressByUserIdAction(userId)

  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        {message ||
          "No progress data available yet. Start learning to track your progress!"}
      </div>
    )
  }

  // Use the latest progress record (assuming one per user for simplicity)
  const progress: SelectProgress = data[0]
  const xp = progress.xp || 0
  const streak = progress.streak || 0
  const badges = (progress.badges as string[]) || []

  // XP progress bar capped at 300 (Master badge threshold)
  const xpProgress = Math.min((xp / 300) * 100, 100)

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <h1 className="mb-6 text-2xl font-bold">Your Learning Dashboard</h1>

      {/* XP Section */}
      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">
          Experience Points (XP): {xp}
        </h2>
        <Progress value={xpProgress} className="w-full" />
      </div>

      {/* Streak Section */}
      <div className="mb-8 flex items-center gap-2">
        <Flame className="size-6 text-orange-500" />
        <span className="text-lg font-semibold">
          Streak: {streak} day{streak !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Badges</h2>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="bg-muted text-foreground flex items-center gap-2 rounded-md p-2"
              >
                <Trophy className="size-5 text-yellow-500" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No badges earned yet. Keep learning!
          </p>
        )}
      </div>
    </div>
  )
}
