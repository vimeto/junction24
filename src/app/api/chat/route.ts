import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Updated schema to handle optional text and image
const messageSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine(data => data.text || data.imageUrl, {
  message: "Either text or imageUrl must be provided"
});

// Add this type at the top of the file
type ChatContent = 
  | string 
  | Array<{
      type: "text" | "image_url";
      text?: string;
      image_url?: { url: string };
    }>;

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const { text, imageUrl } = messageSchema.parse(body);

    // Construct messages array based on what's provided
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that helps users with technical maintenance tasks."
      }
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: text || "Please analyze this image and provide technical feedback." }
        ]
      });
    } else if (text) {
      messages.push({
        role: "user",
        content: text
      });
    }

    // Call OpenAI API with appropriate model
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4o",
      max_tokens: 500,
    });

    // Extract the AI response
    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
