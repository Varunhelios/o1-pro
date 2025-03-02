/*
 * Defines the database schema for lessons in the Learn Kannada app.
 * This file creates the lessons table to store lesson data, including level,
 * title, and content, supporting the structured curriculum feature.
 *
 * Key features:
 * - Uses an enum for lesson levels (beginner, intermediate, advanced)
 * - Stores lesson content as JSON for structured data (grammar, vocab, sentences)
 * - Includes timestamps for creation and updates
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides PostgreSQL schema definition utilities
 *
 * @notes
 * - No migrations are generated here; handled externally per backend rules
 * - Content is JSON to allow flexible lesson structure
 */

import {
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"

// Define the lesson level enum
export const levelEnum = pgEnum("level", [
  "beginner",
  "intermediate",
  "advanced"
])

// Define the lessons table
export const lessonsTable = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(), // Unique identifier for each lesson
  level: levelEnum("level").notNull(), // Lesson difficulty level (beginner, intermediate, advanced)
  title: text("title").notNull(), // Human-readable title of the lesson
  content: json("content").notNull(), // JSON content storing lesson details (e.g., grammar, vocab)
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()) // Update timestamp on modification
})

// Type definitions for insert and select operations
export type InsertLesson = typeof lessonsTable.$inferInsert
export interface SelectLesson {
  id: string
  title: string
  level: "beginner" | "intermediate" | "advanced"
  content: unknown // Adjust as necessary
  createdAt: Date
  updatedAt: Date
  progress?: number
}
