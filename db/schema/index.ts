/*
 * Exports all database schemas for the Learn Kannada app.
 * This file centralizes schema exports for use in database operations.
 *
 * Key features:
 * - Exports all table definitions for Drizzle ORM integration
 *
 * @notes
 * - Follows project rule to export schemas from a single index file
 */

export * from "./profiles-schema"
export * from "./lessons-schema"
export * from "./progress-schema"
export * from "./exercises-schema" // Added to align with Step 6 completion
export * from "./chat-messages-schema" // Added export for chat messages schema
