/**
 * @description
 * This client component renders an XP progress chart for the Learn Kannada app’s dashboard.
 * It visualizes user XP over time using Recharts, supporting the gamification feature.
 *
 * Key features:
 * - Displays a line chart of XP by date
 * - Responsive design with Tailwind CSS and Recharts’ ResponsiveContainer
 * - Receives chart data as props from a server component
 * - Clean, minimalistic UI per design requests
 *
 * @dependencies
 * - recharts: For LineChart and related components
 *
 * @notes
 * - Marked "use client" to comply with Next.js client-side rendering rules
 * - Assumes chartData is an array of { date: string, xp: number } objects
 * - No server-side logic; relies on props for data
 * - Handles empty data implicitly via Recharts (empty chart renders cleanly)
 */

"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

// Define props interface
interface ProgressChartProps {
  chartData: { date: string; xp: number }[]
}

/**
 * ProgressChart component renders the XP line chart.
 * @param {ProgressChartProps} props - Contains chart data
 * @returns {JSX.Element} The rendered chart
 */
export default function ProgressChart({ chartData }: ProgressChartProps) {
  return (
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
            stroke="#1E40AF" // Matches design system primary color
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
