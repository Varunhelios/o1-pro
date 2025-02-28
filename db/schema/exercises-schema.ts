/*
 * Defines the database schema for exercises in the Learn Kannada app.
 * This file creates the exercises table to store interactive exercise data,
 * such as quizzes, writing, and speaking exercises, linked to lessons.
 *
 * Key features:
 * - Links to lessons via a foreign key (lessonId) with cascade delete
 * - Uses an enum for exercise types (quiz, writing, speaking)
 * - Stores exercise content as JSON for structured data (e.g., questions, answers)
 * - Includes timestamps for creation and updates
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides PostgreSQL schema definition utilities
 * - @/db/schema/lessons-schema: Imports lessonsTable for foreign key reference
 *
 * @notes
 * - No migrations are generated here; handled externally per backend rules
 * - Content is JSON to allow flexible exercise structures
 * - lessonId is required (notNull) to ensure exercises are always tied to a lesson
 */

import {
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { lessonsTable } from "@/db/schema/lessons-schema"

/**
 * Defines the exercise type enum.
 * Represents the possible types of exercises supported by the app.
 */
export const exerciseTypeEnum = pgEnum("type", ["quiz", "writing", "speaking"])

/**
 * Defines the exercises table schema.
 * This table stores exercise data linked to a specific lesson.
 */
export const exercisesTable = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(), // Unique identifier for each exercise
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessonsTable.id, { onDelete: "cascade" }), // Foreign key to lessons, cascades on delete
  type: exerciseTypeEnum("type").notNull(), // Type of exercise (quiz, writing, speaking)
  content: json("content").notNull(), // JSON content storing exercise details (e.g., questions, prompts)
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()) // Update timestamp on modification
})

/**
 * Type definition for inserting a new exercise record.
 * Matches the schema structure for type-safe insertions.
 */
export type InsertExercise = typeof exercisesTable.$inferInsert

/**
 * Type definition for selecting an exercise record.
 * Matches the schema structure for type-safe queries.
 */
export type SelectExercise = typeof exercisesTable.$inferSelect
