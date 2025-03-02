/**
 * @description
 * This file defines server actions for managing offline lesson downloads in the Learn Kannada app.
 * It uses Supabase Storage to generate signed URLs for lesson content, enabling offline access.
 * All actions are server-side, adhering to the project’s backend and storage rules.
 *
 * Key features:
 * - Download Lessons: Generates a signed URL for a lesson’s JSON content
 * - Security: Uses Clerk auth and RLS policies to restrict access to user-owned files
 * - Type Safety: Defines interfaces for inputs and outputs
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase client for storage operations
 * - @clerk/nextjs/server: Clerk auth helper for user authentication
 * - @/types/server-action-types: ActionState type for consistent return values
 * - @/db/schema/lessons-schema: SelectLesson type for lesson metadata
 *
 * @notes
 * - Assumes a `lessons` bucket exists in Supabase with RLS policy applied (user instructions provided)
 * - Lesson content is stored as JSON files in `{userId}/{lessonId}.json` format
 * - Signed URLs are valid for 1 hour; adjust expiration as needed
 * - No direct client-side storage access; all operations are server-side per rules
 * - Error handling covers auth, storage access, and file existence
 */

"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types/server-action-types"
import { SelectLesson } from "@/db/schema/lessons-schema"

// Define parameters for downloading a lesson
interface DownloadLessonParams {
  lessonId: string // UUID of the lesson to download
}

// Define response type for lesson download
interface DownloadLessonResponse {
  url: string // Signed URL for downloading the lesson content
}

/**
 * Generates a signed URL for downloading a lesson’s content from Supabase Storage.
 * @param {DownloadLessonParams} params - Lesson ID to download
 * @returns {Promise<ActionState<DownloadLessonResponse>>} Success/failure with signed URL
 */
export async function downloadLessonStorage({
  lessonId
}: DownloadLessonParams): Promise<ActionState<DownloadLessonResponse>> {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Validate lessonId (basic UUID check)
    if (!lessonId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) {
      return {
        isSuccess: false,
        message: "Invalid lesson ID"
      }
    }

    // Initialize Supabase client with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Define bucket and file path per storage rules: {bucket}/{userId}/{purpose}/{filename}
    const bucketName = process.env.SUPABASE_LESSONS_BUCKET || "lessons"
    const filePath = `${userId}/${lessonId}.json`

    // Generate a signed URL for the lesson file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600) // URL expires in 1 hour

    if (error) {
      throw error
    }

    if (!data?.signedUrl) {
      throw new Error("Signed URL not generated")
    }

    return {
      isSuccess: true,
      message: "Lesson download URL generated successfully",
      data: { url: data.signedUrl }
    }
  } catch (error) {
    console.error("Error generating lesson download URL:", error)
    return {
      isSuccess: false,
      message: "Failed to generate lesson download URL. Please try again."
    }
  }
}