/**
 * @description
 * This file defines server actions for managing chat messages in the Learn Kannada app.
 * It provides functions to send and retrieve chat messages stored in the Supabase PostgreSQL
 * database using Drizzle ORM. These actions support the peer-to-peer chat system under
 * the social features of the app, enabling learners to practice together.
 *
 * Key features:
 * - Send Message: Creates a new chat message for the authenticated user
 * - Retrieve Messages: Fetches all chat messages (optionally filtered by user ID)
 *
 * @dependencies
 * - @clerk/nextjs/server: Used for authentication via Clerk
 * - drizzle-orm: Provides database query capabilities with Drizzle ORM
 * - @/db/db: Imports the database instance with schema
 * - @/db/schema/chat-messages-schema: Imports chat messages table schema and types
 * - @/types/server-action-types: Imports ActionState type for consistent return values
 *
 * @notes
 * - All actions are server-side only ("use server") per Next.js conventions
 * - Authentication is required for all actions to ensure user-specific operations
 * - getMessagesAction fetches all messages by default; filtering by userId is optional
 * - Designed to support future real-time integration (e.g., Step 18) with Supabase
 * - Date handling relies on schema defaults for createdAt
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import {
  InsertChatMessage,
  SelectChatMessage,
  chatMessagesTable
} from "@/db/schema/chat-messages-schema"
import { ActionState } from "@/types/server-action-types"

/**
 * Sends a new chat message for the authenticated user.
 * @param content - The content of the message to send
 * @returns Promise<ActionState<SelectChatMessage>> - Success with new message or error
 */
export async function sendMessageAction(
  content: string
): Promise<ActionState<SelectChatMessage>> {
  // Authenticate the user
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to send messages"
    }
  }

  try {
    // Validate input
    if (!content || content.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Message content cannot be empty"
      }
    }

    // Prepare the message data
    const messageData: InsertChatMessage = {
      userId,
      content: content.trim()
    }

    // Insert the message into the database
    const [newMessage] = await db
      .insert(chatMessagesTable)
      .values(messageData)
      .returning()

    return {
      isSuccess: true,
      message: "Message sent successfully",
      data: newMessage
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return {
      isSuccess: false,
      message: "Failed to send message due to a server error"
    }
  }
}

/**
 * Retrieves chat messages, optionally filtered by user ID.
 * @param userIdParam - Optional user ID to filter messages (must match authenticated user if provided)
 * @returns Promise<ActionState<SelectChatMessage[]>> - Success with message list or error
 */
export async function getMessagesAction(
  userIdParam?: string
): Promise<ActionState<SelectChatMessage[]>> {
  // Authenticate the user
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Please sign in to view messages"
    }
  }

  try {
    // If userIdParam is provided, ensure it matches the authenticated user
    if (userIdParam && userIdParam !== userId) {
      return {
        isSuccess: false,
        message: "Forbidden: You can only view your own messages"
      }
    }

    // Fetch messages, filtering by userId if provided, otherwise fetch all
    const messages = userIdParam
      ? await db
          .select()
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.userId, userIdParam))
      : await db.select().from(chatMessagesTable)

    return {
      isSuccess: true,
      message: "Messages retrieved successfully",
      data: messages
    }
  } catch (error) {
    console.error("Error retrieving messages:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve messages due to a server error"
    }
  }
}