/**
 * @description
 * This client-side component renders a writing exercise UI for the Learn Kannada app.
 * It provides a textarea for users to input text and submits it for evaluation.
 * Designed for use in /practice/[type]/page.tsx to support interactive learning.
 *
 * Key features:
 * - Displays a writing prompt with a textarea for user response
 * - Manages form state and submission with React Hook Form
 * - Clean, responsive UI with Tailwind CSS and Shadcn components
 * - Submits user text to a provided handler function
 *
 * @dependencies
 * - @/components/ui/button: Shadcn Button for submission
 * - @/components/ui/form: Shadcn Form components for form structure
 * - @/components/ui/textarea: Shadcn Textarea for user input
 * - @/db/schema/exercises-schema: Imports SelectExercise for type safety
 * - react-hook-form: Manages form state and validation
 * - lucide-react: Provides icons (e.g., Check)
 *
 * @notes
 * - Requires a parent component to fetch exercise data and pass it as props
 * - Assumes content JSON has a prompt string
 * - Submission handler is expected to call a server action (e.g., submitExerciseAction)
 * - No direct server actions here; adheres to client component rules
 * - Handles edge case of missing/invalid content
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
import { Textarea } from "@/components/ui/textarea"
import { SelectExercise } from "@/db/schema/exercises-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Define form schema for validation
const writingFormSchema = z.object({
  response: z.string().min(1, "Please enter your response")
})

// Infer form type from schema
type WritingFormValues = z.infer<typeof writingFormSchema>

// Define props interface
interface WritingExerciseProps {
  exercise: SelectExercise // Exercise data from database
  onSubmit: (response: string) => Promise<void> // Handler to process submission
}

/**
 * WritingExercise component renders a writing exercise UI.
 * @param {WritingExerciseProps} props - Exercise data and submission handler
 * @returns {JSX.Element} A form with prompt and textarea
 */
export default function WritingExercise({
  exercise,
  onSubmit
}: WritingExerciseProps) {
  // Parse exercise content (assuming JSON structure: { prompt: string })
  const content = exercise.content as { prompt: string }
  const prompt = content?.prompt ?? "No prompt available"

  // Initialize form with React Hook Form
  const form = useForm<WritingFormValues>({
    resolver: zodResolver(writingFormSchema),
    defaultValues: { response: "" }
  })

  // Handle form submission
  const handleSubmit = async (data: WritingFormValues) => {
    await onSubmit(data.response)
  }

  return (
    <div className="w-full max-w-lg p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Prompt display */}
          <div className="text-foreground text-lg font-medium">{prompt}</div>

          {/* Textarea */}
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Your response</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type your response here..."
                    className="h-32 resize-none"
                    {...field}
                  />
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
            Submit Response
          </Button>
        </form>
      </Form>
    </div>
  )
}
