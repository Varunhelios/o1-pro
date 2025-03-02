/**
 * @description
 * Unit tests for exercises server actions in the Learn Kannada app.
 */
import {
    createExerciseAction,
    getExercisesByLessonIdAction,
    submitExerciseAction
  } from "@/actions/db/exercises-actions"
  import { db } from "@/db/db"
  import { InsertExercise, SelectExercise, exercisesTable } from "@/db/schema/exercises-schema"
  
  jest.mock("@/db/db", () => ({
    db: {
      insert: jest.fn(),
      query: { exercises: { findMany: jest.fn() } },
      update: jest.fn()
    }
  }))
  
  describe("Exercises Server Actions", () => {
    const mockExercise: InsertExercise = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      lessonId: "lesson123",
      type: "quiz",
      content: { question: "What is hello?", options: ["ನಮಸ್ಕಾರ", "Goodbye"], correct: "ನಮಸ್ಕಾರ" }
    }
  
    const mockSelectExercise: SelectExercise = {
      ...mockExercise,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: mockExercise.id as string
    }
  
    beforeEach(() => {
      jest.clearAllMocks()
    })
  
    describe("createExerciseAction", () => {
      it("should create an exercise successfully", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectExercise])
        })
  
        const result = await createExerciseAction(mockExercise)
  
        expect(db.insert).toHaveBeenCalledWith(exercisesTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Exercise created successfully",
          data: mockSelectExercise
        })
      })
  
      it("should handle creation error", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await createExerciseAction(mockExercise)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to create exercise"
        })
      })
    })
  
    describe("getExercisesByLessonIdAction", () => {
      it("should retrieve exercises successfully", async () => {
        (db.query.exercises.findMany as jest.Mock).mockResolvedValue([mockSelectExercise])
  
        const result = await getExercisesByLessonIdAction(mockExercise.lessonId)
  
        expect(db.query.exercises.findMany).toHaveBeenCalledWith({
          where: expect.any(Function)
        })
        expect(result).toEqual({
          isSuccess: true,
          message: "Exercises retrieved successfully",
          data: [mockSelectExercise]
        })
      })
  
      it("should handle retrieval error", async () => {
        (db.query.exercises.findMany as jest.Mock).mockRejectedValue(new Error("DB Error"))
  
        const result = await getExercisesByLessonIdAction(mockExercise.lessonId)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to get exercises"
        })
      })
    })
  
    describe("submitExerciseAction", () => {
      it("should submit an exercise and score correctly", async () => {
        (db.query.exercises.findMany as jest.Mock).mockResolvedValue([mockSelectExercise])
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectExercise])
        })
  
        const submission = { answer: "ನಮಸ್ಕಾರ" }
        const result = await submitExerciseAction(mockExercise.id as string, submission)
  
        expect(result.isSuccess).toBe(true)
        expect(result.message).toBe("Exercise submitted successfully")
        expect(result.data).toHaveProperty("score", 100)
      })
  
      it("should handle submission error", async () => {
        (db.query.exercises.findMany as jest.Mock).mockRejectedValue(new Error("DB Error"))
  
        const result = await submitExerciseAction(mockExercise.id as string, { answer: "Wrong" })
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to submit exercise"
        })
      })
    })
  })