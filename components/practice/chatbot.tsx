/**
 * @description
 * This client-side component renders a chatbot interface for the Learn Kannada app.
 * It allows users to practice conversational Kannada with AI-generated responses,
 * integrating with server actions for real-time feedback.
 *
 * Key features:
 * - Conversation history: Displays user and AI messages with timestamps
 * - Real-time input: Handles user messages with form submission
 * - AI integration: Uses getGrammarExplanationAction for responses (placeholder for future conversational action)
 * - Responsive design: Clean, minimalistic UI with Tailwind CSS and Shadcn components
 *
 * @dependencies
 * - @/actions/ai-actions: Imports getGrammarExplanationAction for AI responses
 * - @/components/ui/button: Shadcn Button for submission
 * - @/components/ui/input: Shadcn Input for message entry
 * - @/components/ui/scroll-area: Shadcn ScrollArea for conversation history
 * - lucide-react: Provides Send icon
 * - react: Manages state and effects
 *
 * @notes
 * - Runs as a client component ("use client") for interactive UI
 * - Currently uses getGrammarExplanationAction; a dedicated conversational action could be added later
 * - Messages are stored locally in state; persistence could be added with a backend table
 * - Assumes user input is in Kannada or Romanized Kannada; transliteration support pending
 * - Error handling displays messages in the UI for user feedback
 */

"use client"

import { getGrammarExplanationAction } from "@/actions/ai-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { FormEvent, useState } from "react"

/**
 * Interface for a chat message.
 */
interface ChatMessage {
  id: number // Unique identifier for each message
  sender: "user" | "ai" // Who sent the message
  content: string // Message text
  timestamp: string // ISO string of when the message was sent
}

/**
 * Chatbot component for conversational practice.
 * @returns {JSX.Element} The chatbot UI with input and message display
 */
export default function Chatbot() {
  // State for conversation history and current input
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Handle form submission to send a message
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return // Prevent empty submissions

    const userMessage: ChatMessage = {
      id: Date.now(), // Simple ID based on timestamp
      sender: "user",
      content: input,
      timestamp: new Date().toISOString()
    }

    // Add user message to history
    setMessages(prev => [...prev, userMessage])
    setInput("") // Clear input field
    setIsLoading(true)

    try {
      // Call server action for AI response (using grammar explanation as a placeholder)
      const result = await getGrammarExplanationAction(input)
      const aiContent = result.isSuccess
        ? result.data
        : `Error: ${result.message}`

      const aiMessage: ChatMessage = {
        id: Date.now() + 1, // Ensure unique ID
        sender: "ai",
        content: aiContent,
        timestamp: new Date().toISOString()
      }

      // Add AI response to history
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      // Handle unexpected errors (e.g., network issues)
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      console.error("Chatbot error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background mx-auto flex h-[500px] w-full max-w-md flex-col rounded-lg border p-4 shadow-md">
      {/* Chat history */}
      <ScrollArea className="mb-4 flex-1">
        {messages.length === 0 ? (
          <div className="text-muted-foreground text-center">
            Start a conversation to practice Kannada!
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`mb-2 flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-2 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p>{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </ScrollArea>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message in Kannada..."
          className="flex-1"
          disabled={isLoading}
        />

        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="size-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  )
}
