import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai  = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messageSchema = z.object({
  text: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const { text } = messageSchema.parse(body);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that helps users with technical maintenance tasks."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "gpt-3.5-turbo",
    });

    // Extract the AI response
    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json({
      message: "Success",
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
