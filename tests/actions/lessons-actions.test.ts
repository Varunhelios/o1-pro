/**
 * @description
 * Unit tests for lessons server actions in the Learn Kannada app.
 */
import {
    createLessonAction,
    getLessonAction,
    updateLessonAction,
    deleteLessonAction
  } from "@/actions/db/lessons-actions"
  import { db } from "@/db/db"
  import { lessonsTable } from "@/db/schema/lessons-schema"
  
  jest.mock("@/db/db", () => ({
    db: {
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }))
  
  interface InsertLesson {
    id: string
    level: "beginner" | "intermediate" | "advanced"
    title: string
    content: unknown
  }
  
  interface SelectLesson extends InsertLesson {
    createdAt: Date
    updatedAt: Date
  }
  
  describe("Lessons Server Actions", () => {
    const mockLesson: InsertLesson = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      level: "beginner",
      title: "Lesson 1",
      content: { grammar: "Basics", vocab: ["hello"] }
    }
  
    const mockSelectLesson: SelectLesson = {
      ...mockLesson,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  
    beforeEach(() => {
      jest.clearAllMocks()
    })
  
    describe("createLessonAction", () => {
      it("should create a lesson successfully", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectLesson])
        })
  
        const result = await createLessonAction(mockLesson)
  
        expect(db.insert).toHaveBeenCalledWith(lessonsTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Lesson created successfully",
          data: mockSelectLesson
        })
      })
  
      it("should handle creation error", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await createLessonAction(mockLesson)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to create lesson"
        })
      })
    })
  
    describe("getLessonAction", () => {
      it("should retrieve a lesson successfully", async () => {
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([mockSelectLesson])
        })
  
        const result = await getLessonAction(mockLesson.id)
  
        expect(result).toEqual({
          isSuccess: true,
          message: "Lesson retrieved successfully",
          data: [mockSelectLesson]
        })
      })
  
      it("should handle retrieval error", async () => {
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await getLessonAction(mockLesson.id)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to get lesson"
        })
      })
    })
  
    describe("updateLessonAction", () => {
      it("should update a lesson successfully", async () => {
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectLesson])
        })
  
        const updateData = { title: "Updated Lesson" }
        const result = await updateLessonAction(mockLesson.id, updateData)
  
        expect(db.update).toHaveBeenCalledWith(lessonsTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Lesson updated successfully",
          data: mockSelectLesson
        })
      })
  
      it("should handle update error", async () => {
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await updateLessonAction(mockLesson.id, { title: "Updated" })
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to update lesson"
        })
      })
    })
  
    describe("deleteLessonAction", () => {
      it("should delete a lesson successfully", async () => {
        (db.delete as jest.Mock).mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
  
        const result = await deleteLessonAction(mockLesson.id)
  
        expect(db.delete).toHaveBeenCalledWith(lessonsTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Lesson deleted successfully",
          data: undefined
        })
      })
  
      it("should handle deletion error", async () => {
        (db.delete as jest.Mock).mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await deleteLessonAction(mockLesson.id)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to delete lesson"
        })
      })
    })
  })