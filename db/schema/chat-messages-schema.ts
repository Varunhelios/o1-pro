/*
 * Defines the database schema for chat messages in the Learn Kannada app.
 * This file creates the chat_messages table to store peer-to-peer chat messages,
 * supporting the social feature for learners to practice together.
 *
 * Key features:
 * - Links to profiles via a foreign key (userId) with cascade delete
 * - Stores message content as text
 * - Includes a creation timestamp to track when messages were sent
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides PostgreSQL schema definition utilities
 * - @/db/schema/profiles-schema: Imports profilesTable for foreign key reference
 *
 * @notes
 * - No migrations are generated here; handled externally per backend rules
 * - Only createdAt is included per the technical specification; messages are immutable
 * - userId is required (notNull) to ensure messages are always tied to a user
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { profilesTable } from "@/db/schema/profiles-schema"

/**
 * Defines the chat messages table schema.
 * This table stores messages sent between users in the peer-to-peer chat system.
 */
export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(), // Unique identifier for each message
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }), // Foreign key to profiles, cascades on delete
  content: text("content").notNull(), // Message content, required
  createdAt: timestamp("created_at").defaultNow().notNull() // Creation timestamp
})

/**
 * Type definition for inserting a new chat message record.
 * Matches the schema structure for type-safe insertions.
 */
export type InsertChatMessage = typeof chatMessagesTable.$inferInsert

/**
 * Type definition for selecting a chat message record.
 * Matches the schema structure for type-safe queries.
 */
export type SelectChatMessage = typeof chatMessagesTable.$inferSelect
