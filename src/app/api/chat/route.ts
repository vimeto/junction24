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
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  previousMessages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(["text", "image_url"]),
        text: z.string().optional(),
        image_url: z.object({ url: z.string() }).optional()
      }))
    ])
  })).optional()
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
      location?: { latitude: number, longitude: number };
    }>;

const auditTool = {
  type: "function" as const,
  function: {
    name: "audit_item_location",
    description: "Generates a report stating that the item has been audited to the provided location.",
    parameters: {
      type: "object",
      required: ["auditor_id", "item_id", "location_id"],
      properties: {
        auditer_id: {
          type: "string",
          description: "Unique identifier for the auditor"
        },
        item_id: {
          type: "string",
          description: "Unique identifier for the item being audited"
        },
        location_id: {
          type: "string",
          description: "Unique identifier for the location"
        },
        metadata: {
          type: "object",
          description: "Additional audit information",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate of the location"
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate of the location"
            },
            comments: {
              type: "string",
              description: "Optional comments about the audit"
            },
            condition: {
              type: "string",
              enum: ["good", "fair", "poor"],
              description: "Optional assessment of the item's condition"
            },
            image_url: {
              type: "string",
              description: "URL of the audit image if provided"
            },
            image_confirmed: {
              type: "boolean",
              description: "Whether the image has been confirmed"
            },
            serial_number: {
              type: "string",
              description: "Serial number of the item if applicable"
            }
          }
        }
      },
      additionalProperties: false
    }
  }
} as const;

// Import the POST handler from itemAudits route
import { POST as itemAuditHandler } from '../itemAudits/route';

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate request body
    const { text, imageUrl, location, previousMessages } = messageSchema.parse(
      await req.json()
    );

    // Initialize messages array with system message
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that guides users through technical maintenance tasks. " +
          "When conducting an audit, ask for one piece of information at a time. " +
          "Wait for the user's response before proceeding to the next question."
      }
    ];

    // Add previous messages if they exist
    if (previousMessages?.length) {
      messages.push(...(previousMessages as OpenAI.Chat.ChatCompletionMessageParam[]));
    }

    // Add current message
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text" as const, text: text || "Please analyze this image and provide technical feedback." },
          ...(location ? [{ type: "text" as const, text: `Location: ${location.latitude}, ${location.longitude}` }] : [])
        ]
      });
    } else if (text) {
      messages.push({
        role: "user",
        content: text + (location ? `\n(Location: ${location.latitude}, ${location.longitude})` : '')
      });
    }

    // Call OpenAI API with appropriate model
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4o",
      max_tokens: 500,
      tools: [auditTool],
      tool_choice: "auto",
    });

    // Handle function calls from OpenAI
    const responseMessage = completion.choices[0]?.message;
    
    if (responseMessage?.tool_calls?.[0]) {
      // Handle the function call
      const functionCall = responseMessage.tool_calls[0];
      if (functionCall.function.name === 'audit_item_location') {
        const args = JSON.parse(functionCall.function.arguments);
        
        console.log('Audit request payload:', args);
        console.log('Request URL:', `${process.env.NEXT_PUBLIC_APP_URL}/api/itemAudits`);

        // Create a new Request object
        const auditRequest = new Request(`${process.env.NEXT_PUBLIC_APP_URL}/api/itemAudits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args)
        });

        // Call the handler directly
        const auditResponse = await itemAuditHandler(auditRequest);
        
        if (!auditResponse.ok) {
          const errorText = await auditResponse.text();
          throw new Error(`Failed to create audit: ${auditResponse.status} - ${errorText}`);
        }

        const auditResult = await auditResponse.json();
        return NextResponse.json({
          success: true,
          response: `Audit created successfully with ID: ${auditResult.data.itemAuditId}`
        });
      }
    }

    // Handle normal responses
    const aiResponse = responseMessage?.content;

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
