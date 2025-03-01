import React from "react"

// Define the props type for LessonCard
export interface LessonCardProps {
  lesson: {
    id: string
    createdAt: Date
    updatedAt: Date
    level: "beginner" | "intermediate" | "advanced"
    title: string
    content: unknown
  }
}

// LessonCard component definition
export const LessonCard: React.FC<LessonCardProps> = ({ lesson }) => {
  return (
    <div>
      <h2>{lesson.title}</h2>
      {/* Render other lesson details */}
    </div>
  )
}
