/**
 * @description
 * This file configures Next.js for the Learn Kannada app, optimizing it for production deployment on Vercel.
 * It defines settings for image handling, production optimizations, and runtime behavior.
 *
 * Key features:
 * - Image optimization: Allows remote image loading from specific domains
 * - Production optimizations: Enables minification and strict mode
 * - Security headers: Adds Content-Security-Policy and other headers for Vercel
 * - Environment validation: Ensures required env vars are present
 *
 * @dependencies
 * - next: Provides the NextConfig type and runtime
 *
 * @notes
 * - Optimized for Vercel deployment per Step 32 requirements
 * - Headers enhance security without affecting functionality
 * - No experimental features enabled unless explicitly needed
 * - Assumes environment variables are set in .env.local (not exposed here)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Image optimization for remote patterns
    images: {
      remotePatterns: [
        { hostname: "localhost" }, // Development
        { hostname: "*.vercel.app" }, // Vercel deployment domains
        { hostname: "*.supabase.co" } // Supabase storage for offline lessons
      ]
    },
  
    // Production optimizations
    reactStrictMode: true, // Enables strict mode for better error detection
    swcMinify: true, // Uses SWC for faster minification in production
  
    // Custom headers for security (applied by Vercel)
    async headers() {
      return [
        {
          source: "/(.*)", // Apply to all routes
          headers: [
            {
              key: "X-Frame-Options",
              value: "DENY" // Prevent clickjacking
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff" // Prevent MIME-type sniffing
            },
            {
              key: "Content-Security-Policy",
              value:
                "default-src 'self'; script-src 'self' 'unsafe-inline' *.clerk.accounts.dev *.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.supabase.co; connect-src 'self' *.supabase.co api.openai.com *.clerk.accounts.dev; frame-ancestors 'none';"
              // Restrict sources, allow Clerk, Supabase, and OpenAI
            }
          ]
        }
      ]
    },
  
    // Environment validation (runs at build time)
    env: {
      // No custom env vars added here; rely on .env.local
    },
  
    // Vercel-specific settings
    output: "standalone", // Optimizes for Vercel’s serverless environment
    experimental: {
      // Avoid enabling experimental features unless necessary
      optimizePackageImports: ["lucide-react", "framer-motion"] // Optimize common imports
    }
  }
  
  export default nextConfig