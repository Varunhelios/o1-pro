"use client"

import { SelectLesson } from "@/db/schema/lessons-schema"

interface LessonCardProps {
  lesson: SelectLesson
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson }) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <h2 className="text-xl font-bold">{lesson.title}</h2>
      <p className="capitalize text-gray-600">Level: {lesson.level}</p>
    </div>
  )
}

export default LessonCard
