/*
 * Initializes the database connection and schema for the Learn Kannada app.
 * This file sets up Drizzle ORM with PostgreSQL via Supabase, defining the schema
 * structure that includes all tables used in the application.
 *
 * Key features:
 * - Connects to Supabase PostgreSQL using DATABASE_URL from .env.local
 * - Defines the schema object with all application tables
 *
 * @dependencies
 * - drizzle-orm/postgres-js: Drizzle ORM for PostgreSQL
 * - postgres: PostgreSQL client
 * - dotenv: Loads environment variables from .env.local
 * - @/db/schema: Schema definitions for all tables
 *
 * @notes
 * - Do not generate migrations here (per backend rules); migrations are handled externally
 */

import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Import existing schemas
import { profilesTable } from "@/db/schema/profiles-schema"
import { lessonsTable } from "@/db/schema/lessons-schema"
import { progressTable } from "@/db/schema/progress-schema"
import { exercisesTable } from "@/db/schema/exercises-schema" // Added to align with Step 6 completion
import { chatMessagesTable } from "@/db/schema/chat-messages-schema" // Updated to real import from type-only

// Load environment variables from .env.local
config({ path: ".env.local" })

// Define the schema object with all tables
const schema = {
  profiles: profilesTable,
  lessons: lessonsTable,
  progress: progressTable,
  exercises: exercisesTable, // Added exercises schema
  chatMessages: chatMessagesTable // Added chat messages schema
}

// Initialize PostgreSQL client with the connection string
const client = postgres(process.env.DATABASE_URL!)

// Export the Drizzle ORM instance with the schema
export const db = drizzle(client, { schema })
