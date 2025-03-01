/**
 * @description
 * Dashboard page for the Learn Kannada app. Displays user's progress (XP, streak, badges)
 * with a chart to visualize XP over time.
 */

import { auth } from "@clerk/nextjs/server"
import { getProgressByUserIdAction } from "@/actions/db/progress-actions"
import { SelectProgress } from "@/db/schema/progress-schema"
import { Suspense } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Trophy } from "lucide-react"

/**
 * Fetches user progress securely on the server.
 * Ensures Clerk authentication and fetches progress data.
 */
async function fetchUserProgress() {
  const { userId } = await auth()
  if (!userId) return { userId: null, progress: null }

  const { isSuccess, data } = await getProgressByUserIdAction(userId)
  return { userId, progress: isSuccess ? data : null }
}

/**
 * Dashboard Page Component
 * @returns {JSX.Element}
 */
export default async function DashboardPage() {
  const { userId, progress } = await fetchUserProgress()

  if (!userId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          Please sign in to view your dashboard.
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent progress={progress} />
    </Suspense>
  )
}

/**
 * DashboardContent: Displays progress data (XP, streak, badges, chart).
 */
function DashboardContent({ progress }: { progress: SelectProgress[] | null }) {
  if (!progress || progress.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          No progress yet. Start learning to see your stats!
        </div>
      </div>
    )
  }

  // Process progress data
  const totalXP = progress.reduce((sum, entry) => sum + entry.xp, 0)
  const latestStreak = progress
    .map(entry => ({
      streak: entry.streak,
      date: new Date(entry.createdAt) // Ensure correct Date object
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0].streak

  const badges = progress.flatMap(entry => entry.badges as string[])
  const chartData = progress.map(entry => ({
    date: new Date(entry.createdAt).toLocaleDateString(), // Ensure date format
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="xp"
                stroke="#1E40AF"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
 */
function LoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-muted-foreground">Loading your dashboard...</div>
    </div>
  )
}
