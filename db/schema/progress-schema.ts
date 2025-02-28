/*
 * Defines the database schema for user progress in the Learn Kannada app.
 * This file creates the progress table to track user learning progress, including
 * XP points, streaks, and badges, with relationships to profiles and lessons.
 *
 * Key features:
 * - Links to profiles and lessons via foreign keys (userId and lessonId)
 * - Stores XP and streak as integers for gamification
 * - Uses JSON for badges to support flexible badge structures
 * - Includes timestamps for creation and updates
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides PostgreSQL schema definition utilities
 * - @/db/schema: Imports profilesTable and lessonsTable for foreign key references
 *
 * @notes
 * - No migrations are generated here; handled externally per backend rules
 * - lessonId is optional (nullable) to allow progress tracking without a specific lesson
 * - badges defaults to an empty array for new records
 */

import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { profilesTable } from "@/db/schema/profiles-schema"
import { lessonsTable } from "@/db/schema/lessons-schema"

/**
 * Defines the progress table schema.
 * This table stores user progress data linked to their profile and optionally a lesson.
 */
export const progressTable = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(), // Unique identifier for each progress record
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }), // Foreign key to profiles, cascades on delete
  lessonId: uuid("lesson_id").references(() => lessonsTable.id, {
    onDelete: "cascade"
  }), // Optional foreign key to lessons, cascades on delete
  xp: integer("xp").default(0).notNull(), // Experience points earned, defaults to 0
  streak: integer("streak").default(0).notNull(), // Current streak count, defaults to 0
  badges: json("badges").default([]).notNull(), // Array of badges earned, stored as JSON, defaults to empty array
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()) // Update timestamp on modification
})

/**
 * Type definition for inserting a new progress record.
 * Matches the schema structure for type-safe insertions.
 */
export type InsertProgress = typeof progressTable.$inferInsert

/**
 * Type definition for selecting a progress record.
 * Matches the schema structure for type-safe queries.
 */
export type SelectProgress = typeof progressTable.$inferSelect
