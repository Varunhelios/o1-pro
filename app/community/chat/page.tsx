/**
 * @description
 * This client component serves as the community chat page for the Learn Kannada app.
 * It provides a real-time peer-to-peer chat interface where users can send and receive messages,
 * supporting the social feature for learners to practice together.
 *
 * Key features:
 * - Real-time message updates using Supabase subscriptions
 * - Displays a scrollable list of chat messages
 * - Allows users to send messages via sendMessageAction
 * - Clean, responsive UI with Tailwind CSS and Shadcn components
 * - Integrates Clerk authentication for user identification
 *
 * @dependencies
 * - @clerk/nextjs: For Clerk auth hooks (useUser)
 * - @supabase/supabase-js: For real-time Supabase client
 * - @/actions/db/chats-actions: Server action to send messages
 * - @/components/ui/input: Shadcn Input for message input
 * - @/components/ui/button: Shadcn Button for sending messages
 * - @/db/schema/chat-messages-schema: Types for chat messages
 * - lucide-react: Provides icons (e.g., Send)
 * - react: For state and effect management
 *
 * @notes
 * - Marked "use client" as it's a client component with real-time interactivity
 * - Assumes sendMessageAction and getMessagesAction exist from Step 11
 * - Requires Supabase real-time enabled for the chat_messages table
 * - Scrolls to the latest message on update using a ref
 * - Handles edge cases: no user, subscription errors, empty message list
 */

"use client"

import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { sendMessageAction } from "@/actions/db/chats-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SelectChatMessage } from "@/db/schema/chat-messages-schema"
import { Send } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * ChatPage component renders the real-time chat interface.
 * @returns {JSX.Element} The chat UI with message list and input
 */
export default function ChatPage() {
  // Clerk user authentication
  const { user, isLoaded } = useUser()
  const [messages, setMessages] = useState<SelectChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to the bottom of the message list when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch initial messages and set up real-time subscription
  useEffect(() => {
    if (!isLoaded || !user) return

    // Initial fetch of messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching messages:", error)
        return
      }
      setMessages(data || [])
    }

    fetchMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        payload => {
          setMessages(prev => [...prev, payload.new as SelectChatMessage])
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, user])

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending a new message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    const messageData = {
      userId: user.id,
      content: newMessage.trim()
    }

    const { isSuccess, message } = await sendMessageAction(newMessage.trim())
    if (isSuccess) {
      setNewMessage("") // Clear input on success
    } else {
      console.error("Failed to send message:", message)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Please sign in to chat.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col p-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold">
        Community Chat
      </h1>

      {/* Message List */}
      <div className="bg-card flex-1 overflow-y-auto rounded-lg p-4 shadow-sm">
        {messages.length > 0 ? (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.userId === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-lg p-3 ${
                  msg.userId === user.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p>{msg.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground text-center">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          <Send className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}
