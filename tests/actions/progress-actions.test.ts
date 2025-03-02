/**
 * @description
 * Unit tests for progress server actions in the Learn Kannada app.
 */
import {
    createProgressAction,
    getProgressByUserIdAction,
    updateProgressAction
  } from "@/actions/db/progress-actions"
  import { db } from "@/db/db"
  import { InsertProgress, SelectProgress, progressTable } from "@/db/schema/progress-schema"
  
  jest.mock("@/db/db", () => ({
    db: {
      insert: jest.fn(),
      query: { progress: { findMany: jest.fn() } },
      update: jest.fn()
    }
  }))
  
  describe("Progress Server Actions", () => {
    const mockProgress: InsertProgress = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "user123",
      lessonId: "lesson123",
      xp: 100,
      streak: 1,
      badges: ["beginner"]
    }
  
    const mockSelectProgress: SelectProgress = {
      ...mockProgress,
      createdAt: new Date(),
      updatedAt: new Date(),
      xp: mockProgress.xp ?? 0,
      streak: mockProgress.streak ?? 0,
      lessonId: mockProgress.lessonId || null,
      id: mockProgress.id as string,
      badges: mockProgress.badges
    }
  
    beforeEach(() => {
      jest.clearAllMocks()
    })
  
    describe("createProgressAction", () => {
      it("should create progress successfully", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectProgress])
        })
  
        const result = await createProgressAction(mockProgress)
  
        expect(db.insert).toHaveBeenCalledWith(progressTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Progress created successfully",
          data: mockSelectProgress
        })
      })
  
      it("should handle creation error", async () => {
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await createProgressAction(mockProgress)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to create progress"
        })
      })
    })
  
    describe("getProgressByUserIdAction", () => {
      it("should retrieve progress successfully", async () => {
        (db.query.progress.findMany as jest.Mock).mockResolvedValue([mockSelectProgress])
  
        const result = await getProgressByUserIdAction(mockProgress.userId)
  
        expect(db.query.progress.findMany).toHaveBeenCalledWith({
          where: expect.any(Function)
        })
        expect(result).toEqual({
          isSuccess: true,
          message: "Progress retrieved successfully",
          data: [mockSelectProgress]
        })
      })
  
      it("should handle retrieval error", async () => {
        (db.query.progress.findMany as jest.Mock).mockRejectedValue(new Error("DB Error"))
  
        const result = await getProgressByUserIdAction(mockProgress.userId)
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to get progress"
        })
      })
    })
  
    describe("updateProgressAction", () => {
      it("should update progress successfully", async () => {
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockSelectProgress])
        })
  
        const updateData = { xp: 200 }
        const result = await updateProgressAction(mockProgress.id as string, updateData)
  
        expect(db.update).toHaveBeenCalledWith(progressTable)
        expect(result).toEqual({
          isSuccess: true,
          message: "Progress updated successfully",
          data: mockSelectProgress
        })
      })
  
      it("should handle update error", async () => {
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockRejectedValue(new Error("DB Error"))
        })
  
        const result = await updateProgressAction(mockProgress.id as string, { xp: 200 })
  
        expect(result).toEqual({
          isSuccess: false,
          message: "Failed to update progress"
        })
      })
    })
  })