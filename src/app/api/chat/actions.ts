import { and } from "drizzle-orm";
import { db } from "~/server/db";
import { audits, chats } from "~/server/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ChatPayload } from "./schema";
import { openai } from "~/utils/openAIClient";
import OpenAI from "openai";
import { imagePrompt, systemPrompt } from "./prompts";
import { auditTool } from "./tools";
import { createItemAudit } from "~/server/actions/itemAudits";
import { createChat } from "~/server/actions/chats";

const processChat = async (params: ChatPayload) => {
  const { text, imageUrl, location, auditUuid } = params;

  const audit = await db.query.audits.findFirst({where: eq(audits.uuid, auditUuid)});
  if (!audit) return { success: false, response: "Audit not found", auditId: null };

  // Load previous messages from database
  const dbMessages = await db
    .select({
      sender: chats.sender,
      chatText: chats.chatText,
    })
    .from(chats)
    .where(
      and(
        isNotNull(chats.chatText),
        eq(chats.auditId, audit.id)
      )
    )
    .orderBy(chats.createdAt);

  // Initialize messages array with system message
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }];

  // Add messages from database
  dbMessages.forEach(msg => {
    messages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.chatText || ""
    });
  });

  if (text || imageUrl) {
    await createChat({
      auditUuid,
      sender: "user",
      chatText: text || undefined,
      imageUrl: imageUrl || undefined,
    });
  }

  // Add current message
  if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text" as const, text: imagePrompt },
        ...(location ? [{ type: "text" as const, text: `Location: ${location.latitude}, ${location.longitude}` }] : [])
      ]
    });
  } else if (text) {
    messages.push({
      role: "user",
      content: text + (location ? `\n(User current location: ${location.latitude}, ${location.longitude})` : '')
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
        auditResult = await createItemAudit(args);
        aiResponse = "Audit created successfully.";
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? `Failed to create audit: ${error.message}`
            : "Failed to create audit"
        );
      }
    }
  } else {
    aiResponse = responseMessage?.content ?? null;
  }

  if (!aiResponse) throw new Error("No response from OpenAI");

  // After getting aiResponse, save assistant's message
  await createChat({
    auditUuid,
    sender: "assistant",
    chatText: aiResponse,
  });

  return {
    success: true,
    response: aiResponse,
    auditId: auditResult?.itemAuditId
  };
};

export { processChat };
