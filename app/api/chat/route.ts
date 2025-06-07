import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Check if API key is available
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "API key not configured. Please add your Google Gemini API key to environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const result = await streamText({
      model: google("gemini-1.5-flash"), // Using flash model which has higher quota limits
      messages,
      maxTokens: 1000, // Limit tokens to reduce quota usage
      temperature: 0.7,
      tools: {
        weather: tool({
          description: "Get the weather in a location (fahrenheit)",
          parameters: z.object({
            location: z.string().describe("The location to get the weather for"),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32)
            return {
              location,
              temperature,
              description: ["sunny", "cloudy", "rainy", "snowy"][Math.floor(Math.random() * 4)],
            }
          },
        }),
        calculator: tool({
          description: "Perform mathematical calculations",
          parameters: z.object({
            expression: z.string().describe("The mathematical expression to evaluate"),
          }),
          execute: async ({ expression }) => {
            try {
              // Simple calculator - in production, use a proper math parser
              const result = Function(`"use strict"; return (${expression})`)()
              return { result }
            } catch (error) {
              return { error: "Invalid mathematical expression" }
            }
          },
        }),
        currentTime: tool({
          description: "Get the current date and time",
          parameters: z.object({}),
          execute: async () => {
            return {
              currentTime: new Date().toLocaleString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
          },
        }),
      },
    })

    return result.toAIStreamResponse()
  } catch (error: any) {
    console.error("Chat API Error:", error)

    // Handle specific quota exceeded error
    if (error.message?.includes("quota") || error.message?.includes("exceeded")) {
      return new Response(
        JSON.stringify({
          error: "API quota exceeded. Please check your Google AI billing plan or try again later.",
          type: "quota_exceeded",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Handle rate limit errors
    if (error.message?.includes("rate limit") || error.status === 429) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment before sending another message.",
          type: "rate_limit",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Handle authentication errors
    if (error.message?.includes("authentication") || error.status === 401) {
      return new Response(
        JSON.stringify({
          error: "Invalid API key. Please check your Google Gemini API key configuration.",
          type: "auth_error",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Generic error handling
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again later.",
        type: "generic_error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
