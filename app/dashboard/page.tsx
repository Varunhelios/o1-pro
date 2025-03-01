/**
 * @description
 * This server component serves as the dashboard page for the Learn Kannada app.
 * It fetches user progress data and renders static progress metrics (streak, badges),
 * delegating the XP chart to a client component for gamification visualization.
 *
 * Key features:
 * - Fetches progress data server-side using getProgressByUserIdAction
 * - Displays current streak and badges in a responsive layout
 * - Passes XP data to ProgressChart client component for chart rendering
 * - Uses Clerk for authentication to secure access
 * - Implements Suspense for async data fetching with a loading fallback
 * - Clean, minimalistic UI with Tailwind CSS per design requests
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication (auth helper)
 * - @/actions/db/progress-actions: Server action to fetch progress data
 * - @/components/dashboard/progress-chart: Client component for XP chart
 * - lucide-react: Provides icons (e.g., Trophy)
 * - react: For Suspense and ReactNode types
 *
 * @notes
 * - Aggregates total XP and uses latest streak based on createdAt
 * - Badges are flattened from all entries; assumes they're strings in JSON
 * - Chart data preparation moved to client component to avoid server-side recharts issues
 * - Handles edge cases: no user, no progress, fetch errors
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { getProgressByUserIdAction } from "@/actions/db/progress-actions"
import { SelectProgress } from "@/db/schema/progress-schema"
import { Suspense } from "react"
import ProgressChart from "@/components/dashboard/progress-chart"
import { Trophy } from "lucide-react"

/**
 * DashboardPage component renders the user dashboard.
 * @returns {JSX.Element} The dashboard UI with progress data
 */
export default async function DashboardPage() {
  // Authenticate user with Clerk
  const { userId } = await auth()
  if (!userId) {
    return <div>Please sign in to view your dashboard.</div>
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent userId={userId} />
    </Suspense>
  )
}

/**
 * DashboardContent fetches and displays progress data.
 * @param {Object} props - Contains userId
 * @param {string} props.userId - The authenticated user's ID
 * @returns {JSX.Element} The rendered dashboard content
 */
async function DashboardContent({ userId }: { userId: string }) {
  // Fetch user progress
  const { isSuccess, message, data } = await getProgressByUserIdAction(userId)

  // Handle fetch failure or no progress data
  if (!isSuccess || !data || data.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          {message || "No progress yet. Start learning to see your stats!"}
        </div>
      </div>
    )
  }

  // Process progress data
  const progress: SelectProgress[] = data
  const totalXP = progress.reduce((sum, entry) => sum + entry.xp, 0)
  // Sort by createdAt descending to get the latest streak
  const latestStreak = progress.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0].streak
  // Flatten badges from all entries
  const badges = progress.flatMap(entry => entry.badges as string[])
  // Prepare chart data as props
  const chartData = progress.map(entry => ({
    date: entry.createdAt.toLocaleDateString(),
    xp: entry.xp
  }))

  return (
    <div className="container mx-auto min-h-[calc(100vh-4rem)] p-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold">
        Your Learning Dashboard
      </h1>

      {/* XP Section with Chart */}
      <div className="bg-card mb-8 rounded-lg p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Experience Points (XP)
        </h2>
        <div className="text-muted-foreground mb-4 text-lg">
          Total XP: {totalXP}
        </div>
        <ProgressChart chartData={chartData} />
      </div>

      {/* Streak Section */}
      <div className="bg-card mb-8 rounded-lg p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Current Streak
        </h2>
        <div className="flex items-center">
          <Trophy className="mr-2 size-6 text-yellow-500" />
          <span className="text-muted-foreground text-lg">
            {latestStreak} days
          </span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Badges Earned
        </h2>
        {badges.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {badges.map((badge, index) => (
              <li
                key={index}
                className="text-muted-foreground bg-muted rounded p-2 text-center"
              >
                {badge}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground">
            No badges earned yet. Keep practicing!
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * LoadingFallback component shows a loading state during data fetching.
 * @returns {JSX.Element} A centered loading message
 */
function LoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-muted-foreground">Loading your dashboard...</div>
    </div>
  )
}
