/**
 * @description
 * This client component provides a button to download lesson content for offline use in the Learn Kannada app.
 * It integrates with the downloadLessonStorage server action to fetch a signed URL and initiates a browser download.
 * Designed to be used within lesson pages (e.g., /learn/[level]/page.tsx).
 *
 * Key features:
 * - Download Trigger: Fetches a signed URL and downloads the lesson as a JSON file
 * - UI Feedback: Shows loading state and toast notifications for success/errors
 * - Responsive Design: Uses Tailwind and Shadcn for a clean, mobile-friendly button
 *
 * @dependencies
 * - @/actions/storage/offline-actions: downloadLessonStorage for fetching signed URLs
 * - @/components/ui/button: Shadcn Button for UI
 * - @/lib/hooks/use-toast: Toast hook for user feedback
 * - lucide-react: Download icon
 *
 * @notes
 * - Marked "use client" per frontend rules for client-side interactivity
 * - Assumes lesson content is stored as JSON in Supabase Storage (from Step 26)
 * - No direct Supabase calls; relies on server action per project rules
 * - Handles edge cases like failed downloads or missing URLs
 * - Filename includes lesson ID for uniqueness
 */

"use client"

import { downloadLessonStorage } from "@/actions/storage/offline-actions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { Download } from "lucide-react"
import { useState } from "react"

// Define props interface for the component
interface OfflineButtonProps {
  lessonId: string // UUID of the lesson to download
}

/**
 * OfflineButton renders a button to download a lesson for offline access.
 * @param {OfflineButtonProps} props - Lesson ID to download
 * @returns {JSX.Element} A button with download functionality
 */
export default function OfflineButton({ lessonId }: OfflineButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Handle button click to initiate download
  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const result = await downloadLessonStorage({ lessonId })

      if (!result.isSuccess || !result.data?.url) {
        throw new Error(result.message || "Failed to generate download URL")
      }

      // Fetch the file from the signed URL
      const response = await fetch(result.data.url)
      if (!response.ok) {
        throw new Error("Failed to fetch lesson content")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `lesson-${lessonId}.json` // Unique filename with lesson ID
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Successful",
        description: "The lesson has been downloaded for offline use."
      })
    } catch (error) {
      console.error("Error downloading lesson:", error)
      toast({
        title: "Download Failed",
        description: "Could not download the lesson. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Download className="size-4" />
      {isLoading ? "Downloading..." : "Download"}
    </Button>
  )
}
