import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
console.log("KEY LOADED:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-3.1-flash-lite"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
