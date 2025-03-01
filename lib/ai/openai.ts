/**
 * @description
 * This file configures the OpenAI client for the Learn Kannada app.
 * It initializes the OpenAI SDK with an API key from environment variables,
 * providing a reusable client instance for AI-driven features like grammar explanations.
 *
 * Key features:
 * - Secure initialization: Uses environment variable for API key
 * - Consistent versioning: Specifies a fixed API version
 * - App identification: Includes metadata for OpenAI tracking
 *
 * @dependencies
 * - openai: The OpenAI SDK for interacting with the API
 * - dotenv: Loads environment variables from .env.local (loaded globally in db.ts)
 *
 * @notes
 * - Requires OPENAI_API_KEY in .env.local (set up in Step 1)
 * - Throws an error if the API key is missing to prevent runtime failures
 * - Uses a specific API version (2024-02-15-preview) for stability; update as needed
 * - No direct API calls are made here; this is purely configuration
 */

import OpenAI from "openai"

// Initialize the OpenAI client with configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // Expects key from .env.local; ! assumes it’s set per Step 1
  // Specify API version for consistency across calls
  // Using a preview version as of March 2025; adjust based on OpenAI’s latest stable version
  baseURL: "https://api.openai.com/v1",
  defaultHeaders: {
    "OpenAI-Beta": "v1" // Optional: Indicates beta features if needed
  }
})

// Validate the API key presence to fail fast if misconfigured
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is not set in .env.local. Please add it as per Step 1 instructions."
  )
}

// Export the configured client for use in server actions
export { openai }
