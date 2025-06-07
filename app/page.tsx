"use client"

import type React from "react"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Send, Bot, User, Trash2, Copy, AlertTriangle, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { GeminiLogo } from "@/components/gemini-logo"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload } = useChat({
    maxSteps: 3, // Reduced to save quota
    onError: (error) => {
      console.error("Chat error:", error)

      // Show specific error messages
      if (error.message?.includes("quota")) {
        toast({
          title: "Quota Exceeded",
          description: "Your API quota has been exceeded. Please check your billing plan.",
          variant: "destructive",
        })
      } else if (error.message?.includes("rate limit")) {
        toast({
          title: "Rate Limited",
          description: "Please wait a moment before sending another message.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    },
  })

  const [isTyping, setIsTyping] = useState(false)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)

  // Rate limiting cooldown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCooldown(rateLimitCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [rateLimitCooldown])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || rateLimitCooldown > 0) return

    setIsTyping(true)
    handleSubmit(e)

    // Set a cooldown to prevent rapid requests
    setRateLimitCooldown(3)

    // Reset typing indicator after a delay
    setTimeout(() => setIsTyping(false), 1000)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      })
    }
  }

  const clearChat = () => {
    window.location.reload()
  }

  const retryLastMessage = () => {
    if (messages.length > 0) {
      reload()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <GeminiLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Gemini AI Chat</h1>
                <p className="text-sm text-muted-foreground">Powered by Google Gemini Flash</p>
              </div>
            </div>
            <div className="flex gap-2">
              {error && (
                <Button variant="outline" size="sm" onClick={retryLastMessage}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-4 py-2">
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error.message?.includes("quota")
                ? "API quota exceeded. Please check your Google AI billing plan or try again later."
                : error.message?.includes("rate limit")
                  ? "Rate limit exceeded. Please wait before sending another message."
                  : "Unable to connect to AI service. Please check your internet connection and try again."}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && !error && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Welcome to Gemini AI Chat</h2>
              <p className="text-muted-foreground mb-6">
                Start a conversation with AI. I can help with questions, calculations, weather, and more!
              </p>

              {/* Usage Tips */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium mb-2">💡 Tips for Better Experience</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Keep messages concise to save API quota</li>
                  <li>• Wait 3 seconds between messages to avoid rate limits</li>
                  <li>• Use tools for specific tasks (weather, calculations, time)</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleInputChange({ target: { value: "What's the weather like in Tokyo?" } } as any)}
                >
                  <p className="text-sm font-medium">Weather Info</p>
                  <p className="text-xs text-muted-foreground">Get weather for any location</p>
                </Card>
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleInputChange({ target: { value: "Calculate 15 * 24" } } as any)}
                >
                  <p className="text-sm font-medium">Math Calculator</p>
                  <p className="text-xs text-muted-foreground">Solve mathematical problems</p>
                </Card>
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleInputChange({ target: { value: "What time is it?" } } as any)}
                >
                  <p className="text-sm font-medium">Current Time</p>
                  <p className="text-xs text-muted-foreground">Get current date and time</p>
                </Card>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  <AvatarFallback>
                    <GeminiLogo className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                <Card
                  className={`p-4 group ${
                    message.role === "user" ? "bg-blue-500 text-white ml-auto" : "bg-white dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {message.parts?.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                                {part.text}
                              </div>
                            )
                          case "tool-invocation":
                            return (
                              <div key={`${message.id}-${i}`} className="mt-2">
                                <Badge variant="secondary" className="mb-2">
                                  🔧 Using {part.toolInvocation.toolName}
                                </Badge>
                                <div className="text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded">
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(part.toolInvocation.result, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )
                          default:
                            return null
                        }
                      }) || <div className="whitespace-pre-wrap">{message.content}</div>}
                    </div>

                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {message.role === "user" && (
                <Avatar className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500">
                  <AvatarFallback>
                    <User className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {(isLoading || isTyping) && (
            <div className="flex gap-4 justify-start">
              <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                <AvatarFallback>
                  <GeminiLogo className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    rateLimitCooldown > 0 ? `Wait ${rateLimitCooldown}s before sending...` : "Type your message here..."
                  }
                  disabled={isLoading || rateLimitCooldown > 0}
                  className="pr-12 min-h-[50px] resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || rateLimitCooldown > 0}
                size="lg"
                className="px-6"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : rateLimitCooldown > 0 ? (
                  <span className="text-sm">{rateLimitCooldown}</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="flex justify-center mt-2">
                <Button variant="outline" size="sm" onClick={stop}>
                  Stop generating
                </Button>
              </div>
            )}

            {rateLimitCooldown > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Rate limiting active to prevent quota issues
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
