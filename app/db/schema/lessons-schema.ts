export interface SelectLesson {
  id: string
  level: "beginner" | "intermediate" | "advanced"
  title: string
  content: unknown // Adjust this type as necessary
  createdAt: Date
  updatedAt: Date
}
