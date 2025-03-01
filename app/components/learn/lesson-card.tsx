/**
 * @description
 * This server component renders a preview card for a lesson in the Learn Kannada app.
 * It displays key lesson details such as title, level, and a snippet of content,
 * supporting the structured curriculum feature. Designed for reuse in pages like
 * /learn/[level]/page.tsx to provide a consistent lesson preview UI.
 *
 * Key features:
 * - Lesson Preview: Shows title, level, and truncated content
 * - Responsive Design: Uses Tailwind CSS and Shadcn Card styling for a clean, minimalistic look
 * - Server-Side Rendering: Fetches and displays data without client-side overhead
 *
 * @dependencies
 * - @/db/schema/lessons-schema: Imports SelectLesson for type safety
 * - lucide-react: Provides BookOpen icon for visual enhancement
 *
 * @notes
 * - Assumes content is JSON with a possible 'description' field; falls back to generic text if absent
 * - Truncates content to 100 characters for brevity; full content can be viewed on click (future feature)
 * - No interactivity here; client-side features (e.g., clicking to view) to be added in parent components
 * - Matches Step 13's intent as a reusable server component
 */

"use server"

import { SelectLesson } from "@/db/schema/lessons-schema"
import { BookOpen } from "lucide-react"

// Define props interface matching SelectLesson
interface LessonCardProps {
  lesson: SelectLesson // Ensure this matches the SelectLesson structure
}

/**
 * LessonCard component renders a single lesson preview.
 * @param {LessonCardProps} props - The lesson data to display
 * @returns {JSX.Element} A styled card with lesson details
 */
export default function LessonCard({ lesson }: LessonCardProps) {
  // Extract content safely; assume it's JSON with a description or similar field
  const content = lesson.content as { description?: string } | null
  const contentPreview = content?.description
    ? content.description.slice(0, 100) +
      (content.description.length > 100 ? "..." : "")
    : "No content available"

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center space-x-2">
        <BookOpen className="text-primary size-5" />
        <h2 className="text-foreground text-lg font-semibold">
          {lesson.title}
        </h2>
      </div>
      <div className="text-muted-foreground mt-2 text-sm capitalize">
        Level: {lesson.level}
      </div>
      <div className="text-foreground mt-2 text-sm">{contentPreview}</div>
      <div className="text-muted-foreground mt-2 text-xs">
        Created: {lesson.createdAt.toLocaleDateString()}
      </div>
    </div>
  )
}
