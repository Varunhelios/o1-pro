/**
 * @description
 * This server component renders a reusable card for displaying lesson previews in the Learn Kannada app.
 * It is designed to show a lesson's title, level (beginner, intermediate, advanced), and optionally the user's progress.
 * The component is used within server-side rendered pages like /learn/[level]/page.tsx to provide a consistent UI.
 *
 * Key features:
 * - Displays lesson title and level with clear typography
 * - Optionally shows progress as a percentage with a progress bar
 * - Uses Tailwind CSS and Shadcn Card for a clean, minimalistic, responsive design
 * - Accessible with ARIA labels for screen readers
 *
 * @dependencies
 * - @/components/ui/card: Shadcn Card component for consistent UI styling
 * - @/components/ui/progress: Shadcn Progress component for progress visualization
 * - @/db/schema/lessons-schema: Imports levelEnum for type safety on lesson levels
 *
 * @notes
 * - This is a server component, so it cannot include client-side interactivity (e.g., hooks)
 * - Progress is optional and only rendered if provided, defaulting to hidden
 * - Assumes parent component fetches and passes lesson data
 * - No direct data fetching here; relies on props for simplicity and reusability
 */

"use server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { levelEnum } from "@/db/schema/lessons-schema"

// Define props interface for type safety
interface LessonCardProps {
  title: string // Lesson title, required
  level: (typeof levelEnum.enumValues)[number] // Lesson level, constrained to enum values
  progress?: number // Optional progress percentage (0-100)
}

/**
 * LessonCard component renders a preview of a lesson.
 * @param {LessonCardProps} props - The lesson data to display
 * @returns {JSX.Element} A styled card with lesson details
 */
export async function LessonCard({ title, level, progress }: LessonCardProps) {
  // Validate progress value if provided
  const validProgress =
    progress !== undefined && progress >= 0 && progress <= 100
      ? progress
      : undefined

  return (
    <Card className="border-border w-full max-w-md border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-foreground text-xl font-semibold">
          {title}
        </CardTitle>
        {/* Capitalize level for display */}
        <div
          className="text-muted-foreground text-sm capitalize"
          aria-label={`Level: ${level}`}
        >
          {level}
        </div>
      </CardHeader>

      <CardContent>
        {validProgress !== undefined && (
          <div className="mt-4">
            {/* Progress label for accessibility */}
            <div
              className="text-muted-foreground mb-2 text-sm"
              aria-label={`Progress: ${validProgress}%`}
            >
              Progress: {validProgress}%
            </div>
            <Progress
              value={validProgress}
              className="w-full"
              aria-label={`Progress bar at ${validProgress}%`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LessonCard
