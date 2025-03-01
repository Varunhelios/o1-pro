/**
 * @description
 * This client-side component renders a multiple-choice quiz exercise for the Learn Kannada app.
 * It displays a question with selectable options and handles submission to evaluate user answers.
 * Designed for use in /practice/[type]/page.tsx to support interactive learning.
 *
 * Key features:
 * - Displays a single question with multiple-choice options using radio buttons
 * - Manages form state and submission with React Hook Form
 * - Clean, responsive UI with Tailwind CSS and Shadcn components
 * - Submits selected answer to a provided handler function
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for submission
 * - @/components/ui/form: Shadcn Form components for form structure
 * - @/components/ui/radio-group: Shadcn RadioGroup for options
 * - @/db/schema/exercises-schema: Imports SelectExercise for type safety
 * - react-hook-form: Manages form state and validation
 * - lucide-react: Provides icons (e.g., Check)
 *
 * @notes
 * - Requires a parent component to fetch exercise data and pass it as props
 * - Assumes content JSON has a question and options array
 * - Submission handler is expected to call a server action (e.g., submitExerciseAction)
 * - No direct server actions here; adheres to client component rules
 * - Handles edge case of missing/invalid content gracefully
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Define form schema for validation
const quizFormSchema = z.object({
  answer: z.string().min(1, "Please select an answer")
})

// Infer form type from schema
type QuizFormValues = z.infer<typeof quizFormSchema>

// Define props interface
interface QuizExerciseProps {
  exercise: SelectExercise // Exercise data from database
  onSubmit: (answer: string) => Promise<void> // Handler to process submission
}

/**
 * QuizExercise component renders a multiple-choice quiz UI.
 * @param {QuizExerciseProps} props - Exercise data and submission handler
 * @returns {JSX.Element} A form with question and radio options
 */
export default function QuizExercise({
  exercise,
  onSubmit
}: QuizExerciseProps) {
  // Parse exercise content (assuming JSON structure: { question: string, options: string[] })
  const content = exercise.content as { question: string; options: string[] }
  const question = content?.question ?? "No question available"
  const options = content?.options ?? []

  // Initialize form with React Hook Form
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { answer: "" }
  })

  // Handle form submission
  const handleSubmit = async (data: QuizFormValues) => {
    await onSubmit(data.answer)
  }

  return (
    <div className="w-full max-w-lg p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Question display */}
          <div className="text-foreground text-lg font-medium">{question}</div>

          {/* Options */}
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Select an answer</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-2"
                  >
                    {options.length > 0 ? (
                      options.map((option, index) => (
                        <FormItem
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={option}
                              id={`option-${index}`}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`option-${index}`}
                            className="text-foreground"
                          >
                            {option}
                          </FormLabel>
                        </FormItem>
                      ))
                    ) : (
                      <div className="text-muted-foreground">
                        No options available
                      </div>
                    )}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
            className="w-full"
          >
            <Check className="mr-2 size-4" />
            Submit Answer
          </Button>
        </form>
      </Form>
    </div>
  )
}
