import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { createItemAudit } from "~/server/actions/itemAudits";
import { db } from "~/server/db";
import { chats } from "~/server/db/schema";
import { and, isNotNull, eq } from "drizzle-orm";
import { createChat } from "~/server/actions/chats";
import { itemAudits } from "~/server/db/schema";

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
  })).optional(),
  itemAuditId: z.number().optional()
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
      required: ["auditor_id", "item_id", "location_id", "audit_id"],
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
        audit_id: {
          type: "string",
          description: "Unique identifier for the audit"
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

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate request body
    const { text, imageUrl, location, previousMessages, itemAuditId } = messageSchema.parse(
      await req.json()
    );
    // Load previous messages from database
    const dbMessages = await db
      .select({
        sender: chats.sender,
        chatText: chats.chatText,
      })
      .from(chats)
      .where(
        and(
          isNotNull(chats.chatText)
        )
      )
      .orderBy(chats.createdAt);

    // Initialize messages array with system message
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that guides users through technical maintenance tasks. " +
          "When conducting an audit, ask for one piece of information at a time. " +
          "Wait for the user's response before proceeding to the next question."
      }
    ];

    // Add messages from database
    dbMessages.forEach(msg => {
      messages.push({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.chatText || ""
      });
    });

    // Add current conversation messages if they exist
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
    let auditResult: { itemAuditId: number } | undefined;
    let aiResponse: string | null = null;

    if (responseMessage?.tool_calls?.[0]) {
      // Handle the function call
      const functionCall = responseMessage.tool_calls[0];
      if (functionCall.function.name === 'audit_item_location') {
        const args = JSON.parse(functionCall.function.arguments);
        try {
          auditResult = await createItemAudit(args, user.userId);
          console.log('Audit request payload:', args);
          aiResponse = "Audit created successfully.";
        } catch (error) {
          console.error('Failed to create audit:', error);
          throw new Error(
            error instanceof Error
              ? `Failed to create audit: ${error.message}`
              : "Failed to create audit"
          );
        }
      }
    } else {
      // Handle normal responses
      aiResponse = responseMessage?.content ?? null;
    }

    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    // Check if itemAuditId exists
    if (!itemAuditId) {
      return new NextResponse("Item audit ID is required", { status: 400 });
    }

    // Get the item audit ID for this audit
    const existingItemAudit = await db
      .select()
      .from(itemAudits)
      .where(eq(itemAudits.auditId, itemAuditId))
      .limit(1);

    if (!existingItemAudit.length) {
      return new NextResponse("Item audit not found", { status: 404 });
    }

    const chatItemAuditId = existingItemAudit[0]!.id;

    // After getting aiResponse, save assistant's message
    const savedAssistantMessage = await createChat({
      itemAuditId: auditResult?.itemAuditId || chatItemAuditId,
      sender: "assistant",
      chatText: aiResponse,
    });

    if (text || imageUrl) {
      await createChat({
        itemAuditId: chatItemAuditId,
        sender: "user",
        chatText: text || undefined,
        imageUrl: imageUrl || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      auditId: auditResult?.itemAuditId
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
