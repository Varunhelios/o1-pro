/**
 * @description
 * This file defines the server-side layout component for the /learn routes in the Learn Kannada app.
 * It provides a structured layout with a sidebar for navigation and a main content area for rendering
 * nested pages. The layout supports the learning modules feature by offering navigation to different
 * lesson levels and placeholders for progress indicators.
 *
 * Key features:
 * - Sidebar Navigation: Links to beginner, intermediate, and advanced lesson levels
 * - Progress Indicators: Placeholder section for future integration with user progress data
 * - Responsive Design: Mobile-friendly layout using Tailwind CSS
 *
 * @dependencies
 * - lucide-react: Provides icons for navigation (BookOpen, GraduationCap)
 * - next/link: Enables client-side navigation for lesson level links
 * - react: Core React library for component structure
 *
 * @notes
 * - Marked as "use server" to comply with server component rules
 * - No async data fetching yet; progress indicators are placeholders until Step 15 integrates data
 * - Assumes lesson levels are "beginner", "intermediate", "advanced" per lessons-schema.ts
 * - Edge case: Mobile sidebar collapse not implemented yet; could be added in future iterations
 */

"use server"

import { BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

/**
 * Props interface for the LearnLayout component.
 * @interface LearnLayoutProps
 * @property {ReactNode} children - The content to render within the main area
 */
interface LearnLayoutProps {
  children: ReactNode
}

/**
 * The server-side layout component for /learn routes.
 * @param {LearnLayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout with sidebar and main content
 */
export default async function LearnLayout({ children }: LearnLayoutProps) {
  // Define navigation items for lesson levels
  const navItems = [
    { label: "Beginner", href: "/learn/beginner", icon: BookOpen },
    { label: "Intermediate", href: "/learn/intermediate", icon: BookOpen },
    { label: "Advanced", href: "/learn/advanced", icon: GraduationCap }
  ]

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-card w-full border-b p-4 md:w-64 md:border-b-0 md:border-r">
        <div className="mb-6">
          <h2 className="text-foreground text-xl font-semibold">
            Learn Kannada
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Explore lessons by level
          </p>
        </div>

        <nav>
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md p-2"
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress Indicators Placeholder */}
        <div className="mt-6">
          <h3 className="text-foreground text-lg font-medium">Your Progress</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Progress tracking coming soon...
          </p>
          {/* Future integration: Display XP, streak, badges here */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
